/**
 * Tests for Input Component
 * T-UI-002: Tests pour le composant Input
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  // ============================================
  // RENDERING TESTS
  // ============================================

  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText(/enter text/i);
      expect(input).toBeInTheDocument();
    });

    it('should render input with value', () => {
      render(<Input value="test value" readOnly />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should render disabled input', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should render input with type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  describe('Interactions', () => {
    it('should update value on change', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'test');
      
      expect(input.value).toBe('test');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should not update value when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'test');
      
      expect(input.value).toBe('');
    });

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TYPES TESTS
  // ============================================

  describe('Input Types', () => {
    it('should render text input', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('should render password input', () => {
      render(<Input type="password" label="Password" />);
      const input = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
    });
  });

  // ============================================
  // ACCESSIBILITY TESTS
  // ============================================

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <>
          <label htmlFor="test-input">Test Label</label>
          <Input id="test-input" />
        </>
      );
      const input = screen.getByLabelText(/test label/i);
      expect(input).toBeInTheDocument();
    });

    it('should have required attribute when required', () => {
      render(<Input required aria-label="Required input" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeRequired();
    });

    it('should have aria-invalid when error', () => {
      render(<Input aria-invalid="true" aria-label="Error input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should be keyboard accessible', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe('Validation', () => {
    it('should show required validation', () => {
      render(<Input required aria-label="Required" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeRequired();
    });

    it('should have minLength attribute', () => {
      render(<Input minLength={5} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.minLength).toBe(5);
    });

    it('should have maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });

    it('should have pattern attribute', () => {
      render(<Input pattern="[0-9]+" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.pattern).toBe('[0-9]+');
    });
  });
});

