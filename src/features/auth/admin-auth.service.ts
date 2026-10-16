import { apiRequest } from '@/shared/api/client';
import type { AuthUser } from './auth.types';

export const ADMIN_UNAUTHORIZED_EVENT = 'lunara:admin-unauthorized';
const adminUser = (): AuthUser => ({ name: '', email: '', role: 'admin' });
export async function getAdminSession(signal?: AbortSignal): Promise<AuthUser> {
  await apiRequest<{ role: 'ADMIN' }>('/admin/me', { signal });
  return adminUser();
}
export async function loginAdmin(password: string, turnstileToken?: string): Promise<AuthUser> {
  await apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ password, ...(turnstileToken ? { turnstile_token: turnstileToken } : {}) }) });
  return getAdminSession();
}
export async function logoutAdmin() {
  await apiRequest('/admin/logout', { method: 'POST', body: '{}' });
}
