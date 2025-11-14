// Temporary type declaration for the `qrcode` package
// Provides a minimal module declaration so TypeScript won't error during build.
declare module 'qrcode' {
  const content: any;
  export = content;
}
