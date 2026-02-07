import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata = generatePageMetadata({
  title: 'Aide',
  description: 'Documentation, FAQ et support Luneo - Trouvez des réponses et apprenez à utiliser la plateforme de personnalisation produit.',
  path: '/help',
});

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
