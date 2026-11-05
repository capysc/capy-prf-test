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

The default source and consumer assertions request `userVerification: preferred` and still reject a response without the actual UV bit. Enrollment separately requests `required`; this does not describe subsequent assertions. If the consumer receives `USER_NOT_VERIFIED`, a separate **Retry with required verification** button preserves the packet and Test ID and directly starts one `get` request with `required`. This is an explicit additional experiment, never an automatic retry or changed default. Successful reports include creator/consumer requested policies and actual verification results; an unverified response produces no PRF or decryption report.

The reports intentionally include disposable PRF outputs for this experiment. Do not use real account or Transport passkeys. No passkey ceremonies are automated by the code's tests.

UI/browser tests are intentionally not used. Existing focused crypto tests are retained; typecheck and static build validate packaging. Manual device acceptance is separate.

## Visual source

The app uses the actual native `capysc/keep-app` kit at `f6765478b424c2aaffb28d6c11d0358849604310`, inspected read-only at `/private/tmp/capy-staging-desktop-transport-20261103`. References: `src/lib/ui/canonical/kit-tokens.css`, `kit-base.css`, and the `Page`, `Button`, `Controls`, `Field`, and `MessageBox` components under `src/components/kit/`.

Keep's system font stack, measured column, light/dark tokens, glass controls, fields and message borders are reused. The standalone wrappers contain no Keep authentication or backend dependencies. No blog styling or font assets are used.

The private source repository is `https://github.com/capysc/capy-prf-test`. Vercel project `capy-prf-test` deploys the `codex/standalone-prf-test` branch. The stable test address is `https://capy-prf-test.vercel.app/`. No `main` branch or Capy product deployment is involved.
