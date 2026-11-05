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

## Findings summary

Latest results: **November 4, 2026**.

| Provider / path | Finding |
| --- | --- |
| 1Password · Safari ↔ Chrome QR | Original-input keys differed in both directions; cross-input decryption exposed a relative input-hashing shift. |
| 1Password · Safari ↔ Chrome extension directly | Keys matched and decryption passed in both directions. |
| Apple Passwords · Safari ↔ Chrome QR | Keys matched and decryption passed in both directions. |
| Apple Passwords · Safari ↔ desktop Chrome directly | Keys matched and decryption passed in both directions. |
| Chrome Password Manager · phone Chrome ↔ desktop Chrome directly | Keys matched and decryption passed in both directions with required verification on desktop; earlier preferred attempts lacked actual UV. |
| Chrome Password Manager · phone → Chrome QR | An earlier unnumbered run reported a relative input-hashing shift; no complete numbered matrix was supplied for this path. |

[Full results and four-case decryption matrices](https://passkey-lab.capy.sc/results)

These findings describe reported setups. Historical QR and later direct runs
used different origins and credentials, so they do not isolate route alone or
identify the responsible vendor. Native verification failures are recorded
separately from encryption mismatches. The full results retain those details.

## Contributing

Help broaden the evidence with another browser, password manager or access
path. Share a sanitized finding in a
[GitHub issue](https://github.com/capysc/capy-prf-test/issues/new), or open a pull
request adding a comparison.

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

## Privacy and scope

The lab runs in the browser without sign-in, a backend, analytics or automatic
result submission. Use disposable passkeys. In-progress data stays in page
memory; refreshing clears it. Copying and sharing a report is an explicit
action by the tester.

This is a diagnostic experiment, not a passkey manager or an application
encryption fallback. Its reference contract is the
[WebAuthn PRF specification](https://www.w3.org/TR/webauthn-3/#prf-extension).
