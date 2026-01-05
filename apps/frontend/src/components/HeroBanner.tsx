'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import styles from './HeroBanner.module.css';

/**
 * HeroBanner - Bannière hero premium avec animations subtiles
 * 
 * @param backgroundImage - URL ou chemin de l'image de fond (requis)
 * @param title - Titre principal (optionnel)
 * @param subtitle - Sous-titre (optionnel)
 * @param children - Contenu personnalisé (optionnel)
 */
interface HeroBannerProps {
  backgroundImage: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  alt?: string;
}

export function HeroBanner({
  backgroundImage,
  title,
  subtitle,
  children,
  alt = 'Hero background',
}: HeroBannerProps) {
  // Génération des particules avec positions aléatoires mais cohérentes
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${15 + (i * 23) % 70}%`,
        top: `${20 + (i * 31) % 60}%`,
        delay: `${(i * 0.8) % 4}s`,
        size: `${2 + (i % 3)}px`,
      })),
    []
  );

  // Génération des halos lumineux
  const halos = useMemo(
    () => [
      {
        id: 'halo-1',
        left: '15%',
        top: '25%',
        size: '200px',
        delay: '0s',
      },
      {
        id: 'halo-2',
        left: '75%',
        top: '60%',
        size: '150px',
        delay: '2s',
      },
      {
        id: 'halo-3',
        left: '50%',
        top: '80%',
        size: '180px',
        delay: '4s',
      },
    ],
    []
  );

  // Génération des éléments UI flottants
  const floatingElements = useMemo(
    () => [
      {
        id: 'ui-1',
        left: '20%',
        top: '15%',
        delay: '1s',
        rotation: '5deg',
      },
      {
        id: 'ui-2',
        left: '80%',
        top: '30%',
        delay: '3s',
        rotation: '-8deg',
      },
      {
        id: 'ui-3',
        left: '10%',
        top: '70%',
        delay: '2.5s',
        rotation: '12deg',
      },
      {
        id: 'ui-4',
        left: '85%',
        top: '75%',
        delay: '1.5s',
        rotation: '-5deg',
      },
    ],
    []
  );

  return (
    <section className={styles.heroSection}>
      {/* Image de fond principale */}
      <div className={styles.backgroundImageContainer}>
        <Image
          src={backgroundImage}
          alt={alt}
          fill
          priority
          quality={90}
          className={styles.backgroundImage}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Overlay léger pour améliorer la lisibilité */}
        <div className={styles.overlay} />
      </div>

      {/* Halos lumineux subtils */}
      {halos.map((halo) => (
        <div
          key={halo.id}
          className={styles.halo}
          style={{
            left: halo.left,
            top: halo.top,
            width: halo.size,
            height: halo.size,
            animationDelay: halo.delay,
          }}
        />
      ))}

      {/* Particules fines */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.particle}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
          }}
        />
      ))}

      {/* Éléments UI flottants */}
      {floatingElements.map((element) => (
        <div
          key={element.id}
          className={styles.floatingElement}
          style={{
            left: element.left,
            top: element.top,
            animationDelay: element.delay,
            transform: `rotate(${element.rotation})`,
          }}
        />
      ))}

      {/* Contenu principal */}
      <div className={styles.content}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}











