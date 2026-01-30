/**
 * Classify whether a Q&A interaction should be flagged for human review.
 *
 * Scans both the user question and AI response for sensitive topics
 * that require admin attention per PRD §5.1.
 *
 * @param {string} question - The user's question
 * @param {string} response - The AI's response
 * @returns {{ flag: boolean, reason: string|null }}
 */
export function shouldFlagForReview(question, response) {
  const combinedText = `${question} ${response}`.toLowerCase();

  for (const indicator of SENSITIVE_INDICATORS) {
    if (combinedText.includes(indicator)) {
      return {
        flag: true,
        reason: `Contains sensitive topic: ${indicator}`,
      };
    }
  }

  return { flag: false, reason: null };
}

/**
 * Classify the question category for metadata tracking.
 *
 * Maps to the ChatMessage.aiMetadata.questionCategory enum:
 * wvpp_content, sb553_general, reporting, emergency, training, other
 *
 * @param {string} question - The user's question
 * @returns {string} Category key
 */
export function classifyQuestionCategory(question) {
  const text = question.toLowerCase();

  for (const { keywords, category } of CATEGORY_RULES) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

// ---- Internal data ----

const SENSITIVE_INDICATORS = [
  'legal',
  'lawsuit',
  'attorney',
  'lawyer',
  'discrimination',
  'harassment',
  'retaliation',
  'termination',
  'fired',
  'discipline',
  'police',
  'arrest',
  'criminal',
  'weapon',
  'gun',
  'knife',
  'suicide',
  'self-harm',
  'mental health crisis',
  'domestic violence',
  'stalking',
  'union',
  'grievance',
  'complaint against manager',
];

const CATEGORY_RULES = [
  {
    category: 'emergency',
    keywords: ['emergency', '911', 'active shooter', 'evacuation', 'shelter', 'immediate danger', 'bomb threat'],
  },
  {
    category: 'reporting',
    keywords: ['report', 'reporting', 'anonymous', 'file a complaint', 'how to report', 'who do i tell', 'hotline'],
  },
  {
    category: 'training',
    keywords: ['training', 'quiz', 'module', 'course', 'certificate', 'learning', 'video'],
  },
  {
    category: 'wvpp_content',
    keywords: ['wvpp', 'plan', 'policy', 'prevention plan', 'our plan', 'company plan', 'workplace violence prevention'],
  },
  {
    category: 'sb553_general',
    keywords: ['sb 553', 'sb553', 'senate bill', 'labor code', 'cal/osha', 'california law', 'compliance', 'requirement'],
  },
];
