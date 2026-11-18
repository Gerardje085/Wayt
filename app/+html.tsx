import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Wayt</title>
        <meta name="theme-color" content="#09090B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wayt" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webPolishStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webPolishStyles = `
html, body {
  background-color: #09090B;
  color-scheme: dark light;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overscroll-behavior: none;
}

* {
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(113, 113, 122, 0.45) transparent;
}

*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(113, 113, 122, 0.42);
  border-radius: 9999px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(161, 161, 170, 0.65);
}

input, textarea, select {
  outline: none;
}

input:focus, textarea:focus, select:focus {
  outline: none;
}

button:focus:not(:focus-visible),
[role="button"]:focus:not(:focus-visible),
[role="tab"]:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible,
[role="button"]:focus-visible,
[role="tab"]:focus-visible,
a:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.7);
  outline-offset: 2px;
}
`;
