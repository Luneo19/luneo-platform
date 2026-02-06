/**
 * Loading State pour la page Commandes
 * FE-02: Loading states pour routes critiques
 */

import { OrdersSkeleton } from '@/components/ui/skeletons/OrdersSkeleton';

export default function OrdersLoading() {
  return <OrdersSkeleton />;
}
