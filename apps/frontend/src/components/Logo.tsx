'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /**
   * Taille du logo
   * @default 'default' - 32x32px pour l'icône, texte normal
   */
  size?: 'small' | 'default' | 'large';
  /**
   * Afficher le texte "Luneo" à côté du logo
   * @default true
   */
  showText?: boolean;
  /**
   * Lien vers lequel le logo redirige
   * @default '/'
   */
  href?: string;
  /**
   * Classe CSS supplémentaire
   */
  className?: string;
  /**
   * Variante du logo (pour fond clair ou sombre)
   * @default 'light'
   */
  variant?: 'light' | 'dark';
}

const sizeMap = {
  small: { icon: 20, text: 'text-base' },
  default: { icon: 32, text: 'text-xl' },
  large: { icon: 48, text: 'text-2xl' },
};

export function Logo({
  size = 'default',
  showText = true,
  href = '/',
  className = '',
  variant = 'light',
}: LogoProps) {
  const { icon, text } = sizeMap[size];
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-white';

  const logoContent = (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src={showText ? "/logo.png" : "/logo.png"}
          alt="Luneo Logo"
          width={icon}
          height={icon}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold ${text} ${textColor}`}>
          Luneo
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

