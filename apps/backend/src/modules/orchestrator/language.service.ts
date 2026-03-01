import { Injectable } from '@nestjs/common';

@Injectable()
export class OrchestratorLanguageService {
  detectLanguage(message: string): string {
    const normalized = message.toLowerCase();
    const frenchHints = ['bonjour', 'commande', 'livraison', 'retour', 'prix'];
    const englishHints = ['hello', 'order', 'shipping', 'return', 'price'];
    const spanishHints = ['hola', 'pedido', 'envio', 'devolucion', 'precio'];

    const score = (hints: string[]) => hints.filter((hint) => normalized.includes(hint)).length;
    const fr = score(frenchHints);
    const en = score(englishHints);
    const es = score(spanishHints);

    if (es > fr && es > en) return 'es';
    if (en > fr) return 'en';
    return 'fr';
  }

  buildLanguageInstruction(language: string): string {
    switch (language) {
      case 'en':
        return 'Always answer in English unless the user asks to switch language.';
      case 'es':
        return 'Responde en espanol, salvo que el usuario pida otro idioma.';
      default:
        return "Reponds en francais, sauf si l'utilisateur demande explicitement une autre langue.";
    }
  }
}
