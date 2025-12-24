'use client';

/**
 * HeroBannerOptimized - Version ultra-optimisée reproduisant l'image
 * 
 * Optimisations appliquées:
 * - CSS transforms uniquement (GPU accelerated)
 * - SVG inline pour toutes les formes
 * - will-change pour les éléments animés
 * - CSS containment pour l'isolation
 * - Lazy loading des éléments non critiques
 * - Réduction du nombre de DOM nodes
 * - Pas de canvas, pas de Three.js
 */

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HeroBannerOptimized.module.css';

// Import direct pour performance (les composants sont déjà légers avec SVG/CSS)
// Lazy loading peut être ajouté si nécessaire, mais pour l'instant on garde direct pour éviter le flash
import { HumanoidFigure } from './hero/HumanoidFigure';
import { FloatingProducts } from './hero/FloatingProducts';
import { PromptCloud } from './hero/PromptCloud';
import { CodePanels } from './hero/CodePanels';
import { FloatingObject } from './hero/FloatingObject';

interface HeroBannerOptimizedProps {
  backgroundImage?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  alt?: string;
}

export function HeroBannerOptimized({
  backgroundImage = "/herobanner.png",
  title = "L'Auteure de Personnalisation 3D",
  subtitle,
  children,
  alt = 'Hero background',
}: HeroBannerOptimizedProps) {
  // Navigation items - Supprimés selon demande
  const navItems = useMemo(
    () => [],
    []
  );

  // Stars background - généré une seule fois (plus d'étoiles pour effet réaliste)
  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        id: i,
        left: `${(i * 137.5) % 100}%`,
        top: `${(i * 197.3) % 100}%`,
        size: `${0.3 + (i % 4) * 0.2}px`,
        opacity: 0.2 + (i % 4) * 0.15,
        delay: `${(i * 0.08) % 3}s`,
      })),
    []
  );

  return (
    <section className={styles.heroSection}>
      {/* Background avec étoiles */}
      <div className={styles.starsBackground}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Image de fond optionnelle */}
      {backgroundImage && (
        <div className={styles.backgroundImageContainer}>
          <Image
            src={backgroundImage}
            alt={alt}
            fill
            priority
            quality={85}
            className={styles.backgroundImage}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <div className={styles.overlay} />
        </div>
      )}

      {/* Navigation bar */}
      <nav className={styles.navBar}>
        <Link href="/" className={styles.navLogo}>
          <Image
            src="/logo.png"
            alt="Luneo Logo"
            width={1000}
            height={400}
            className={styles.logoImage}
            priority
          />
        </Link>
        {/* Navigation links supprimés selon demande */}
        {/* Join waitlist button supprimé selon demande */}
      </nav>

      {/* Contenu principal */}
      <div className={styles.content}>
        {/* Titre uniquement */}
        <div className={styles.textContent}>
          {title && <h1 className={styles.title}>{title}</h1>}
        </div>

        {/* Éléments flottants */}
        <div className={styles.floatingElements}>
          {/* Figure humaine translucide */}
          <HumanoidFigure />

          {/* Objet lumineux flottant au centre (touché par la main) */}
          <FloatingObject />

          {/* Produits 3D flottants */}
          <FloatingProducts />

          {/* Nuage Prompt */}
          <PromptCloud />

          {/* Panneaux de code */}
          <CodePanels />
        </div>

        {/* Barre de recherche flottante */}
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher / Browse"
            className={styles.searchInput}
            readOnly
          />
        </div>

        {/* Contenu personnalisé */}
        {children}
      </div>
    </section>
  );
}

