'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LOGO_URL = 'https://res.cloudinary.com/deh4aokbx/image/upload/v1768673851/Favicon_FT_qmi9px.webp';

interface LogoProps {
  /** Size variant */
  size?: 'small' | 'default' | 'large';
  /** Show "Luneo" text next to the icon */
  showText?: boolean;
  /** Link destination */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Logo variant for light or dark backgrounds */
  variant?: 'light' | 'dark';
  /** Called when logo is clicked */
  onClick?: () => void;
}

const sizeMap = {
  small: { icon: 24, text: 'text-base' },
  default: { icon: 32, text: 'text-xl' },
  large: { icon: 48, text: 'text-2xl' },
};

export function Logo({
  size = 'default',
  showText = true,
  href = '/',
  className = '',
  variant = 'light',
  onClick,
}: LogoProps) {
  const { icon, text } = sizeMap[size];
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-white';

  const logoContent = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src={LOGO_URL}
          alt="Luneo Logo"
          width={icon}
          height={icon}
          className="object-contain rounded-lg"
          priority
          unoptimized
        />
      </div>
      {showText && (
        <span className={`font-bold ${text} ${textColor} tracking-tight`}>
          Luneo
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center hover:opacity-80 transition-opacity"
        onClick={onClick}
        aria-label="Luneo - Accueil"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
