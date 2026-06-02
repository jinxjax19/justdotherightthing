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

/* Fills the Vibes panel table from ep1_vibecheck.csv
   CSV columns: Supporters, Key Argument, TimeStamp
   Rows with an empty Supporters cell are treated as continuations of the
   previous group; the first row of each group gets a rowspan spanning all
   its continuation rows so the label merges visually. */
function renderVibeCheck(data) {
  const tbody = document.getElementById('vibe-check-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  let i = 0;
  while (i < data.length) {
    const d = data[i];
    const supporter = (d.supporters || '').trim();

    /* Count how many following rows belong to this group (empty supporters) */
    let span = 1;
    while (i + span < data.length && !(data[i + span].supporters || '').trim()) {
      span++;
    }

    /* First row of the group — supporters cell spans all rows in the group */
    const tr = document.createElement('tr');
    const secs = timeToSeconds(d.timestamp);
    const tsCell = secs > 0
      ? `<td class="ts-link" data-seconds="${secs}" style="width:20%">${d.timestamp}</td>`
      : `<td style="width:20%">${d.timestamp||''}</td>`;
    tr.innerHTML = `<td rowspan="${span}" style="width:25%; vertical-align:middle;">${supporter}</td><td style="width:55%">${d.keyargument||''}</td>${tsCell}`;
    tbody.appendChild(tr);

    /* Continuation rows — no supporters cell (consumed by rowspan above) */
    for (let j = 1; j < span; j++) {
      const rd = data[i + j];
      const tr2 = document.createElement('tr');
      const secs2 = timeToSeconds(rd.timestamp);
      const tsCell2 = secs2 > 0
        ? `<td class="ts-link" data-seconds="${secs2}" style="width:20%">${rd.timestamp}</td>`
        : `<td style="width:20%">${rd.timestamp||''}</td>`;
      tr2.innerHTML = `<td style="width:55%">${rd.keyargument||''}</td>${tsCell2}`;
      tbody.appendChild(tr2);
    }

    i += span;
  }

  /* Pad to minimum row count so the table doesn't look sparse when data is short */
  const VIBE_ROWS = 9;
  const rendered = tbody.querySelectorAll('tr').length;
  for (let p = rendered; p < VIBE_ROWS; p++) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>&nbsp;</td><td></td><td></td>';
    tbody.appendChild(tr);
  }
}

/* Fills the Decisions panel table from ep1_votes.csv
   CSV columns: Proposals (text), "" (timestamp — header is blank)
   Rows where the timestamp column is empty are section headers and render
   as a full-width merged cell. All other rows get a clickable timestamp. */
function renderDecisions(data) {
  const tbody = document.getElementById('decisions-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  /* "Proposals" is the CSV column header so it doesn't appear as a data row —
     inject it manually as the first section header */
  const firstHeader = document.createElement('tr');
  firstHeader.innerHTML = `<td colspan="2" class="decisions-section-header">Proposals</td>`;
  tbody.appendChild(firstHeader);

  data.forEach(d => {
    const tr  = document.createElement('tr');
    const text = d.proposals || '';
    const ts   = (d[''] || '').trim();   /* timestamp lives in the blank-named column */

    if (!ts) {
      /* Section header row (e.g. "Next Steps") */
      tr.innerHTML = `<td colspan="2" class="decisions-section-header">${text}</td>`;
    } else {
      /* Decision row with clickable timestamp */
      const secs = timeToSeconds(ts);
      const tsCell = secs > 0
        ? `<td class="ts-link" data-seconds="${secs}" style="width:20%">${ts}</td>`
        : `<td style="width:20%">${ts}</td>`;
      tr.innerHTML = `<td style="width:80%">${text}</td>${tsCell}`;
    }
    tbody.appendChild(tr);
  });
}

/* Convert a H:MM:SS or M:SS timestamp string to total seconds.
   Strips surrounding brackets e.g. [01:59:00] before parsing. */
function timeToSeconds(str) {
  if (!str) return 0;
  const cleaned = str.trim().replace(/[\[\]]/g, '');
  const parts = cleaned.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/* Fills the Money panel table from ep1_money.csv
   CSV columns: Context, Price, Time Stamp, Who Said It
   parseCSV normalises these to: context, price, timestamp, whosaidit
   Timestamp cells get class="ts-link" and data-seconds so the YT player
   can seek to that position when clicked. */
function renderByNumbers(data) {
  const tbody = document.getElementById('by-numbers-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  /* No padding — show exactly the rows from the CSV */
  data.forEach(d => {
    const tr = document.createElement('tr');
    const secs = timeToSeconds(d.timestamp);
    /* Only make the cell a link if we got a valid non-zero time */
    const tsCell = secs > 0
      ? `<td class="ts-link" data-seconds="${secs}" style="width:16%">${d.timestamp}</td>`
      : `<td style="width:16%">${d.timestamp||''}</td>`;
    tr.innerHTML = `<td style="width:20%">${d.price||''}</td><td style="width:40%">${d.context||''}</td><td style="width:24%">${d.whosaidit||''}</td>${tsCell}`;
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

