/**
 * Cattura schermate mobile dell'app su un database temporaneo popolato con i
 * dati demo del progetto. Non tocca samla.db.
 * Uso: node capture-mobile.mjs
 */
import puppeteer from 'puppeteer';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const DB = resolve(ROOT, '.tmp-shots.db');
const PORT = 3099;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = resolve(ROOT, '.shots');

for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) if (existsSync(f)) rmSync(f);
mkdirSync(OUT, { recursive: true });

const env = {
  ...process.env,
  DB_PATH: DB,
  PORT: String(PORT),
  SESSION_SECRET: 'screenshot-secret-che-basta-per-i-32-caratteri',
  SESSION_SECURE: 'false',
  NODE_ENV: 'development',
  BACKUP_DIR: resolve(ROOT, '.tmp-shots-backups'),
};

console.log('avvio server sulla porta', PORT);
const server = spawn(process.execPath, ['server/index.js'], { env, cwd: ROOT, stdio: 'ignore' });

const waitHealth = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch { /* non ancora pronto */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

if (!(await waitHealth())) { console.error('server non partito'); server.kill(); process.exit(1); }
console.log('server pronto, popolo i dati demo');

const seed = spawnSync(process.execPath, ['scripts/seed-demo.js', '--db', DB], { cwd: ROOT, encoding: 'utf8' });
console.log('seed:', (seed.stdout || seed.stderr || '').trim().split('\n').slice(-2).join(' | '));

// Il seed scrive direttamente nel file: il server ha la sua connessione aperta,
// quindi lo riavvio per essere sicuro di leggere lo stato nuovo.
server.kill();
await new Promise((r) => setTimeout(r, 800));
const server2 = spawn(process.execPath, ['server/index.js'], { env, cwd: ROOT, stdio: 'ignore' });
if (!(await waitHealth())) { console.error('riavvio fallito'); server2.kill(); process.exit(1); }

// protocolTimeout hoch: der animierte "living backdrop" hält den Compositor
// beschäftigt, captureScreenshot lief sonst in den Standard-Timeout.
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-lcd-text'],
  protocolTimeout: 180000,
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
// Bewegung aus: stabilisiert die Aufnahmen und entspricht dem, was Nutzer mit
// aktivierter Systemeinstellung ohnehin sehen.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

await page.goto(BASE, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: resolve(OUT, '00-login.png') });
console.log('  00-login');

// Login. Die SPA rendert das Formular nach dem Laden nach, deshalb erst auf das
// Feld warten — sonst zerstört die Navigation den Ausführungskontext beim Tippen.
await page.waitForSelector('#username', { timeout: 20000 });
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  document.querySelector('#username').value = '';
  document.querySelector('#password').value = '';
});
await page.type('#username', 'linda', { delay: 20 });
await page.type('#password', 'demo1234', { delay: 20 });
await page.click('button[type=submit]');
await new Promise((r) => setTimeout(r, 2500));

// Onboarding-Overlay wegklicken, sonst verdeckt es das Dashboard und dimmt
// alles dahinter (der FAB sah dadurch fälschlich kontrastarm aus).
for (let i = 0; i < 4; i++) {
  const done = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const skip = btns.find((b) => /salta|skip|hoppa|fertig|chiudi|close/i.test(b.textContent || ''));
    if (skip) { skip.click(); return false; }
    return !document.querySelector('.onboarding-overlay');
  });
  await new Promise((r) => setTimeout(r, 600));
  if (done) break;
}

const PAGES = [
  ['01-dashboard', '/'],
  ['02-tasks', '/tasks'],
  ['03-calendar', '/calendar'],
  ['04-shopping', '/shopping'],
  ['05-meals', '/meals'],
  ['06-budget', '/budget'],
  ['07-settings', '/settings'],
];

for (const [name, path] of PAGES) {
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: resolve(OUT, `${name}.png`) });
    // Zweite Aufnahme ganz unten: dort zeigte sich, dass der FAB das letzte
    // Listenelement verdeckte. Belegt die Wirkung der Scroll-Reserve.
    const scrolled = await page.evaluate(() => {
      const el = document.querySelector('.app-content');
      if (!el || el.scrollHeight <= el.clientHeight + 40) return false;
      el.scrollTop = el.scrollHeight;
      return true;
    });
    if (scrolled) {
      await new Promise((r) => setTimeout(r, 900));
      await page.screenshot({ path: resolve(OUT, `${name}-fondo.png`) });
    }
    console.log('  ' + name + (scrolled ? ' (+fondo)' : ''));
  } catch (e) {
    console.log('  ' + name + ' FALLITO: ' + e.message.split('\n')[0]);
  }
}

await browser.close();
server2.kill();
for (const f of [DB, `${DB}-wal`, `${DB}-shm`]) if (existsSync(f)) rmSync(f);
rmSync(resolve(ROOT, '.tmp-shots-backups'), { recursive: true, force: true });
console.log('\nschermate in .shots/');
