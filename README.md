# Passwordless-Login-Simulator

A passwordless authentication system using ECDSA and a challenge-response mechanism, inspired by WebAuthn. Built with an Angular frontend and a Node.js/Express backend to demonstrate secure, password-free login using public-key cryptography.

##Features

- Passwordless Registration: Client-side ECDSA key pair generation in the browser.
- Challenge-Response Login: Secure one-time challenges with ECDSA signature verification.
- Replay Protection: Each random nonce is single-use.
- In-Memory Storage: Simple Map storage for users and challenges (demo purpose).

##Architecture

+-----------+          +---------------+          +-----------+
| Angular   |  HTTP    |  Express API  |  Crypto  | Node.js   |
| Frontend  |<-------->|  Backend      |<-------->| Crypto    |
+-----------+          +---------------+          +-----------+
     |                        |                         |
     | generateKeyPair()      |                         |
     | exportPublicKeyPem()   |                         |
     |----------------------->| /register               |
     |                        | store publicKey         |
     |                        |                         |
     |   GET /challenge       |                         |
     |<-----------------------|                         |
     |   signChallenge()      |                         |
     |   POST /login          |                         |
     |----------------------->| /login                  |
     |                        | verify signature + nonce|
     |                        |                         |
     +                        +                         +

##Tech Stack

- Frontend: Angular 17+, TypeScript, Web Crypto API
- Backend: Node.js, Express, built-in Crypto module
- Format: ECDSA P-256 (secp256r1), SHA-256

##Prerequisites

- Node.js v18+
- npm v8+
- Angular CLI v17+

##Installation & Setup

#Backend
  1. Clone repository:
     ```bash
    git clone https://github.com/your-username/passwordless-login-simulator.git
    cd passwordless-login-simulator/backend
    ```
  3. Install dependencies:
     ```bash
    npm install
    ```
  5. Start server:
     ```bash
    node index.js
    ```
   The backend runs on http://localhost:3000.

#Frontend
  1. Open a new terminal and navigate to the frontend folder:
     ```bash
    cd ../frontend
    ```
  3. Install dependencies:
     ```bash
    npm install
    ```
  5. Serve the app:
     ```bash
    ng serve
    ```
   The frontend runs on http://localhost:4200.

##Usage

  1. Register a new user:
     - Open http://localhost:4200
     - Enter a username and click Register
     - A key pair is generated, public key is stored server-side "check the terminal"
     
  2. Login:
     - Enter the same username and click Login
     - A challenge is retrieved, signed, and verified "check the terminal"
     - On success, you'll see Login successful
