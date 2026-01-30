/**
 * Seed script for default SB 553 training modules and quiz questions.
 *
 * Usage:
 *   node --env-file=.env.local lib/seed/trainingModules.js
 *
 * Requires MONGODB_URI in environment.
 * Idempotent — skips modules whose moduleId already exists.
 */

import mongoose from 'mongoose';
import TrainingModule from '../models/TrainingModule.js';
import TrainingQuestion from '../models/TrainingQuestion.js';

// ---------------------------------------------------------------------------
// Module definitions (PRD §5.2 — 6 sequential modules)
// ---------------------------------------------------------------------------

const modules = [
  {
    moduleId: 'wvpp-overview-v1',
    title: 'Understanding Your WVPP',
    description:
      'Learn about your employer\'s Workplace Violence Prevention Plan, its purpose under California SB 553, and your role in maintaining a safe workplace.',
    order: 1,
    type: 'video',
    videoDurationMinutes: 8,
    category: 'wvpp_overview',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
  {
    moduleId: 'reporting-procedures-v1',
    title: 'Reporting Workplace Violence',
    description:
      'Understand how to report workplace violence incidents, threats, and concerns without fear of reprisal, including your legal protections under California law.',
    order: 2,
    type: 'video',
    videoDurationMinutes: 6,
    category: 'reporting_procedures',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
  {
    moduleId: 'hazard-recognition-v1',
    title: 'Recognizing Hazards',
    description:
      'Identify workplace violence hazards specific to your job and environment, including warning signs of potential violence and environmental risk factors.',
    order: 3,
    type: 'video',
    videoDurationMinutes: 10,
    category: 'hazard_recognition',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
  {
    moduleId: 'avoidance-strategies-v1',
    title: 'Strategies to Avoid Harm',
    description:
      'Learn practical strategies and de-escalation techniques to avoid physical harm during workplace violence situations.',
    order: 4,
    type: 'video',
    videoDurationMinutes: 8,
    category: 'avoidance_strategies',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
  {
    moduleId: 'incident-log-v1',
    title: 'The Violent Incident Log',
    description:
      'Understand the violent incident log required by SB 553, what information is recorded, how it protects employee privacy, and how it is used to improve safety.',
    order: 5,
    type: 'video',
    videoDurationMinutes: 5,
    category: 'incident_log',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
  {
    moduleId: 'emergency-response-v1',
    title: 'Emergency Response',
    description:
      'Learn your employer\'s emergency action procedures, evacuation routes, shelter-in-place protocols, and how to respond during an active threat situation.',
    order: 6,
    type: 'video',
    videoDurationMinutes: 10,
    category: 'emergency_response',
    isRequired: true,
    hasQuiz: true,
    passingScore: 70,
    maxAttempts: 0,
  },
];

// ---------------------------------------------------------------------------
// Quiz questions — keyed by moduleId
// ---------------------------------------------------------------------------

const questionsByModule = {
  'wvpp-overview-v1': [
    {
      questionText: 'What does WVPP stand for?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Workplace Violence Prevention Plan', isCorrect: true },
        { id: 'b', text: 'Workplace Verification and Protection Policy', isCorrect: false },
        { id: 'c', text: 'Worker Violation Prevention Program', isCorrect: false },
        { id: 'd', text: 'Workplace Violence Preparedness Protocol', isCorrect: false },
      ],
      explanation: 'WVPP stands for Workplace Violence Prevention Plan, as required by California SB 553.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'California SB 553 requires most employers to maintain a written WVPP.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'SB 553 (Labor Code §6401.9) requires nearly all California employers to establish and maintain a written WVPP.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'Which of the following is a key component of a WVPP?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Employee dress code policy', isCorrect: false },
        { id: 'b', text: 'Procedures for responding to workplace violence emergencies', isCorrect: true },
        { id: 'c', text: 'Quarterly financial reporting', isCorrect: false },
        { id: 'd', text: 'Office supply requisition process', isCorrect: false },
      ],
      explanation: 'A WVPP must include procedures for responding to actual or potential workplace violence emergencies.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'How often must the WVPP be reviewed at minimum?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Every 5 years', isCorrect: false },
        { id: 'b', text: 'Every 2 years', isCorrect: false },
        { id: 'c', text: 'Annually', isCorrect: true },
        { id: 'd', text: 'Only when an incident occurs', isCorrect: false },
      ],
      explanation: 'The WVPP must be reviewed at least annually and after any workplace violence incident.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'Employees have the right to participate in the development of the WVPP.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'SB 553 requires employee involvement in the development and implementation of the WVPP.',
      order: 5,
      points: 1,
    },
  ],

  'reporting-procedures-v1': [
    {
      questionText: 'An employer can retaliate against an employee for reporting a workplace violence concern.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: false },
        { id: 'b', text: 'False', isCorrect: true },
      ],
      explanation: 'California law prohibits employers from retaliating against employees who report workplace violence incidents or concerns.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'Which of the following should you report?',
      questionType: 'select_all',
      options: [
        { id: 'a', text: 'A coworker threatening another employee', isCorrect: true },
        { id: 'b', text: 'A customer behaving aggressively', isCorrect: true },
        { id: 'c', text: 'A colleague arriving late to work', isCorrect: false },
        { id: 'd', text: 'Feeling unsafe due to a stranger loitering near the entrance', isCorrect: true },
      ],
      explanation: 'Threats, aggressive behavior, and situations that make you feel unsafe should all be reported. Tardiness is not a workplace violence concern.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'What is the first thing you should do if you witness a workplace violence incident?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Post about it on social media', isCorrect: false },
        { id: 'b', text: 'Ensure your own safety, then report the incident to your supervisor or designated contact', isCorrect: true },
        { id: 'c', text: 'Confront the perpetrator directly', isCorrect: false },
        { id: 'd', text: 'Ignore it and continue working', isCorrect: false },
      ],
      explanation: 'Your safety is the top priority. Once safe, immediately report the incident through your employer\'s designated reporting channels.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'Reports of workplace violence should include as much detail as possible, such as date, time, location, and description of events.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Detailed reports help the employer investigate and take appropriate corrective action.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'Which reporting method allows you to raise concerns without revealing your identity?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Verbal report to your supervisor', isCorrect: false },
        { id: 'b', text: 'Anonymous reporting system', isCorrect: true },
        { id: 'c', text: 'Company-wide email', isCorrect: false },
        { id: 'd', text: 'Social media post', isCorrect: false },
      ],
      explanation: 'Anonymous reporting systems allow employees to report concerns without revealing their identity, providing protection from potential retaliation.',
      order: 5,
      points: 1,
    },
  ],

  'hazard-recognition-v1': [
    {
      questionText: 'Which of the following is an example of a workplace violence hazard?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'A well-lit parking lot', isCorrect: false },
        { id: 'b', text: 'Working alone in an isolated area late at night', isCorrect: true },
        { id: 'c', text: 'Having multiple employees at the front desk', isCorrect: false },
        { id: 'd', text: 'A functioning security camera system', isCorrect: false },
      ],
      explanation: 'Working alone in isolated areas, especially during late hours, is a recognized workplace violence hazard.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'Which of the following are warning signs of potential workplace violence?',
      questionType: 'select_all',
      options: [
        { id: 'a', text: 'Repeated verbal threats or intimidation', isCorrect: true },
        { id: 'b', text: 'Sudden, unexplained changes in behavior', isCorrect: true },
        { id: 'c', text: 'An employee asking for time off', isCorrect: false },
        { id: 'd', text: 'Expressions of intent to harm others', isCorrect: true },
      ],
      explanation: 'Verbal threats, significant behavior changes, and expressed intent to harm are all warning signs that should be taken seriously and reported.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'Type 1 workplace violence involves a perpetrator who has no legitimate relationship with the business.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Type 1 (criminal intent) involves perpetrators with no legitimate business relationship — for example, a robbery.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'A customer who becomes increasingly agitated and begins shouting at employees represents which type of workplace violence?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Type 1 — Criminal Intent', isCorrect: false },
        { id: 'b', text: 'Type 2 — Customer/Client', isCorrect: true },
        { id: 'c', text: 'Type 3 — Worker-on-Worker', isCorrect: false },
        { id: 'd', text: 'Type 4 — Personal Relationship', isCorrect: false },
      ],
      explanation: 'Type 2 workplace violence involves customers, clients, patients, or others the business serves.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'Hazard assessments should only be conducted once and never updated.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: false },
        { id: 'b', text: 'False', isCorrect: true },
      ],
      explanation: 'Hazard assessments must be reviewed regularly and updated whenever new hazards are identified or workplace conditions change.',
      order: 5,
      points: 1,
    },
  ],

  'avoidance-strategies-v1': [
    {
      questionText: 'What is the recommended first step when encountering an aggressive individual?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Argue back to assert authority', isCorrect: false },
        { id: 'b', text: 'Remain calm and speak in a low, steady voice', isCorrect: true },
        { id: 'c', text: 'Physically restrain the person', isCorrect: false },
        { id: 'd', text: 'Turn your back and walk away quickly', isCorrect: false },
      ],
      explanation: 'Staying calm and using a low, steady voice are fundamental de-escalation techniques that can help prevent the situation from escalating.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'Which of the following are effective de-escalation techniques?',
      questionType: 'select_all',
      options: [
        { id: 'a', text: 'Active listening and acknowledging the person\'s feelings', isCorrect: true },
        { id: 'b', text: 'Maintaining a safe distance', isCorrect: true },
        { id: 'c', text: 'Making sudden movements to show urgency', isCorrect: false },
        { id: 'd', text: 'Offering options or choices to the agitated person', isCorrect: true },
      ],
      explanation: 'Active listening, maintaining safe distance, and offering choices are proven de-escalation techniques. Sudden movements can escalate the situation.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'If a situation becomes physically dangerous and you cannot de-escalate, you should prioritize your personal safety and remove yourself from the area.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Personal safety always comes first. If de-escalation fails and there is physical danger, remove yourself and call for help.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'When speaking with an agitated person, which body language should you use?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Cross your arms and stare directly at them', isCorrect: false },
        { id: 'b', text: 'Point your finger to emphasize your point', isCorrect: false },
        { id: 'c', text: 'Maintain open, non-threatening posture with hands visible', isCorrect: true },
        { id: 'd', text: 'Stand as close as possible to show empathy', isCorrect: false },
      ],
      explanation: 'Open, non-threatening body language with visible hands signals that you are not a threat and helps create a calmer environment.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'You should always try to resolve a violent situation on your own before calling for help.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: false },
        { id: 'b', text: 'False', isCorrect: true },
      ],
      explanation: 'Never try to handle a violent situation alone. Call for help immediately — contact your supervisor, security, or 911 as appropriate.',
      order: 5,
      points: 1,
    },
  ],

  'incident-log-v1': [
    {
      questionText: 'What is the purpose of the violent incident log?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'To discipline employees involved in incidents', isCorrect: false },
        { id: 'b', text: 'To record and track workplace violence incidents for prevention and compliance', isCorrect: true },
        { id: 'c', text: 'To report incidents to the media', isCorrect: false },
        { id: 'd', text: 'To determine employee performance ratings', isCorrect: false },
      ],
      explanation: 'The incident log records workplace violence incidents to identify patterns, improve prevention measures, and maintain compliance with SB 553.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'The violent incident log must NOT contain personally identifiable information (PII) about employees.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Because employees have the right to access the incident log, it must not contain PII such as names, addresses, or social security numbers.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'How long must violent incident log records be retained?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: '1 year', isCorrect: false },
        { id: 'b', text: '3 years', isCorrect: false },
        { id: 'c', text: '5 years', isCorrect: true },
        { id: 'd', text: '10 years', isCorrect: false },
      ],
      explanation: 'California Labor Code §6401.9 requires violent incident log records to be retained for a minimum of 5 years.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'Which of the following must be recorded in the incident log?',
      questionType: 'select_all',
      options: [
        { id: 'a', text: 'Date, time, and location of the incident', isCorrect: true },
        { id: 'b', text: 'Type of violence that occurred', isCorrect: true },
        { id: 'c', text: 'The employee\'s home address', isCorrect: false },
        { id: 'd', text: 'A detailed description of the incident', isCorrect: true },
      ],
      explanation: 'The incident log must include date/time/location, violence type, and description. Employee home addresses are PII and must NOT be included.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'Employees have the right to request access to the violent incident log.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Employees have the right to access the incident log. Employers must provide access within 15 calendar days of a request.',
      order: 5,
      points: 1,
    },
  ],

  'emergency-response-v1': [
    {
      questionText: 'What should you do first in an emergency situation involving workplace violence?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Document what is happening', isCorrect: false },
        { id: 'b', text: 'Assess the situation and ensure your own safety', isCorrect: true },
        { id: 'c', text: 'Confront the threat', isCorrect: false },
        { id: 'd', text: 'Continue working normally', isCorrect: false },
      ],
      explanation: 'In any emergency, your first priority is to assess the situation and ensure your personal safety before taking any other action.',
      order: 1,
      points: 1,
    },
    {
      questionText: 'The "Run, Hide, Fight" framework is a recognized approach for responding to an active threat. What is the recommended order of priority?',
      questionType: 'multiple_choice',
      options: [
        { id: 'a', text: 'Fight first, then hide, then run', isCorrect: false },
        { id: 'b', text: 'Hide first, then run, then fight', isCorrect: false },
        { id: 'c', text: 'Run first, then hide, then fight as a last resort', isCorrect: true },
        { id: 'd', text: 'The order does not matter', isCorrect: false },
      ],
      explanation: 'The priority is to Run (evacuate if possible), Hide (find a secure location), and Fight only as an absolute last resort when your life is in imminent danger.',
      order: 2,
      points: 1,
    },
    {
      questionText: 'You should know the location of at least two emergency exits from your work area.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'Knowing multiple exit routes is essential. If one exit is blocked during an emergency, you need to know alternative escape routes.',
      order: 3,
      points: 1,
    },
    {
      questionText: 'When calling 911 during a workplace violence emergency, which information should you provide?',
      questionType: 'select_all',
      options: [
        { id: 'a', text: 'Your location and the nature of the emergency', isCorrect: true },
        { id: 'b', text: 'Number of people involved or injured', isCorrect: true },
        { id: 'c', text: 'Your employee performance review score', isCorrect: false },
        { id: 'd', text: 'Description of the threat or suspect if known', isCorrect: true },
      ],
      explanation: 'Provide location, nature of emergency, number of people involved/injured, and any description of the threat. Only share relevant emergency information.',
      order: 4,
      points: 1,
    },
    {
      questionText: 'During a shelter-in-place situation, you should lock or barricade doors, turn off lights, silence phones, and stay away from windows.',
      questionType: 'true_false',
      options: [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ],
      explanation: 'These are standard shelter-in-place procedures. The goal is to make your location appear unoccupied and to minimize your visibility.',
      order: 5,
      points: 1,
    },
  ],
};

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('Connected to MongoDB');

  let modulesCreated = 0;
  let modulesSkipped = 0;
  let questionsCreated = 0;

  for (const mod of modules) {
    const existing = await TrainingModule.findOne({ moduleId: mod.moduleId });
    if (existing) {
      console.log(`  Skip (exists): ${mod.moduleId}`);
      modulesSkipped++;
      continue;
    }

    const created = await TrainingModule.create(mod);
    console.log(`  Created module: ${mod.moduleId} (order ${mod.order})`);
    modulesCreated++;

    // Insert quiz questions for this module
    const questions = questionsByModule[mod.moduleId];
    if (questions && questions.length > 0) {
      const docs = questions.map((q) => ({ ...q, moduleId: created._id }));
      await TrainingQuestion.insertMany(docs);
      questionsCreated += docs.length;
      console.log(`    + ${docs.length} quiz questions`);
    }
  }

  console.log('\nSeed complete:');
  console.log(`  Modules created: ${modulesCreated}`);
  console.log(`  Modules skipped: ${modulesSkipped}`);
  console.log(`  Questions created: ${questionsCreated}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
