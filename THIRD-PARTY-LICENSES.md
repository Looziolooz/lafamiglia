# Third-Party Licenses

Samla is built on open-source software. This file reproduces the license notices
required by those components. It must be distributed together with Samla.

---

## 1. Upstream project — Yuvomi

Samla is a derivative work of **Yuvomi** (https://github.com/ulsklyc/yuvomi),
released under the MIT License. The notice below is reproduced in full as
required by that license.

```
MIT License

Copyright (c) 2026 ulsklyc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Runtime dependencies

| Package | License |
| --- | --- |
| bcrypt | MIT |
| better-sqlite3-multiple-ciphers | MIT |
| compression | MIT |
| dotenv | BSD-2-Clause |
| express | MIT |
| express-rate-limit | MIT |
| express-session | MIT |
| helmet | MIT |
| libphonenumber-js | MIT |
| node-cron | ISC |
| nodemailer | MIT-0 |
| openid-client | MIT |
| web-push | **MPL-2.0** |
| googleapis (optional) | Apache-2.0 |
| tsdav (optional) | MIT |

### Note on web-push (MPL-2.0)

The Mozilla Public License 2.0 is a file-level copyleft license. Samla may be
distributed as proprietary software while depending on `web-push`, provided the
library's own source files are not modified. **If any file of `web-push` is
modified, that modified file must be made available under the MPL-2.0.** Samla
uses `web-push` as an unmodified npm dependency.

Source: https://github.com/web-push-libs/web-push

---

## 3. Bundled assets

| Asset | License | Terms |
| --- | --- | --- |
| Plus Jakarta Sans (`public/fonts/`) | SIL Open Font License 1.1 | Redistribution permitted, including commercially, as part of this software. The font may not be sold on its own. Any modified version must be renamed. |
| SortableJS (`public/vendor/sortablejs/`) | MIT | Vendored build, unmodified library source. |
| Lucide icons (`public/lucide.min.js`) | ISC | Free for commercial use. |

---

## 4. External services

Samla can connect to third-party services. Each deployment configures its own
credentials; no shared credentials are distributed with the software.

| Service | Usage | Terms to be aware of |
| --- | --- | --- |
| Open-Meteo | Default weather provider, no API key | The free API is **restricted to non-commercial use** (10,000 calls/day). Commercial deployments require a paid Open-Meteo plan or a different provider. |
| OpenWeatherMap | Alternative weather provider | Requires the operator's own API key. |
| Fixer.io | Currency rates for subscriptions | Requires the operator's own API key; disabled when unset. |
| Google Calendar / Google Drive | Optional sync and document storage | Requires the operator's own Google Cloud project and OAuth credentials. |
| CalDAV / CardDAV / WebDAV | Optional sync and backup | Operator-provided endpoints. |
