const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
//const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = new Map();         // username -> publicKey (JWK or PEM)
const challenges = new Map();    // username -> challenge (base64)

// Routes will go here...

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));



/**
 * Convert a raw ECDSA signature (r||s) to DER format.
 * @param {Buffer} rawSig 64‑byte Buffer: r (32 bytes) followed by s (32 bytes)
 * @returns {Buffer} DER‑encoded signature
 */
function rawToDer(rawSig) {
  // Split raw into r and s
  const len = rawSig.length / 2;
  let r = rawSig.slice(0, len);
  let s = rawSig.slice(len);

  // Strip leading zeros, ensure high bit not set (prepend 0x00 if it is)
  const strip = buf => {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    buf = buf.slice(i);
    if (buf[0] & 0x80) buf = Buffer.concat([Buffer.from([0x00]), buf]);
    return buf;
  };
  r = strip(r);
  s = strip(s);

  // Build DER sequence: 0x30 <total_len> 0x02 <r_len> <r> 0x02 <s_len> <s>
  const rSeq = Buffer.concat([Buffer.from([0x02, r.length]), r]);
  const sSeq = Buffer.concat([Buffer.from([0x02, s.length]), s]);
  const seq = Buffer.concat([rSeq, sSeq]);
  return Buffer.concat([Buffer.from([0x30, seq.length]), seq]);
}



app.post('/register', (req, res) => {
  // Log the entire request body immediately
  console.log('>>> [DEBUG] /register called with body:', req.body);

  const { username, publicKey } = req.body;
  console.log('>>> [DEBUG] Parsed username:', username);
  console.log('>>> [DEBUG] Parsed publicKey:', publicKey);

  if (!username || !publicKey) {
    return res.status(400).json({ error: 'Missing username or publicKey' });
  }

  users.set(username, publicKey);
  return res.json({ status: 'Registration successful' });
});

app.get('/challenge', (req, res) => {
    const { username } = req.query;
    if (!users.has(username)) {
        return res.status(404).send('User not found');
    }

    const challenge = crypto.randomBytes(32).toString('base64');
    challenges.set(username, challenge);
    res.send({ challenge });
});

app.post('/login', async (req, res) => {
  const { username, challenge, signature } = req.body;
  const publicKeyPem = users.get(username);
  const expectedChallenge = challenges.get(username);

  // 2. Log what’s stored on the server
  console.log('>>> [DEBUG] Stored publicKeyPem:', publicKeyPem);
  console.log('>>> [DEBUG] Expected challenge:', expectedChallenge);

  
  if (!publicKeyPem || !expectedChallenge || expectedChallenge !== challenge) {
    console.log('Login error: user or challenge mismatch');
    return res.status(401).json({ error: 'Invalid user or challenge' });
  }

  // Decode buffers
  const sigBuf  = Buffer.from(signature, 'base64');
  const chalBuf = Buffer.from(challenge, 'base64');

  // 4.1 Convert raw signature to DER
  const derSig = rawToDer(sigBuf);

  // 5. Log decoded buffer lengths
  console.log('>>> [DEBUG] challenge buffer length:', chalBuf.length);
  console.log('>>> [DEBUG] signature buffer length:', sigBuf.length);


  // Verify signature
  const verify = crypto.createVerify('SHA256');
  verify.update(chalBuf);
  verify.end();
  //const isValid = verify.verify(publicKeyPem, sigBuf);

  const isValid = verify.verify(publicKeyPem, derSig);

  // 7. Log result
  console.log('>>> [DEBUG] Signature valid?', isValid);

  if (!isValid) {
    return res.status(401).json({ error: 'Signature invalid' });
  }

  // On success, consume the challenge and respond
  challenges.delete(username);
  return res.json({ status: 'Login successful' });

 });


//part 2

const crypto = require('crypto');

/**
 * Verify an ECDSA signature over a Base64 challenge.
 *
 * @param {object|string} publicKeyJwk  – The public key in JWK format, or a PEM string
 * @param {string} challengeB64        – The original challenge, Base64‑encoded
 * @param {string} signatureB64        – The signature from the client, Base64‑encoded
 * @returns {boolean}
 */
function verifySignature(publicKeyJwk, challengeB64, signatureB64) {
  // 1) Convert JWK → KeyObject (or if you passed PEM, crypto will auto-detect)
  const keyObject = crypto.createPublicKey({
    key: publicKeyJwk,
    format: typeof publicKeyJwk === 'string' ? 'pem' : 'jwk'
  });

  // 2) Decode base64 inputs
  const challenge = Buffer.from(challengeB64, 'base64');
  const signature = Buffer.from(signatureB64, 'base64');

  // 3) Create a verifier for SHA-256 + ECDSA
  const verifier = crypto.createVerify('SHA256');
  verifier.update(challenge);
  verifier.end();

  // 4) Return true/false
  return verifier.verify(keyObject, signature);
}

