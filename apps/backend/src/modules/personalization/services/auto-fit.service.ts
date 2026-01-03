import { Injectable } from '@nestjs/common';

export interface AutoFitResult {
  fontSize: number;
  width?: number;
  height?: number;
  scale?: number;
}

@Injectable()
export class AutoFitService {
  /**
   * Calculer la taille de police optimale pour un texte dans une zone
   * Algorithme simple : réduire la taille jusqu'à ce que le texte rentre
   */
  calculateFontSize(
    text: string,
    maxWidth: number,
    maxHeight: number,
    fontFamily: string = 'Arial',
    minFontSize: number = 8,
    maxFontSize: number = 72,
  ): AutoFitResult {
    if (!text || text.length === 0) {
      return { fontSize: maxFontSize };
    }

    // Estimation basique (à améliorer avec mesure réelle du texte)
    // Pour l'instant, calcul approximatif basé sur la longueur du texte
    const avgCharWidth = this.estimateCharWidth(fontFamily, maxFontSize);
    const textWidth = text.length * avgCharWidth;
    const textHeight = maxFontSize * 1.2; // Line height

    // Si le texte rentre déjà, retourner maxFontSize
    if (textWidth <= maxWidth && textHeight <= maxHeight) {
      return { fontSize: maxFontSize };
    }

    // Calculer le ratio de réduction nécessaire
    const widthRatio = maxWidth / textWidth;
    const heightRatio = maxHeight / textHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    // Appliquer le ratio avec une marge de sécurité (90%)
    let fontSize = Math.floor(maxFontSize * ratio * 0.9);

    // S'assurer que fontSize est dans les limites
    fontSize = Math.max(minFontSize, Math.min(maxFontSize, fontSize));

    return { fontSize };
  }

  /**
   * Estimer la largeur moyenne d'un caractère (approximation)
   * TODO: Utiliser une mesure réelle avec Canvas ou une librairie
   */
  private estimateCharWidth(fontFamily: string, fontSize: number): number {
    // Approximation basique : 0.6 * fontSize pour la plupart des polices
    // Les polices monospace sont plus larges (0.7)
    const isMonospace = ['Courier', 'Courier New', 'Monaco', 'Consolas'].includes(fontFamily);
    return fontSize * (isMonospace ? 0.7 : 0.6);
  }

  /**
   * Calculer le scale pour un élément (image, pattern, etc.)
   */
  calculateScale(
    elementWidth: number,
    elementHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean = true,
  ): AutoFitResult {
    if (elementWidth <= maxWidth && elementHeight <= maxHeight) {
      return { fontSize: 0, scale: 1, width: elementWidth, height: elementHeight };
    }

    const widthRatio = maxWidth / elementWidth;
    const heightRatio = maxHeight / elementHeight;
    const scale = Math.min(widthRatio, heightRatio);

    if (maintainAspectRatio) {
      return {
        fontSize: 0,
        scale,
        width: elementWidth * scale,
        height: elementHeight * scale,
      };
    }

    return {
      fontSize: 0,
      scale,
      width: maxWidth,
      height: maxHeight,
    };
  }
}

