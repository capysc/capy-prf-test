# Standalone passkey PRF test

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

The reports intentionally include disposable PRF outputs for this experiment. Do not use real account or Transport passkeys. No passkey ceremonies are automated by the code's tests.

UI/browser tests are intentionally not used. Existing focused crypto tests are retained; typecheck and static build validate packaging. Manual device acceptance is separate.
