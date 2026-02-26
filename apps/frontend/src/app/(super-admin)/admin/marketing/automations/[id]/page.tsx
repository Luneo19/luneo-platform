import { redirect } from 'next/navigation';

export default async function AutomationByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/marketing/automations/${id}/edit`);
}
