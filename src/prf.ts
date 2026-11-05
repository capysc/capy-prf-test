/** Disposable native WebAuthn reproduction. No Keep identity, Transport,
 * database, storage, HKDF, or shared ceremony implementation. */
const MESSAGE = new TextEncoder().encode('Capy disposable PRF test');
const SALT = Uint8Array.from({ length: 32 }, (_value, index) => index);
// Public D(x) = SHA256(UTF8("WebAuthn PRF") || 0x00 || SALT), precomputed
// so the two-input check reaches credentials.get directly from the click.
const HASHED_SALT = Uint8Array.from('dc1f4f3b3d759586245d5de7e2e115d2a056a2df27109db7cef9b4b3a89bb106'.match(/../g)!, (hex) => Number.parseInt(hex, 16));
const b64 = (value: Uint8Array): string => btoa(Array.from(value, (byte) => String.fromCharCode(byte)).join(''));
const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0));
const hex = (value: Uint8Array): string => Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
export type PrfTestDevice = 'phone' | 'desktop';
export type PrfTestResult = Readonly<{
  prfHex: string;
  hashedInputPrfHex: string | null;
  opensTest: boolean;
  hashedInputOpensTest: boolean | null;
}>;
export type PrfUnifiedTest = Readonly<{
  v: 2;
  testId?: string;
  rpId: string;
  sourceDevice: PrfTestDevice;
  sample: string;
  hashedSample?: string;
  sourceResult: PrfTestResult;
}>;
export type PrfDecryptionCase = Readonly<{
  encryptedWith: 'original-input' | 'extra-hashed-input';
  decryptedWith: 'original-input' | 'extra-hashed-input';
  opensTest: boolean | null;
}>;
export type PrfUnifiedReport = Readonly<{
  test: 'unified-prf-v1';
  testId: string | null;
  rpId: string;
  credentialId: string;
  sourceDevice: PrfTestDevice;
  checkingDevice: PrfTestDevice;
  sourceResult: PrfTestResult;
  checkingResult: PrfTestResult;
  samePrf: boolean;
  sameHashedInputPrf: boolean | null;
  sourceFirstMatchesCheckingSecond: boolean | null;
  sourceSecondMatchesCheckingFirst: boolean | null;
  decryptionCases: readonly PrfDecryptionCase[];
}>;
type NativeCredentials = Pick<CredentialsContainer, 'create' | 'get'>;
type Sample = Readonly<{ v: 1; credentialId: string; salt: string; iv: string; ct: string }>;

export async function createSmokeCredential(rpId: string, api: NativeCredentials = navigator.credentials): Promise<string> {
  const credential = await api.create({ publicKey: {
    rp: { id: rpId, name: 'Passkey PRF test' },
    user: { id: new TextEncoder().encode(`prf-test-${crypto.randomUUID()}`), name: 'Capy PRF test (disposable)', displayName: 'Capy PRF test (disposable)' },
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
    extensions: { prf: { eval: { first: SALT } } },
  } }) as PublicKeyCredential | null;
  if (!credential) throw new Error('CREDENTIAL_NOT_CREATED');
  const prf = credential.getClientExtensionResults().prf;
  if (prf?.enabled !== true && prf?.results?.first === undefined) throw new Error('PRF_NOT_ENABLED');
  return credential.id;
}

/** Snapshot provider arrays and exact offset views before any async import. */
function outputBytes(raw: unknown): Uint8Array<ArrayBuffer> | null {
  if (Array.isArray(raw) && raw.length === 32 && raw.every((value) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255)) return Uint8Array.from(raw);
  if (raw instanceof ArrayBuffer && raw.byteLength === 32) return Uint8Array.from(new Uint8Array(raw));
  if (ArrayBuffer.isView(raw) && raw.byteLength === 32) return Uint8Array.from(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength));
  return null;
}

async function evaluate(rpId: string, credentialId: string, api: NativeCredentials) {
  const credential = await api.get({ publicKey: {
    rpId, challenge: crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
    userVerification: 'preferred', extensions: { prf: { eval: { first: SALT, second: HASHED_SALT } } },
  } }) as PublicKeyCredential | null;
  if (!credential || credential.id !== credentialId) throw new Error('CREDENTIAL_MISMATCH');
  const data = new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData);
  if (data.length < 33 || (data[32] & 4) === 0) throw new Error('USER_NOT_VERIFIED');
  const results = credential.getClientExtensionResults().prf?.results;
  const output = outputBytes(results?.first);
  if (!output) throw new Error('PRF_NOT_32_BYTES');
  const second = outputBytes(results?.second);
  return {
    key: await crypto.subtle.importKey('raw', output, 'AES-GCM', false, ['encrypt', 'decrypt']),
    output,
    second,
  } as const;
}

function readSample(text: string): Sample {
  if (text.length > 4096) throw new Error('INVALID_TEST');
  const sample: Partial<Sample> | null = JSON.parse(text);
  if (sample?.v !== 1 || typeof sample.credentialId !== 'string' || sample.credentialId.length > 2048
    || sample.salt !== b64(SALT) || typeof sample.iv !== 'string' || decode(sample.iv).length !== 12
    || typeof sample.ct !== 'string' || decode(sample.ct).length !== MESSAGE.length + 16) throw new Error('INVALID_TEST');
  return { v: 1, credentialId: sample.credentialId, salt: b64(SALT), iv: sample.iv, ct: sample.ct };
}

async function opensMessage(sample: Sample, key: CryptoKey): Promise<boolean> {
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(sample.iv) }, key, decode(sample.ct)).catch(() => null);
  return plaintext !== null && new TextDecoder().decode(plaintext) === new TextDecoder().decode(MESSAGE);
}

async function sealMessage(credentialId: string, key: CryptoKey): Promise<Sample> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, MESSAGE);
  return { v: 1, credentialId, salt: b64(SALT), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

/** Both inputs are evaluated in one fresh assertion. Only disposable outputs
 * are copied; a receiving device must always obtain its own native output. */
async function resultFor(sample: Sample, key: CryptoKey, output: Uint8Array<ArrayBuffer>, second: Uint8Array<ArrayBuffer> | null): Promise<PrfTestResult> {
  const secondKey = second ? await crypto.subtle.importKey('raw', second, 'AES-GCM', false, ['decrypt']) : null;
  const [opensTest, hashedInputOpensTest] = await Promise.all([
    opensMessage(sample, key),
    secondKey ? opensMessage(sample, secondKey) : Promise.resolve(null),
  ]);
  return { prfHex: hex(output), hashedInputPrfHex: second ? hex(second) : null, opensTest, hashedInputOpensTest };
}

export async function createUnifiedPrfTest(rpId: string, credentialId: string, device: PrfTestDevice, api: NativeCredentials = navigator.credentials): Promise<PrfUnifiedTest> {
  // evaluate reaches native get before its first await (iOS user activation).
  const { key, output, second } = await evaluate(rpId, credentialId, api);
  const secondKey = second ? await crypto.subtle.importKey('raw', second, 'AES-GCM', false, ['encrypt', 'decrypt']) : null;
  const [sample, hashedSample] = await Promise.all([
    sealMessage(credentialId, key),
    secondKey ? sealMessage(credentialId, secondKey) : Promise.resolve(null),
  ]);
  const sourceResult = await resultFor(sample, key, output, second);
  if (!sourceResult.opensTest || (hashedSample && secondKey && !await opensMessage(hashedSample, secondKey))) throw new Error('LOCAL_ENCRYPTION_FAILED');
  return { v: 2, testId: `PRF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, rpId, sourceDevice: device, sample: JSON.stringify(sample), sourceResult,
    ...(hashedSample ? { hashedSample: JSON.stringify(hashedSample) } : {}) };
}

const validHex = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
function validResult(value: unknown): value is PrfTestResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<PrfTestResult>;
  return validHex(result.prfHex) && (result.hashedInputPrfHex === null || validHex(result.hashedInputPrfHex))
    && typeof result.opensTest === 'boolean' && (result.hashedInputOpensTest === null || typeof result.hashedInputOpensTest === 'boolean');
}

export function parseUnifiedPrfTest(rpId: string, text: string): PrfUnifiedTest {
  if (text.length > 8192) throw new Error('INVALID_TEST');
  const packet: Partial<PrfUnifiedTest> | null = JSON.parse(text);
  if (packet?.v !== 2 || typeof packet.rpId !== 'string' || (packet.sourceDevice !== 'phone' && packet.sourceDevice !== 'desktop')
    || typeof packet.sample !== 'string' || !validResult(packet.sourceResult)
    || (packet.testId !== undefined && (typeof packet.testId !== 'string' || !/^PRF-[0-9A-F]{8}$/.test(packet.testId)))) throw new Error('INVALID_TEST');
  if (packet.rpId !== rpId) throw new Error('TEST_DOMAIN_MISMATCH');
  const sample = readSample(packet.sample);
  if (packet.hashedSample !== undefined) {
    if (typeof packet.hashedSample !== 'string' || readSample(packet.hashedSample).credentialId !== sample.credentialId) throw new Error('INVALID_TEST');
  }
  return { v: 2, rpId, sourceDevice: packet.sourceDevice, sample: packet.sample, sourceResult: { ...packet.sourceResult },
    ...(packet.testId !== undefined ? { testId: packet.testId } : {}),
    ...(packet.hashedSample !== undefined ? { hashedSample: packet.hashedSample } : {}) };
}

export async function checkUnifiedPrfTest(rpId: string, packet: PrfUnifiedTest, device: PrfTestDevice, api: NativeCredentials = navigator.credentials): Promise<PrfUnifiedReport> {
  const checkedPacket = parseUnifiedPrfTest(rpId, JSON.stringify(packet));
  const sample = readSample(checkedPacket.sample);
  const { key, output, second } = await evaluate(rpId, sample.credentialId, api);
  const checkingResult = await resultFor(sample, key, output, second);
  const sourceResult = checkedPacket.sourceResult;
  const secondKey = second ? await crypto.subtle.importKey('raw', second, 'AES-GCM', false, ['decrypt']) : null;
  const hashedSample = checkedPacket.hashedSample ? readSample(checkedPacket.hashedSample) : null;
  const [hashedWithOriginal, hashedWithHashed] = await Promise.all([
    hashedSample ? opensMessage(hashedSample, key) : Promise.resolve(null),
    hashedSample && secondKey ? opensMessage(hashedSample, secondKey) : Promise.resolve(null),
  ]);
  const decryptionCases: readonly PrfDecryptionCase[] = [
    { encryptedWith: 'original-input', decryptedWith: 'original-input', opensTest: checkingResult.opensTest },
    { encryptedWith: 'original-input', decryptedWith: 'extra-hashed-input', opensTest: checkingResult.hashedInputOpensTest },
    { encryptedWith: 'extra-hashed-input', decryptedWith: 'original-input', opensTest: hashedWithOriginal },
    { encryptedWith: 'extra-hashed-input', decryptedWith: 'extra-hashed-input', opensTest: hashedWithHashed },
  ];
  return {
    test: 'unified-prf-v1', testId: checkedPacket.testId ?? null, rpId, credentialId: sample.credentialId,
    sourceDevice: checkedPacket.sourceDevice, checkingDevice: device, sourceResult, checkingResult, decryptionCases,
    samePrf: sourceResult.prfHex === checkingResult.prfHex,
    sameHashedInputPrf: sourceResult.hashedInputPrfHex !== null && checkingResult.hashedInputPrfHex !== null
      ? sourceResult.hashedInputPrfHex === checkingResult.hashedInputPrfHex : null,
    sourceFirstMatchesCheckingSecond: checkingResult.hashedInputPrfHex !== null ? sourceResult.prfHex === checkingResult.hashedInputPrfHex : null,
    sourceSecondMatchesCheckingFirst: sourceResult.hashedInputPrfHex !== null ? sourceResult.hashedInputPrfHex === checkingResult.prfHex : null,
  };
}
