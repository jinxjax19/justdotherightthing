const overlay = document.getElementById('tv-overlay');
const canvas  = document.getElementById('static-canvas');
let rafId = null;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawFrame() {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const img = ctx.createImageData(w, h);
  const d   = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 180 + 40) | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // rolling scan band
  const band = (Date.now() / 4) % h;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(0, band, w, 4);
}

function startStatic() {
  resizeCanvas();
  function loop() { drawFrame(); rafId = requestAnimationFrame(loop); }
  loop();
}

function stopStatic() {
  cancelAnimationFrame(rafId);
  rafId = null;
}

// Navigate with TV static transition
window.navigate = function(url) {
  if (!url || url === '#') return;
  overlay.style.transition = 'none';
  overlay.style.opacity    = '1';
  overlay.style.pointerEvents = 'all';
  startStatic();
  setTimeout(() => {
    stopStatic();
    window.location.href = url;
  }, 520);
};

// On page load: static plays then fades out to reveal page
window.addEventListener('DOMContentLoaded', () => {
  overlay.style.transition    = 'none';
  overlay.style.opacity       = '1';
  overlay.style.pointerEvents = 'none';
  startStatic();

  setTimeout(() => {
    stopStatic();
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity    = '0';
  }, 380);

  // Wire all data-href elements
  document.querySelectorAll('[data-href]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.href));
  });
});

window.addEventListener('resize', () => { if (rafId) resizeCanvas(); });
