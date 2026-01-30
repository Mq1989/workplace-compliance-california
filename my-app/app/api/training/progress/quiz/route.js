import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingQuestion from '@/lib/models/TrainingQuestion';
import TrainingProgress from '@/lib/models/TrainingProgress';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({
      organizationId: organization._id,
      clerkUserId: userId,
      isActive: true
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    const data = await request.json();
    const { moduleId, answers } = data;

    if (!moduleId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'moduleId and answers array are required' },
        { status: 400 }
      );
    }

    // Verify module exists
    const trainingModule = await TrainingModule.findById(moduleId);
    if (!trainingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get progress record
    let progress = await TrainingProgress.findOne({
      organizationId: organization._id,
      employeeId: employee._id,
      moduleId: trainingModule._id
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'No progress record found. Start watching the video first.' },
        { status: 400 }
      );
    }

    // Check max attempts (0 = unlimited)
    if (
      trainingModule.maxAttempts > 0 &&
      progress.quizAttempts.length >= trainingModule.maxAttempts
    ) {
      return NextResponse.json(
        { error: 'Maximum quiz attempts reached' },
        { status: 400 }
      );
    }

    // Fetch questions to grade
    const questions = await TrainingQuestion.find({
      moduleId: trainingModule._id,
      isActive: true
    }).lean();

    const questionMap = {};
    for (const q of questions) {
      questionMap[q._id.toString()] = q;
    }

    // Grade the answers
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = answers.map((ans) => {
      const question = questionMap[ans.questionId];
      if (!question) {
        return {
          questionId: ans.questionId,
          selectedOptionIds: ans.selectedOptionIds || [],
          isCorrect: false
        };
      }

      totalPoints += question.points;

      // Determine correct option IDs
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);

      const selected = ans.selectedOptionIds || [];

      // For select_all: all correct options must be selected and no incorrect ones
      // For multiple_choice/true_false: exactly one correct option must match
      let isCorrect = false;
      if (question.questionType === 'select_all') {
        isCorrect =
          correctOptionIds.length === selected.length &&
          correctOptionIds.every((id) => selected.includes(id));
      } else {
        isCorrect =
          selected.length === 1 && correctOptionIds.includes(selected[0]);
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points;
      }

      return {
        questionId: question._id,
        selectedOptionIds: selected,
        isCorrect
      };
    });

    const score =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= trainingModule.passingScore;
    const attemptNumber = progress.quizAttempts.length + 1;

    // Add quiz attempt
    progress.quizAttempts.push({
      attemptNumber,
      score,
      passed,
      answers: gradedAnswers,
      completedAt: new Date()
    });

    // Update best score
    if (score > progress.bestScore) {
      progress.bestScore = score;
    }

    // Update quiz passed status
    if (passed && !progress.quizPassed) {
      progress.quizPassed = true;
      progress.quizPassedAt = new Date();
    }

    // Check if module is now complete (video watched + quiz passed)
    if (progress.videoCompleted && progress.quizPassed && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();

      // Update module analytics
      await TrainingModule.findByIdAndUpdate(trainingModule._id, {
        $inc: { totalCompletions: 1 }
      });
    }

    await progress.save();

    // Build response with question explanations
    const resultAnswers = gradedAnswers.map((ga) => {
      const question = questionMap[ga.questionId?.toString()];
      return {
        questionId: ga.questionId,
        selectedOptionIds: ga.selectedOptionIds,
        isCorrect: ga.isCorrect,
        correctOptionIds: question
          ? question.options.filter((o) => o.isCorrect).map((o) => o.id)
          : [],
        explanation: question?.explanation || null
      };
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'quiz_submitted',
      resourceType: 'training',
      resourceId: progress._id,
      details: {
        employeeId: employee._id,
        moduleId: trainingModule._id,
        moduleTitle: trainingModule.title,
        attemptNumber,
        score,
        passed
      }
    });

    return NextResponse.json({
      attemptNumber,
      score,
      passed,
      passingScore: trainingModule.passingScore,
      correctCount,
      totalQuestions: questions.length,
      answers: resultAnswers,
      bestScore: progress.bestScore,
      moduleCompleted: progress.status === 'completed'
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
