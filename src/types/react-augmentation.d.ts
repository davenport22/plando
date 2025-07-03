
// This declaration allows us to use the data-ai-hint attribute on any HTML element
// without TypeScript complaining. It augments the default React HTMLAttributes.

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    dataAiHint?: string;
  }
}
