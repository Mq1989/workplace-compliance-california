import { clerkClient } from '@clerk/nextjs/server';

/**
 * Invite an employee to a Clerk organization.
 *
 * @param {Object} params
 * @param {string} params.email        - Employee email address
 * @param {string} params.orgId        - Clerk organization ID (clerkOrgId)
 * @param {string} params.role         - Clerk org role, e.g. 'org:member' or 'org:admin'
 * @param {string} [params.inviterUserId] - Clerk user ID of the person sending the invite
 * @returns {Promise<Object>} Clerk OrganizationInvitation object
 */
export async function inviteEmployeeToOrg({ email, orgId, role = 'org:member', inviterUserId }) {
  const client = await clerkClient();

  const invitation = await client.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress: email,
    role,
    ...(inviterUserId ? { inviterUserId } : {}),
  });

  return invitation;
}
