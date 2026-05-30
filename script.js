// ── PAGE FLIP STATE ──────────────────────────────────────────────────────────
const TOTAL_SPREADS = 5;
let currentSpread = 0;
let isFlipping = false;

// ── FLIP MECHANIC ─────────────────────────────────────────────────────────────
function flipTo(target) {
  if (isFlipping || target === currentSpread) return;
  if (target < 0 || target >= TOTAL_SPREADS) return;

  const direction  = target > currentSpread ? 'next' : 'prev';
  const isMobile   = window.innerWidth <= 768;
  isFlipping = true;

  const leaf = document.getElementById('flip-leaf');

  // Position leaf over the turning page
  leaf.style.transition = 'none';
  leaf.style.transform  = 'perspective(2200px) rotateY(0deg)';

  if (direction === 'next') {
    leaf.style.left          = isMobile ? '0'   : '50%';
    leaf.style.width         = isMobile ? '100%' : '50%';
    leaf.style.transformOrigin = 'left center';
  } else {
    leaf.style.left          = '0';
    leaf.style.width         = isMobile ? '100%' : '50%';
    leaf.style.transformOrigin = 'right center';
  }

  leaf.style.opacity = '1';
  leaf.getBoundingClientRect(); // force reflow

  leaf.style.transition = 'transform 0.78s cubic-bezier(0.4, 0, 0.2, 1)';
  requestAnimationFrame(() => {
    leaf.style.transform = direction === 'next'
      ? 'perspective(2200px) rotateY(-180deg)'
      : 'perspective(2200px) rotateY(180deg)';
  });

  setTimeout(() => {
    currentSpread = target;
    updateNav();
  }, 420);

  setTimeout(() => {
    leaf.style.opacity    = '0';
    leaf.style.transform  = '';
    leaf.style.transition = '';
    isFlipping = false;
  }, 820);
}

function updateNav() {
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  const num  = document.getElementById('page-num');
  if (prev) prev.disabled = currentSpread === 0;
  if (next) next.disabled = currentSpread === TOTAL_SPREADS - 1;
  if (num)  num.textContent = `${currentSpread + 1}`;
}

// ── DATA RENDERERS (preserved for future data layer) ─────────────────────────
function renderVibeCheck(data) {
  const tbody = document.getElementById('vibe-check-body');
  if (!tbody) return;
  const VIBE_ROWS = 9;
  tbody.innerHTML = '';
  for (let i = 0; i < Math.max(data.length, VIBE_ROWS); i++) {
    const tr = document.createElement('tr');
    if (i < data.length) {
      const d = data[i];
      tr.innerHTML = `<td style="width:22%">${d.side||''}</td><td style="width:44%">${d.keyarguments||''}</td><td style="width:17%">${d.live||''}</td><td style="width:17%">${d.written||''}</td>`;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td></td><td></td><td></td>';
    }
    tbody.appendChild(tr);
  }
}

function renderByNumbers(data) {
  const tbody = document.getElementById('by-numbers-body');
  if (!tbody) return;
  const NUM_ROWS = 9;
  tbody.innerHTML = '';
  for (let i = 0; i < Math.max(data.length, NUM_ROWS); i++) {
    const tr = document.createElement('tr');
    if (i < data.length) {
      const d = data[i];
      tr.innerHTML = `<td style="width:28%">${d.keynumber||''}</td><td style="width:34%">${d.context||''}</td><td style="width:22%">${d.whosaidit||''}</td><td style="width:16%">${d.timestamp||''}</td>`;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td></td><td></td><td></td>';
    }
    tbody.appendChild(tr);
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '')
  );
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
    return obj;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url);
  return parseCSV(await res.text());
}

// ── NOTEBOOK OVERLAY POSITIONING ─────────────────────────────────────────────
function updateOverlay() {
  const img     = document.getElementById('notebook-img');
  const overlay = document.getElementById('notebook-overlay');
  if (!img || !overlay || !img.naturalWidth) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const nw = img.naturalWidth;   // 1264
  const nh = img.naturalHeight;  // 841

  // Replicate object-fit: cover math
  const scale = Math.max(vw / nw, vh / nh);
  const rw    = nw * scale;
  const rh    = nh * scale;
  const ox    = (vw - rw) / 2;
  const oy    = (vh - rh) / 2;

  overlay.style.left   = `${ox}px`;
  overlay.style.top    = `${oy}px`;
  overlay.style.width  = `${rw}px`;
  overlay.style.height = `${rh}px`;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  const img = document.getElementById('notebook-img');
  if (img) {
    if (img.complete) {
      updateOverlay();
    } else {
      img.addEventListener('load', updateOverlay);
    }
  }
  window.addEventListener('resize', updateOverlay);

  const next = document.getElementById('btn-next');
  const prev = document.getElementById('btn-prev');
  if (next) next.addEventListener('click', () => flipTo(currentSpread + 1));
  if (prev) prev.addEventListener('click', () => flipTo(currentSpread - 1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') flipTo(currentSpread + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   flipTo(currentSpread - 1);
  });
});
