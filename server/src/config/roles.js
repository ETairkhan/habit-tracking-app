/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Roles and their access levels:
 * - user: Can CRUD only their own habits, checkins, profile
 * - premium: Same as user (can add premium features like export, higher limits)
 * - moderator: Can view all users/habits, delete any habit (moderation), cannot delete users or change roles
 * - admin: Full access - delete users, promote/demote, manage any resource
 */

export const ROLES = {
  USER: "user",
  PREMIUM: "premium",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

/** Roles that can manage (view/update/delete) any habit, not just their own */
export const HABIT_MANAGEMENT_ROLES = [ROLES.ADMIN, ROLES.MODERATOR];

/** Roles that can access admin panel - view users and habits */
export const ADMIN_VIEW_ROLES = [ROLES.ADMIN, ROLES.MODERATOR];

/** Roles that can delete users, promote/demote, delete any user's habits */
export const ADMIN_FULL_ROLES = [ROLES.ADMIN];

/** Check if role can manage any habit (admin/moderator) */
export const canManageAnyHabit = (role) => HABIT_MANAGEMENT_ROLES.includes(role);

/** Check if role has admin view access */
export const hasAdminViewAccess = (role) => ADMIN_VIEW_ROLES.includes(role);

/** Check if role has full admin access */
export const hasFullAdminAccess = (role) => ADMIN_FULL_ROLES.includes(role);
