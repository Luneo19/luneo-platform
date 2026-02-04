import { getServerUser } from './get-user';

/**
 * Assert that the current user owns a resource
 * Throws if user is not authenticated or doesn't own the resource
 */
export async function assertOwnership(resourceOwnerId: string): Promise<void> {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }
  
  if (user.id !== resourceOwnerId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: User does not own this resource');
  }
}

/**
 * Check if user has admin privileges
 */
export async function assertAdmin(): Promise<void> {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated');
  }
  
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
}
