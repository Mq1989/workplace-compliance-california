import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingQuestion from '@/lib/models/TrainingQuestion';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;

    await dbConnect();

    const trainingModule = await TrainingModule.findById(moduleId).lean();
    if (!trainingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const questions = await TrainingQuestion.find({
      moduleId: trainingModule._id,
      isActive: true
    })
      .sort({ order: 1 })
      .lean();

    // Strip correct answers — only include for grading on the server
    const safeQuestions = questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text
      })),
      order: q.order,
      points: q.points
    }));

    return NextResponse.json({
      ...trainingModule,
      questions: safeQuestions
    });
  } catch (error) {
    console.error('Error fetching training module:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
