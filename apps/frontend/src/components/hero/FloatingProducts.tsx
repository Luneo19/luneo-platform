'use client';

/**
 * FloatingProducts - Produits 3D flottants (bijoux, lunettes)
 * Utilise SVG et CSS pour un rendu optimisé
 */

import React, { useMemo } from 'react';
import styles from './FloatingProducts.module.css';

interface Product {
  id: string;
  type: 'ring' | 'necklace' | 'necklace-heart' | 'glasses' | 'ring-diamond';
  left: string;
  top: string;
  delay: string;
  rotation: string;
  scale: number;
}

export function FloatingProducts() {
  // Produits positionnés selon l'image exacte :
  // - Le collier pointé est géré par FloatingObject
  // - Bijoux autour du collier pointé (centre-gauche)
  const products = useMemo<Product[]>(
    () => [
      // Bague avec diamant bleu (haut gauche)
      { id: 'ring-diamond-1', type: 'ring-diamond', left: '12%', top: '25%', delay: '0s', rotation: '18deg', scale: 1.1 },
      // Lunettes (centre-gauche, sous la bague avec diamant)
      { id: 'glasses-1', type: 'glasses', left: '20%', top: '38%', delay: '0.5s', rotation: '-10deg', scale: 1.0 },
      // Collier avec pendentif cœur (légèrement en dessous et à droite du collier pointé)
      { id: 'necklace-heart-1', type: 'necklace-heart', left: '32%', top: '48%', delay: '1s', rotation: '8deg', scale: 0.95 },
      // Bague simple (centre-gauche, sous le collier pointé)
      { id: 'ring-1', type: 'ring', left: '24%', top: '52%', delay: '1.5s', rotation: '-12deg', scale: 0.9 },
      // Bague (plus bas, sous les lunettes)
      { id: 'ring-2', type: 'ring', left: '18%', top: '58%', delay: '2s', rotation: '15deg', scale: 0.8 },
      // Collier simple (bas gauche)
      { id: 'necklace-1', type: 'necklace', left: '14%', top: '65%', delay: '2.5s', rotation: '-8deg', scale: 0.85 },
    ],
    []
  );

  return (
    <>
      {products.map((product) => (
        <div
          key={product.id}
          className={styles.productContainer}
          style={{
            left: product.left,
            top: product.top,
            animationDelay: product.delay,
            transform: `rotate(${product.rotation}) scale(${product.scale})`,
          }}
        >
          {product.type === 'ring' && <RingProduct />}
          {product.type === 'ring-diamond' && <RingDiamondProduct />}
          {product.type === 'necklace' && <NecklaceProduct />}
          {product.type === 'necklace-heart' && <NecklaceHeartProduct />}
          {product.type === 'glasses' && <GlassesProduct />}
        </div>
      ))}
    </>
  );
}

// Composant Bague simple (avec bande gravée)
function RingProduct() {
  return (
    <svg
      className={styles.productSvg}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.65)" />
          <stop offset="50%" stopColor="rgba(192, 192, 192, 0.45)" />
          <stop offset="100%" stopColor="rgba(147, 197, 253, 0.35)" />
        </linearGradient>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Anneau extérieur */}
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth="3.5"
        filter="url(#ringGlow)"
        opacity="0.75"
      />
      {/* Anneau intérieur */}
      <circle
        cx="50"
        cy="50"
        r="26"
        fill="rgba(255, 255, 255, 0.15)"
        filter="url(#ringGlow)"
        opacity="0.7"
      />
      {/* Bande gravée (motifs décoratifs) */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="rgba(192, 192, 192, 0.4)"
        strokeWidth="1"
        strokeDasharray="3,2"
        filter="url(#ringGlow)"
        opacity="0.6"
      />
      {/* Petite pierre centrale */}
      <circle
        cx="50"
        cy="42"
        r="3"
        fill="rgba(255, 255, 255, 0.8)"
        filter="url(#ringGlow)"
        opacity="0.9"
      />
    </svg>
  );
}

// Composant Bague avec diamant bleu (grande pierre)
function RingDiamondProduct() {
  return (
    <svg
      className={styles.productSvg}
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ringDiamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
          <stop offset="50%" stopColor="rgba(192, 192, 192, 0.5)" />
          <stop offset="100%" stopColor="rgba(147, 197, 253, 0.4)" />
        </linearGradient>
        <linearGradient id="diamondBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(147, 197, 253, 1)" />
          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
          <stop offset="100%" stopColor="rgba(30, 64, 175, 0.6)" />
        </linearGradient>
        <filter id="ringDiamondGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Anneau de la bague */}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="url(#ringDiamondGradient)"
        strokeWidth="4"
        filter="url(#ringDiamondGlow)"
        opacity="0.75"
      />
      <circle
        cx="60"
        cy="60"
        r="30"
        fill="rgba(255, 255, 255, 0.15)"
        filter="url(#ringDiamondGlow)"
        opacity="0.6"
      />
      {/* Grande pierre diamant bleu */}
      <path
        d="M 60 25 L 75 45 L 60 65 L 45 45 Z"
        fill="url(#diamondBlueGradient)"
        filter="url(#ringDiamondGlow)"
        opacity="0.95"
      />
      {/* Reflets sur le diamant */}
      <path
        d="M 60 35 L 68 48 L 60 58 L 52 48 Z"
        fill="rgba(255, 255, 255, 0.6)"
        filter="url(#ringDiamondGlow)"
        opacity="0.8"
      />
      {/* Glow autour du diamant */}
      <circle
        cx="60"
        cy="45"
        r="22"
        fill="none"
        stroke="rgba(147, 197, 253, 0.5)"
        strokeWidth="2"
        filter="url(#ringDiamondGlow)"
        opacity="0.7"
      />
    </svg>
  );
}

// Composant Collier simple
function NecklaceProduct() {
  return (
    <svg
      className={styles.productSvg}
      viewBox="0 0 120 150"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="necklaceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(192, 192, 192, 0.35)" />
        </linearGradient>
        <filter id="necklaceGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Support holographique */}
      <rect
        x="40"
        y="10"
        width="40"
        height="18"
        rx="4"
        fill="rgba(100, 100, 100, 0.35)"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
        filter="url(#necklaceGlow)"
        opacity="0.75"
      />
      {/* Chaîne */}
      <path
        d="M 50 28 Q 60 50 50 72 Q 40 95 50 115 Q 60 135 50 145"
        fill="none"
        stroke="url(#necklaceGradient)"
        strokeWidth="2.5"
        filter="url(#necklaceGlow)"
        opacity="0.7"
      />
      {/* Pendentif simple rond */}
      <ellipse
        cx="50"
        cy="125"
        rx="18"
        ry="22"
        fill="url(#necklaceGradient)"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="2"
        filter="url(#necklaceGlow)"
        opacity="0.8"
      />
      {/* Détail central du pendentif */}
      <circle
        cx="50"
        cy="125"
        r="8"
        fill="rgba(255, 255, 255, 0.3)"
        filter="url(#necklaceGlow)"
        opacity="0.7"
      />
    </svg>
  );
}

// Composant Collier avec pendentif en cœur
function NecklaceHeartProduct() {
  return (
    <svg
      className={styles.productSvg}
      viewBox="0 0 120 150"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="necklaceHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(192, 192, 192, 0.4)" />
        </linearGradient>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
          <stop offset="50%" stopColor="rgba(220, 230, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(147, 197, 253, 0.4)" />
        </linearGradient>
        <filter id="necklaceHeartGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Support holographique */}
      <rect
        x="40"
        y="10"
        width="40"
        height="20"
        rx="5"
        fill="rgba(100, 100, 100, 0.35)"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
        filter="url(#necklaceHeartGlow)"
        opacity="0.75"
      />
      {/* Chaîne */}
      <path
        d="M 50 30 Q 60 50 50 70 Q 40 90 50 110 Q 60 130 50 140"
        fill="none"
        stroke="url(#necklaceHeartGradient)"
        strokeWidth="2.5"
        filter="url(#necklaceHeartGlow)"
        opacity="0.7"
      />
      {/* Pendentif en forme de cœur */}
      <path
        d="M 50 110 C 50 105, 45 100, 40 105 C 35 100, 30 105, 30 110 C 30 115, 40 125, 50 135 C 60 125, 70 115, 70 110 C 70 105, 65 100, 60 105 C 55 100, 50 105, 50 110 Z"
        fill="url(#heartGradient)"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="2"
        filter="url(#necklaceHeartGlow)"
        opacity="0.85"
      />
      {/* Détails sur le cœur */}
      <circle
        cx="45"
        cy="112"
        r="3"
        fill="rgba(255, 255, 255, 0.7)"
        filter="url(#necklaceHeartGlow)"
        opacity="0.9"
      />
      <circle
        cx="55"
        cy="112"
        r="3"
        fill="rgba(255, 255, 255, 0.7)"
        filter="url(#necklaceHeartGlow)"
        opacity="0.9"
      />
      {/* Glow autour du cœur */}
      <path
        d="M 50 110 C 50 105, 45 100, 40 105 C 35 100, 30 105, 30 110 C 30 115, 40 125, 50 135 C 60 125, 70 115, 70 110 C 70 105, 65 100, 60 105 C 55 100, 50 105, 50 110 Z"
        fill="none"
        stroke="rgba(147, 197, 253, 0.4)"
        strokeWidth="1.5"
        filter="url(#necklaceHeartGlow)"
        opacity="0.6"
        transform="scale(1.15) translate(-5, -5)"
      />
    </svg>
  );
}

// Composant Lunettes
function GlassesProduct() {
  return (
    <svg
      className={styles.productSvg}
      viewBox="0 0 150 80"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="glassesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
          <stop offset="100%" stopColor="rgba(147, 197, 253, 0.35)" />
        </linearGradient>
        <filter id="glassesGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Verre gauche - monture épaisse */}
      <ellipse
        cx="40"
        cy="40"
        rx="32"
        ry="27"
        fill="none"
        stroke="url(#glassesGradient)"
        strokeWidth="3.5"
        filter="url(#glassesGlow)"
        opacity="0.7"
      />
      {/* Verre intérieur gauche */}
      <ellipse
        cx="40"
        cy="40"
        rx="26"
        ry="21"
        fill="rgba(147, 197, 253, 0.1)"
        filter="url(#glassesGlow)"
        opacity="0.4"
      />
      {/* Verre droit - monture épaisse */}
      <ellipse
        cx="110"
        cy="40"
        rx="32"
        ry="27"
        fill="none"
        stroke="url(#glassesGradient)"
        strokeWidth="3.5"
        filter="url(#glassesGlow)"
        opacity="0.7"
      />
      {/* Verre intérieur droit */}
      <ellipse
        cx="110"
        cy="40"
        rx="26"
        ry="21"
        fill="rgba(147, 197, 253, 0.1)"
        filter="url(#glassesGlow)"
        opacity="0.4"
      />
      {/* Pont épais */}
      <rect
        x="68"
        y="38"
        width="14"
        height="4"
        rx="2"
        fill="url(#glassesGradient)"
        filter="url(#glassesGlow)"
        opacity="0.7"
      />
      {/* Branches épaisses */}
      <rect
        x="5"
        y="38"
        width="8"
        height="3"
        rx="1.5"
        fill="url(#glassesGradient)"
        filter="url(#glassesGlow)"
        opacity="0.6"
        transform="rotate(-15 9 39.5)"
      />
      <rect
        x="137"
        y="38"
        width="8"
        height="3"
        rx="1.5"
        fill="url(#glassesGradient)"
        filter="url(#glassesGlow)"
        opacity="0.6"
        transform="rotate(15 141 39.5)"
      />
    </svg>
  );
}

