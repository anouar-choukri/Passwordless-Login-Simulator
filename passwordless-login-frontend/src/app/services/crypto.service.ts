import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
//export class CryptoService {
//
//  constructor() { }
//}

export class CryptoService {
  private keyPair: CryptoKeyPair | null = null;

  /** Generate an ECDSA P-256 key pair and keep it in memory */
  async generateKeyPair(): Promise<void> {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,                  // extractable
      ['sign', 'verify']
    );
  }

  /** Export public key to JWK so we can send it to the server */
  async exportPublicKeyJwk(): Promise<JsonWebKey> {
    if (!this.keyPair) throw new Error('Key pair not generated');
    return await window.crypto.subtle.exportKey(
      'jwk',
      this.keyPair.publicKey
    );
  }

  /** Sign a Base64-encoded challenge string; returns Base64 signature */
  async signChallenge(challengeB64: string): Promise<string> {
    if (!this.keyPair) throw new Error('Key pair not generated');
    // Decode Base64 into Uint8Array
    const challengeBytes = Uint8Array.from(atob(challengeB64), c => c.charCodeAt(0));
    const signature = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: 'SHA-256'
      },
      this.keyPair.privateKey,
      challengeBytes
    );
    // Convert ArrayBuffer → Base64
    //const sigBytes = new Uint8Array(signature);
    //let str = '';
    //sigBytes.forEach(b => str += String.fromCharCode(b));
    //return btoa(str);
    return this.arrayBufferToBase64(signature);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
  }
  /** Export the public key as PEM (SPKI) */
  async exportPublicKeyPem(): Promise<string> {
    if (!this.keyPair) throw new Error('No key pair generated');
    // 1) Export in SPKI format (binary)
    const spki = await window.crypto.subtle.exportKey(
      'spki',
      this.keyPair.publicKey
    );
    // 2) Convert to Base64
    const b64 = this.arrayBufferToBase64(spki);
    // 3) Break into 64‑char lines and wrap in PEM header/footer
    const lines = b64.match(/.{1,64}/g)!.join('\n');
    return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
  }

  /** Update register to use PEM instead of JWK */
  async registerUser(username: string): Promise<string> {
    // generate keys if not yet done
    if (!this.keyPair) {
      await this.generateKeyPair();
    }
    const pem = await this.exportPublicKeyPem();
    return pem;
  }

}