/**
 * Tests für public/lang-init.js — das synchrone <head>-Bootstrap, das
 * document.documentElement.lang vor dem Render auf die echte Nutzer-Locale setzt
 * (verhindert falsches „aus dem Deutschen übersetzen" in Chromium-Browsern).
 *
 * Die Resolve-Logik muss mit i18n.js (resolveLocale) übereinstimmen. Italienisch
 * ist die Produktsprache, deshalb steht FOLLOW_BROWSER_LANGUAGE in BEIDEN Dateien
 * auf false:
 *   manueller Override (localStorage) > DEFAULT_LOCALE ('it').
 * Die Browsersprache wird bewusst NICHT ausgewertet — ein Kunde mit englischem
 * Browser soll das Produkt trotzdem auf Italienisch starten sehen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const SRC = readFileSync(new URL('../public/lang-init.js', import.meta.url), 'utf8');

/** Führt lang-init.js in einer Sandbox aus und liefert die gesetzten HTML-Metadaten. */
function runLangInitState({ stored = null, languages = undefined, language = undefined, throwOnStorage = false } = {}) {
  const html = { lang: '', dir: '' };
  const sandbox = {
    document: { documentElement: html },
    navigator: { languages, language },
    localStorage: {
      getItem(key) {
        if (throwOnStorage) throw new Error('blocked');
        return key === 'samla-locale' ? stored : null;
      },
    },
  };
  runInContext(SRC, createContext(sandbox));
  return html;
}

function runLangInit(options = {}) {
  return runLangInitState(options).lang;
}

test('gültiger localStorage-Override gewinnt', () => {
  assert.equal(runLangInit({ stored: 'it', languages: ['sv-SE'] }), 'it');
});

test('ungültiger localStorage-Wert wird ignoriert, Fallback auf die Standardsprache', () => {
  assert.equal(runLangInit({ stored: 'xx', languages: ['en-US', 'sv'] }), 'it');
});

test('die Browsersprache wird NICHT ausgewertet: englischer Browser bleibt it', () => {
  assert.equal(runLangInit({ languages: ['en-US', 'en'] }), 'it');
});

test('auch ein schwedischer Browser startet auf der Produktsprache', () => {
  assert.equal(runLangInit({ languages: ['sv-SE'] }), 'it');
});

test('nicht unterstützte Sprache landet ebenfalls auf it', () => {
  assert.equal(runLangInit({ languages: ['th-TH'] }), 'it');
});

test('die gemerkte Wahl schlägt jede Browsersprache — auch en und sv', () => {
  assert.equal(runLangInit({ stored: 'en', languages: ['it-IT'] }), 'en');
  assert.equal(runLangInit({ stored: 'sv', languages: ['it-IT'] }), 'sv');
});

test('fehlendes navigator.languages fuehrt zu keinem Fehler', () => {
  assert.equal(runLangInit({ language: 'sv-SE' }), 'it');
});

test('blockierter localStorage (Privatmodus) wirft nicht, nutzt navigator', () => {
  assert.equal(runLangInit({ throwOnStorage: true, languages: ['it-IT'] }), 'it');
});

test('keine brauchbaren Signale → it (Standardsprache)', () => {
  assert.equal(runLangInit({ languages: [] }), 'it');
});

test('Schreibrichtung wird für die unterstützten Sprachen auf ltr gesetzt', () => {
  assert.deepEqual(
    runLangInitState({ stored: 'sv', languages: ['it-IT'] }),
    { lang: 'sv', dir: 'ltr' },
  );
});

test('nicht unterstützte Browsersprache landet auf it mit ltr', () => {
  assert.deepEqual(
    runLangInitState({ languages: ['ar-EG'] }),
    { lang: 'it', dir: 'ltr' },
  );
});
