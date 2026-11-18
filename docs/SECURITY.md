# Privacy and defensive review

HikmahPrep is a static revision tool, not a proctoring or identity system. The website has no auth, database, analytics endpoint, payments, PDF handling, cross-device sync, or API secrets. Answer keys and scoring logic are intentionally shipped to the browser; a student can inspect or alter their own data. Do not use local results for credentialing, attendance, or official grades. Use a preferred display name and keep study notes free of private or identifying information, especially on a shared device.

## Defensive controls

- The one script has a build-generated SHA-256 policy; no arbitrary inline scripts, event handlers, JS URLs, remote scripts, eval, runtime dependencies, network connections, plugins, base URL overrides or cross-origin form submissions are needed. Inline styles remain permitted for the bundled CSS and numeric charts. Embedded images and fonts use data URLs.
- Browser storage is treated as untrusted. IDs, course ownership, canonical answer indices, option-order seeds, dates, preference enums, string lengths, collection membership and record counts are checked. Note text is stored as plain text and escaped before display. User-entered text is rendered as text or escaped at the HTML boundary. Reference links are HTTPS and host-allowlisted. External links suppress referrer and opener.
- The local benchmark/preview server serves only `/` and `/index.html`, supports GET/HEAD, uses a fixed file path, nosniff, a restrictive Permissions Policy and no-referrer. It deliberately allows Arena to frame it. A portable HTML meta policy travels with the file; the supplied `_headers` adds frame protection on hosts that support that format.
- For production, use HTTPS on a dedicated static origin, publish the built output only, and verify the host actually applies the response headers (translate `_headers` if needed). Use the host’s CDN/traffic protection. Do not publish the supplied source documents or student data.
- LocalStorage (including notes) is browser-accessible and not encrypted by this app. A same-origin script, shared browser profile, OS access, or user editing can read/change it. Use a fresh browser profile on shared computers and clear your data when finished. Browser storage can be denied or cleared by private mode or browser cleanup.

This is a scoped defensive check of our generated code and local preview, not a third-party penetration test or production certificate. See `TESTING.md` for what was exercised.
