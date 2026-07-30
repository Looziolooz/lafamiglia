# Note interne di rebrand — Samla

> **Documento interno.** Rimuovilo dal pacchetto prima di consegnare il prodotto
> a un cliente: contiene la tua checklist commerciale, non documentazione d'uso.

Origine: fork di [Yuvomi](https://github.com/ulsklyc/yuvomi) v1.57.0 (MIT),
commit upstream `936d60c`. Il remote `upstream` è già configurato:

```bash
git fetch upstream && git merge upstream/main   # per i fix di sicurezza a monte
```

---

## 1. Placeholder da compilare (obbligatori prima di vendere)

### `YOUR-ORG` — registro immagini Docker
Sostituiscilo con la tua organizzazione GitHub/registry in questi file:

| File | Cosa contiene |
| --- | --- |
| `docker-compose.yml` | immagine principale (ha `build: .`, quindi funziona già in locale) |
| `podman-compose.yml` | idem, variante SELinux |
| `docs/docker-compose.portainer.yml` | template Portainer |
| `deploy/umbrel/*` | app store Umbrel |
| `deploy/truenas/*` | app store TrueNAS |
| `templates/samla.xml` | template Unraid |
| `tools/quadlet/samla.container` | systemd rootless |
| `docs/installation.md` | comandi `curl` di download |
| `README.md` | riferimento al registro |

Finché non pubblichi un'immagine, il percorso funzionante è
`docker compose up -d --build` (build locale).

### Dominio e contatti
| Riferimento | Dove | Nota |
| --- | --- | --- |
| `samla.family` | `README.md` | dominio verificato **libero** al 30/07/2026 — da registrare |
| `security@samla.family` | `SECURITY.md` | casella per segnalazioni di sicurezza |
| `https://samla.family/docs/installation#google-drive-document-storage` | `public/settings/pages/documents-storage.js` | link di aiuto mostrato nell'interfaccia |

### Titolarità del copyright
`LICENSE` intesta il copyright a **Lorenzo Dastoli**. Se vendi tramite società,
sostituiscilo con la ragione sociale (es. Savant Media AB).

---

## 2. Da far verificare a un professionista

- **`LICENSE`** è un modello, non un contratto validato. Fallo rivedere da un
  legale: clausole di limitazione di responsabilità e foro competente cambiano
  molto tra vendita B2B e B2C, e verso i consumatori parte delle limitazioni
  non è opponibile.
- **Marchio.** Il dominio libero non implica marchio libero. Fai una ricerca
  EUIPO e PRV (Svezia) nelle classi 9 e 42 su "Samla" prima di investire nel
  brand. *Samla* è una parola svedese comune: questo riduce il rischio di
  conflitto ma rende anche più difficile registrarla come marchio (i termini
  descrittivi/comuni sono debolmente tutelabili).
- **Fiscale.** Vendita di licenze software transfrontaliera: regime IVA e
  inquadramento vanno definiti con un consulente.

---

## 3. Obblighi di licenza — non rimuovibili

| Obbligo | Dove |
| --- | --- |
| Avviso MIT + copyright `ulsklyc` | `THIRD-PARTY-LICENSES.md` §1 — **deve** essere distribuito col prodotto |
| `web-push` è MPL-2.0 | copyleft a livello di file: non modificare i sorgenti della libreria, o quei file vanno pubblicati |
| Plus Jakarta Sans (OFL 1.1) | ridistribuibile anche commercialmente; se modifichi il font va rinominato |

I diritti MIT sulle porzioni originali **non sono revocabili**: la §4 di `LICENSE`
lo dichiara esplicitamente. Una licenza che pretendesse il contrario sarebbe
inapplicabile.

---

## 4. Open-Meteo — l'unico costo strutturale

Provider meteo predefinito (`server/routes/weather.js`). Il piano gratuito è
**solo per uso non commerciale**, 10.000 chiamate/giorno.

Essendo self-hosted, le chiamate partono dal server del cliente: una famiglia
che usa Samla privatamente resta in uso non commerciale. Diventa un problema se
vendi ad aziende. Opzioni: piano Open-Meteo a pagamento, oppure disattivare il
meteo di default e lasciare che il cliente configuri la propria chiave
OpenWeatherMap.

---

## 5. Scelte tecniche prese durante il rebrand

- **Italiano come lingua di prodotto.** L'app parte **sempre** in italiano, non
  solo quando la lingua del browser è ignota: il rilevamento dal browser è
  disattivato tramite `FOLLOW_BROWSER_LANGUAGE`, presente in `public/i18n.js` e
  `public/lang-init.js` — **le due devono restare allineate**, altrimenti
  l'attributo `<html lang>` dichiara una lingua diversa dai testi resi.
  Compromesso: anche un cliente svedese vede l'italiano al primo avvio; la sua
  scelta esplicita resta memorizzata in `localStorage` e prevale sempre. Per
  tornare al rilevamento automatico: `FOLLOW_BROWSER_LANGUAGE = true` in entrambi
  i file. Il default è impostato in 8 punti: i due registri i18n, l'installer web
  (`i18n-mini.js`), l'installer CLI (`install.sh`), `server/routes/budget/helpers.js`,
  `server/openapi/helpers.js`, il manifest statico e quello dinamico servito da
  `server/index.js`, più `<html lang>` in `index.html` e `offline.html`.
- **Lingue ridotte a inglese, svedese, italiano.** Rimossi 60 file lingua
  (20 app + 20 installer web + 20 installer CLI). La lingua di riferimento e di
  fallback è passata dal tedesco all'italiano nei registri
  (`public/i18n.js`, `public/lang-init.js`, `public/sw.js`,
  `tools/installer/i18n-mini.js`, `install.sh`,
  `server/routes/budget/helpers.js`, `server/openapi/helpers.js`).
  Tutte e tre le lingue sono complete: 3366 chiavi ciascuna, zero mancanti.
- **Changelog in-app.** Prima chiamava le release GitHub dell'autore originale a
  ogni apertura e restituiva 502 se irraggiungibile. Ora non fa nessuna chiamata
  in uscita se `CHANGELOG_RELEASES_URL` non è impostata — coerente con il
  posizionamento "zero telemetria".
- **Variabili d'ambiente** rinominate `OIKOS_*` → `SAMLA_*` (`SAMLA_HTTP_PORT`,
  `SAMLA_HTTP_BIND`, `SAMLA_INSTALLER_LANG`, `SAMLA_INSTALLER_ROOT`).
- **Migrazione DB legacy mantenuta.** `server/db.js` migra un eventuale
  `oikos.db` verso `samla.db`. È codice inerte per installazioni nuove, ma
  funzionante e coperto da test: l'ho lasciato perché rimuoverlo comporta
  rischio senza benefici. Puoi eliminarlo quando vuoi (`migrateLegacyDbFile`,
  più `test/test-rename-migration.js`).
- **Palette invariata.** Il viola `#6c3aed` di origine è rimasto, perché
  cambiarlo è restyling e non rebrand. Il **marchio** invece è nuovo
  (`icon.svg` + `scripts/generate-icons.js`): tre braccia raccolte attorno a un
  centro, per *samla* = "raccogliere". Rigenera con
  `node scripts/generate-icons.js`.
- **Default tedeschi sostituiti**: città meteo Berlino → Stoccolma, `TZ`
  d'esempio Europe/Berlin → Europe/Stockholm, `lang` del manifest PWA
  (statico e dinamico) da `de-DE` a `en`.

## 6. Difetti trovati e corretti strada facendo

Non erano parte del rebrand, ma sono emersi cambiando la lingua di riferimento:

- `housekeeping.reports` non era tradotto in italiano né svedese (restava
  "Reports"). Ora "Report" / "Rapporter".
- Nella pagina impostazioni *Appearance*, il sottotitolo della prima sezione
  ripeteva il titolo della pagina in inglese ("Appearance" / "Appearance").
  La sezione contiene solo il selettore del tema: ora si chiama
  "Theme" / "Tema" / "Tema".

## 6b. Difetti upstream trovati ma NON corretti (fuori perimetro)

Da valutare prima di vendere, non toccati perché l'ambito concordato era il solo
rebrand:

- **Setup: errori 400 mostrati come messaggio generico.** Il server valida lo
  username (`server/auth.js:921`) e risponde con un testo preciso, ma il `catch`
  in `public/pages/setup.js:158-169` gestisce solo 409/403/429: ogni altro 400
  ricade su `setup.errorGeneric` ("Could not create the account"). La traduzione
  corretta `setup.errorUsernameInvalid` esiste già in tutte e tre le lingue e non
  viene usata in quel percorso. Chi digita la propria email nel campo Username —
  gesto naturalissimo — non capisce perché venga rifiutata. Fix: gestire il 400
  mostrando il messaggio specifico. Stessa struttura anche in
  `server/auth.js:1152` e `:1235` (creazione/modifica utenti), da controllare.
- **Lo username non ammette le email** (`^[a-zA-Z0-9._-]{3,64}$`, quindi nessuna
  `@`). Per un prodotto familiare venduto a non tecnici, poter usare l'email come
  credenziale di accesso è un'aspettativa comune. È una scelta di prodotto: se la
  cambi, allinea le tre regex nel server e quella in `public/pages/setup.js:15`.

## 7. Test — due vincoli d'ambiente (nessuno dei due dovuto al rebrand)

### Node 22, non 24
`.nvmrc` dichiara **22**, `engines` chiede `>=22`, e il CI upstream gira su
22.x. Su Node 24 tre test si appendono: `test-password-normalization.js`,
e gli altri due che chiudono con `setTimeout(() => process.exit(0), 50)` nel
teardown (necessario perché il file importa il server, che avvia i cron e
tiene vivo l'event loop). Da Node 23 il runner di `node --test` tratta un
`process.exit()` dentro un test come fallimento del file e non termina.

```bash
fnm use 22        # oppure nvm use 22
npm test
```

I moduli nativi (`bcrypt`, `better-sqlite3-multiple-ciphers`) usano N-API e
caricano su entrambe le versioni senza ricompilare — `npm rebuild` su Windows
fallirebbe comunque senza i Visual Studio Build Tools.

### Windows: serve bash come shell degli script
Gli script npm usano la sintassi POSIX `VAR=value node ...`, che `cmd.exe` non
interpreta:

```bash
npm_config_script_shell="/usr/bin/bash" npm test
```

Su Linux, macOS e dentro Docker `npm test` funziona senza accorgimenti.

## 8. Ambiente di sviluppo locale

Ho creato un `.env` (già in `.gitignore`) con `SESSION_SECRET` generato,
database non cifrato e `PORT=3010` — la 3000 è occupata da un altro tuo
progetto locale. Verificato funzionante: `/health` risponde 200, il manifest
dinamico riporta "Samla Family Planner" con `lang: en`, e le tre lingue sono
servite. Le lingue rimosse degradano correttamente: il catch-all SPA
restituisce `index.html`, `resp.json()` lancia e `loadLocale()` ricade su
inglese.

Per un'installazione reale usa il wizard (`node tools/installer/install-server.js`)
o `./install.sh`: scrivono anche `BASE_URL` e le impostazioni del reverse proxy,
che il mio `.env` di sviluppo non contiene.
