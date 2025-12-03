// Type definitions for minimatch
// Professional type definitions to satisfy TypeScript's implicit type library requirement
// This ensures the build process doesn't fail on missing type definitions

declare module 'minimatch' {
  export interface MinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    noext?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  export function minimatch(
    target: string,
    pattern: string,
    options?: MinimatchOptions
  ): boolean;

  export class Minimatch {
    pattern: string;
    options: MinimatchOptions;
    regexp: RegExp | null;
    negate: boolean;
    comment: boolean;
    empty: boolean;

    constructor(pattern: string, options?: MinimatchOptions);
    match(target: string): boolean;
    makeRe(): RegExp | null;
  }

  export default minimatch;
}

// Global namespace declaration for implicit type library
declare namespace minimatch {
  export interface MinimatchOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    noext?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
  }

  export function minimatch(
    target: string,
    pattern: string,
    options?: MinimatchOptions
  ): boolean;

  export class Minimatch {
    pattern: string;
    options: MinimatchOptions;
    regexp: RegExp | null;
    negate: boolean;
    comment: boolean;
    empty: boolean;

    constructor(pattern: string, options?: MinimatchOptions);
    match(target: string): boolean;
    makeRe(): RegExp | null;
  }
}

