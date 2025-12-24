'use client';

/**
 * FloatingObject - Collier avec pendentif rond (objet touché par le doigt)
 * Selon l'image : collier avec pendentif rond détaillé, pierres précieuses,
 * support holographique, glow intense au centre (point de contact)
 */

import React from 'react';
import styles from './FloatingObject.module.css';

export function FloatingObject() {
  return (
    <div className={styles.floatingObjectContainer}>
      <svg
        className={styles.floatingObjectSvg}
        viewBox="0 0 200 280"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient pour le support holographique */}
          <linearGradient id="standGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
            <stop offset="50%" stopColor="rgba(147, 197, 253, 0.3)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
          </linearGradient>
          
          {/* Gradient pour le collier */}
          <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(192, 192, 192, 0.4)" />
          </linearGradient>
          
          {/* Gradient pour le pendentif */}
          <radialGradient id="pendantGradient" cx="50%" cy="40%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="30%" stopColor="rgba(220, 230, 255, 0.7)" />
            <stop offset="60%" stopColor="rgba(147, 197, 253, 0.5)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
          </radialGradient>
          
          {/* Filtre de glow intense pour le point de contact */}
          <filter id="intenseGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="12" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Filtre de glow standard */}
          <filter id="standardGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Pattern pour texture métallique */}
          <pattern id="metalPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.5" fill="rgba(255, 255, 255, 0.2)" />
          </pattern>
        </defs>

        {/* Support holographique (base) */}
        <g className={styles.standGroup}>
          {/* Support principal */}
          <path
            d="M 60 260 L 140 260 L 135 250 Q 100 245 65 250 Z"
            fill="url(#standGradient)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
            filter="url(#standardGlow)"
            opacity="0.6"
          />
          {/* Barres de support latérales */}
          <line
            x1="70"
            y1="260"
            x2="75"
            y2="230"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="2"
            filter="url(#standardGlow)"
          />
          <line
            x1="130"
            y1="260"
            x2="125"
            y2="230"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="2"
            filter="url(#standardGlow)"
          />
        </g>

        {/* Chaîne du collier */}
        <g className={styles.chainGroup}>
          {/* Partie supérieure (support) */}
          <rect
            x="75"
            y="220"
            width="50"
            height="15"
            rx="3"
            fill="rgba(100, 100, 100, 0.4)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            filter="url(#standardGlow)"
            opacity="0.7"
          />
          
          {/* Chaîne qui pend */}
          <path
            d="M 85 235 Q 90 250 100 270 Q 110 250 115 235"
            fill="none"
            stroke="url(#chainGradient)"
            strokeWidth="2.5"
            filter="url(#standardGlow)"
            opacity="0.7"
          />
        </g>

        {/* Pendentif rond détaillé */}
        <g className={styles.pendantGroup}>
          {/* Cercle principal du pendentif */}
          <circle
            cx="100"
            cy="165"
            r="45"
            fill="url(#pendantGradient)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="2.5"
            filter="url(#intenseGlow)"
            opacity="0.85"
            className={styles.mainPendant}
          />
          
          {/* Texture métallique sur le pendentif */}
          <circle
            cx="100"
            cy="165"
            r="45"
            fill="url(#metalPattern)"
            opacity="0.3"
          />
          
          {/* Cercle intérieur avec motifs */}
          <circle
            cx="100"
            cy="165"
            r="32"
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1.5"
            filter="url(#standardGlow)"
            opacity="0.8"
          />
          
          {/* Pierres précieuses / motifs complexes */}
          {/* Pierre centrale principale */}
          <circle
            cx="100"
            cy="155"
            r="8"
            fill="rgba(147, 197, 253, 0.9)"
            filter="url(#intenseGlow)"
            opacity="0.95"
          />
          <circle
            cx="100"
            cy="155"
            r="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="1.5"
            filter="url(#intenseGlow)"
            opacity="0.7"
          />
          
          {/* Petites pierres autour */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * 60) * (Math.PI / 180);
            const x = 100 + Math.cos(angle) * 22;
            const y = 165 + Math.sin(angle) * 22;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="rgba(255, 255, 255, 0.8)"
                filter="url(#standardGlow)"
                opacity="0.9"
              />
            );
          })}
          
          {/* Motifs géométriques */}
          <path
            d="M 100 130 L 115 145 L 100 160 L 85 145 Z"
            fill="none"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1"
            filter="url(#standardGlow)"
            opacity="0.6"
          />
        </g>

        {/* Glow intense au centre (point de contact avec le doigt) */}
        <circle
          cx="100"
          cy="155"
          r="20"
          fill="none"
          stroke="rgba(255, 255, 255, 1)"
          strokeWidth="3"
          filter="url(#intenseGlow)"
          opacity="1"
          className={styles.contactGlow}
        />
        <circle
          cx="100"
          cy="155"
          r="30"
          fill="none"
          stroke="rgba(147, 197, 253, 0.8)"
          strokeWidth="2"
          filter="url(#intenseGlow)"
          opacity="0.9"
          className={styles.contactGlow}
        />
        <circle
          cx="100"
          cy="155"
          r="40"
          fill="none"
          stroke="rgba(59, 130, 246, 0.6)"
          strokeWidth="1.5"
          filter="url(#intenseGlow)"
          opacity="0.7"
          className={styles.contactGlow}
        />
        
        {/* Lens flare effect au point de contact */}
        <circle
          cx="100"
          cy="155"
          r="15"
          fill="rgba(255, 255, 255, 0.95)"
          filter="url(#intenseGlow)"
          opacity="1"
          className={styles.lensFlare}
        />
      </svg>
    </div>
  );
}

