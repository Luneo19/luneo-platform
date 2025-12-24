import { cleanup, render } from '@testing-library/react';
import { describe, expect, it, afterEach } from 'vitest';
import axe from 'axe-core';
import HomePage from '@/app/(public)/page';

const runAxe = async (container: HTMLElement) => {
  const { violations } = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: true },
      region: { enabled: true },
    },
  });
  expect(violations).toEqual([]);
};

describe('Hero a11y', () => {
  afterEach(() => cleanup());

  it('should have no axe violations', async () => {
    const { container } = render(<HomePage />);
    await runAxe(container);
  });
});

