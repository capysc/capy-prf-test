# Passkey Lab

A static, browser-only extraction of the disposable test from Keep revision `f6765478b424c2aaffb28d6c11d0358849604310`. No Keep dependency, sign-in, backend, storage, analytics, or environment secrets.

## Run

```
bun install
bun run typecheck
bun test
bun run build
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173` locally. Real phone/desktop testing needs the same deployed HTTPS address on both devices. The RP ID is the current hostname, so passkeys created on staging Keep cannot be reused on this app's separate domain.

## Test

Choose the current device role. The labels do not choose a browser, provider, or transport: use your planned password manager and either direct selection or native QR. Create a disposable passkey, then use a separate tap to obtain both PRF outputs and encrypt both messages. Copy the complete packet using its copy button, load it on the other device, compare test IDs, and check. Copy the combined results using their copy button.

Each assertion requests exactly the same original input and domain-separated hashed input as the Keep diagnostic. Both outputs are normalized to exact 32-byte snapshots, with actual user verification required. Each ciphertext has its own IV. The consumer uses fresh native outputs for all four AES-GCM decryptions, never the copied source keys. No automatic extra-hash compensation or provider detection is applied.

The default source and consumer assertions request `userVerification: preferred` and still reject a response without the actual UV bit. Enrollment separately requests `required`; this does not describe subsequent assertions. Both creator encryption and consumer checks offer explicit required-verification alternatives. After `USER_NOT_VERIFIED`, the alternative is labeled **Retry with required verification**. Each button directly starts one `get` request with the selected policy. Creator retry reuses its current enrolled credential; consumer retry preserves its packet and Test ID. A page refresh clears that in-memory state. This is an explicit additional experiment, never an automatic retry or changed default. Successful reports include creator/consumer requested policies and actual verification results; an unverified response produces no PRF or decryption report.

The reports intentionally include disposable PRF outputs for this experiment. Do not use real account or Transport passkeys. No passkey ceremonies are automated by the code's tests.

UI/browser tests are intentionally not used. Existing focused crypto tests are retained; typecheck and static build validate packaging. Manual device acceptance is separate.

## Visual source

The app uses the actual native `capysc/keep-app` kit at `f6765478b424c2aaffb28d6c11d0358849604310`, inspected read-only at `/private/tmp/capy-staging-desktop-transport-20261103`. References: `src/lib/ui/canonical/kit-tokens.css`, `kit-base.css`, and the `Page`, `Button`, `Controls`, `Field`, and `MessageBox` components under `src/components/kit/`.

Keep's system font stack, measured column, light/dark tokens, glass controls, fields and message borders are reused. The standalone wrappers contain no Keep authentication or backend dependencies. No blog styling or font assets are used.

The private source repository is `https://github.com/capysc/capy-prf-test`. Vercel project `capy-prf-test` deploys the `codex/standalone-prf-test` branch. The stable test address is `https://passkey-lab.capy.sc/`. No `main` branch or Capy product deployment is involved.

## Published results

`/results` contains the ten numbered manual comparisons, the four-case
decryption matrix, requested verification policies, observed key relationships
and interpretation limits. Latest results are dated **November 4, 2026**
(Pacific), rather than using the visitor's clock. Only sanitized summaries and
test numbers are published; no report IDs, credential IDs or raw PRF outputs
are included. Both tables show creator and consumer for every numbered test.

The header's Results link opens in a separate tab to preserve an in-progress
test's memory. Links are blue in light mode and teal in dark mode. The results
page is generated as static HTML during the build, works without JavaScript,
and uses the same stylesheet as the test. Tables scroll within the page on
narrow screens. Update the immutable comparison data and date in
`src/Results.tsx` when adding verified manual results. Provider/route labels
remain user-reported, and QR and direct runs from different origins or
credentials must not be presented as a controlled same-credential comparison.

## Compare verification policies on one device

Create a disposable passkey on the phone with the intended provider, then encrypt using the default preferred approval. Choose **Check on this device**, then **Check with required verification**. This compares policies against the same passkey and ciphertext. Copy the report with **Copy results for chat**. **Check again** returns to that same packet so the default preferred check can also be run without re-enrollment.

This is a separate experiment from cross-device QR testing. A currently working provider may not reproduce a historical failure. Keep's historical 1Password fix also changed per-credential `evalByCredential` requests to plain `prf.eval`; this lab already uses plain `eval`, so changing its verification policy does not reproduce the entire old request.
