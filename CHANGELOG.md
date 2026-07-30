# Changelog

All notable changes to Samla are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.57.0] - 2026-07-30

Initial Samla release.

Samla is a self-hosted family planner: tasks, calendar, shopping, meals,
recipes, pantry, budget, health, documents, notes, contacts, birthdays and
housekeeping in one private application, running on hardware the household
controls.

### Added
- Interface available in English, Swedish and Italian, auto-detected from the
  browser with a manual switcher in settings.
- Progressive Web App with offline support and an installable home-screen icon.
- Optional AES-256 database encryption (SQLCipher) via `DB_ENCRYPTION_KEY`.
- Browser-based setup wizard and a localized CLI installer (`install.sh`).
- Docker and Podman deployment, with rootless systemd (quadlet) support.

### Changed
- Release notes in the app are no longer fetched from a public repository by
  default. A self-hosted install makes no outbound connection when the changelog
  view is opened. Set `CHANGELOG_RELEASES_URL` to a GitHub releases endpoint to
  restore the live feed.
- Deployment variables are namespaced `SAMLA_*` (`SAMLA_HTTP_PORT`,
  `SAMLA_HTTP_BIND`, `SAMLA_INSTALLER_LANG`, `SAMLA_INSTALLER_ROOT`).
- The default database file is `samla.db`. On first start, a database file left
  by an earlier installation under the managed path is migrated automatically.

### Attribution
Samla derives from [Yuvomi](https://github.com/ulsklyc/yuvomi) by ulsklyc, used
under the MIT License. See `THIRD-PARTY-LICENSES.md`.
