export type RedactionSeverity = 'secret' | 'pii';
export interface PromptRedaction {
    label: string;
    preview: string;
    severity: RedactionSeverity;
}
export interface SanitizePromptOptions {
    /**
     * If true, any detected secret blocks the prompt immediately.
     * Defaults to true.
     */
    blockOnSecrets?: boolean;
    /**
     * Maximum number of characters kept.
     */
    maxLength?: number;
}
export interface SanitizePromptResult {
    prompt: string;
    redactions: PromptRedaction[];
    blocked: boolean;
    reasons: string[];
    piiDetected: boolean;
    truncated: boolean;
    originalLength: number;
}
export declare function sanitizePrompt(raw: string, options?: SanitizePromptOptions): SanitizePromptResult;
export declare const hashPrompt: (value: string) => string;
export declare const maskPromptForLogs: (value: string, maxLength?: number) => string;
