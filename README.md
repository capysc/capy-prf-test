# Passkey Lab

An open-source experiment investigating whether the same passkey produces the
same encryption keys across browsers, devices, password managers and access paths.

[Open the lab](https://passkey-lab.capy.sc/) · [View the results](https://passkey-lab.capy.sc/results) · [Contribute](#contributing)

## Why this exists

A passkey can sign you in successfully while its encryption features behave
differently across platforms. Applications that use the WebAuthn PRF extension
to protect encrypted data depend on the same credential and input producing
the same key wherever that credential is used.

Passkey Lab makes that interoperability property observable. It compares
phone-local access, desktop password-manager extensions and phone QR flows.
The goal is reproducible evidence that helps browser and password-manager
vendors find and fix incompatible behavior.

## What the experiment measures

One approval evaluates two inputs: an original input and an extra-hashed
version. Each returned key encrypts a separate copy of the same message.
The receiving device obtains its own fresh keys and tries both against both
encrypted copies, producing four authenticated decryption results.

This distinguishes matching keys from a relative input-hashing shift. It also
records the requested verification policy and actual user verification.
An assertion without actual verification is rejected before any PRF or
decryption result is accepted.

The extra-hashed input is a diagnostic probe. The lab does not automatically
adjust inputs by provider, compensate for mismatches or use copied source
keys to make the receiving device appear successful.

## Findings so far

Latest results: **November 4, 2026**.

| Provider | Direct paths | Phone QR paths |
| --- | --- | --- |
| 1Password | Safari ↔ Chrome extension passed in both directions. | Earlier runs showed a relative input-hashing shift in both directions. |
| Apple Passwords | Both directions passed. | Both directions passed. |
| Chrome Password Manager | Both directions passed with required verification on desktop. | An earlier unnumbered run reported a relative input-hashing shift. |

The numbered comparisons and full four-case matrices are on the
[results page](https://passkey-lab.capy.sc/results).

The direct 1Password results show that the observed failure is not universal
to 1Password or cross-device PRF. Its QR/provider hand-off deserves investigation,
but responsibility between 1Password, Apple's bridge and Chrome is unconfirmed.
Historical QR runs and later direct runs used different origins and credentials;
they are not a same-credential control isolating route alone.

Verification failures are a separate finding. Some desktop Chrome Password
Manager attempts under preferred verification lacked actual UV; explicit
required attempts passed. Preferred permits an unverified response, so this
alone does not establish a vendor bug. A later 1Password extension run used
required without establishing that preferred had failed.

Provider and selection-route labels come from the tester's reported setup;
the JSON does not attest which provider interface or transport was used.
These findings describe tested combinations, not every installation.

## Contributing

Help broaden the evidence or make the experiment easier to understand and
reproduce. Share a sanitized finding in a
[GitHub issue](https://github.com/capysc/capy-prf-test/issues/new), or open a pull
request with a correction, a new comparison or an implementation improvement.

A useful result includes:

- Date and test origin, plus device, OS, browser and password-manager versions.
- Creator and consumer paths: local, extension or QR, including the native
  chooser's provider-selection route.
- Requested verification policies and actual verification on both devices.
- All four decryption verdicts, or the exact native popup/app error if the
  experiment stopped before comparison.
- Whether the comparison reused a credential and packet or started a separate
  run. Keep observations separate from explanations of their cause.

**Do not post complete copied packets or reports.** They contain disposable
PRF outputs and credential identifiers. Share only sanitized metadata and
verdicts, never real-account credentials or encryption material.

For code contributions, preserve human-controlled native approval and actual-UV
checks. Comparison data and dates live in `src/Results.tsx`. Use the existing
style tokens and immutable TypeScript values. Run `bun run typecheck`,
`bun test` and `bun run build` before submitting. Automated checks cover
synthetic crypto; native provider behavior is verified manually, without
browser/UI tests.

## Privacy and scope

The lab runs in the browser without sign-in, a backend, analytics or automatic
result submission. Use disposable passkeys. In-progress data stays in page
memory; refreshing clears it. Copying and sharing a report is an explicit
action by the tester.

This is a diagnostic experiment, not a passkey manager or an application
encryption fallback. Its reference contract is the
[WebAuthn PRF specification](https://www.w3.org/TR/webauthn-3/#prf-extension).
