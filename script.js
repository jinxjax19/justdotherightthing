// ── DATA SOURCES ──────────────────────────────────────────────────────────────
// When your Google Sheets are ready:
//   1. File → Share → Publish to web → select the sheet tab → CSV → Copy link
//   2. Paste the URL below and uncomment the fetch calls in init()
//
// const VIBE_CHECK_URL  = 'https://docs.google.com/spreadsheets/d/YOUR_ID/pub?gid=0&output=csv';
// const BY_NUMBERS_URL  = 'https://docs.google.com/spreadsheets/d/YOUR_ID/pub?gid=1&output=csv';

// ── PLACEHOLDER DATA ──────────────────────────────────────────────────────────
const vibeCheckPlaceholder  = [];   // { side, keyArguments, live, written }
const byNumbersPlaceholder  = [];   // { keyNumber, context, whoSaidIt, timeStamp }

// ── RENDER ────────────────────────────────────────────────────────────────────
const VIBE_ROWS = 9;
const NUM_ROWS  = 9;

function renderVibeCheck(data) {
  const tbody = document.getElementById('vibe-check-body');
  if (!tbody) return;
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

// ── CSV PARSER ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '')
  );
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj  = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
}

async function fetchCSV(url) {
  const res  = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

// ── BOARD MOUSE PARALLAX ──────────────────────────────────────────────────────
function initParallax() {
  const board = document.getElementById('board');
  if (!board) return;

  // Each entry: { selector, depth, element, current: {x,y}, target: {x,y} }
  const layers = [
    { sel: '.title-pin', depth: 0.4 },
    { sel: '.about-pin', depth: 0.75 },
    { sel: '.ella-pos',  depth: 0.9 },
    { sel: '.brie-pos',  depth: 0.9 },
    { sel: '.radio-pin', depth: 0.5 },
  ].map(L => ({
    ...L,
    el: board.querySelector(L.sel),
    cur: { x: 0, y: 0 },
    tgt: { x: 0, y: 0 },
  })).filter(L => L.el);

  let rafId = null;

  function tick() {
    rafId = null;
    let still = true;

    layers.forEach(L => {
      L.cur.x += (L.tgt.x - L.cur.x) * 0.1;
      L.cur.y += (L.tgt.y - L.cur.y) * 0.1;
      if (Math.abs(L.tgt.x - L.cur.x) > 0.05 || Math.abs(L.tgt.y - L.cur.y) > 0.05) still = false;

      L.el.style.setProperty('--px', `${L.cur.x.toFixed(2)}px`);
      L.el.style.setProperty('--py', `${L.cur.y.toFixed(2)}px`);
    });

    if (!still) rafId = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  board.addEventListener('mousemove', e => {
    const r  = board.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width  - 0.5;
    const my = (e.clientY - r.top)  / r.height - 0.5;
    layers.forEach(L => {
      L.tgt.x = -mx * 18 * L.depth;
      L.tgt.y = -my * 18 * L.depth;
    });
    schedule();
  });

  board.addEventListener('mouseleave', () => {
    layers.forEach(L => { L.tgt.x = 0; L.tgt.y = 0; });
    schedule();
  });
}

// ── POLAROID 3D TILT ──────────────────────────────────────────────────────────
function initPolaroidTilt() {
  document.querySelectorAll('.polaroid').forEach(card => {
    const baseRot = parseFloat(card.dataset.rot || '0');

    card.addEventListener('mousemove', e => {
      if (card._tilting) return;
      card._tilting = true;
      requestAnimationFrame(() => {
        card._tilting = false;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        const px = parseFloat(card.style.getPropertyValue('--px') || '0');
        const py = parseFloat(card.style.getPropertyValue('--py') || '0');
        card.style.transform = `perspective(520px) rotateY(${x * 22}deg) rotateX(${-y * 22}deg) rotate(${baseRot}deg) translate(${px}px,${py}px) scale(1.1)`;
        card.style.boxShadow = `${-x * 18}px ${y * -12}px 32px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)`;
        card.style.zIndex = '20';
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.zIndex   = '';
    });
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
function initScrollReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal-section').forEach(el => obs.observe(el));
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  renderVibeCheck(vibeCheckPlaceholder);
  renderByNumbers(byNumbersPlaceholder);

  // Uncomment when Google Sheets URLs are ready:
  //
  // try {
  //   renderVibeCheck(await fetchCSV(VIBE_CHECK_URL));
  // } catch (e) { console.warn('Vibe Check: could not load data', e); }
  //
  // try {
  //   renderByNumbers(await fetchCSV(BY_NUMBERS_URL));
  // } catch (e) { console.warn('By The Numbers: could not load data', e); }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  initParallax();
  initPolaroidTilt();
  initScrollReveal();
});
