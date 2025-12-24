/**
 * Test utilities for React Testing Library
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { TRPCProvider } from '@/app/providers';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <TRPCProvider>{children}</TRPCProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

