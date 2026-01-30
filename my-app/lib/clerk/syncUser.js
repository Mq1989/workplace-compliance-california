import { clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Employee from '@/lib/models/Employee';

/**
 * Link a Clerk user to their matching Employee record.
 * Looks up the Clerk user by ID, finds the Employee by email in the given org,
 * and sets the clerkUserId on the Employee document.
 *
 * @param {Object} params
 * @param {string} params.clerkUserId    - Clerk user ID
 * @param {string} params.organizationId - MongoDB Organization _id
 * @returns {Promise<Object|null>} Updated Employee document or null if not found
 */
export async function syncClerkUserToEmployee({ clerkUserId, organizationId }) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  if (!user) return null;

  const primaryEmail = user.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) return null;

  await dbConnect();

  const employee = await Employee.findOneAndUpdate(
    { organizationId, email: primaryEmail.toLowerCase() },
    {
      clerkUserId,
      inviteStatus: 'accepted',
      inviteAcceptedAt: new Date(),
    },
    { new: true }
  );

  return employee;
}
