const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Generate VAPID Key Pair using prime256v1 (P-256) curve
 */
function generateVapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey('base64url'),
    privateKey: ecdh.getPrivateKey('base64url')
  };
}

/**
 * Encrypt push payload according to RFC 8291 (aes128gcm)
 */
function encryptPayload(subscription, payloadString) {
  const clientPublicKey = Buffer.from(subscription.keys.p256dh, 'base64url');
  const authSecret = Buffer.from(subscription.keys.auth, 'base64url');

  // 1. Generate local ephemeral ECDH key pair
  const localEcdh = crypto.createECDH('prime256v1');
  localEcdh.generateKeys();
  const localPublicKey = localEcdh.getPublicKey();

  // 2. Compute ECDH shared secret
  const sharedSecret = localEcdh.computeSecret(clientPublicKey);

  // 3. HKDF step 1: PRK_key = HKDF-Extract(auth_secret, shared_secret)
  const prkKey = crypto.hkdfSync('sha256', sharedSecret, authSecret, Buffer.alloc(0), 32);

  // 4. HKDF step 2: IKM = HKDF-Expand(PRK_key, info, 32)
  const hkdfExpandInfo = Buffer.concat([
    Buffer.from('WebPush: info\0'),
    clientPublicKey,
    localPublicKey
  ]);
  const ikm = crypto.hkdfSync('sha256', prkKey, Buffer.alloc(0), hkdfExpandInfo, 32);

  // 5. Generate random 16-byte salt
  const salt = crypto.randomBytes(16);

  // 6. PRK = HKDF-Extract(salt, IKM)
  const prk = crypto.hkdfSync('sha256', ikm, salt, Buffer.alloc(0), 32);

  // 7. CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cek = crypto.hkdfSync('sha256', prk, Buffer.alloc(0), Buffer.from('Content-Encoding: aes128gcm\0'), 16);

  // 8. Nonce = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonce = crypto.hkdfSync('sha256', prk, Buffer.alloc(0), Buffer.from('Content-Encoding: nonce\0'), 12);

  // 9. Format plaintext with padding delimiter (0x02 indicates final record, no padding)
  const paddingDelimiter = Buffer.from([0x02]);
  const plaintext = Buffer.concat([Buffer.from(payloadString, 'utf8'), paddingDelimiter]);

  // 10. Encrypt with AES-128-GCM
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag()
  ]);

  // 11. Format final push body: salt(16) + rs(4) + idlen(1) + publickey(65) + ciphertext
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096, 0);
  const keyLength = Buffer.from([localPublicKey.length]);

  return Buffer.concat([
    salt,
    recordSize,
    keyLength,
    localPublicKey,
    ciphertext
  ]);
}

/**
 * Send Web Push Notification to a subscription endpoint
 */
function sendNotification(subscription, payload, vapidKeys) {
  return new Promise((resolve, reject) => {
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return reject(new Error('Invalid subscription object'));
    }

    try {
      const endpointUrl = new URL(subscription.endpoint);
      const audience = endpointUrl.protocol + '//' + endpointUrl.host;

      // 1. Generate VAPID JWT
      const header = { typ: 'JWT', alg: 'ES256' };
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        aud: audience,
        exp: now + 12 * 3600, // 12 hours expiration
        sub: 'mailto:admin@gsc.edu' // Contact email
      };

      const jwtHeaderBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const jwtPayloadBase64 = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
      const unsignedToken = jwtHeaderBase64 + '.' + jwtPayloadBase64;

      // Uncompressed public key point coordinates x, y from VAPID public key
      const vapidPubKeyBuf = Buffer.from(vapidKeys.publicKey, 'base64url');
      const privateKeyBuf = Buffer.from(vapidKeys.privateKey, 'base64url');

      const privateKeyObj = crypto.createPrivateKey({
        key: {
          kty: 'EC',
          crv: 'P-256',
          x: vapidPubKeyBuf.slice(1, 33).toString('base64url'),
          y: vapidPubKeyBuf.slice(33, 65).toString('base64url'),
          d: privateKeyBuf.toString('base64url')
        },
        format: 'jwk'
      });

      const signer = crypto.createSign('SHA256');
      signer.update(unsignedToken);
      const signature = signer.sign({
        key: privateKeyObj,
        dsaEncoding: 'ieee-p1363' // concatenation of r and s format
      });

      const jwt = unsignedToken + '.' + signature.toString('base64url');

      // 2. Encrypt push payload (JSON payload)
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const encryptedBody = encryptPayload(subscription, payloadString);

      // 3. Configure HTTP options
      const isHttps = endpointUrl.protocol === 'https:';
      const requestLib = isHttps ? https : http;

      const headers = {
        'TTL': '2419200', // Time to live in seconds (4 weeks)
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${jwt}, k=${vapidKeys.publicKey}`
      };

      const req = requestLib.request(subscription.endpoint, {
        method: 'POST',
        headers: headers
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: `Push service rejected notification: ${body}`
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(encryptedBody);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateVapidKeys,
  sendNotification
};
