/**
 * Loading State pour la page Produits
 * FE-02: Loading states pour routes critiques
 */

import { ProductsSkeleton } from '@/components/ui/skeletons/ProductsSkeleton';

export default function ProductsLoading() {
  return <ProductsSkeleton />;
}
