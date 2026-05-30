// ── ITEM INTERACTIONS ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nb-item[data-href]').forEach(el => {
    el.addEventListener('click', () => {
      const href = el.dataset.href;
      if (href && href !== '#') window.location.href = href;
    });
  });
});

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

