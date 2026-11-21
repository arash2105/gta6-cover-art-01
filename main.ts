// Neon Coast Cover Studio — entry program for gta6-cover-art-01.
//
// Node 22, standard library only. This file does one job: hand the app
// in. It copies this repository's app/ and screenshots/ into the grader's
// output folder and writes the dossier the judge reads, using the kit's
// own vendored library (vendor/makefun-app.ts, unchanged). The cover art
// itself lives in app/src/cover.js; nothing here draws or grades anything.
//
// The two sample photos under app/samples/ were made with an image model
// for make.fun and are free to use (kit RULES.txt).
//
// Try it locally with `node serve.ts` (opens the app at localhost:8080),
// then hand it in with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The folder this file lives in, and the folder the grader reads.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app first: every static file the browser needs, offline.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Then the screenshots, if the maker has taken any yet.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier, written by the kit's library from exactly what we copied.
// These caps mirror the scorer's own limits: only text_max_bytes shapes
// the dossier bytes; the rest refuse an entry the scorer would refuse —
// more than 4 screenshots or one over 256 KiB, more than 993 files in
// app/ or 48 MiB of app files in all, or a path under app/ over 1000
// bytes. app/ counts beside /output's own 1000-entry cap, which it
// shares with screenshots/ and dossier.json, so keep room.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
