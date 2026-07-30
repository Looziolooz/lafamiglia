/**
 * Misura difetti mobile oggettivi sull'app in esecuzione, su database temporaneo.
 * Non stima: legge geometrie reali dal DOM.
 *   - "chrome": pixel occupati da controlli prima del primo contenuto
 *   - aree tocco sotto 44x44 (soglia WCAG 2.5.5 / linee guida iOS e Android)
 *   - contrasto testo/sfondo sotto 4.5:1 (WCAG AA)
 * Uso: node scripts/audit-mobile.mjs
 */
import puppeteer from 'puppeteer';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
// Nome univoco per esecuzione: su Windows il file della corsa precedente resta
// bloccato dal processo server e non si puo' cancellare. Riusandolo si ereditava
// uno stato vecchio, il login falliva e l'audit misurava la pagina di login.
const DB = resolve(ROOT, `.tmp-audit-${process.pid}.db`);
// Porta univoca per esecuzione: un server residuo di una corsa precedente
// risponde a /health con il SUO database, e il login fallisce su dati che non
// esistono. Derivarla dal pid evita del tutto la collisione.
const PORT = 3400 + (process.pid % 400);
const BASE = `http://127.0.0.1:${PORT}`;

for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) if (existsSync(f)) rmSync(f);
const env = {
  ...process.env, DB_PATH: DB, PORT: String(PORT),
  SESSION_SECRET: 'audit-secret-lungo-abbastanza-per-i-32-caratteri',
  SESSION_SECURE: 'false', NODE_ENV: 'development',
  BACKUP_DIR: resolve(ROOT, '.tmp-audit-backups'),
};

const waitHealth = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) return true; } catch { /* attesa */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

let srv = spawn(process.execPath, ['server/index.js'], { env, cwd: ROOT, stdio: 'ignore' });
if (!(await waitHealth())) { console.error('server non partito'); srv.kill(); process.exit(1); }
const seed = spawnSync(process.execPath, ['scripts/seed-demo.js', '--db', DB], { cwd: ROOT, encoding: 'utf8' });
console.log('porta', PORT, '| seed:', (seed.stdout || seed.stderr || '(nessun output)').trim().split('\n').pop());
srv.kill(); await new Promise((r) => setTimeout(r, 800));
srv = spawn(process.execPath, ['server/index.js'], { env, cwd: ROOT, stdio: 'ignore' });
if (!(await waitHealth())) { console.error('riavvio fallito'); srv.kill(); process.exit(1); }

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 180000 });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

await page.goto(BASE, { waitUntil: 'networkidle2' });
await page.waitForSelector('#username', { timeout: 20000 });
// Pausa dopo la comparsa del form: il token CSRF viene recuperato dopo il render,
// e un invio anticipato viene rifiutato.
await new Promise((r) => setTimeout(r, 800));
page.on('response', async (res) => {
  if (res.url().includes('/auth/login')) {
    let b = ''; try { b = (await res.text()).slice(0, 160); } catch { /* corpo non leggibile */ }
    console.log(`  risposta login: ${res.status()} ${b}`);
  }
});
await page.type('#username', 'linda', { delay: 20 });
await page.type('#password', 'demo1234', { delay: 20 });
await page.click('button[type=submit]');

// Attendere la CONDIZIONE, non un tempo fisso: bcrypt gira a costo 12 e sotto
// carico (p.es. suite di test in parallelo) il login supera i 2-3 secondi.
// Un'attesa fissa faceva finire l'audit sulla pagina di login, dove ogni misura
// vale zero e sembrerebbe un "nessun problema".
try {
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 45000 });
} catch {
  console.error('LOGIN FALLITO — nessuna misura eseguita (il risultato sarebbe un falso via libera).');
  await browser.close(); srv.kill(); process.exit(2);
}
await new Promise((r) => setTimeout(r, 1500));
for (let i = 0; i < 4; i++) {
  const done = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /salta|skip|chiudi/i.test(x.textContent || ''));
    if (b) { b.click(); return false; }
    return !document.querySelector('.onboarding-overlay');
  });
  await new Promise((r) => setTimeout(r, 500));
  if (done) break;
}

const AUDIT = () => {
  // I colori calcolati arrivano anche come color(srgb ...) / oklch(...) per via di
  // color-mix() nei token: un parser a regex su rgb() li leggeva come valori 0-255
  // e produceva rapporti impossibili (1.00:1 su testo perfettamente leggibile).
  // Lascio risolvere al browser disegnando un pixel su canvas.
  const _cvs = document.createElement('canvas');
  _cvs.width = _cvs.height = 1;
  const _ctx = _cvs.getContext('2d', { willReadFrequently: true });
  /** Risolve una qualsiasi sintassi CSS di colore in [r,g,b,a]; a in 0..1. */
  const toRgba = (c) => {
    if (!c) return null;
    _ctx.clearRect(0, 0, 1, 1);
    _ctx.globalAlpha = 1;
    _ctx.fillStyle = c;
    _ctx.fillRect(0, 0, 1, 1);
    const d = _ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (fg, bg) => {
    const a = fg[3];
    return [
      Math.round(fg[0] * a + bg[0] * (1 - a)),
      Math.round(fg[1] * a + bg[1] * (1 - a)),
      Math.round(fg[2] * a + bg[2] * (1 - a)),
      1,
    ];
  };
  const lumOf = (rgb) => {
    const [r, g, b] = rgb.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  /**
   * Sfondo effettivo dietro un elemento: raccoglie gli strati risalendo il DOM e
   * li compone dal basso. Senza composizione uno sfondo semitrasparente veniva
   * letto come tinta piena, producendo rapporti impossibili (1.13:1 su testo
   * perfettamente leggibile).
   */
  const bgOf = (el) => {
    const layers = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const c = toRgba(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) {
        layers.push(c);
        if (c[3] >= 0.999) break;
      }
      n = n.parentElement;
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };

  // chrome: distanza dal top del contenitore scrollabile al primo elemento "contenuto"
  const scroller = document.querySelector('.app-content');
  const firstCard = document.querySelector(
    '.task-card, .event-card, .card, .widget, [class*="-card"], [class*="__item"], li'
  );
  const chrome = scroller && firstCard
    ? Math.round(firstCard.getBoundingClientRect().top - scroller.getBoundingClientRect().top)
    : null;

  // aree tocco troppo piccole
  const small = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, [role="button"], [role="tab"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    if (r.width < 44 || r.height < 44) {
      const label = (el.getAttribute('aria-label') || el.textContent || el.className || el.tagName)
        .toString().trim().replace(/\s+/g, ' ').slice(0, 34);
      small.push(`${Math.round(r.width)}x${Math.round(r.height)}  ${label}`);
    }
  }

  // contrasti insufficienti sul testo visibile
  const low = [];
  for (const el of document.querySelectorAll('p, span, div, h1, h2, h3, h4, label, td, li, button, a')) {
    if (!el.childNodes.length) continue;
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (txt.length < 3) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || Number(cs.opacity) < 0.5) continue;
    const bg = bgOf(el);
    const fg = toRgba(cs.color);
    if (!fg) continue;
    // Anche il testo puo' essere semitrasparente: comporlo sul proprio sfondo.
    const l1 = lumOf(fg[3] >= 0.999 ? fg : over(fg, bg));
    const l2 = lumOf(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const min = large ? 3 : 4.5;
    if (ratio < min) low.push(`${ratio.toFixed(2)}:1 (min ${min})  "${txt.slice(0, 30)}"  ${Math.round(px)}px`);
  }

  return {
    chrome,
    small: [...new Set(small)],
    low: [...new Set(low)],
    // Controllo di sanita': senza questi numeri un risultato "0 problemi" puo'
    // significare semplicemente che la pagina non e' stata analizzata.
    url: location.pathname,
    interattivi: document.querySelectorAll('button, a[href], input, select, [role="button"]').length,
    testi: document.querySelectorAll('p, span, div, h1, h2, h3, label, li').length,
  };
};

for (const [name, path] of [['Dashboard', '/'], ['Compiti', '/tasks'], ['Calendario', '/calendar'], ['Spesa', '/shopping'], ['Budget', '/budget']]) {
  await page.goto(BASE + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1600));
  const r = await page.evaluate(AUDIT);
  console.log(`\n=== ${name} ===`);
  console.log(`  pagina: ${r.url} | elementi interattivi: ${r.interattivi} | nodi di testo: ${r.testi}`);
  if (r.interattivi < 5) { console.log('  !! pagina non analizzabile (login fallito o render vuoto) — risultati ignorati'); continue; }
  console.log(`  controlli prima del contenuto: ${r.chrome ?? '?'} px  (viewport 844)`);
  console.log(`  aree tocco < 44px: ${r.small.length}`);
  r.small.slice(0, 6).forEach((s) => console.log('      ' + s));
  console.log(`  contrasti sotto AA: ${r.low.length}`);
  r.low.slice(0, 6).forEach((s) => console.log('      ' + s));
}

await browser.close();
srv.kill();
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) { try { if (existsSync(f)) rmSync(f); } catch { /* lock */ } }
try { rmSync(resolve(ROOT, '.tmp-audit-backups'), { recursive: true, force: true }); } catch { /* lock */ }
