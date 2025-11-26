export interface KeywordPattern {
    label: string;
    regex: RegExp;
}
export declare const SECRET_PATTERNS: KeywordPattern[];
export declare const PII_PATTERNS: KeywordPattern[];
export declare const BLOCKED_KEYWORDS: string[];
