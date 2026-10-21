// Google service account → OAuth access token（RS256 JWT，用 WebCrypto 簽章，不需要 Node 套件）。
// 流程依 Google 官方「Using OAuth 2.0 for Server to Server Applications」：
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function base64UrlFromBytes(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlFromJson(value) {
  return base64UrlFromBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToPkcs8Bytes(pem) {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * @param {string} serviceAccountJson service account 金鑰 JSON 全文（Worker secret）
 * @param {typeof fetch} fetchImpl 計數用的 fetch
 * @returns {Promise<string>} access token
 */
export async function getGoogleAccessToken(serviceAccountJson, fetchImpl) {
  let account;
  try {
    account = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON 不是合法 JSON。');
  }
  if (!account.client_email || !account.private_key) {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON 缺少 client_email 或 private_key。');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', ...(account.private_key_id ? { kid: account.private_key_id } : {}) };
  const claims = { iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: issuedAt, exp: issuedAt + 3600 };
  const unsigned = `${base64UrlFromJson(header)}.${base64UrlFromJson(claims)}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8Bytes(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64UrlFromBytes(new Uint8Array(signature))}`;

  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google OAuth 換 token 失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  const { access_token: accessToken } = JSON.parse(text);
  if (!accessToken) throw new Error('Google OAuth 回應沒有 access_token。');
  return accessToken;
}
