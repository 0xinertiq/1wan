// Markdown imports are plain strings (see next.config.mjs).
declare module "*.md" {
  const text: string;
  export default text;
}
