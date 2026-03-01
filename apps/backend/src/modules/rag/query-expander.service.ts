import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryExpanderService {
  expand(query: string): string[] {
    const base = query.trim();
    if (!base) return [];

    const normalized = base.toLowerCase();
    const expansions = new Set<string>([base]);

    if (/commande|order/.test(normalized)) {
      expansions.add('suivi commande');
      expansions.add('statut livraison');
      expansions.add('date de livraison');
    }
    if (/retour|refund|rembours/.test(normalized)) {
      expansions.add('politique de retour');
      expansions.add('conditions de remboursement');
    }
    if (/prix|price|tarif/.test(normalized)) {
      expansions.add('grille tarifaire');
      expansions.add('conditions commerciales');
    }

    return Array.from(expansions).slice(0, 4);
  }
}
