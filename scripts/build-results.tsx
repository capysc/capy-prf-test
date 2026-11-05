import { mkdir, writeFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultsPage } from '../src/Results';

const html = '<!doctype html>' + renderToStaticMarkup(
  <html lang="en"><head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Dated manual results comparing passkey PRF encryption across 1Password, Apple Passwords and Chrome Password Manager, over direct and QR paths." />
    <title>Results · Passkey Lab</title>
    <link rel="stylesheet" href="/style.css" />
  </head><body><ResultsPage /></body></html>,
);

await mkdir('dist/results', { recursive: true });
await writeFile('dist/results/index.html', html);
