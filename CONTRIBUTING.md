# Contributing

Use Node.js 24+ and npm. Keep runtime code in `rep4rep.user.js`, with no bundling or external runtime libraries. The readable source is the exact published asset.

```sh
npm ci --ignore-scripts
npx playwright install chromium firefox
npm run format
npm run check
npm test
```

Work on a branch and submit a pull request. CI checks formatting, JavaScript syntax, release metadata, asset checksums, dependency vulnerabilities and browser behavior. CodeQL checks JavaScript on pull requests, `main` and weekly. Dependabot groups compatible development-tool updates and updates pinned Actions separately.

For behavioral changes, add a regression to `tests/browser/userscript.spec.mjs`. Mock every Steam request; never use CI to post to real profiles or discover rate limits. Include relevant error, cancellation and keyboard behavior. Tests use a local synthetic DOM, not real accounts.

Preserve `@name` and `@namespace`, use string SteamIDs, render external text with `textContent`, and never log/store session tokens. Changes to the posting flow must retain confirmation, same-origin tab locking, sequential requests, timeout, stop-on-error and no automatic retries of uncertain POSTs. Do not add bypasses for Steam restrictions.

Keep both README languages and metadata descriptions accurate. UI text belongs in the existing English/Portuguese translation objects. Document visible behavior, not implementation details in the product interface. See [release instructions](docs/RELEASING.md) for versioning and publication.

MIT applies to contributions. Report security vulnerabilities through [SECURITY.md](SECURITY.md).
