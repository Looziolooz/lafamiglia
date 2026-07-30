# Registro della sessione — da Yuvomi a Samla

> **Documento interno**, come `REBRAND-NOTES.md`. Rimuovilo dal pacchetto prima
> di consegnare il prodotto a un cliente.
>
> Riassunto ricostruito della sessione del **30 luglio 2026**: richieste, decisioni,
> verifiche e problemi trovati. Non è una trascrizione letterale.

---

## 1. La richiesta iniziale

> «vorrei copiare e personalizzare questo progetto per poter venderlo privatamente»
> — https://github.com/ulsklyc/yuvomi

Prima verifica fatta: **la licenza**, perché è il punto che decide se l'operazione
è legale. Risultato: **MIT**. Puoi forkare, modificare, rinominare, tenere le
modifiche chiuse e far pagare quanto vuoi. L'unico obbligo vincolante è
conservare l'avviso di copyright originale nel prodotto distribuito.

## 2. «ci sono spese da sostenere da parte mia?»

Verificate una per una, non assunte.

**Licenze: costo zero.** Interrogato il registro npm per tutte le 15 dipendenze:
MIT, BSD-2, ISC, MIT-0, Apache-2.0. Due segnalazioni:

- **`web-push` è MPL-2.0**, copyleft a livello di file: puoi distribuirlo in un
  prodotto chiuso, ma se modifichi i suoi sorgenti devi pubblicare quei file.
- **Plus Jakarta Sans** è OFL 1.1: ridistribuibile anche commercialmente; se
  modifichi il font va rinominato.

**L'unico costo strutturale: Open-Meteo.** È il provider meteo predefinito e il
suo piano gratuito è **esplicitamente non commerciale** (10.000 chiamate/giorno).
Sfumatura decisiva: essendo self-hosted, le chiamate partono dal server del
cliente, quindi una famiglia che usa Samla privatamente resta in uso non
commerciale. Diventa un problema con clienti aziendali.

**Nessun costo dalle altre integrazioni**, perché le credenziali sono
per-installazione (Google, OIDC, OpenWeatherMap, Fixer.io sono vuote in
`.env.example`). Questo ti risparmia anche la verifica OAuth di Google, che per
gli scope sensibili può costare parecchio.

**Un avvertimento commerciale**, dato non per scoraggiare ma perché condiziona
la strategia: Yuvomi è gratuito, in sviluppo attivo e pubblico su GitHub. Il
valore che vendi deve stare nel *tuo* lavoro — installazione gestita, hosting,
supporto, localizzazione — non nel codice in sé.

## 3. Scelta del nome

Tre giri di proposte, con verifica reale della disponibilità dei domini via RDAP
invece di supposizioni.

1. **Primo giro** (casa/latino: Casata, Domora, Larium, Nidus…). Scartato
   **Larium** nonostante avesse i domini migliori: è a una lettera da **Lariam**,
   antimalarico di Roche, che difende il marchio.
2. **Secondo giro** (famiglia: Familio, Nucleo, Insieme, Gentis). Segnalato che
   **Nucleo** collide con una nota libreria di icone nella stessa classe software.
3. **Terzo giro** per direzione stilistica → scelto **Samla**, svedese per
   «raccogliere, riunire».

Constatazione ricorrente: **`.com` è fuori portata** per qualsiasi nome corto e
pronunciabile (tutti in mano ai domainer). `.family` è libero ed è il TLD giusto
per questo prodotto: **`samla.family`** risultava libero al 30/07/2026.

Segnalato anche che **"La Famiglia"** come brand andrebbe evitato: in inglese e
tedesco è un tropo mafioso immediato, sconveniente per un'app che gestisce
budget e documenti privati.

## 4. Il rebrand eseguito

Clonato come **fork mantenibile** (remote `upstream` configurato) da v1.57.0,
commit `936d60c`, ~112k righe.

| Intervento | Dettaglio |
| --- | --- |
| Rinomina brand | 220 file, 1863 occorrenze, case-aware (`Yuvomi`/`yuvomi`/`YUVOMI`) |
| Identificatori tecnici | `samla.db`, cookie `samla.sid`, prefisso token `samla_`, custom element `<samla-*>` |
| File rinominati | componenti, template Unraid, unit quadlet |
| Variabili d'ambiente | `OIKOS_*` → `SAMLA_*` (porta, bind, installer) |
| Lingue | ridotte a **inglese, svedese, italiano**: 60 file rimossi, 6 registri aggiornati |
| Licenze | `LICENSE` commerciale + `THIRD-PARTY-LICENSES.md` con l'avviso MIT integrale |
| Pulizia | rimossi sito marketing upstream, workflow di pubblicazione, file di comunità |
| Identità visiva | nuovo marchio (tre braccia raccolte attorno a un centro, per *samla*) + `favicon.ico` generata |

**Nota legale importante** scritta esplicitamente nella §4 di `LICENSE`: i diritti
MIT sulle porzioni originali **non sono revocabili**. I termini proprietari
coprono le tue aggiunte e il prodotto come compilazione. Una licenza che
pretendesse il contrario sarebbe inapplicabile e ti esporrebbe.

## 5. Problemi trovati che avrebbero rotto il prodotto venduto

- **Il changelog in-app** chiamava le release GitHub dell'autore originale a ogni
  apertura e restituiva **502** se irraggiungibile. Ora non fa alcuna chiamata in
  uscita se `CHANGELOG_RELEASES_URL` non è impostata — coerente col
  posizionamento «zero telemetria».
- **Due `User-Agent`** si presentavano ai server esterni col repo di `ulsklyc`.
- **Un link di aiuto nell'interfaccia** puntava a documentazione altrui.
- **Il manifest PWA era doppio**: quello statico *e* uno dinamico servito dal
  server, entrambi con nome e `lang` tedeschi. Correggere solo il JSON non
  sarebbe bastato.
- **`docs/impressum.html` e `docs/datenschutz.html`** contenevano i dati
  anagrafici dell'autore originale. Rimossi.

## 6. Difetti preesistenti emersi cambiando la lingua di riferimento

- `housekeeping.reports` non era tradotto in italiano né svedese («Reports»).
- La pagina impostazioni *Appearance* ripeteva il proprio titolo come
  sottotitolo in inglese. La sezione contiene solo il selettore del tema: ora si
  chiama Theme / Tema / Tema.

## 7. Verifiche sul campo

Non solo test: l'app è stata **avviata e guidata con un browser reale**
(puppeteer).

- `/health` risponde 200; database `samla.db` con tutte le 110 migrazioni.
- Manifest dinamico corretto.
- Le tre lingue sono servite; le lingue rimosse **degradano correttamente** (il
  catch-all SPA restituisce `index.html`, `resp.json()` lancia e si ricade sul
  default).
- Porta spostata a **3010**: la 3000 era occupata da un altro progetto locale.

### Il caso dell'account che non si creava
Il setup rifiutava `lorenzo.dastoli@gmail.com` e poi `lorenzo dastoli`. Causa:
lo username ammette solo `[a-zA-Z0-9._-]{3,64}` — niente `@`, niente spazi.
Difetto reale trovato: il server restituisce un messaggio **preciso**, ma il
`catch` in `public/pages/setup.js` gestisce solo 409/403/429, quindi ogni 400
finisce nel generico «Could not create the account», **pur esistendo già** la
traduzione `setup.errorUsernameInvalid` in tutte tre le lingue. Annotato in
`REBRAND-NOTES.md` §6b, non corretto perché fuori dal perimetro concordato.

### Manca il selettore di lingua prima del login
Il componente `samla-locale-picker` esiste ed è localizzato, ma è raggiungibile
solo dalle impostazioni, quindi **dopo** l'autenticazione.

## 8. Italiano come lingua predefinita

Richiesta finale. Cambiato in 8 punti (non uno): `i18n.js`, `lang-init.js`,
`i18n-mini.js`, `install.sh`, `budget/helpers.js`, `openapi/helpers.js`,
`manifest.json` statico e dinamico, `index.html`, `offline.html`.

Scelta di interpretazione, dichiarata: **l'app parte in italiano sempre**, non
solo quando la lingua del browser è ignota — altrimenti un Chrome in inglese
avrebbe continuato a mostrare l'inglese, che era il problema osservato. Il
rilevamento della lingua del browser è disattivato tramite un interruttore
unico e reversibile, `FOLLOW_BROWSER_LANGUAGE`, presente in `i18n.js` e
`lang-init.js` (devono restare allineati).

**Compromesso da sapere:** anche una famiglia svedese vedrà l'italiano al primo
avvio. Una scelta esplicita dell'utente resta memorizzata e prevale sempre.
Verificato col browser: `en-US`, `sv-SE`, `de-DE` → italiano; con scelta salvata
`en`/`sv` → inglese/svedese.

## 9. Test: 158 su 163 verdi

I 5 rossi sono **tutti vincoli d'ambiente di questa postazione**, ognuno
dimostrato confrontando col codice originale da git — non assunto.

| Script | Causa |
| --- | --- |
| `password-normalization`, `setup`, `admin-password-reset` | chiudono con `process.exit(0)` nel teardown; da Node 23 il runner lo considera un fallimento. Il progetto dichiara **Node 22** |
| `installer-env-write` | su Windows `execFileSync` verso `bash.exe` corrompe le virgolette di `-c`. **Fallisce identico sull'`install.sh` originale** |
| `backup-scheduler` | usa `chmod 0o500`, che su Windows non impedisce al proprietario di scrivere. Il test ha una guardia per root, non per Windows |

Node 22 non è utilizzabile qui: il binario nativo di `better-sqlite3` è compilato
per l'ABI di Node 24 e il rebuild richiede i Visual Studio Build Tools. Non c'è
né Docker né Podman. La verifica definitiva la darà il CI su Linux/Node 22.

### Tre fallimenti erano invece miei, e sono stati corretti
- `docker-publish`: test orfano, verificava il workflow CI che avevo eliminato
  perché pubblicava sul registry dell'autore originale. Rimosso con il suo script npm.
- `installer-prereq` e `installer-schema`: puntavano ancora a
  `tools/quadlet/oikos.container`, rinominato in `samla.container`. Lo script di
  rinomina sostituiva «yuvomi» ma **non** «oikos» — scelta deliberata per non
  rompere la migrazione del database.

## 10. Errori miei durante la sessione, e come sono emersi

Registrati perché servono a valutare quanto fidarsi dei risultati intermedi.

1. **Ho dichiarato la suite verde quando non lo era.** Avevo letto l'exit code
   dell'ultimo `grep` della catena, non quello di `npm`. Inoltre il mio filtro
   cercava `✖` e non intercettava `✗`, usato da un harness custom. Corretto
   catturando `NPM_EXIT` esplicitamente e contando entrambi i marcatori.
2. **Il primo tentativo di eseguire i 164 script non ha eseguito nulla.** Node su
   Windows scriveva la lista in `C:\tmp`, mentre il `/tmp` di Git Bash è
   un'altra directory: il ciclo leggeva un file inesistente e usciva subito,
   scrivendo comunque il marker «FINITO» che mi ha tratto in inganno.
3. **Diagnosi dei fine riga incompleta.** `core.autocrlf=false` non bastava: con
   `* text=auto` nel `.gitattributes` il file è marcato come testo, e per i file
   di testo decide `core.eol` (default `native` = CRLF su Windows). Servivano
   entrambe le impostazioni, applicate **solo a questo repo**.
4. **Ho segnalato un falso allarme** su una presunta corruzione di `auth.js`,
   che era solo un artefatto di rendering dell'output di ricerca.

## 11. Aperto, in ordine di urgenza

1. Compilare i placeholder **`YOUR-ORG`** (registro immagini) — vedi
   `REBRAND-NOTES.md` §1.
2. Registrare **`samla.family`** e la casella `security@samla.family`.
3. Far rivedere **`LICENSE`** da un legale; ricerca marchio EUIPO/PRV classi 9 e 42.
4. Decidere su **Open-Meteo** (piano a pagamento o meteo disattivato di default).
5. Valutare i due difetti upstream in `REBRAND-NOTES.md` §6b.
6. Far girare la suite su **Linux/Node 22** per la conferma definitiva.
