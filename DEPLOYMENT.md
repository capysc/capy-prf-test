# Standalone PRF diagnostic deployment

- Stable test URL: https://capy-prf-test.vercel.app/
- Vercel project: `capy-prf-test`, independent of Keep.
- Branch: `codex/standalone-prf-test`.
- Deployed application source: `bfea61e300c03816f233ca43ce9c97c9d81de7b1`.
- Deployment: `dpl_H3FfxqTKRHcBuFr4LhtHW5w6xnWA`, `READY`.
- This test project's production target provides its public stable address. No Capy product deployment, existing alias, or DNS was changed.
- Full verified artifact metadata and asset SHA-256 values: `deployment.json`.

## Verification

Typecheck and build passed. Five focused crypto tests passed with 27 assertions. HTTP verification confirmed the root, `/prf-test` alias, JavaScript, and stylesheet return 200 without authentication. The served JavaScript contains the requested Phone/Desktop/Check Passkey Equality labels, visible Test IDs, and explicit verification retry. Self-only script/style CSP and no application connections are retained.

No browser/UI tests or human passkey ceremonies were performed. Manual phone/desktop acceptance remains pending.

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
vercel deploy --prod --yes --scope team_KwEbJp9UDDo9DI80N1MvCsa4
```

Run deployments only from this isolated checkout, already linked to `capy-prf-test`. The first baseline deployment was `dpl_APZfXFA9gCkUkzyVKSq6XLXo8Mxd` from source `9b8fc9e`; it lacked the explicit verification-policy retry. Keep it as a rollback reference, not as the current state.

The deployed application source above is exact; this documentation/evidence commit follows deployment and does not alter application code.
