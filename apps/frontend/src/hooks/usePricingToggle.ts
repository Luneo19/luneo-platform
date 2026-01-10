'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for pricing toggle (monthly/yearly)
 */
export function usePricingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const prices = document.querySelectorAll('.price');
    const labels = document.querySelectorAll('.toggle-label');

    prices.forEach((price) => {
      const monthly = price.getAttribute('data-monthly');
      const yearly = price.getAttribute('data-yearly');

      if (monthly && yearly) {
        const priceElement = price as HTMLElement;
        priceElement.style.opacity = '0';
        priceElement.style.transform = 'translateY(-10px)';

        setTimeout(() => {
          priceElement.textContent = isYearly ? yearly : monthly;
          priceElement.style.opacity = '1';
          priceElement.style.transform = 'translateY(0)';
        }, 150);
      }
    });

    labels.forEach((label, index) => {
      if ((index === 0 && !isYearly) || (index === 1 && isYearly)) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    });
  }, [isYearly]);

  return { isYearly, setIsYearly };
}
