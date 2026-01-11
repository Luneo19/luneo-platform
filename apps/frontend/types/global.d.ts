/// <reference types="minimatch" />

// Global type definitions to satisfy TypeScript compiler
// This file ensures all implicit type libraries are available

import 'react';declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Framer Motion component
      // This allows TypeScript to recognize <motion> and <motion.*> elements without explicit imports
      // The actual motion component should be imported from framer-motion or lazy-loaded
      motion: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
        whileHover?: any;
        whileTap?: any;
        whileFocus?: any;
        whileInView?: any;
        variants?: any;
        [key: string]: any;
      };
      // Support for motion.button, motion.div, motion.p, etc.
      'motion.button': React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
        whileHover?: any;
        whileTap?: any;
        whileFocus?: any;
        whileInView?: any;
        variants?: any;
        [key: string]: any;
      };
      'motion.p': React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> & {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
        whileHover?: any;
        whileTap?: any;
        whileFocus?: any;
        whileInView?: any;
        variants?: any;
        [key: string]: any;
      };
    }
  }
}
