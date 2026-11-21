// Fixed scenes for screenshots.
//
// `?shot=editor` shows the editor with sample photos loaded.
// `?shot=cover` shows the exported cover alone: it is drawn at its true
// export size (w, h) on an offscreen canvas, then scaled into the visible
// canvas at the screenshot size (sw, sh), so the screenshot is a real
// export scaled down to fit the limits, never a re-draw or an edit.
// `?shot=exporttest` proves the export path writes a real PNG at the
// requested size and reports its byte count in the page.
//
// Query keys: photo, caption, subtitle, badge, layout, grade, w, h, sw,
// sh, and panels — one "photo:fx:fy:zoom" entry per panel, in order, so
// every crop is intentional (a face, a car, a sunset).
// window.__shotReady is set once the scene is painted, so headless Chrome
// knows when to take the screenshot.
import { drawCover } from './cover.js';

function parsePanels(spec, photos) {
  if (!spec) return [];
  return spec.split(',').map((entry) => {
    const [name, fx, fy, zoom] = entry.split(':');
    const photo = Math.max(0, photos.findIndex((p) => p.name === `${name}.jpg`));
    return {
      photo,
      fx: fx === undefined ? 0.5 : Number(fx),
      fy: fy === undefined ? 0.5 : Number(fy),
      zoom: zoom === undefined ? 1 : Number(zoom),
      ox: 0,
      oy: 0,
    };
  });
}

function report(text) {
  let el = document.getElementById('shotinfo');
  if (!el) {
    el = document.createElement('div');
    el.id = 'shotinfo';
    document.body.appendChild(el);
  }
  el.textContent = text;
  document.title = text;
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, app) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'VICE HEIST';
  const layout = query.get('layout') ?? 'hero3';
  const grade = query.get('grade') ?? 'neon';
  const w = Number(query.get('w') ?? 1280);
  const h = Number(query.get('h') ?? 720);
  const sw = Number(query.get('sw') ?? w);
  const sh = Number(query.get('sh') ?? h);
  const subtitle = query.get('subtitle') ?? 'Chasing the neon tide';
  const badge = query.get('badge') ?? 'NEON COUNTY';

  app.state.layout = layout;
  app.state.grade = grade;
  app.state.title = caption;
  app.state.subtitle = subtitle;
  app.state.badge = badge;

  // Both sample photos, so any panel can use either one.
  await app.loadSamples(['pier', 'boulevard']);
  const panels = parsePanels(query.get('panels'), app.state.photos);
  app.state.panels = panels;
  app.state.selected = -1;
  app.redraw();

  if (shot === 'exporttest') {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    drawCover(off, app.state);
    const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
    report(`export ${w}x${h} ${blob.size} bytes`);
    markReady();
    return;
  }

  await document.fonts.ready;

  if (shot === 'cover') {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    drawCover(off, app.state);
    app.setCanvasSize(sw, sh);
    document.body.classList.add('shot-cover');
    const vctx = document.getElementById('cover').getContext('2d');
    vctx.drawImage(off, 0, 0, sw, sh);
    report(`cover ${w}x${h} scaled to ${sw}x${sh}`);
  } else {
    // editor: the photo the shot asked for is the picked one.
    app.state.picked = Math.max(0, app.state.photos.findIndex((p) => p.name === `${photo}.jpg`));
    app.state.selected = 0;
    app.redraw();
    const col = document.querySelector('.controls');
    report(`editor ${photo} ${layout} ${grade} controls ${col.scrollHeight}/${col.clientHeight}`);
  }
  markReady();
}
