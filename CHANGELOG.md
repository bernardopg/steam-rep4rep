# Changelog

## 1.2.1 — 2026-10-14

- Wait for Greasy Fork download propagation as well as the public API version before completing release verification.
- Keep failure logs concise and verify the canonical download without selecting a historical version.
- Update development formatting tools and pin the tested Ubuntu runner image.

## 1.2.0 — 2026-10-14

- Select only visible search results and review named recipients before sending.
- Send one request at a time, with an editable interval after each response.
- Add cancellation, 30-second timeout, correct progress and a same-origin tab lock.
- Stop on Steam errors, HTTP errors, unexpected responses and connection failures; never retry uncertain POSTs automatically.
- Render response errors as text; validate session and SteamID inputs.
- Improve labels, focus, selection styling, layout and delayed/dynamic initialization.
- Preserve installed script identity and use `rep4rep.user.js` as the canonical source.
- Add reproducible release assets, checksums, browser regression tests, CI, CodeQL and Dependabot.
- Synchronize code and bilingual description to Greasy Fork only after a GitHub release.

## 1.1 — 2025-06-25

- Publish the initial English/Portuguese userscript and Greasy Fork update metadata.
