
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
  const img = document.getElementById('notebook-img');
  if (img) {
    if (img.complete) {
      updateOverlay();
    } else {
      img.addEventListener('load', updateOverlay);
    }
  }
  window.addEventListener('resize', updateOverlay);
});
