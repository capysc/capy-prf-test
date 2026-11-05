# Passkey Lab

An open-source experiment investigating whether the same passkey produces the
same encryption keys across browsers, devices, password managers and access paths.

[Open the lab](https://passkey-lab.capy.sc/) · [View the results](https://passkey-lab.capy.sc/results) · [Contribute](#contributing)

## Why this exists

A passkey can sign you in successfully while its encryption features behave
differently across platforms. The WebAuthn PRF extension lets an application
create an encryption key from a passkey. Applications using it depend on the
same passkey and input producing the same key wherever that passkey is used.

Passkey Lab makes that interoperability property observable. It compares
phone-local access, desktop password-manager extensions and phone QR flows.
The goal is reproducible evidence that helps browser and password-manager
vendors find and fix incompatible behavior.

## What the experiment measures

One approval evaluates two inputs: an original input and an extra-hashed
version. Each returned key encrypts a separate copy of the same message.
The receiving device obtains its own fresh keys and tries both against both
encrypted copies, producing four authenticated decryption results.

This shows whether the devices get the same key. It also helps detect when one
connection method appears to hash the input an extra time. The report records
the verification setting and whether the browser reported identity verification.
Without that confirmation, the test stops before accepting any encryption keys.

The extra-hashed input is a diagnostic probe. The lab does not automatically
adjust inputs by provider, compensate for mismatches or use copied source
keys to make the receiving device appear successful.

## Findings summary

Latest results: **November 4, 2026**.

| Provider / path | Finding |
| --- | --- |
| 1Password · Safari ↔ Chrome QR | The routes returned different keys in both directions. QR behaved as though the input had been hashed an extra time compared with Safari. |
| 1Password · Safari ↔ Chrome extension directly | Phone → extension passed under preferred. The reverse run needs changes: it used required, although keys matched and decryption succeeded. |
| Apple Passwords · Safari ↔ Chrome QR | Keys matched and decryption passed in both directions. |
| Apple Passwords · Safari ↔ desktop Chrome directly | Keys matched and decryption passed in both directions. |
| Chrome Password Manager · phone Chrome ↔ desktop Chrome directly | Needs changes: desktop used required verification in both directions. Keys matched and decryption succeeded; earlier default approvals did not report identity verification. |
| Chrome Password Manager · phone → Chrome QR | An earlier unnumbered test reported a similar key mismatch. It did not include a complete set of comparison results. |

[Full comparison results](https://passkey-lab.capy.sc/results)

These findings describe reported setups. Historical QR and later direct runs
used different origins and credentials, so they do not isolate route alone or
identify the responsible vendor. Tests that stop during identity verification
are recorded separately from tests that return different encryption keys.

## Contributing

Help broaden the evidence with another browser, password manager or access
path. Share a result summary without keys or passkey identifiers in a
[GitHub issue](https://github.com/capysc/capy-prf-test/issues/new), or open a pull
request adding a comparison.

A useful result includes:

- Date and test website, plus device, OS, browser and password-manager versions.
- Creator and consumer paths: local, extension or QR, including the native
  password-manager selection menu.
- Verification settings and whether each device reported identity verification.
- Whether each of the four decryption checks worked, or the exact error if the
  experiment stopped before comparison.
- Whether the comparison reused a credential and packet or started a separate
  run. Keep observations separate from explanations of their cause.

**Do not post complete copied packets or reports.** They contain disposable
encryption keys and passkey identifiers. Share only the setup details and
results described above, never real-account credentials or encryption keys.

## Privacy and scope

The lab runs in the browser without sign-in, a backend, analytics or automatic
result submission. Use disposable passkeys. In-progress data stays in page
memory; refreshing clears it. Copying and sharing a report is an explicit
action by the tester.

This is a diagnostic experiment, not a passkey manager or an application
encryption fallback. Its reference contract is the
[WebAuthn PRF specification](https://www.w3.org/TR/webauthn-3/#prf-extension).
