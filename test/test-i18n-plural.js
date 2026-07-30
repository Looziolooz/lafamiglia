/**
 * Tests: Pluralformen in t() (Audit-Befund nach #534)
 * Zweck: `{{count}}`-Strings waren hart im Plural formuliert - „1 Adressbücher
 *        aktiviert". t() wählt jetzt über Intl.PluralRules die passende Variante
 *        (`key_one`, `key_few`, …) und fällt auf den Basisschlüssel zurück,
 *        wenn eine Locale die Variante nicht kennt.
 * Ausführen: node test/test-i18n-plural.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const LOCALE_DIR = new URL('../public/locales/', import.meta.url);
const localeFile = (locale) => JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALE_DIR), 'utf8'));

// i18n.js ist Browser-Code: Umgebung stellen, bevor das Modul geladen wird.
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
global.document = { documentElement: { lang: '', dir: '' } };
global.window = { dispatchEvent: () => {}, matchMedia: () => ({ matches: false }) };
global.CustomEvent = class { constructor(type, init) { this.type = type; Object.assign(this, init); } };
global.fetch = async (url) => {
  const locale = String(url).replace('/locales/', '').replace('.json', '');
  return { ok: true, json: async () => localeFile(locale) };
};
Object.defineProperty(global, 'navigator', {
  value: { languages: ['en-US'], language: 'en-US' },
  writable: true,
  configurable: true,
});

const { initI18n, setLocale, t } = await import('../public/i18n.js');
await initI18n();

test('Italienisch: Singular und Plural je nach count', async () => {
  await setLocale('it');
  assert.equal(t('settings.enabledReminderListCount', { count: 1 }), '1 elenco promemoria abilitato');
  assert.equal(t('settings.enabledReminderListCount', { count: 2 }), '2 elenchi promemoria abilitati');
  assert.equal(t('settings.enabledReminderListCount', { count: 0 }), '0 elenchi promemoria abilitati');
});

test('Englisch: Singular und Plural je nach count', async () => {
  await setLocale('en');
  assert.equal(t('settings.enabledReminderListCount', { count: 1 }), '1 reminder list enabled');
  assert.equal(t('settings.enabledReminderListCount', { count: 3 }), '3 reminder lists enabled');
  assert.equal(t('settings.calendarImport.success', { count: 1 }), '1 event imported.');
  assert.equal(t('settings.calendarImport.success', { count: 4 }), '4 events imported.');
});

test('Schwedisch: Singular und Plural je nach count', async () => {
  await setLocale('sv');
  assert.equal(t('settings.enabledReminderListCount', { count: 1 }), '1 påminnelselista aktiverad');
  assert.equal(t('settings.enabledReminderListCount', { count: 2 }), '2 påminnelselistor aktiverade');
});

test('gleichlautende Formen bleiben für jede Anzahl identisch', async () => {
  // sv: tasks.pointsSummary lautet im Singular wie im Plural („poäng").
  // Die Variantenwahl darf daran nichts ändern.
  await setLocale('sv');
  const one = t('tasks.pointsSummary', { count: 1 });
  const many = t('tasks.pointsSummary', { count: 5 });
  assert.equal(one.replace('1', 'N'), many.replace('5', 'N'));
});

test('„N von M"-Zähler nutzt bei einem Eintrag die Singularform', async () => {
  // Die _one-Variante ging beim Umbenennen einer früheren Runde verloren:
  // „1 von 1 Adressbüchern aktiv". t() wählt über count (= Gesamtzahl).
  await setLocale('it');
  assert.equal(
    t('settings.addressbooksEnabledOfTotal', { enabled: 1, total: 1, count: 1 }),
    '1 di 1 rubrica attiva',
  );
  assert.equal(
    t('settings.addressbooksEnabledOfTotal', { enabled: 1, total: 3, count: 3 }),
    '1 di 3 rubriche attive',
  );
  await setLocale('en');
  assert.equal(
    t('settings.calendarsEnabledOfTotal', { enabled: 0, total: 1, count: 1 }),
    '0 of 1 calendar active',
  );
  assert.equal(
    t('settings.calendarsEnabledOfTotal', { enabled: 2, total: 4, count: 4 }),
    '2 of 4 calendars active',
  );
});

test('Standard-Punkte (#578): zählende Strings nutzen die Singularform', async () => {
  // Review-Fund: die vier count-Strings des Features waren hart im Plural
  // formuliert („1 Aufgaben aktualisiert").
  await setLocale('it');
  assert.equal(t('tasks.pointsSummary', { count: 1 }), '1 punto');
  assert.equal(t('tasks.pointsSummary', { count: 10 }), '10 punti');
  assert.equal(t('settings.rewardsDefaultPointsRebased', { count: 1 }), '1 attività aggiornata.');
  assert.equal(t('settings.rewardsDefaultPointsRebased', { count: 3 }), '3 attività aggiornate.');
  assert.match(t('settings.rewardsDefaultPointsRebaseTitle', { count: 1, from: 10, to: 15 }), /^Portare 1 attività da 10 a 15 /);

  await setLocale('en');
  assert.equal(t('tasks.pointsSummary', { count: 1 }), '1 point');
  assert.equal(t('tasks.pointsSummary', { count: 4 }), '4 points');
  assert.equal(t('settings.rewardsDefaultPointsRebased', { count: 1 }), '1 task updated.');
  assert.equal(t('settings.rewardsDefaultPointsRebased', { count: 2 }), '2 tasks updated.');
});

test('Schlüssel ohne Pluralvarianten funktionieren unverändert', async () => {
  await setLocale('it');
  assert.equal(t('common.save'), localeFile('it').common.save);
  // count-Parameter ohne passende Variante (7 → „other"): Basisschlüssel plus Interpolation.
  assert.equal(
    t('settings.enabledReminderListCount', { count: 7 }),
    '7 elenchi promemoria abilitati',
  );
});

test('unbekannter Schlüssel liefert den Schlüssel selbst zurück - auch mit count', async () => {
  await setLocale('it');
  assert.equal(t('gibt.es.nicht'), 'gibt.es.nicht');
  assert.equal(t('gibt.es.nicht', { count: 2 }), 'gibt.es.nicht');
});

test('jede Pluralvariante hat einen zählenden Basisschlüssel in allen Locales', () => {
  const files = readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.json'));
  const flatten = (obj, prefix = '', out = new Map()) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') flatten(v, key, out);
      else out.set(key, v);
    }
    return out;
  };
  // Pluralvariante = Suffix einer CLDR-Kategorie UND ein {{count}} im Wert.
  // Das trennt sie von echten Enum-Werten wie `budget.accountType_other`.
  for (const file of files) {
    const entries = flatten(JSON.parse(readFileSync(new URL(file, LOCALE_DIR), 'utf8')));
    for (const [key, value] of entries) {
      if (!/_(one|two|few|many|other)$/.test(key)) continue;
      if (typeof value !== 'string' || !value.includes('{{count}}')) continue;
      const base = key.replace(/_(one|two|few|many|other)$/, '');
      assert.ok(entries.has(base), `${file}: ${key} ohne Basisschlüssel ${base}`);
      assert.match(entries.get(base), /\{\{count\}\}/, `${file}: ${base} zählt nicht`);
    }
  }
});
