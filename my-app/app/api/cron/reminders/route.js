import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import Incident from '@/lib/models/Incident';
import { sendReminder } from '@/lib/email/sendReminder';

const TRAINING_REMINDER_DAYS = [30, 7, 1];
const ANNUAL_REVIEW_REMINDER_DAYS = [30, 7];
const INCIDENT_FOLLOWUP_DAYS = 7;

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function GET(request) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const now = new Date();
    const results = { sent: 0, errors: 0, details: [] };

    const organizations = await Organization.find({});

    for (const org of organizations) {
      // --- Training reminders (due & overdue) ---
      const employees = await Employee.find({
        organizationId: org._id,
        isActive: true,
        nextTrainingDueDate: { $exists: true, $ne: null },
      });

      for (const emp of employees) {
        const dueDate = new Date(emp.nextTrainingDueDate);
        const daysUntilDue = daysBetween(dueDate, now);

        const data = {
          employeeName: `${emp.firstName} ${emp.lastName}`,
          organizationName: org.name,
          dueDate: formatDate(dueDate),
        };

        if (daysUntilDue > 0 && TRAINING_REMINDER_DAYS.includes(daysUntilDue)) {
          // Training upcoming
          try {
            await sendReminder('training_due', emp.email, {
              ...data,
              daysUntilDue,
            });
            results.sent++;
            results.details.push({
              type: 'training_due',
              to: emp.email,
              daysUntilDue,
            });
          } catch (err) {
            results.errors++;
            results.details.push({
              type: 'training_due',
              to: emp.email,
              error: err.message,
            });
          }
        } else if (daysUntilDue <= 0) {
          // Training overdue
          const daysOverdue = Math.abs(daysUntilDue);
          if (daysOverdue === 0 || daysOverdue === 7) {
            try {
              await sendReminder('training_overdue', emp.email, {
                ...data,
                daysOverdue: daysOverdue || 1,
              });
              results.sent++;
              results.details.push({
                type: 'training_overdue',
                to: emp.email,
                daysOverdue,
              });
            } catch (err) {
              results.errors++;
              results.details.push({
                type: 'training_overdue',
                to: emp.email,
                error: err.message,
              });
            }

            // Also notify org admin email
            if (org.email) {
              try {
                await sendReminder('training_overdue_admin', org.email, {
                  ...data,
                  daysOverdue: daysOverdue || 1,
                });
                results.sent++;
              } catch (err) {
                results.errors++;
              }
            }
          }
        }
      }

      // --- Annual WVPP review reminders ---
      if (org.nextPlanReviewDueDate && org.email) {
        const reviewDue = new Date(org.nextPlanReviewDueDate);
        const daysUntilReview = daysBetween(reviewDue, now);

        if (daysUntilReview > 0 && ANNUAL_REVIEW_REMINDER_DAYS.includes(daysUntilReview)) {
          try {
            await sendReminder('annual_review', org.email, {
              organizationName: org.name,
              reviewDueDate: formatDate(reviewDue),
              daysUntilDue: daysUntilReview,
            });
            results.sent++;
            results.details.push({
              type: 'annual_review',
              to: org.email,
              daysUntilDue: daysUntilReview,
            });
          } catch (err) {
            results.errors++;
            results.details.push({
              type: 'annual_review',
              to: org.email,
              error: err.message,
            });
          }
        }
      }

      // --- Incident follow-up reminders ---
      const openIncidents = await Incident.find({
        organizationId: org._id,
        investigationStatus: { $in: ['pending', 'in_progress'] },
      });

      for (const incident of openIncidents) {
        const daysSince = daysBetween(now, new Date(incident.incidentDate));
        if (daysSince > 0 && daysSince % INCIDENT_FOLLOWUP_DAYS === 0 && org.email) {
          try {
            await sendReminder('incident_followup', org.email, {
              organizationName: org.name,
              incidentDate: formatDate(incident.incidentDate),
              daysSinceIncident: daysSince,
              locationDescription: incident.location?.description || 'Unknown location',
            });
            results.sent++;
            results.details.push({
              type: 'incident_followup',
              to: org.email,
              daysSinceIncident: daysSince,
            });
          } catch (err) {
            results.errors++;
            results.details.push({
              type: 'incident_followup',
              to: org.email,
              error: err.message,
            });
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
