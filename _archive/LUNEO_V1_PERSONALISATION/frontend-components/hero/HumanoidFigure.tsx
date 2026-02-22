'use client';

/**
 * HumanoidFigure - Entité humanoïde féminine futuriste
 * Recréée exactement selon l'image :
 * - Féminine, vue de profil à droite
 * - Translucide/holographique avec texture filaire/organique
 * - Main DROITE pointant vers le centre touchant un collier/objet lumineux
 * - Lunettes semi-transparentes
 * - Structure interne data-like (réseau neuronal)
 */

import React from 'react';
import styles from './HumanoidFigure.module.css';

export function HumanoidFigure() {
  return (
    <div className={styles.humanoidContainer}>
      <svg
        className={styles.humanoidSvg}
        viewBox="0 0 500 700"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient pour le glow blanc/bleu organique */}
          <linearGradient id="humanoidGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="25%" stopColor="rgba(220, 230, 255, 0.5)" />
            <stop offset="50%" stopColor="rgba(180, 210, 255, 0.45)" />
            <stop offset="75%" stopColor="rgba(147, 197, 253, 0.4)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.35)" />
          </linearGradient>
          
          {/* Filtre de glow intensifié pour effet holographique */}
          <filter id="humanoidGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Filtre pour les lignes neurales/data streams */}
          <filter id="neuralGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Pattern pour texture filaire/organique */}
          <pattern id="wireframePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 0 10 L 20 10" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
            <path d="M 10 0 L 10 20" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Tête féminine vue de profil (à droite) */}
        <g className={styles.headGroup}>
          {/* Contour de la tête - forme plus féminine */}
          <ellipse
            cx="350"
            cy="140"
            rx="50"
            ry="65"
            fill="url(#humanoidGlow)"
            fillOpacity="0.3"
            stroke="url(#humanoidGlow)"
            strokeWidth="2.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.7"
          />
          {/* Texture filaire sur la tête */}
          <ellipse
            cx="350"
            cy="140"
            rx="50"
            ry="65"
            fill="url(#wireframePattern)"
            opacity="0.2"
          />
          
          {/* Traits faciaux stylisés */}
          {/* Front */}
          <path
            d="M 320 120 Q 330 105 340 115 Q 350 125 360 120"
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1.5"
            filter="url(#neuralGlow)"
            opacity="0.7"
          />
          {/* Nez */}
          <path
            d="M 360 125 Q 365 130 365 140"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.2"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          {/* Bouche - lèvres légèrement foncées */}
          <path
            d="M 355 160 Q 360 165 365 160"
            fill="rgba(200, 200, 220, 0.4)"
            stroke="rgba(200, 200, 220, 0.6)"
            strokeWidth="1.5"
            filter="url(#neuralGlow)"
            opacity="0.8"
          />
          {/* Menton */}
          <path
            d="M 345 175 Q 350 185 355 180"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.2"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          
          {/* Lignes lumineuses sur le crâne et cou (réseau neuronal) */}
          {/* Ligne frontale */}
          <path
            d="M 325 115 Q 335 105 345 110"
            fill="none"
            stroke="rgba(147, 197, 253, 0.5)"
            strokeWidth="1.2"
            filter="url(#neuralGlow)"
            opacity="0.7"
          />
          {/* Lignes sur le côté */}
          <path
            d="M 370 125 Q 375 115 380 125"
            fill="none"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          <path
            d="M 372 145 Q 378 135 382 145"
            fill="none"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          
          {/* Structure interne organique de la tête */}
          <path
            d="M 320 110 Q 340 90 360 110 Q 380 130 360 150 Q 340 170 320 150 Q 300 130 320 110"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          {/* Lignes de connexion dans la tête */}
          <path
            d="M 330 120 Q 350 130 370 120"
            fill="none"
            stroke="rgba(147, 197, 253, 0.3)"
            strokeWidth="1"
            filter="url(#neuralGlow)"
            opacity="0.5"
          />
        </g>

        {/* Lunettes semi-transparentes vue de profil */}
        <g className={styles.glassesGroup}>
          <ellipse
            cx="340"
            cy="150"
            rx="20"
            ry="16"
            fill="none"
            stroke="rgba(147, 197, 253, 0.7)"
            strokeWidth="2.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.8"
          />
          <ellipse
            cx="360"
            cy="150"
            rx="20"
            ry="16"
            fill="none"
            stroke="rgba(147, 197, 253, 0.7)"
            strokeWidth="2.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.8"
          />
          <line
            x1="360"
            y1="150"
            x2="340"
            y2="150"
            stroke="rgba(147, 197, 253, 0.7)"
            strokeWidth="2.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.8"
          />
          {/* Reflet sur les lunettes */}
          <ellipse
            cx="345"
            cy="148"
            rx="8"
            ry="6"
            fill="rgba(255, 255, 255, 0.3)"
            opacity="0.6"
          />
        </g>

        {/* Cou et épaules féminines */}
        <g className={styles.neckGroup}>
          <path
            d="M 340 210 L 360 210 L 365 270 L 335 270 Z"
            fill="url(#humanoidGlow)"
            fillOpacity="0.25"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="2"
            filter="url(#humanoidGlowFilter)"
            opacity="0.65"
          />
          <path
            d="M 340 210 L 360 210 L 365 270 L 335 270 Z"
            fill="url(#wireframePattern)"
            opacity="0.15"
          />
          {/* Lignes lumineuses sur le cou (connexions de données) */}
          <path
            d="M 345 215 L 345 235 L 355 240 L 355 220"
            fill="none"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1"
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          <path
            d="M 350 225 Q 352 245 354 260"
            fill="none"
            stroke="rgba(147, 197, 253, 0.3)"
            strokeWidth="1"
            filter="url(#neuralGlow)"
            opacity="0.5"
          />
        </g>

        {/* Torse féminin vue de profil */}
        <g className={styles.torsoGroup}>
          <path
            d="M 340 270 Q 360 260 380 270 L 375 470 Q 350 490 330 470 L 340 270 Z"
            fill="url(#humanoidGlow)"
            fillOpacity="0.2"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
            filter="url(#humanoidGlowFilter)"
            opacity="0.6"
          />
          <path
            d="M 340 270 Q 360 260 380 270 L 375 470 Q 350 490 330 470 L 340 270 Z"
            fill="url(#wireframePattern)"
            opacity="0.12"
          />
        </g>

        {/* Bras gauche (côté opposé, plus discret) */}
        <g className={styles.leftArmGroup}>
          <path
            d="M 340 290 Q 310 270 280 290 L 275 310 Q 300 330 320 310 Z"
            fill="url(#humanoidGlow)"
            fillOpacity="0.2"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2"
            filter="url(#humanoidGlowFilter)"
            opacity="0.5"
          />
        </g>

        {/* Bras DROIT (pointant vers le centre) - CRITIQUE - selon l'image */}
        <g className={styles.rightArmGroup}>
          {/* Épaule à avant-bras */}
          <path
            d="M 360 290 Q 390 270 420 290"
            fill="none"
            stroke="url(#humanoidGlow)"
            strokeWidth="3"
            filter="url(#humanoidGlowFilter)"
            opacity="0.75"
          />
          {/* Avant-bras pointant vers le centre (vers la gauche) */}
          <path
            d="M 420 290 Q 380 310 320 330"
            fill="none"
            stroke="url(#humanoidGlow)"
            strokeWidth="3.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.85"
          />
          {/* Main pointant vers le centre */}
          <path
            d="M 320 330 Q 300 340 280 330 Q 270 325 275 320"
            fill="url(#humanoidGlow)"
            fillOpacity="0.4"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="3"
            filter="url(#humanoidGlowFilter)"
            opacity="0.8"
          />
          {/* Index pointant avec glow intense */}
          <circle
            cx="275"
            cy="325"
            r="12"
            fill="rgba(255, 255, 255, 0.95)"
            filter="url(#humanoidGlowFilter)"
            className={styles.pointingFinger}
          />
          {/* Halo lumineux intense autour de l'index (point de contact) */}
          <circle
            cx="275"
            cy="325"
            r="25"
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="2.5"
            filter="url(#humanoidGlowFilter)"
            opacity="0.9"
            className={styles.fingerHalo}
          />
          <circle
            cx="275"
            cy="325"
            r="35"
            fill="none"
            stroke="rgba(147, 197, 253, 0.6)"
            strokeWidth="2"
            filter="url(#humanoidGlowFilter)"
            opacity="0.7"
            className={styles.fingerHalo}
          />
        </g>

        {/* Lignes neurales/data streams internes (réseau complexe organique) */}
        <g className={styles.neuralLines}>
          {/* Lignes dans la tête - réseau neuronal */}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = (i * 36) * (Math.PI / 180);
            const x1 = 350 + Math.cos(angle) * 18;
            const y1 = 140 + Math.sin(angle) * 25;
            const x2 = 350 + Math.cos(angle) * 35;
            const y2 = 140 + Math.sin(angle) * 45;
            return (
              <line
                key={`head-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(147, 197, 253, 0.3)"
                strokeWidth="1.2"
                className={styles.neuralLine}
                style={{ animationDelay: `${i * 0.12}s` }}
                filter="url(#neuralGlow)"
              />
            );
          })}
          
          {/* Lignes dans le torse - structure data-like */}
          {Array.from({ length: 15 }, (_, i) => {
            const angle = (i * 24) * (Math.PI / 180);
            const x1 = 350 + Math.cos(angle) * 20;
            const y1 = 370 + Math.sin(angle) * 35;
            const x2 = 350 + Math.cos(angle) * 45;
            const y2 = 370 + Math.sin(angle) * 75;
            return (
              <line
                key={`torso-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(147, 197, 253, 0.25)"
                strokeWidth="1"
                className={styles.neuralLine}
                style={{ animationDelay: `${(i + 10) * 0.08}s` }}
                filter="url(#neuralGlow)"
              />
            );
          })}
          
          {/* Lignes convergeant vers la main pointante (connexions data) */}
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const x1 = 350 + Math.cos(angle) * 25;
            const y1 = 320 + Math.sin(angle) * 25;
            return (
              <line
                key={`hand-${i}`}
                x1={x1}
                y1={y1}
                x2="275"
                y2="325"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="1.8"
                className={styles.neuralLine}
                style={{ animationDelay: `${(i + 25) * 0.06}s` }}
                filter="url(#neuralGlow)"
              />
            );
          })}
          {/* Lignes émanant du bras et de la main vers les objets flottants */}
          <line
            x1="290"
            y1="310"
            x2="200"
            y2="300"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1.5"
            className={styles.neuralLine}
            filter="url(#neuralGlow)"
            opacity="0.6"
          />
          <line
            x1="300"
            y1="320"
            x2="220"
            y2="330"
            stroke="rgba(147, 197, 253, 0.3)"
            strokeWidth="1.5"
            className={styles.neuralLine}
            filter="url(#neuralGlow)"
            opacity="0.5"
          />
        </g>
      </svg>
    </div>
  );
}
