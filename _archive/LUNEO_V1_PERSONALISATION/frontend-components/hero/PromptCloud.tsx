'use client';

/**
 * PromptCloud - Nuage "Prompt" avec "A/A" et flèches circulaires
 * SVG optimisé
 */

import React from 'react';
import styles from './PromptCloud.module.css';

export function PromptCloud() {
  return (
    <div className={styles.promptCloudContainer}>
      <svg
        className={styles.promptCloudSvg}
        viewBox="0 0 200 150"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(147, 197, 253, 0.4)" />
          </linearGradient>
          <filter id="cloudGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nuage */}
        <path
          d="M 50 80 Q 30 60 50 50 Q 70 40 80 50 Q 100 40 120 50 Q 140 40 150 60 Q 170 50 160 80 Q 180 90 150 100 Q 130 110 100 100 Q 70 110 50 100 Q 30 90 50 80 Z"
          fill="url(#cloudGradient)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          filter="url(#cloudGlow)"
          opacity="0.7"
          className={styles.cloudShape}
        />

        {/* Texte "Prompt" */}
        <text
          x="100"
          y="75"
          textAnchor="middle"
          className={styles.promptText}
          fill="rgba(255, 255, 255, 0.9)"
          fontSize="24"
          fontWeight="600"
        >
          Prompt
        </text>

        {/* Texte "A/A" */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          className={styles.aaText}
          fill="rgba(147, 197, 253, 0.8)"
          fontSize="18"
          fontWeight="500"
        >
          A/A
        </text>

        {/* 3 Icônes circulaires au-dessus du nuage */}
        <g className={styles.iconsGroup}>
          {/* Icône 1 : Loupe (gauche) */}
          <g className={styles.iconCircle} style={{ animationDelay: '0s' }}>
            <circle
              cx="65"
              cy="25"
              r="12"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.8"
            />
            <circle cx="68" cy="22" r="3" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.5" />
            <line x1="71" y1="25" x2="74" y2="28" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.5" />
            {/* Ligne de connexion vers le nuage */}
            <line
              x1="65"
              y1="37"
              x2="80"
              y2="55"
              stroke="rgba(147, 197, 253, 0.5)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.6"
            />
          </g>
          
          {/* Icône 2 : Engrenage (centre) */}
          <g className={styles.iconCircle} style={{ animationDelay: '0.2s' }}>
            <circle
              cx="100"
              cy="25"
              r="12"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.8"
            />
            {/* Engrenage simplifié */}
            <circle cx="100" cy="25" r="4" fill="rgba(255, 255, 255, 0.7)" />
            {[0, 45, 90, 135].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + Math.cos(rad) * 6;
              const y1 = 25 + Math.sin(rad) * 6;
              const x2 = 100 + Math.cos(rad) * 9;
              const y2 = 25 + Math.sin(rad) * 9;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
            {/* Ligne de connexion vers le nuage */}
            <line
              x1="100"
              y1="37"
              x2="100"
              y2="55"
              stroke="rgba(147, 197, 253, 0.5)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.6"
            />
          </g>
          
          {/* Icône 3 : Réseau/Connexion (droite) */}
          <g className={styles.iconCircle} style={{ animationDelay: '0.4s' }}>
            <circle
              cx="135"
              cy="25"
              r="12"
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.8"
            />
            {/* Réseau : points connectés */}
            <circle cx="130" cy="22" r="2" fill="rgba(255, 255, 255, 0.8)" />
            <circle cx="140" cy="22" r="2" fill="rgba(255, 255, 255, 0.8)" />
            <circle cx="135" cy="28" r="2" fill="rgba(255, 255, 255, 0.8)" />
            <line x1="130" y1="22" x2="135" y2="28" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
            <line x1="140" y1="22" x2="135" y2="28" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
            <line x1="130" y1="22" x2="140" y2="22" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
            {/* Ligne de connexion vers le nuage */}
            <line
              x1="135"
              y1="37"
              x2="120"
              y2="55"
              stroke="rgba(147, 197, 253, 0.5)"
              strokeWidth="1.5"
              filter="url(#cloudGlow)"
              opacity="0.6"
            />
          </g>
        </g>

        {/* Flèches circulaires */}
        <g className={styles.arrowsGroup}>
          {/* Flèche 1 */}
          <path
            d="M 100 30 L 110 40 L 105 40 L 105 50 L 95 50 L 95 40 L 90 40 Z"
            fill="rgba(255, 255, 255, 0.5)"
            filter="url(#cloudGlow)"
            className={styles.arrow}
            style={{ animationDelay: '0s' }}
          />
          {/* Flèche 2 */}
          <path
            d="M 170 80 L 160 90 L 165 90 L 165 100 L 175 100 L 175 90 L 180 90 Z"
            fill="rgba(255, 255, 255, 0.5)"
            filter="url(#cloudGlow)"
            className={styles.arrow}
            style={{ animationDelay: '0.5s' }}
          />
          {/* Flèche 3 */}
          <path
            d="M 100 120 L 90 110 L 95 110 L 95 100 L 105 100 L 105 110 L 110 110 Z"
            fill="rgba(255, 255, 255, 0.5)"
            filter="url(#cloudGlow)"
            className={styles.arrow}
            style={{ animationDelay: '1s' }}
          />
          {/* Flèche 4 */}
          <path
            d="M 30 80 L 40 90 L 35 90 L 35 100 L 25 100 L 25 90 L 20 90 Z"
            fill="rgba(255, 255, 255, 0.5)"
            filter="url(#cloudGlow)"
            className={styles.arrow}
            style={{ animationDelay: '1.5s' }}
          />
        </g>
      </svg>
    </div>
  );
}

