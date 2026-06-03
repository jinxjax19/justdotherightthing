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

/* Fills the Comments panel table from ep1_vibecheck.csv
   CSV format: argument text, timestamp, (optional empty trailing column).
   Row 1 (CSV header) = "Total Comments Supporting..." count — used as column key.
   Rows with no timestamp (e.g. "Total Comments Opposing...") render as section headers.
   Rows with a timestamp render as argument rows.
   Timestamp is found by pattern-match rather than key name, so a trailing
   comma (3rd empty column) doesn't break lookup. */
function renderVibeCheck(data) {
  const tbody = document.getElementById('vibe-check-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!data.length) return;

  const textKey = Object.keys(data[0])[0];

  /* Show the CSV header row text (e.g. "Total Comments Supporting...") as first section header */
  const firstHeader = (data._rawHeaders && data._rawHeaders[0] || '').trim();
  if (firstHeader) {
    const hr = document.createElement('tr');
    hr.innerHTML = `<td class="vibecheck-section-header">${firstHeader}</td>`;
    tbody.appendChild(hr);
  }

  data.forEach(d => {
    const text = (d[textKey] || '').trim();
    if (!text) return;
    const tr = document.createElement('tr');

    /* Section headers: total-count rows or rows ending with "Summary" */
    /* Skip "...Summary" label rows — they're redundant after the total count header */
    if (/summary$/i.test(text)) return;

    const isSectionHeader = /^total comments/i.test(text);

    if (isSectionHeader) {
      tr.innerHTML = `<td class="vibecheck-section-header">${text}</td>`;
    } else {
      /* Check for optional timestamp */
      const ts = (Object.values(d).find(v => /\[?\d{1,2}:\d{2}/.test(v || '')) || '').trim();
      if (ts) {
        const secs = timeToSeconds(ts);
        const tsCell = secs > 0
          ? `<td class="ts-link" data-seconds="${secs}" style="width:20%">${ts}</td>`
          : `<td style="width:20%">${ts}</td>`;
        tr.innerHTML = `<td style="width:80%">${text}</td>${tsCell}`;
      } else {
        tr.innerHTML = `<td>${text}</td>`;
      }
    }
    tbody.appendChild(tr);
  });
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
    const text = (d.proposals || '').trim();
    if (!text) return; /* skip empty rows */
    const tr  = document.createElement('tr');
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
  data.forEach(d => {
    if (!d.context && !d.price) return; /* skip empty rows */
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
  /* Strip carriage returns (Windows line endings) and blank/comma-only rows */
  const lines = text.trim().replace(/\r/g, '').split('\n')
    .filter(l => l.replace(/,/g, '').trim());
  if (lines.length < 2) return [];
  /* Preserve raw header values before normalising — callers can read _rawHeaders */
  const rawHeaders = parseCSVLine(lines[0]);
  /* Normalise header names: lowercase, strip spaces */
  const raw = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, ''));
  /* Deduplicate: if two columns share a name (e.g. both empty from a trailing
     comma), suffix the second one with _1, _2, … so neither value is lost. */
  const seen = {};
  const headers = raw.map(h => {
    if (h in seen) { seen[h]++; return h + '_' + seen[h]; }
    seen[h] = 0; return h;
  });
  const result = lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  result._rawHeaders = rawHeaders;  /* attach so renderers can use original text */
  return result;
}

async function fetchCSV(url) {
  const res = await fetch(url);
  return parseCSV(await res.text());
}

