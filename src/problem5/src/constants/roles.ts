/**
 * User Roles Constants
 * Centralized role management for consistent usage across the application
 */

// Role values as constants
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

// Type for UserRole based on constants
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Array of all roles for validation
export const ALL_ROLES: UserRole[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.EDITOR,
  USER_ROLES.VIEWER,
];

// Default role for new users
export const DEFAULT_ROLE: UserRole = USER_ROLES.VIEWER;

// Permissions mapping for each role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.ADMIN]: ['create', 'read', 'update', 'delete', 'manage_users'],
  [USER_ROLES.EDITOR]: ['create', 'read', 'update', 'delete'],
  [USER_ROLES.VIEWER]: ['read'],
};

// Helper function to check if a value is a valid role
export const isValidRole = (role: string): role is UserRole => {
  return ALL_ROLES.includes(role as UserRole);
};

// Helper function to get permissions for a role
export const getRolePermissions = (role: UserRole): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

// Helper function to check if a role has a specific permission
export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

