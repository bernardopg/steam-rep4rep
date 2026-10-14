# Release and Greasy Fork distribution

## Distribution contract

`rep4rep.user.js` is the canonical source and the exact release asset. It must exist at the root of each version tag: Greasy Fork's GitHub release handler reads the file from the tag, even when its sync URL names a release asset. Do not generate a differently named script only in `dist/`.

Keep `@name` and `@namespace` unchanged so installed copies update in place. `package.json`, the userscript's `@version` and the stable tag `vX.Y.Z` must agree. Metadata points installations to Greasy Fork; both GitHub and Greasy Fork distribute the same runtime code, although Greasy Fork rewrites update directives.

`npm run build` creates these reproducible files in `dist/`:

- `rep4rep.user.js`: exact readable source.
- `rep4rep.meta.js`: metadata only.
- `README.md`: bilingual published description, with absolute links.
- `LICENSE`: MIT license.
- `SHA256SUMS`: checksums of the four files.

## One-time owner setup

1. In the script's Greasy Fork synchronization settings, use `https://github.com/bernardopg/steam-rep4rep/releases/latest/download/rep4rep.user.js` for code.
2. Link the additional description to `https://raw.githubusercontent.com/bernardopg/steam-rep4rep/main/README.md`, as Markdown. Keep descriptions under this repository's control.
3. From the authenticated owner's webhook information page, obtain the existing endpoint and secret. Do not regenerate an account-wide secret when other scripts may use it.
4. Save them as repository Actions secrets `GREASYFORK_WEBHOOK_URL` and `GREASYFORK_WEBHOOK_SECRET`. Never place them in code or print them in logs.

The release workflow sends signed events directly to the official Greasy Fork webhook endpoint. No separate GitHub webhook is required. It sends a release event for code, then a push event for the README at the exact released commit. The second event is needed because Greasy Fork's release handler does not refresh additional descriptions. Ordinary pushes to `main` do not invoke this distribution workflow.

These are the official [webhook implementation](https://github.com/greasyfork-org/greasyfork/blob/main/app/controllers/concerns/webhooks.rb), [release selector](https://github.com/greasyfork-org/greasyfork/blob/main/lib/github.rb) and [integration tests](https://github.com/greasyfork-org/greasyfork/blob/main/test/integration/github_webhook_test.rb). The webhook protocol currently expects HMAC-SHA1 in `X-Hub-Signature`; this is the service's authentication protocol, not the SHA-256 checksum used for release files.

## Publish

1. Merge tested changes to `main`. Update `CHANGELOG.md` and both version fields; run `npm install --package-lock-only --ignore-scripts` to align the lockfile.
2. Run `npm run format`, `npm run check` and `npm test`. Commit the version and documentation changes, then push `main`.
3. Create and push the version tag from that commit:

   ```sh
   git tag -a vX.Y.Z -m 'Release vX.Y.Z'
   git push origin vX.Y.Z
   ```

4. The Release workflow repeats CI, checks tag/version alignment and membership in `main`, creates a draft, uploads all assets, and only then publishes the release. It then synchronizes Greasy Fork and verifies the public version.
5. Check the terminal Release result, its assets and the public Greasy Fork page. Do not call a release delivered merely because the tag exists or GitHub accepted an HTTP request.

Release publication and distribution stay in one workflow. A release created with `GITHUB_TOKEN` does not start another workflow from its `release` event. See [GitHub's event behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Failures and recovery

The workflow requires distribution secrets before publishing. A failed CI or tag check publishes nothing. A draft can be retried; its assets are completed before publication. Once published, assets are never overwritten: a rerun compares them byte-for-byte and then retries distribution only. A mismatch requires a new version, not replacing a stable asset.

The synchronization step checks both HTTP and the webhook JSON result. HTTP 200 can still contain `updated_failed`; that is a failure. Repeating the release workflow must not change stable assets or roll back to a previous version.

If GitHub is published but Greasy Fork fails, fix its source/description settings or the Actions secrets, then rerun the failed release run. Manual dispatch is also available when selecting the existing version tag in the Actions UI. Dispatch on a branch is rejected. Never advance `main`'s source directly into Greasy Fork as a shortcut around release checks.

For a bad published version, fix forward and publish a new, higher version. Do not lower `@version`, move a published tag, remove existing releases, or regenerate webhook credentials to work around a synchronization error.
