# AGENT-17: SEO Pages Publiques

**Objectif**: Optimiser le SEO de toutes les pages publiques avec metadata, structured data, sitemap et images Open Graph

**Priorité**: P1  
**Complexité**: 2/5  
**Estimation**: 3-5 jours  
**Dépendances**: Aucune

---

## 📋 SCOPE

### Pages Publiques Concernees

- `/` - Homepage (SEO deja present, verifier completude)
- `/solutions/*` - Pages solutions (configurateur, AR, personnalisation)
- `/integrations/*` - Pages integrations (Shopify, WooCommerce, PrestaShop)
- `/resources/*` - Pages ressources (blog, guides, API docs)
- `/pricing` - Page tarifs
- `/gallery` - Galerie publique
- `/help/*` - Pages aide
- `/developers/*` - Pages developpeurs

### Manquant Actuel

- Metadata SEO absente sur la plupart des pages hors homepage
- Pas de structured data (JSON-LD) sauf homepage
- Pas d'images Open Graph generees
- Pas de sitemap.xml dynamique

---

## ✅ TÂCHES

### Phase 1: Metadata et generateMetadata() (1-2 jours)

- [ ] Ajouter `generateMetadata()` sur chaque page `/solutions/*`
- [ ] Ajouter `generateMetadata()` sur chaque page `/integrations/*`
- [ ] Ajouter `generateMetadata()` sur `/pricing`
- [ ] Ajouter `generateMetadata()` sur `/gallery`, `/help/*`, `/developers/*`
- [ ] Verifier que chaque page a : title, description, keywords, canonical URL

### Phase 2: Structured Data JSON-LD (1 jour)

- [ ] Ajouter JSON-LD `SoftwareApplication` sur la homepage
- [ ] Ajouter JSON-LD `Product` sur les pages solutions
- [ ] Ajouter JSON-LD `FAQPage` sur les pages help
- [ ] Ajouter JSON-LD `BreadcrumbList` sur toutes les pages publiques
- [ ] Ajouter JSON-LD `Organization` dans le layout principal

### Phase 3: Sitemap et Open Graph (1-2 jours)

- [ ] Creer `apps/frontend/src/app/sitemap.ts` (dynamique)
- [ ] Creer `apps/frontend/src/app/robots.ts`
- [ ] Ajouter des images Open Graph pour chaque section (solutions, integrations, pricing)
- [ ] Verifier les meta tags og:image, og:title, og:description sur chaque page

### Phase 4: Verification (0.5 jour)

- [ ] Valider avec Google Rich Results Test
- [ ] Verifier le rendu Open Graph avec metatags.io
- [ ] Verifier le sitemap.xml est accessible
- [ ] Build OK

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Pattern generateMetadata()

```typescript
// app/(public)/solutions/configurator-3d/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurateur 3D Produits | Luneo',
  description: 'Personnalisez vos produits en 3D avec notre configurateur interactif.',
  keywords: ['configurateur 3D', 'personnalisation produit', 'visualisation 3D'],
  openGraph: {
    title: 'Configurateur 3D | Luneo',
    description: 'Personnalisez vos produits en 3D.',
    images: ['/og/solutions-3d.png'],
    type: 'website',
  },
  alternates: {
    canonical: 'https://luneo.io/solutions/configurator-3d',
  },
};
```

### Pattern JSON-LD

```typescript
export default function SolutionPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Luneo Configurateur 3D',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **100%** des pages publiques ont des metadata SEO
- [ ] **JSON-LD** present sur toutes les pages publiques
- [ ] **sitemap.xml** dynamique genere et accessible
- [ ] **robots.txt** configure correctement
- [ ] Validation Google Rich Results Test sans erreur

---

## 🔗 RESSOURCES

- Pages publiques : `apps/frontend/src/app/(public)/`
- SEO lib existante : `apps/frontend/src/lib/seo/`
- Homepage metadata : `apps/frontend/src/app/(public)/page.tsx`

---

## 📝 NOTES

- Utiliser le domaine canonique `https://luneo.io` pour toutes les URLs
- Les images OG doivent etre en 1200x630px
- Le sitemap doit inclure les pages dynamiques (gallery items, etc.)
