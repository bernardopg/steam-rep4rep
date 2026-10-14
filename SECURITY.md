# Security policy

Security fixes target the latest stable release. Update through Greasy Fork and reload Steam after installing an update.

Use the repository's [private vulnerability reporting](https://github.com/bernardopg/steam-rep4rep/security/advisories/new) for vulnerabilities. Do not include session cookies, `g_sessionID`, passwords, friends' data or screenshots containing them. Provide the affected version, browser/manager version and a minimal reproduction with synthetic data.

The script runs in the Steam page context with `@grant none`. It trusts the page session and Steam's DOM; browser extensions or a compromised page can affect that context. It sends comments only to the fixed HTTPS Steam Community host. It does not persist tokens or comments and does not run a separate service.

Stopping a request cannot retract a comment already accepted by Steam. A timeout or lost connection has an unknown delivery result, so there is no automatic retry. Same-origin Web Locks prevent concurrent batches only within the same browser profile. Steam can still apply restrictions independently of this software.

Release assets include SHA-256 checksums. GitHub Actions dependencies are pinned, the lockfile is committed and Dependabot updates development dependencies. The Greasy Fork account webhook credential belongs only in repository Actions secrets; never put it in source, issue bodies, screenshots or logs. The release workflow checks synchronization results and the public version before reporting success.
