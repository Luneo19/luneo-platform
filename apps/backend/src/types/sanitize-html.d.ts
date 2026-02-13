declare module 'sanitize-html' {
  interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    [key: string]: unknown;
  }
  function sanitizeHtml(html: string, options?: IOptions): string;
  export = sanitizeHtml;
}
