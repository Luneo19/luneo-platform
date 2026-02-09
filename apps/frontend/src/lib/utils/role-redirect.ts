/**
 * Returns the appropriate redirect URL based on user role
 */
export function getRoleBasedRedirect(role?: string): string {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/admin';
    default:
      return '/overview';
  }
}
