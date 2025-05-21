import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const BASE = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
//export class ApiService {
//
//  constructor() { }
//}
export class ApiService {
  constructor(private http: HttpClient) {}

  register(username: string, publicKeyPem: string) {
  return this.http.post<{ status: string }>(
    `${BASE}/register`,
    { username, publicKey: publicKeyPem }
  );
  }

  getChallenge(username: string) {
    return this.http.get<{ challenge: string }>(`${BASE}/challenge`, { params: { username } });
  }

  login(username: string, challenge: string, signature: string) {
    return this.http.post<{ status: string }>(`${BASE}/login`, { username, challenge, signature });
  }
}