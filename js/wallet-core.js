// wallet-core.js -- RicWallet Core Logic
// Handles: wallet connection, EIP-712 signing, relayer submission, balances

import { t, getLang } from './i18n.js';

// -- Config ----------------------------------------------------
export const CHAIN_ID       = 109;
export const CHAIN_HEX      = '0x6d';
export const RELAYER_URL    = 'https://api.ricswap.com';
export const EXPLORER_URL   = 'https://shibariumscan.io';

export const FORWARDER_ADDR = '0xFC07CB6a642d66A7a10eee53871C8F47F9787346';
export const RIC_ADDR       = '0x12C94d3A30daa09f81Ea6c037004E6e99A4A3dfc';
export const WBONE_ADDR     = '0xc76f4c819d820369fb2d7c1531ab3bb18e6fe8d8';

const SHIBARIUM_PARAMS = {
  chainId: CHAIN_HEX,
  chainName: 'Shibarium',
  nativeCurrency: { name: 'BONE', symbol: 'BONE', decimals: 18 },
  rpcUrls: ['https://rpc.shibarium.shib.io'],
  blockExplorerUrls: ['https://shibariumscan.io'],
};

// -- State -----------------------------------------------------
let _address         = null;
let _onAccountChange = null;

// -- Connect ---------------------------------------------------
export async function connectMetaMask() {
  if (!window.ethereum) {
    // Fix: plain string -- t('metamask_not_installed') key missing from i18n.js
    throw new Error('MetaMask is not installed. Please install it at metamask.io');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  _address = accounts[0];
  await ensureShibarium();
  _setupListeners();
  _saveSession('metamask', _address);
  return _address;
}

export async function connectWalletConnect() {
  throw new Error('WalletConnect v2 coming soon. Use MetaMask for now.');
}

export async function connectCoinbase() {
  const provider = window.coinbaseWalletExtension || window.ethereum;
  if (!provider) throw new Error('Coinbase Wallet not found. Please install it.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  _address = accounts[0];
  await ensureShibarium();
  _saveSession('coinbase', _address);
  return _address;
}

export function getAddress()  { return _address; }
export function isConnected() { return !!_address; }

export function disconnect() {
  _address = null;
  localStorage.removeItem('ricwallet_session');
  window.location.reload();
}

export async function restoreSession() {
  try {
    const saved = JSON.parse(localStorage.getItem('ricwallet_session') || 'null');
    if (!saved?.address) return null;
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts[0]?.toLowerCase() === saved.address.toLowerCase()) {
        _address = accounts[0];
        _setupListeners();
        return _address;
      }
    }
  } catch (e) {
    console.warn('[RicWallet] Session restore failed:', e.message);
  }
  localStorage.removeItem('ricwallet_session');
  return null;
}

function _saveSession(type, address) {
  // timestamp saved for future session expiry logic
  localStorage.setItem('ricwallet_session', JSON.stringify({
    type, address, timestamp: Date.now()
  }));
}

async function ensureShibarium() {
  if (!window.ethereum) return;
  try {
    const current = await window.ethereum.request({ method: 'eth_chainId' });
    if (current !== CHAIN_HEX) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_HEX }],
      });
    }
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [SHIBARIUM_PARAMS],
      });
    } else throw err;
  }
}

function _setupListeners() {
  if (!window.ethereum) return;
  window.ethereum.on('accountsChanged', (accounts) => {
    _address = accounts[0] || null;
    if (_onAccountChange) _onAccountChange(_address);
    if (!_address) disconnect();
  });
  window.ethereum.on('chainChanged', () => window.location.reload());
}

export function onAccountChange(fn) { _onAccountChange = fn; }

// -- Balances --------------------------------------------------
export async function getNativeBalance(address) {
  try {
    const hex = await rpc('eth_getBalance', [address, 'latest']);
    return BigInt(hex);
  } catch {
    return 0n;
  }
}

export async function getTokenBalance(tokenAddr, walletAddr) {
  try {
    const data   = encodeCall('balanceOf(address)', [walletAddr]);
    const result = await rpc('eth_call', [{ to: tokenAddr, data }, 'latest']);
    return BigInt(result || '0x0');
  } catch {
    return 0n;
  }
}

export async function getAllowance(tokenAddr, owner, spender) {
  try {
    const data   = encodeCall('allowance(address,address)', [owner, spender]);
    const result = await rpc('eth_call', [{ to: tokenAddr, data }, 'latest']);
    return BigInt(result || '0x0');
  } catch {
    return 0n;
  }
}

// -- Relayer helpers -------------------------------------------
export async function getNonce(address) {
  const res  = await fetch(`${RELAYER_URL}/nonce/${address}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch nonce');
  return data.nonce;
}

export async function estimateRIC(gasAmount) {
  try {
    const res  = await fetch(`${RELAYER_URL}/estimate/${gasAmount}`);
    const data = await res.json();
    return data.ricFormatted || '0';
  } catch {
    return '0';
  }
}

// -- EIP-712 signing -------------------------------------------
export async function signForwardRequest(request) {
  if (!window.ethereum || !_address) throw new Error('Wallet not connected');

  const domain = {
    name:              'RicWallet',
    version:           '1',
    chainId:           CHAIN_ID,
    verifyingContract: FORWARDER_ADDR,
  };

  // EIP712Domain must be included -- required by older MetaMask versions
  const types = {
    EIP712Domain: [
      { name: 'name',              type: 'string'  },
      { name: 'version',           type: 'string'  },
      { name: 'chainId',           type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    ForwardRequest: [
      { name: 'from',     type: 'address' },
      { name: 'to',       type: 'address' },
      { name: 'value',    type: 'uint256' },
      { name: 'gas',      type: 'uint256' },
      { name: 'nonce',    type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'data',     type: 'bytes'   },
    ],
  };

  const signature = await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [_address, JSON.stringify({
      domain,
      types,
      primaryType: 'ForwardRequest',
      message:     request,
    })],
  });

  return signature;
}

// -- Build and relay -------------------------------------------
export async function buildAndRelay({ to, data, value = '0', gas = 300000 }) {
  if (!_address) throw new Error('Wallet not connected');

  const nonce    = await getNonce(_address);
  const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

  const request = {
    from:     _address,
    to,
    value:    value.toString(),
    gas:      gas.toString(),
    nonce:    nonce.toString(),
    deadline: deadline.toString(),
    data,
  };

  const signature = await signForwardRequest(request);

  const res = await fetch(`${RELAYER_URL}/relay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ request, signature }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Relay failed');
  return result;
}

// -- Token helpers ---------------------------------------------
export async function sendToken(tokenAddr, toAddr, amount) {
  const data = encodeCall('transfer(address,uint256)', [toAddr, amount]);
  return buildAndRelay({ to: tokenAddr, data, gas: 80000 });
}

export async function sendNativeToken(toAddr, amount) {
  return buildAndRelay({ to: toAddr, data: '0x', value: amount, gas: 60000 });
}

// -- Utilities -------------------------------------------------
export function formatAmount(bn, decimals = 18, places = 4) {
  if (!bn || bn === 0n) return '0';
  const str     = bn.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, -decimals) || '0';
  let fracPart  = str.slice(-decimals).substring(0, places);
  fracPart      = fracPart.replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export function parseAmount(str, decimals = 18) {
  // Converts '1.5' to BigInt(1500000000000000000n) for 18 decimals
  if (!str || str === '0') return 0n;
  const [intPart, fracPart = ''] = str.split('.');
  const fracPadded = fracPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(intPart + fracPadded);
}

export function shortAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

export function explorerTx(hash) {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddr(addr) {
  return `${EXPLORER_URL}/address/${addr}`;
}

// -- Minimal RPC -----------------------------------------------
async function rpc(method, params = []) {
  const res = await fetch('https://rpc.shibarium.shib.io', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      jsonrpc: '2.0',
      id:      Date.now(), // unique per call -- supports concurrent requests
      method,
      params,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// -- ABI encoding (no ethers dependency) ----------------------
const SELECTORS = {
  'balanceOf(address)':           '0x70a08231',
  'allowance(address,address)':   '0xdd62ed3e',
  'transfer(address,uint256)':    '0xa9059cbb',
  'approve(address,uint256)':     '0x095ea7b3',
  'decimals()':                   '0x313ce567',
  'symbol()':                     '0x95d89b41',
  'name()':                       '0x06fdde03',
};

function encodeCall(sig, params) {
  const selector = SELECTORS[sig];
  if (!selector) throw new Error(`Unknown ABI sig: ${sig}`);
  const encoded = params.map(p => {
    if (typeof p === 'string' && p.startsWith('0x')) {
      return p.slice(2).toLowerCase().padStart(64, '0');
    }
    return BigInt(p).toString(16).padStart(64, '0');
  }).join('');
  return selector + encoded;
}

// -- Toast notifications ---------------------------------------
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
