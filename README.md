<div align="center">
  <img src="icon.svg" alt="Samla" width="92" />

  <h1>Samla</h1>

  <p><strong>One private home for everything your family runs on.</strong></p>

  <p>
    Tasks, calendar, budget, groceries, meals, health and more — self-hosted on
    hardware you control. No cloud accounts, no subscriptions, no trackers.
  </p>
</div>

<br>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/dashboard-dark-web.png">
    <img src="docs/screenshots/dashboard-light-web.png" alt="Samla dashboard" width="680">
  </picture>
</div>

<br>

| | |
| --- | --- |
| **17** modules | tasks, calendar, shopping, meals, recipes, pantry, budget, health, documents, notes, contacts, birthdays, housekeeping, rewards, reminders, split expenses, subscriptions |
| **3** languages | English, Swedish, Italian |
| **0** trackers | no telemetry, no analytics, no outbound calls unless you configure an integration |
| **AES-256** | optional database encryption (SQLCipher) |

---

## Requirements

- Node.js **22 or newer** (see `.nvmrc`)
- Docker with Compose v2, **or** Podman 4.1+ — optional, for container deployment
- A reverse proxy with TLS for anything reachable from the internet

## Install

### Option 1 — Setup wizard (recommended)

```bash
node tools/installer/install-server.js
```

Open <http://localhost:8090>. The wizard writes your `.env`, starts the
container and creates the first administrator account. It shuts itself down when
finished.

### Option 2 — CLI installer

```bash
./install.sh
```

Interactive, localized (English, Swedish, Italian). Honours
`SAMLA_INSTALLER_LANG` or `--lang <code>`.

### Option 3 — Docker Compose by hand

```bash
cp .env.example .env
# edit .env — SESSION_SECRET and DB_ENCRYPTION_KEY are mandatory
docker compose up -d --build
```

The image is built from this repository. If you publish it to your own registry,
replace `YOUR-ORG` in `docker-compose.yml` and the templates under `deploy/`.

### Option 4 — Podman (rootless, SELinux)

```bash
podman compose -f podman-compose.yml up -d
```

For rootless systemd autostart, see `tools/quadlet/samla.container`.

## Configuration

Everything is driven by `.env`. Start from `.env.example`, which documents every
variable. The essentials:

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs session cookies. **Required.** |
| `DB_ENCRYPTION_KEY` | Enables AES-256 database encryption. Cannot be changed or recovered once the database exists — back it up. |
| `DB_PATH` | Database location. Defaults to `samla.db` next to the app, `/data/samla.db` in containers. |
| `SAMLA_HTTP_PORT` | Host port. Default `3000`. |
| `SESSION_SECURE` / `TRUST_PROXY` | Set to `true` / `1` behind an HTTPS reverse proxy. |
| `BASE_URL` | Public URL, used to build password-reset links. |

Optional integrations — weather, Google Calendar, Google Drive, CalDAV/CardDAV,
SMTP, OIDC single sign-on, WebDAV backup — are all off until configured. Each
deployment supplies its own credentials; none are bundled.

> **Weather:** the default provider is Open-Meteo, whose free API is licensed for
> **non-commercial use only**. A household using Samla privately is covered.
> Commercial deployments need a paid Open-Meteo plan or a different provider.
> See `THIRD-PARTY-LICENSES.md`.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/installation.md](docs/installation.md) | Full installation and reverse-proxy guide |
| [docs/SPEC.md](docs/SPEC.md) | Architecture and API specification |
| [MODULES.md](MODULES.md) | Writing custom modules |
| [docs/PRIVACY-FOR-SELFHOSTERS.md](docs/PRIVACY-FOR-SELFHOSTERS.md) | What the app does and does not send anywhere |
| [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md) | Attribution and third-party terms |

## Development

```bash
npm install
npm run setup     # creates .env and the first admin account
npm run dev       # watch mode
npm test          # full suite
```

Backend is Express on SQLite; the frontend is vanilla ES modules with plain CSS —
no build step, no bundler. Server code carries German comments, inherited from
the upstream project.

## Backups

Configure scheduled backups in the app (Settings → Backup), optionally pushed to
a WebDAV target. Note that database backups do **not** include document binaries
stored in a local folder, on WebDAV, or in Google Drive — back those up
separately.

## License

Samla is commercial software. See [LICENSE](LICENSE).

It derives from [Yuvomi](https://github.com/ulsklyc/yuvomi) by ulsklyc, used
under the MIT License. That notice and all other third-party terms are
reproduced in [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md), which must be
distributed with the software.
