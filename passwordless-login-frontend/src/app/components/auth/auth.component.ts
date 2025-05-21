import { Component } from '@angular/core';
import { CryptoService } from '../../services/crypto.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  username = '';
  status = '';

  constructor(
    private cryptoSvc: CryptoService,
    private api: ApiService
  ) {}



  async register() {
    try {
      // generate keypair & export PEM
      const publicKeyPem = await this.cryptoSvc.registerUser(this.username);

      // send PEM to backend
      const res = await this.api
        .register(this.username, publicKeyPem)
        .toPromise();

      this.status = res?.status ?? 'No response';
    } catch (e) {
      if (e instanceof Error) {
        this.status = 'Registration failed: ' + e.message;
      } else {
        this.status = 'Registration failed: unknown error';
      }
    }
  }

  async login() {
    try {
      const challengeRes = await this.api.getChallenge(this.username).toPromise();
      const challenge = challengeRes?.challenge;
      if (!challenge) throw new Error('No challenge received');
      const signature = await this.cryptoSvc.signChallenge(challenge);
      const res = await this.api.login(this.username, challenge, signature).toPromise();
      this.status = res?.status ?? 'No response';
    } catch (e) {
      console.error('Login error:', e); 
      if (e instanceof Error) {
        this.status = 'Login failed: ' + e.message;
      } else {
        this.status = 'Login failed: unknown error';
      }
    }
  }
}
