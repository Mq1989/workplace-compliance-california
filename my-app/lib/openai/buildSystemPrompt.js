/**
 * Build the system prompt for the AI Q&A chatbot.
 *
 * Uses the organization's WVPP (Workplace Violence Prevention Plan)
 * as RAG context so answers reference the employer's specific plan.
 *
 * @param {string} organizationName - Display name of the organization
 * @param {object|null} plan - The active Plan document (plain object)
 * @returns {string} System prompt string for OpenAI chat completion
 */
export function buildSystemPrompt(organizationName, plan) {
  const wvppSection = plan ? formatWVPPContent(plan) : 'No WVPP is currently on file for this organization.';

  return `You are a workplace violence prevention assistant for ${organizationName}.
Your role is to answer employee questions about:
1. This employer's specific Workplace Violence Prevention Plan (WVPP)
2. California SB 553 requirements and workplace safety

EMPLOYER'S WVPP CONTENT:
${wvppSection}

INSTRUCTIONS:
- Answer questions clearly and helpfully
- When referencing the employer's WVPP, cite specific sections
- For general SB 553 questions, provide accurate information
- If you're unsure or the question is complex, indicate that a human will review
- Never provide legal advice — recommend consulting HR or legal counsel for complex situations
- Be supportive and non-judgmental about all concerns raised
- Encourage reporting of any safety concerns
- Keep responses concise but complete
- Use bullet points for lists of steps
- Always end with an offer to help with follow-up questions

IMPORTANT DISCLAIMERS TO INCLUDE WHEN RELEVANT:
- This is general information, not legal advice
- For emergencies, call 911 immediately
- For sensitive matters, suggest using the anonymous reporting system`;
}

/**
 * Format the active WVPP plan into readable text for the system prompt.
 */
function formatWVPPContent(plan) {
  const sections = [];

  // Responsible Persons
  if (plan.responsiblePersons?.length) {
    const people = plan.responsiblePersons.map(
      (p) => `  - ${p.name} (${p.title}): ${p.phone}, ${p.email}`
    ).join('\n');
    sections.push(`SECTION 1 — Responsible Persons:\n${people}`);
  }

  // Employee Involvement
  if (plan.employeeInvolvement) {
    const ei = plan.employeeInvolvement;
    const lines = [];
    if (ei.meetingFrequency) lines.push(`  Meeting frequency: ${ei.meetingFrequency}`);
    if (ei.meetingDescription) lines.push(`  Meeting description: ${ei.meetingDescription}`);
    if (ei.reportingProceduresDescription) lines.push(`  Reporting procedures: ${ei.reportingProceduresDescription}`);
    if (lines.length) sections.push(`SECTION 2 — Employee Involvement:\n${lines.join('\n')}`);
  }

  // Communication System
  if (plan.communicationSystem) {
    const cs = plan.communicationSystem;
    const lines = [];
    if (cs.meetingFrequency) lines.push(`  Meeting frequency: ${cs.meetingFrequency}`);
    if (cs.postingLocations) lines.push(`  Posted information locations: ${cs.postingLocations}`);
    if (cs.reportingHotline) lines.push(`  Reporting hotline: ${cs.reportingHotline}`);
    if (cs.anonymousReporting) lines.push('  Anonymous reporting: Available');
    if (lines.length) sections.push(`SECTION 3 — Communication System:\n${lines.join('\n')}`);
  }

  // Emergency Response
  if (plan.emergencyResponse) {
    const er = plan.emergencyResponse;
    const lines = [];
    if (er.alertMethods?.length) lines.push(`  Alert methods: ${er.alertMethods.join(', ')}`);
    if (er.evacuationPlanDescription) lines.push(`  Evacuation plan: ${er.evacuationPlanDescription}`);
    if (er.shelterLocations?.length) lines.push(`  Shelter locations: ${er.shelterLocations.join(', ')}`);
    if (er.lawEnforcementContact) lines.push(`  Law enforcement contact: ${er.lawEnforcementContact}`);
    if (er.emergencyContacts?.length) {
      const contacts = er.emergencyContacts.map(
        (c) => `    - ${c.name} (${c.title}): ${c.phone}`
      ).join('\n');
      lines.push(`  Emergency contacts:\n${contacts}`);
    }
    if (lines.length) sections.push(`SECTION 4 — Emergency Response:\n${lines.join('\n')}`);
  }

  // Hazard Assessments
  if (plan.hazardAssessments?.length) {
    const hazards = plan.hazardAssessments.map(
      (h) => `  - ${h.description} (Risk: ${h.riskLevel})\n    Controls: ${h.controlMeasures?.join(', ') || 'None specified'}`
    ).join('\n');
    sections.push(`SECTION 5 — Hazard Assessments:\n${hazards}`);
  }

  // Hazard Correction Procedures
  if (plan.hazardCorrectionProcedures) {
    const hc = plan.hazardCorrectionProcedures;
    const lines = [];
    if (hc.immediateThreatProcedure) lines.push(`  Immediate threat procedure: ${hc.immediateThreatProcedure}`);
    if (hc.engineeringControls?.length) lines.push(`  Engineering controls: ${hc.engineeringControls.join(', ')}`);
    if (hc.workPracticeControls?.length) lines.push(`  Work practice controls: ${hc.workPracticeControls.join(', ')}`);
    if (hc.administrativeControls?.length) lines.push(`  Administrative controls: ${hc.administrativeControls.join(', ')}`);
    if (lines.length) sections.push(`SECTION 6 — Hazard Correction Procedures:\n${lines.join('\n')}`);
  }

  // Post-Incident Procedures
  if (plan.postIncidentProcedures) {
    const pi = plan.postIncidentProcedures;
    const lines = [];
    if (pi.investigationSteps?.length) lines.push(`  Investigation steps:\n${pi.investigationSteps.map((s) => `    - ${s}`).join('\n')}`);
    if (pi.supportResources?.length) lines.push(`  Support resources:\n${pi.supportResources.map((r) => `    - ${r}`).join('\n')}`);
    if (pi.counselingAvailable) lines.push(`  Counseling available: Yes${pi.counselingProvider ? ` (${pi.counselingProvider})` : ''}`);
    if (lines.length) sections.push(`SECTION 7 — Post-Incident Procedures:\n${lines.join('\n')}`);
  }

  // Training Program
  if (plan.trainingProgram) {
    const tp = plan.trainingProgram;
    const lines = [];
    if (tp.initialTrainingDescription) lines.push(`  Initial training: ${tp.initialTrainingDescription}`);
    if (tp.annualRefresherDescription) lines.push(`  Annual refresher: ${tp.annualRefresherDescription}`);
    if (tp.trainingTopics?.length) lines.push(`  Topics covered: ${tp.trainingTopics.join(', ')}`);
    if (lines.length) sections.push(`SECTION 8 — Training Program:\n${lines.join('\n')}`);
  }

  // Recordkeeping
  if (plan.recordkeepingProcedures) {
    const rp = plan.recordkeepingProcedures;
    const lines = [];
    if (rp.accessProcedure) lines.push(`  How to access records: ${rp.accessProcedure}`);
    lines.push(`  Hazard records retention: ${rp.hazardRecordsRetention || 5} years`);
    lines.push(`  Training records retention: ${rp.trainingRecordsRetention || 1} year(s)`);
    lines.push(`  Incident log retention: ${rp.incidentLogRetention || 5} years`);
    sections.push(`SECTION 9 — Recordkeeping:\n${lines.join('\n')}`);
  }

  // Plan Accessibility
  if (plan.planAccessibility) {
    const pa = plan.planAccessibility;
    const lines = [];
    if (pa.physicalLocation) lines.push(`  Physical location: ${pa.physicalLocation}`);
    if (pa.electronicAccess) lines.push(`  Electronic access: ${pa.electronicLocation || 'Available electronically'}`);
    if (lines.length) sections.push(`SECTION 10 — Plan Accessibility:\n${lines.join('\n')}`);
  }

  if (!sections.length) {
    return 'The WVPP exists but contains no detailed content yet.';
  }

  return sections.join('\n\n');
}
