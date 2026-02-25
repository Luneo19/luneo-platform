import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCustomizer from '@/components/Customizer/ProductCustomizer';

describe('ProductCustomizer Component', () => {
  it('affiche le placeholder tant que le customizer est en attente', () => {
    render(<ProductCustomizer />);
    expect(screen.getByText('Product Customizer - Coming Soon')).toBeInTheDocument();
  });
});

