# RicWallet

**Live:** https://plain-snow-c523.ceo-585.workers.dev/wallet/index.html

**Gasless Wallet for Shibarium** — Send, Swap, and Learn without paying BONE gas fees.

RicWallet is a beautiful, mobile-first web wallet that uses a relayer system (RicGas + ForwarderContract) so users can transact for free by paying a small RIC fee instead of BONE gas.

Built by a certified finance and IPO professional for the 700 million people of Southeast Asia.

---

## Features

- **Zero Gas Fees** — Pay with RIC instead of BONE
- **Multi-language** — English, Khmer, Vietnamese, Chinese Simplified
- **Learn & Earn** — Complete finance lessons to earn RIC rewards
- **Gasless Send** — Send any Shibarium token without holding BONE
- **Gasless Swap** — Swap tokens via RicSwap with zero gas
- **Transaction History** — On-chain history including Learn & Earn rewards
- **Custom Token Support** — Add any Shibarium token by contract address
- **Clean Dark UI** — Obsidian, gold, and magma design optimized for mobile
- **3 Wallet Connectors** — MetaMask, WalletConnect, Coinbase Wallet

---

## How Gasless Transactions Work

```
User signs a message in MetaMask (free -- no BONE needed)
         |
         v
RicWallet sends signed request to api.ricswap.com
         |
         v
Relayer submits the transaction and pays BONE gas
         |
         v
User is charged a small RIC fee via RicGas
         |
         v
Transaction confirmed on Shibarium
```

No BONE required. No gas fees. Just sign and done.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Signing | EIP-712 typed data signatures |
| Blockchain | Direct JSON-RPC calls (no ethers.js dependency) |
| Relayer | Custom Node.js server at api.ricswap.com |
| Deployment | Cloudflare Pages |
| Languages | English, Khmer, Vietnamese, Chinese Simplified |

---

## File Structure

```
ricwallet/
  css/
    wallet.css          -- shared dark design system
  js/
    wallet-core.js      -- connect, sign, relay, balances
    tokens.js           -- Shibarium token list + custom tokens
    i18n.js             -- 4-language translations
  wallet/
    index.html          -- dashboard (balances, send, receive)
    send.html           -- gasless token send
    swap.html           -- gasless token swap (coming soon)
    learn.html          -- Learn & Earn with 5 finance lessons
    history.html        -- transaction history
```

---

## Quick Start (Local)

```bash
# Clone the repo
git clone https://github.com/Rictoken87/ricwallet.git
cd ricwallet

# No build step needed -- open directly in browser
open wallet/index.html
```

For local development with ES Modules you need a local server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Then open:
# http://localhost:8080/wallet/index.html
```

---

## Deployed Contracts (Shibarium Mainnet -- Chain ID 109)

| Contract | Address |
|----------|---------|
| ForwarderContract | 0xFC07CB6a642d66A7a10eee53871C8F47F9787346 |
| NonceRegistry | 0x7fA7DB58939cc4d107511ac4B07DC588dcdf0ce3 |
| RicGas | 0x6B908238AA7FcF2B0815E9CBfBDDBF97AE668285 |
| RicPaymaster | 0xeBb6F86CBc6841D074E72d317b8C5ad922ec35c4 |
| RIC Token | 0x12C94d3A30daa09f81Ea6c037004E6e99A4A3dfc |
| RicSwapRouter | 0x652875c0F607CB392C0F9E5FB957A7055c2deD2e |
| RicSwapFactory | 0xD8fFEECfDE1698a70A26a094afBE917bA58E2F70 |
| WBONE | 0xc76f4c819d820369fb2d7c1531ab3bb18e6fe8d8 |

---

## Relayer Infrastructure

| Component | Details |
|-----------|---------|
| Server | Hostinger VPS, Singapore (72.62.248.96) |
| API | https://api.ricswap.com |
| Health check | https://api.ricswap.com/health |
| Process manager | PM2 with auto-restart |
| SSL | Let's Encrypt (auto-renew) |
| Relayer wallets | 3 wallets, 50 BONE each |

---

## Supported Tokens

| Token | Symbol | Decimals |
|-------|--------|----------|
| Bone ShibaSwap | BONE | 18 |
| RicToken | RIC | 18 |
| Shiba Inu | SHIB | 18 |
| Doge Killer | LEASH | 18 |
| TREAT | TREAT | 18 |
| Wrapped BONE | WBONE | 18 |
| Tether USD | USDT | 6 |
| USD Coin | USDC | 6 |

Plus any custom token by contract address.

---

## Learn & Earn Lessons

5 finance lessons taught by a certified finance and IPO professional:

1. What is a gasless transaction?
2. How to swap tokens safely on RicSwap
3. How to spot a rug pull
4. What is an IPO vs a token launch
5. How to read tokenomics

Complete each lesson and quiz to earn 10 RIC. All 5 lessons = 50 RIC + on-chain certificate.

---

## Roadmap

| Phase | Timeline | Features |
|-------|----------|---------|
| Phase 1 | Now | Wallet, Send, Learn & Earn, History |
| Phase 2 | Month 2-3 | Swap, RicEvents (NFT ticketing) |
| Phase 3 | Month 3 | RIC Proof-of-Loyalty staking |
| Phase 4 | Month 4 | RicSwap Launchpad |
| Phase 5 | Month 5 | B2B gasless API |
| Phase 6 | Month 6 | RicID + Governance |

---

## Network

- **Network:** Shibarium
- **Chain ID:** 109
- **RPC:** https://rpc.shibarium.shib.io
- **Explorer:** https://shibariumscan.io

---

## License

MIT License -- open source, free to use and build on.

---

*RicWallet -- The first working gasless wallet built for Southeast Asia.*
