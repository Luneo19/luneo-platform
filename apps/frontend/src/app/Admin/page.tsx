import { redirect } from 'next/navigation';

export default function LegacyAdminRouteRedirect() {
  redirect('/admin');
}
