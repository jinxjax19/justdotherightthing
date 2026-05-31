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
// Fills the three header boxes (location, body, date) from ep1_meta.csv
function renderVibeCheckMeta(data) {
  if (!data || !data.length) return;
  const d = data[0];
  const loc  = document.getElementById('vc-location');
  const body = document.getElementById('vc-body');
  const date = document.getElementById('vc-date');
  if (loc)  loc.textContent  = d.location || '';
  if (body) body.textContent = d.body     || '';
  if (date) date.textContent = d.date     || '';
}

function renderVibeCheck(data) {
  const tbody = document.getElementById('vibe-check-body');
  if (!tbody) return;
  const VIBE_ROWS = 9;
  tbody.innerHTML = '';
  for (let i = 0; i < Math.max(data.length, VIBE_ROWS); i++) {
    const tr = document.createElement('tr');
    if (i < data.length) {
      const d = data[i];
      tr.innerHTML = `<td style="width:25%">${d.side||''}</td><td style="width:55%">${d.keyarguments||''}</td><td style="width:20%">${d.live||''}</td>`;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td></td><td></td>';
    }
    tbody.appendChild(tr);
  }
}

/* Fills the Votes panel table from ep1_votes.csv
   Expected columns: item, motion, result, timestamp */
function renderVotes(data) {
  const tbody = document.getElementById('votes-body');
  if (!tbody) return;
  const VOTE_ROWS = 9;
  tbody.innerHTML = '';
  for (let i = 0; i < Math.max(data.length, VOTE_ROWS); i++) {
    const tr = document.createElement('tr');
    if (i < data.length) {
      const d = data[i];
      tr.innerHTML = `<td style="width:15%">${d.item||''}</td><td style="width:50%">${d.motion||''}</td><td style="width:20%">${d.result||''}</td><td style="width:15%">${d.timestamp||''}</td>`;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td></td><td></td><td></td>';
    }
    tbody.appendChild(tr);
  }
}

/* Fills the Money panel table from ep1_money.csv
   CSV columns: Context, Price, Time Stamp, Who Said It
   parseCSV normalises these to: context, price, timestamp, whosaidit */
function renderByNumbers(data) {
  const tbody = document.getElementById('by-numbers-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  /* No padding — show exactly the rows from the CSV */
  data.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="width:20%">${d.price||''}</td><td style="width:40%">${d.context||''}</td><td style="width:24%">${d.whosaidit||''}</td><td style="width:16%">${d.timestamp||''}</td>`;
    tbody.appendChild(tr);
  });
}

/* Parse a single CSV line, correctly handling double-quoted fields that may
   contain commas or escaped quotes ("") */
function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"'; i++;        /* escaped double-quote inside a quoted field */
      } else {
        inQuotes = !inQuotes;     /* toggle quoted-field mode */
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(field.trim()); /* end of field */
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field.trim());     /* last field */
  return fields;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  /* Normalise header names: lowercase, strip spaces */
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

async function fetchCSV(url) {
  const res = await fetch(url);
  return parseCSV(await res.text());
}

