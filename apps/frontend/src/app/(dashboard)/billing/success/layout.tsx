// Layout spécifique pour /billing/success
// Force dynamic rendering pour éviter les erreurs de pré-rendu
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BillingSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



