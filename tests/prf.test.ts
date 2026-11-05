import { expect, mock, test } from 'bun:test';
import { createSmokeCredential, createUnifiedPrfTest, parseUnifiedPrfTest, checkUnifiedPrfTest } from '../src/prf';

const rp = 'staging-keep.capy.sc';
const id = 'c3ludGhldGljLXByZi10ZXN0';
const first = Uint8Array.from({ length: 32 }, (_value, index) => index + 1);
const second = Uint8Array.from({ length: 32 }, (_value, index) => index + 80);
const credential = (a: unknown, b?: unknown): Credential => ({ id, type: 'public-key',
  response: { authenticatorData: Uint8Array.from({ length: 37 }, (_value, index) => index === 32 ? 4 : 0).buffer },
  getClientExtensionResults: () => ({ prf: { enabled: true, results: { first: a, second: b } } }),
}) as unknown as Credential;
const driver = (a: unknown = first, b?: unknown) => ({
  create: mock(async (_options?: CredentialCreationOptions) => credential(a, b)),
  get: mock(async (_options?: CredentialRequestOptions) => credential(a, b)),
});

test('one portable test enrolls, encrypts, and checks freshly on another device with exact native inputs', async () => {
  const source = driver(Array.from(first), Array.from(second));
  expect(await createSmokeCredential(rp, source)).toBe(id);
  expect(source.create.mock.calls[0][0]?.publicKey?.authenticatorSelection?.userVerification).toBe('required');
  const pending = createUnifiedPrfTest(rp, id, 'phone', source);
  expect(source.get).toHaveBeenCalledTimes(1);
  const packet = await pending;
  expect(packet.testId).toMatch(/^PRF-[0-9A-F]{8}$/);
  const request = source.get.mock.calls[0][0]?.publicKey;
  const salt = Uint8Array.from({ length: 32 }, (_value, index) => index);
  const hash = await crypto.subtle.digest('SHA-256', Uint8Array.from([...new TextEncoder().encode('WebAuthn PRF\0'), ...salt]));
  expect(request?.extensions?.prf?.eval).toEqual({ first: salt, second: new Uint8Array(hash) });
  expect(request?.userVerification).toBe('preferred');
  const storage = Uint8Array.from([200, 201, ...first, 202]);
  const destination = driver(new DataView(storage.buffer, 2, 32), second);
  const report = await checkUnifiedPrfTest(rp, parseUnifiedPrfTest(rp, JSON.stringify(packet)), 'desktop', destination);
  expect(destination.create).toHaveBeenCalledTimes(0);
  expect(destination.get).toHaveBeenCalledTimes(1);
  expect(destination.get.mock.calls[0][0]?.publicKey?.allowCredentials).toEqual([{ type: 'public-key', id: Uint8Array.from(Buffer.from(id, 'base64url')) }]);
  expect(report).toMatchObject({ sourceDevice: 'phone', checkingDevice: 'desktop', credentialId: id, samePrf: true, sameHashedInputPrf: true,
    sourceResult: { opensTest: true }, checkingResult: { opensTest: true, hashedInputOpensTest: false } });
  expect(report.decryptionCases.map((entry) => entry.opensTest)).toEqual([true, false, false, true]);
  expect(report.testId).toBe(packet.testId ?? null);
  expect(report).toMatchObject({ sourceUserVerification: 'preferred', checkingUserVerification: 'preferred', sourceUserVerified: true, checkingUserVerified: true });
});

test('reverse setup and a mismatched native key report actual decryption and hash crossovers, never decrypting with copied source bytes', async () => {
  const packet = await createUnifiedPrfTest(rp, id, 'desktop', driver(first, second));
  const report = await checkUnifiedPrfTest(rp, packet, 'phone', driver(second, first));
  expect(report).toMatchObject({ sourceDevice: 'desktop', checkingDevice: 'phone', samePrf: false,
    sourceFirstMatchesCheckingSecond: true, sourceSecondMatchesCheckingFirst: true,
    checkingResult: { opensTest: false, hashedInputOpensTest: true } });
  expect(report.decryptionCases.map((entry) => entry.opensTest)).toEqual([false, true, true, false]);
});

test('missing second output is inconclusive without another approval', async () => {
  const source = driver(first);
  const packet = await createUnifiedPrfTest(rp, id, 'phone', source);
  const target = driver(first);
  const report = await checkUnifiedPrfTest(rp, packet, 'desktop', target);
  expect(report).toMatchObject({ samePrf: true, sameHashedInputPrf: null, sourceFirstMatchesCheckingSecond: null,
    sourceSecondMatchesCheckingFirst: null, checkingResult: { opensTest: true, hashedInputPrfHex: null } });
  expect(target.get).toHaveBeenCalledTimes(1);
  expect(report.decryptionCases.map((entry) => entry.opensTest)).toEqual([true, null, null, null]);
});

test('invalid domain, copied packet, credential, UV and PRF output are refused', async () => {
  const packet = await createUnifiedPrfTest(rp, id, 'phone', driver(first, second));
  expect(() => parseUnifiedPrfTest('other.example', JSON.stringify(packet))).toThrow('TEST_DOMAIN_MISMATCH');
  expect(() => parseUnifiedPrfTest(rp, JSON.stringify({ ...packet, sample: '{}' }))).toThrow('INVALID_TEST');
  const wrong = { ...driver(), get: async () => ({ ...credential(first), id: 'different' }) as Credential };
  await expect(checkUnifiedPrfTest(rp, packet, 'desktop', wrong)).rejects.toThrow('CREDENTIAL_MISMATCH');
  const noUv = { ...driver(), get: async () => ({ ...credential(first), response: { authenticatorData: new Uint8Array(37).buffer } }) as unknown as Credential };
  await expect(checkUnifiedPrfTest(rp, packet, 'desktop', noUv)).rejects.toThrow('USER_NOT_VERIFIED');
  await expect(checkUnifiedPrfTest(rp, packet, 'desktop', noUv, 'required')).rejects.toThrow('USER_NOT_VERIFIED');
  await expect(checkUnifiedPrfTest(rp, packet, 'desktop', driver(new Uint8Array(31)))).rejects.toThrow('PRF_NOT_32_BYTES');
});

test('a separate required-verification check preserves the packet and records its requested policy', async () => {
  const packet = await createUnifiedPrfTest(rp, id, 'phone', driver(first, second));
  const target = driver(first, second);
  const pending = checkUnifiedPrfTest(rp, packet, 'desktop', target, 'required');
  expect(target.get).toHaveBeenCalledTimes(1);
  expect(target.get.mock.calls[0][0]?.publicKey?.userVerification).toBe('required');
  const report = await pending;
  expect(report).toMatchObject({ testId: packet.testId, sourceUserVerification: 'preferred', checkingUserVerification: 'required', sourceUserVerified: true, checkingUserVerified: true, checkingResult: { opensTest: true } });
});
