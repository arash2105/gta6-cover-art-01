// Neon Coast Cover Studio — cover renderer.
//
// Draws one multi-panel poster cover onto any 2D canvas. The state it
// reads is plain data, so the editor, the PNG export and the screenshot
// scenes all share exactly the same drawing and can never drift apart.
//
// A panel keeps a focal point (fx, fy: the point of its photo that belongs
// in the middle of the panel), a zoom, and a drag offset (ox, oy). The
// focal point is what makes a crop intentional: a face, a car or a sunset
// stays in frame instead of being cut by a blind centre crop.

export const LAYOUTS = {
  grid4: { name: 'Four Panel', panels: 4 },
  hero3: { name: 'Hero + Three', panels: 4 },
  full: { name: 'Full Bleed', panels: 1 },
  grid9: { name: 'Nine Panel', panels: 9 },
  tilted: { name: 'Tilted Snaps', panels: 3 },
  strip3: { name: 'Three Strip', panels: 3 },
};

// Six colour grades. Each carries the sky gradient that shows between
// the panels, a wash laid over every photo, the two colours of the title
// lettering, and the glow colour of the script subtitle. The wash is
// strong (0.45) on purpose: the grade has to read even in a small image.
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff2e63', '#2b1055'],
    wash: 'rgba(255,110,60,0.45)',
    title: ['#fff7d6', '#ffb347'],
    glow: 'rgba(255,150,60,0.9)',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#12082e', '#c400a5', '#00c8e8'],
    wash: 'rgba(255,0,168,0.45)',
    title: ['#ffffff', '#00e5ff'],
    glow: 'rgba(255,0,168,0.9)',
  },
  gold: {
    name: 'Palm Gold',
    sky: ['#f7b733', '#fc4a1a', '#3d1e00'],
    wash: 'rgba(255,180,40,0.45)',
    title: ['#fffbe8', '#ffd23e'],
    glow: 'rgba(255,190,60,0.9)',
  },
  teal: {
    name: 'Teal Noir',
    sky: ['#0f2027', '#1f6f7a', '#00d2ff'],
    wash: 'rgba(0,210,255,0.45)',
    title: ['#eafcff', '#4dd8ff'],
    glow: 'rgba(0,210,255,0.9)',
  },
  pink: {
    name: 'Hot Pink',
    sky: ['#ff0080', '#b3127f', '#1a0033'],
    wash: 'rgba(255,0,128,0.45)',
    title: ['#ffe3f1', '#ff5db1'],
    glow: 'rgba(255,0,128,0.9)',
  },
};

// Panel rectangles for a cover of width w and height h. Gutters stay
// visible so the sky shows between the panels and the cover reads as a
// poster collage, never as one flat photo. Tilted snaps carry a rotation
// and a polaroid frame; every other layout gets a thin dark keyline.
export function layoutPanels(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.018) + 2;
  const m = Math.round(Math.min(w, h) * 0.02) + 4;
  const inner = { x: m, y: m, w: w - m * 2, h: h - m * 2 };
  if (layout === 'full') return [{ ...inner, rot: 0, frame: 'keyline' }];
  if (layout === 'grid4') {
    const cw = (inner.w - g) / 2, ch = (inner.h - g) / 2;
    return [
      { x: inner.x, y: inner.y, w: cw, h: ch, rot: 0, frame: 'keyline' },
      { x: inner.x + cw + g, y: inner.y, w: cw, h: ch, rot: 0, frame: 'keyline' },
      { x: inner.x, y: inner.y + ch + g, w: cw, h: ch, rot: 0, frame: 'keyline' },
      { x: inner.x + cw + g, y: inner.y + ch + g, w: cw, h: ch, rot: 0, frame: 'keyline' },
    ];
  }
  if (layout === 'hero3') {
    const heroW = inner.w * 0.6;
    const sideX = inner.x + heroW + g, sideW = inner.w - heroW - g;
    const ch = (inner.h - g * 2) / 3;
    return [
      { x: inner.x, y: inner.y, w: heroW, h: inner.h, rot: 0, frame: 'keyline' },
      { x: sideX, y: inner.y, w: sideW, h: ch, rot: 0, frame: 'keyline' },
      { x: sideX, y: inner.y + ch + g, w: sideW, h: ch, rot: 0, frame: 'keyline' },
      { x: sideX, y: inner.y + (ch + g) * 2, w: sideW, h: ch, rot: 0, frame: 'keyline' },
    ];
  }
  if (layout === 'grid9') {
    const cw = (inner.w - g * 2) / 3, ch = (inner.h - g * 2) / 3;
    const out = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        out.push({ x: inner.x + c * (cw + g), y: inner.y + r * (ch + g), w: cw, h: ch, rot: 0, frame: 'keyline' });
      }
    }
    return out;
  }
  if (layout === 'tilted') {
    const pw = inner.w * 0.52, ph = inner.h * 0.42;
    return [
      { x: inner.x + inner.w * 0.03, y: inner.y + inner.h * 0.03, w: pw, h: ph, rot: -0.07, frame: 'polaroid' },
      { x: inner.x + inner.w * 0.45, y: inner.y + inner.h * 0.06, w: pw, h: ph, rot: 0.05, frame: 'polaroid' },
      { x: inner.x + inner.w * 0.24, y: inner.y + inner.h * 0.34, w: pw, h: ph, rot: -0.02, frame: 'polaroid' },
    ];
  }
  // strip3: three horizontal bands.
  const bh = (inner.h - g * 2) / 3;
  return [
    { x: inner.x, y: inner.y, w: inner.w, h: bh, rot: 0, frame: 'keyline' },
    { x: inner.x, y: inner.y + bh + g, w: inner.w, h: bh, rot: 0, frame: 'keyline' },
    { x: inner.x, y: inner.y + (bh + g) * 2, w: inner.w, h: bh, rot: 0, frame: 'keyline' },
  ];
}

// A tiny noise tile, made once and reused, for the film grain.
let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const d = c.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  c.putImageData(d, 0, 0);
  noiseTile = t;
  return t;
}

// Draws one photo cover-fit inside a rectangle. The panel's focal point
// (fx, fy) lands in the middle of the panel; the drag offset (ox, oy)
// and zoom shift it from there. The photo is clamped so it always covers
// the panel. With no photo yet, a painted sunset gradient stands in.
function drawPhotoInto(ctx, photo, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.img) {
    const img = photo.img;
    const zoom = panel.zoom || 1;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base, ph = img.naturalHeight * base;
    const fx = panel.fx ?? 0.5, fy = panel.fy ?? 0.5;
    let px = rect.x + rect.w / 2 - fx * pw + (panel.ox || 0) * rect.w;
    let py = rect.y + rect.h / 2 - fy * ph + (panel.oy || 0) * rect.h;
    px = Math.max(rect.x + rect.w - pw, Math.min(rect.x, px));
    py = Math.max(rect.y + rect.h - ph, Math.min(rect.y, py));
    ctx.drawImage(img, px, py, pw, ph);
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#ff8c42'); g.addColorStop(0.55, '#c94b7c'); g.addColorStop(1, '#3b1d5a');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(30,10,40,0.55)';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.72, rect.y + rect.h * 0.3, rect.w * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    ctx.font = `bold ${Math.max(14, rect.w * 0.07)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.55);
  }
  ctx.restore();
}

// Draws one panel: the photo, the grade wash, and its frame. A polaroid
// frame is white with a deeper bottom edge, like a snapshot; every other
// panel gets only a thin dark keyline, so the main cover never looks like
// a polaroid.
function drawPanel(ctx, rect, photo, panel, grade, w, h) {
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
  } else {
    ctx.translate(rect.x, rect.y);
  }
  const local = { x: 0, y: 0, w: rect.w, h: rect.h };
  if (rect.frame === 'polaroid') {
    const pad = Math.max(8, Math.min(w, h) * 0.012);
    const foot = pad * 3.2;
    ctx.fillStyle = '#fdfdf8';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.max(10, Math.min(w, h) * 0.02);
    ctx.shadowOffsetY = Math.max(4, Math.min(w, h) * 0.006);
    ctx.fillRect(-pad, -pad, rect.w + pad * 2, rect.h + pad + foot);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawPhotoInto(ctx, photo, local, panel);
    ctx.fillStyle = grade.wash;
    ctx.fillRect(0, 0, rect.w, rect.h);
  } else {
    drawPhotoInto(ctx, photo, local, panel);
    ctx.fillStyle = grade.wash;
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.003);
    ctx.strokeStyle = 'rgba(8,4,18,0.55)';
    ctx.strokeRect(0, 0, rect.w, rect.h);
  }
  ctx.restore();
}

/** Draws the whole cover for `state` onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = layoutPanels(state.layout, w, h);

  // Sky: the grade gradient behind and between the panels.
  const sky = ctx.createLinearGradient(0, 0, w * 0.3, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Panels, in order, each with its own photo, wash and frame.
  panels.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: 0, fx: 0.5, fy: 0.5, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos && state.photos[panel.photo != null ? panel.photo : 0];
    drawPanel(ctx, rect, photo, panel, grade, w, h);
    if (state.selected === i) {
      ctx.save();
      ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
      ctx.strokeStyle = '#ffd23e';
      ctx.setLineDash([14, 8]);
      ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
      ctx.restore();
    }
  });

  // Badge ribbon, top right, clear of the faces.
  const badge = (state.badge || '').trim();
  if (badge) {
    ctx.save();
    const bh = Math.max(26, h * 0.052);
    ctx.font = `bold ${Math.round(bh * 0.52)}px Anton, sans-serif`;
    const bw = Math.min(w * 0.36, ctx.measureText(badge.toUpperCase()).width + 44);
    const bx = w - bw - w * 0.03, by = h * 0.045;
    ctx.translate(bx, by);
    ctx.rotate(-0.02);
    ctx.fillStyle = '#11101a';
    ctx.fillRect(0, 0, bw, bh);
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(0, bh - 4, bw, 4);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.toUpperCase(), 18, bh / 2 + 1);
    ctx.restore();
  }

  // Lettering, straight on the photo: no bar, no band, no stars. The
  // title is big Anton with a thick dark outline; faces live in the upper
  // part of the photos, so the title sits low where it cannot cover one.
  // The subtitle is a different line from the title, never a repeat of it.
  const title = (state.title || 'VICE HEIST').trim().toUpperCase() || 'VICE HEIST';
  let size = Math.round(h * 0.105);
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > w * 0.92 && size > 18) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const titleGrad = ctx.createLinearGradient(0, h - size * 1.6, 0, h);
  titleGrad.addColorStop(0, grade.title[0]);
  titleGrad.addColorStop(1, grade.title[1]);
  const titleY = Math.round(h * 0.955);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.strokeStyle = 'rgba(10,5,20,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(size * 0.12);
  ctx.shadowOffsetY = Math.round(size * 0.03);
  ctx.strokeText(title, w / 2, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, w / 2, titleY);
  ctx.restore();

  const sub = (state.subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.font = `${Math.round(size * 0.36)}px Pacifico, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(size * 0.2);
    ctx.fillText(sub, w / 2, titleY - Math.round(size * 1.18));
    ctx.restore();
  }

  // Grain and vignette finish the poster look.
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette !== false) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}
