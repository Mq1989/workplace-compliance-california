import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'SafeWorkCA <notifications@safeworkca.com>';

function trainingDueHtml({ employeeName, organizationName, dueDate, daysUntilDue }) {
  const urgency = daysUntilDue <= 1 ? 'Tomorrow' : `in ${daysUntilDue} days`;
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Training Due ${urgency}</h2>
      <p>Hi ${employeeName},</p>
      <p>Your annual SB 553 workplace violence prevention training for <strong>${organizationName}</strong> is due on <strong>${dueDate}</strong>.</p>
      ${daysUntilDue <= 7 ? '<p style="color: #dc2626; font-weight: bold;">Please complete your training as soon as possible to remain compliant.</p>' : ''}
      <p>Log in to your employee portal to complete the required training modules.</p>
      <p style="color: #666; font-size: 14px;">— SafeWorkCA</p>
    </div>
  `;
}

function trainingOverdueHtml({ employeeName, organizationName, dueDate, daysOverdue }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Training Overdue</h2>
      <p>Hi ${employeeName},</p>
      <p>Your annual SB 553 training for <strong>${organizationName}</strong> was due on <strong>${dueDate}</strong> and is now <strong>${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue</strong>.</p>
      <p style="color: #dc2626; font-weight: bold;">Please complete your training immediately to restore compliance.</p>
      <p style="color: #666; font-size: 14px;">— SafeWorkCA</p>
    </div>
  `;
}

function trainingOverdueAdminHtml({ employeeName, organizationName, dueDate, daysOverdue }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Employee Training Overdue</h2>
      <p><strong>${employeeName}</strong> has overdue SB 553 training.</p>
      <p>Due date: <strong>${dueDate}</strong> (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue)</p>
      <p>Please follow up with this employee to ensure they complete training. Overdue training affects your organization's compliance score.</p>
      <p style="color: #666; font-size: 14px;">— SafeWorkCA</p>
    </div>
  `;
}

function annualReviewHtml({ organizationName, reviewDueDate, daysUntilDue }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Annual WVPP Review Due${daysUntilDue <= 7 ? ' Soon' : ''}</h2>
      <p>Your Workplace Violence Prevention Plan for <strong>${organizationName}</strong> requires its annual review by <strong>${reviewDueDate}</strong> (${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} remaining).</p>
      <p>California Labor Code Section 6401.9 requires annual review and update of your WVPP. Log in to SafeWorkCA to review and republish your plan.</p>
      ${daysUntilDue <= 7 ? '<p style="color: #dc2626; font-weight: bold;">This review is due soon. Please schedule time to complete it.</p>' : ''}
      <p style="color: #666; font-size: 14px;">— SafeWorkCA</p>
    </div>
  `;
}

function incidentFollowupHtml({ organizationName, incidentDate, daysSinceIncident, locationDescription }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Incident Investigation Follow-Up</h2>
      <p>An incident reported on <strong>${incidentDate}</strong> at <strong>${locationDescription}</strong> for <strong>${organizationName}</strong> has an open investigation that is ${daysSinceIncident} day${daysSinceIncident === 1 ? '' : 's'} old.</p>
      <p>Please update the investigation status or complete the investigation to maintain compliance.</p>
      <p style="color: #666; font-size: 14px;">— SafeWorkCA</p>
    </div>
  `;
}

const TEMPLATES = {
  training_due: {
    subject: ({ daysUntilDue }) =>
      daysUntilDue <= 1
        ? 'Action Required: Training Due Tomorrow'
        : `Training Due in ${daysUntilDue} Days`,
    html: trainingDueHtml,
  },
  training_overdue: {
    subject: () => 'OVERDUE: Complete Your SB 553 Training',
    html: trainingOverdueHtml,
  },
  training_overdue_admin: {
    subject: ({ employeeName }) => `Employee Training Overdue: ${employeeName}`,
    html: trainingOverdueAdminHtml,
  },
  annual_review: {
    subject: ({ daysUntilDue }) =>
      daysUntilDue <= 7
        ? 'Action Required: Annual WVPP Review Due Soon'
        : 'Reminder: Annual WVPP Review Approaching',
    html: annualReviewHtml,
  },
  incident_followup: {
    subject: () => 'Open Incident Investigation Requires Follow-Up',
    html: incidentFollowupHtml,
  },
};

export async function sendReminder(type, to, data) {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown reminder type: ${type}`);
  }

  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: template.subject(data),
    html: template.html(data),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return result;
}
