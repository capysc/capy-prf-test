# Standalone PRF diagnostic deployment

- Stable test URL: https://capy-prf-test.vercel.app/
- Vercel project: `capy-prf-test`, independent of Keep.
- Branch: `codex/standalone-prf-test`.
- Deployed application source: `bbd03d693ba1e0f91870e59f3b611c0f6fe3b6fc`.
- Deployment: `dpl_qBbWYMsnuwf8ck9G3djPWEnKVXfr`, `READY`.
- This test project's production target provides its public stable address. No Capy product deployment, existing alias, or DNS was changed.
- Full verified application snapshot and asset SHA-256 values: `deployment.json`.
- Private source: `https://github.com/cvince/capy-prf-test`.
- Vercel Git link: `cvince/capy-prf-test` (repository ID `1446488784`), production branch `codex/standalone-prf-test`, project ID `prj_gLAwTlMfRD96TyH1MCzbLfsx7vKw`.
- The blog restyle deployed through the Git integration; the exact source commit’s GitHub Vercel success status matches the live deployment ID. No duplicate CLI deployment was started.

## Verification

Typecheck and build passed after restyling. The crypto implementation is unchanged; the existing five focused crypto tests with 27 assertions remain the prior verification evidence. HTTP verification confirmed the root, `/prf-test` alias, JavaScript, and stylesheet return 200 without authentication. The served JavaScript contains the requested Phone/Desktop/Check Passkey Equality labels, visible Test IDs, and explicit verification retry. Self-only script/style CSP and no application connections are retained.

The stylesheet and bundled Vend Sans/Lora fonts were verified at the public URL; returned font bytes match the local assets. The neutral Phone/Desktop/Check Passkey Equality controls and explicit UV retry remain in the served JavaScript. No browser/UI tests or human passkey ceremonies were performed. Manual phone/desktop acceptance remains pending.

## Blog visual provenance

The app reuses `cvince/blog` at `b4e953d34938438f3fdb1acd3aa0de7edf6d4e9c`, inspected read-only at `/Users/vince/Dev/blog`. Visual references are `app/globals.css`, `app/layout.tsx`, `app/markdown.css`, and `app/[slug]/post-nav.tsx`: Vend Sans controls/headings, Lora prose, white/black backgrounds, neutral rules, narrow reading column and square outlined controls. Fonts are bundled locally with their OFL notices; no analytics or blog behavior was copied. The blog checkout was not modified.

## Verification-policy experiment

Enrollment requires verification. The later source assertion and default consumer assertion continue requesting `preferred`, and the code rejects either without actual UV. Only a consumer `USER_NOT_VERIFIED` failure exposes **Retry with required verification**. This separate button directly starts one native request with `required`, retaining the packet and Test ID. Successful reports record the source assertion policy, checking policy, and actual UV. There is no automatic retry, provider detection, changed default, or crypto result after an unverified assertion.

## Domain and previous evidence

Use the stable URL on both devices. The RP ID is `capy-prf-test.vercel.app`, so create a new disposable passkey here. Existing `staging-keep.capy.sc` credentials and packets belong to a different RP and are deliberately not reused. Existing staging test results remain valid evidence for their original RP; record new results with this app's RP and Test ID.

## Reproduce / deploy

```
bun install --frozen-lockfile
bun run typecheck
bun test
bun run build
git push origin codex/standalone-prf-test
```

Pushes to this feature branch deploy through the Git integration. Use a CLI deployment only as an explicitly investigated fallback, not while a Git build is already running. This isolated checkout is also linked to `capy-prf-test`. The first baseline deployment was `dpl_APZfXFA9gCkUkzyVKSq6XLXo8Mxd` from source `9b8fc9e`; it lacked the explicit verification-policy retry. Keep it as a rollback reference, not as the current state.

The deployed application source above is exact; this documentation/evidence commit follows deployment and does not alter application code.
