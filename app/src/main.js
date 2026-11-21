// Neon Coast Cover Studio — editor wiring.
//
// Photos, layouts, grades, lettering, undo/redo and PNG export. The cover
// itself is drawn by cover.js, so the preview, the export and the
// screenshot scenes can never drift apart. A `?shot=` query sets up a
// fixed scene instead; see shots.js.
import { drawCover, layoutPanels, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelInfo = document.getElementById('panelInfo');

// The whole editable state, minus the image elements themselves.
export const state = {
  layout: 'hero3',
  grade: 'neon',
  title: 'VICE HEIST',
  subtitle: 'Chasing the neon tide',
  badge: 'NEON COUNTY',
  grain: true,
  vignette: true,
  photos: [], // { img, name, url }
  panels: [], // per panel: { photo, fx, fy, zoom, ox, oy }
  selected: 0,
  picked: 0,
};

function panelCount() {
  return layoutPanels(state.layout, canvas.width, canvas.height).length;
}

function freshPanel() {
  return { photo: state.picked, fx: 0.5, fy: 0.5, zoom: 1, ox: 0, oy: 0 };
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push(freshPanel());
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

function redraw() {
  ensurePanels();
  drawCover(canvas, state);
  const n = panelCount();
  const panel = state.panels[state.selected];
  panelInfo.textContent = `panel ${state.selected + 1} of ${n} · photo ${(panel?.photo ?? 0) + 1}`;
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.value = String(panel?.zoom ?? 1);
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function addPhoto(img, name, url) {
  state.photos.push({ img, name, url });
  state.picked = state.photos.length - 1;
  renderPhotoList();
  pushHistory();
  redraw();
}

function renderPhotoList() {
  const list = document.getElementById('photoList');
  list.innerHTML = '';
  state.photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.url;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (i === state.picked) thumb.classList.add('picked');
    thumb.addEventListener('click', () => {
      state.picked = i;
      const panel = state.panels[state.selected];
      panel.photo = i;
      panel.fx = 0.5; panel.fy = 0.5; panel.ox = 0; panel.oy = 0; panel.zoom = 1;
      renderPhotoList();
      pushHistory();
      redraw();
    });
    list.appendChild(thumb);
  });
}

// Undo / redo over snapshots of the editable state (photos stay put).
let history = [], historyIndex = -1;
function snapshot() {
  return JSON.stringify({ ...state, photos: undefined, picked: state.picked });
}
function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  ensurePanels();
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  renderPhotoList();
  redraw();
}
function pushHistory() {
  history.length = historyIndex + 1;
  history.push(snapshot());
  if (history.length > 40) history.shift();
  historyIndex = history.length - 1;
}
function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restore(history[historyIndex]);
}
function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restore(history[historyIndex]);
}

// Layout and grade chips.
for (const [key, def] of Object.entries(LAYOUTS)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = def.name;
  b.dataset.layout = key;
  b.addEventListener('click', () => { state.layout = key; pushHistory(); redraw(); });
  document.getElementById('layouts').appendChild(b);
}
for (const [key, def] of Object.entries(GRADES)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = def.name;
  b.dataset.grade = key;
  b.addEventListener('click', () => { state.grade = key; pushHistory(); redraw(); });
  document.getElementById('grades').appendChild(b);
}

// Photo input: every chosen file becomes a photo the panels can use.
document.getElementById('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const url = URL.createObjectURL(file);
    addPhoto(await loadImage(url), file.name, url);
  }
  e.target.value = '';
});
document.getElementById('fillAll').addEventListener('click', () => {
  ensurePanels();
  state.panels.forEach((p) => { p.photo = state.picked; });
  pushHistory();
  redraw();
});
document.getElementById('sample').addEventListener('click', async () => {
  const img = await loadImage('samples/boulevard.jpg');
  addPhoto(img, 'boulevard.jpg', 'samples/boulevard.jpg');
  state.panels.forEach((p) => { p.photo = state.photos.length - 1; });
  redraw();
});

// Zoom and nudge for the selected panel's photo.
document.getElementById('zoom').addEventListener('input', (e) => {
  ensurePanels();
  state.panels[state.selected].zoom = Number(e.target.value);
  redraw();
});
function nudge(dx, dy) {
  ensurePanels();
  const p = state.panels[state.selected];
  p.ox = Math.max(-0.5, Math.min(0.5, p.ox + dx));
  p.oy = Math.max(-0.5, Math.min(0.5, p.oy + dy));
  redraw();
}
document.getElementById('moveLeft').addEventListener('click', () => nudge(-0.05, 0));
document.getElementById('moveRight').addEventListener('click', () => nudge(0.05, 0));
document.getElementById('moveUp').addEventListener('click', () => nudge(0, -0.05));
document.getElementById('moveDown').addEventListener('click', () => nudge(0, 0.05));

// Lettering and finish toggles.
for (const id of ['title', 'subtitle', 'badge']) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[id] = e.target.value;
    redraw();
  });
}
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

// Click a panel to select it; drag to move its photo inside the panel.
let dragging = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => p.x * canvas.width >= r.x && p.x * canvas.width <= r.x + r.w && p.y * canvas.height >= r.y && p.y * canvas.height <= r.y + r.h);
  if (hit >= 0) {
    state.selected = hit;
    dragging = { x: p.x, y: p.y, moved: false };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox + (p.x - dragging.x)));
  panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy + (p.y - dragging.y)));
  dragging.x = p.x; dragging.y = p.y; dragging.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging && dragging.moved) pushHistory();
  dragging = null;
});

// Export: render the same state at full post size and download the PNG.
function exportPng(w, h, name) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const keepSelected = state.selected;
  state.selected = -1; // no selection outline on the exported cover
  drawCover(off, state);
  state.selected = keepSelected;
  redraw();
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    status.textContent = `Saved ${name}`;
  }, 'image/png');
}
document.getElementById('expSquare').addEventListener('click', () => exportPng(1080, 1080, 'cover-1080x1080.png'));
document.getElementById('expPortrait').addEventListener('click', () => exportPng(1080, 1350, 'cover-1080x1350.png'));
document.getElementById('expWide').addEventListener('click', () => exportPng(1920, 1080, 'cover-1920x1080.png'));

// Shot scenes for screenshots, driven by runShot in shots.js.
window.__coverApp = {
  state,
  redraw,
  loadImage,
  loadSample: async (sample) => {
    const img = await loadImage(`samples/${sample}.jpg`);
    state.photos = [{ img, name: `${sample}.jpg`, url: `samples/${sample}.jpg` }];
    state.picked = 0;
    state.panels.forEach((p) => { p.photo = 0; });
    renderPhotoList();
  },
  loadSamples: async (samples) => {
    state.photos = [];
    for (const sample of samples) {
      const img = await loadImage(`samples/${sample}.jpg`);
      state.photos.push({ img, name: `${sample}.jpg`, url: `samples/${sample}.jpg` });
    }
    state.picked = 0;
    renderPhotoList();
  },
  setCanvasSize: (w, h) => { canvas.width = w; canvas.height = h; },
};

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, window.__coverApp).catch((err) => { status.textContent = `Shot failed: ${err.message}`; });
} else {
  ensurePanels();
  pushHistory();
  redraw();
}
