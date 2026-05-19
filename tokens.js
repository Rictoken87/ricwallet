// tokens.js -- Shibarium Token List for RicWallet
// Top known tokens hardcoded. Users can add any custom token by address.

// -- Native BONE -----------------------------------------------
export const NATIVE_BONE = {
  address:  'NATIVE',
  symbol:   'BONE',
  name:     'Bone ShibaSwap',
  decimals: 18,
  color:    '#f5a623',
  isNative: true,
};

// -- Known Shibarium tokens ------------------------------------
export const KNOWN_TOKENS = [
  NATIVE_BONE,
  {
    address:  '0x12C94d3A30daa09f81Ea6c037004E6e99A4A3dfc',
    symbol:   'RIC',
    name:     'RicToken',
    decimals: 18,
    color:    '#ff4d00',
  },
  {
    address:  '0x495eea66B454342BA1e5f955A65e674c83fa2671',
    symbol:   'SHIB',
    name:     'SHIBA INU',
    decimals: 18,
    color:    '#ffa409',
  },
  {
    // LEASH v1 -- kept for balance display only.
    // A supply exploit in August 2025 inflated supply by ~10%.
    // LEASH v2 launched September 2025 with a fixed 107,000 hard cap.
    // Shibarium users migrate 1:1 via the official shib.io portal (Phase 3).
    // We show v1 balances so users know they hold it and can migrate.
    // The isLegacy flag lets the UI show a warning badge.
    address:  '0x52b7C9D984EA17E9eE31159Ca3FfF3790981B64a',
    symbol:   'LEASH',
    name:     'Doge Killer (v1)',
    decimals: 18,
    color:    '#e8b84b',
    isLegacy: true,
    warning:  'Migrate to LEASH v2 at shib.io',
  },
  {
    address:  '0x2bF32FE0E7C8dF48e6DD50E8FaDD977b08f7B49E',
    symbol:   'TREAT',
    name:     'TREAT',
    decimals: 18,
    color:    '#ff6b9d',
  },
  {
    address:  '0xc76f4c819d820369fb2d7c1531ab3bb18e6fe8d8',
    symbol:   'WBONE',
    name:     'Wrapped BONE',
    decimals: 18,
    color:    '#f5a623',
  },
  {
    address:  '0x553d3D295e0f695B9228246232eDF400ed3560B5',
    symbol:   'USDT',
    name:     'Tether USD',
    decimals: 6,
    color:    '#26a17b',
  },
  {
    address:  '0xb4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    symbol:   'USDC',
    name:     'USD Coin',
    decimals: 6,
    color:    '#2775ca',
  },
];

// -- Helpers ---------------------------------------------------
export function getTokenColor(symbol) {
  const token = KNOWN_TOKENS.find(t => t.symbol === symbol);
  return token?.color || '#4a4d60';
}

export function getTokenInitials(symbol) {
  return (symbol || '???').slice(0, 3).toUpperCase();
}

// -- Custom tokens (user-added by contract address) ------------
export function getCustomTokens() {
  try {
    return JSON.parse(localStorage.getItem('ricwallet_custom_tokens') || '[]');
  } catch {
    return [];
  }
}

export function saveCustomToken(token) {
  const custom = getCustomTokens();
  const alreadyExists = custom.some(
    t => t.address.toLowerCase() === token.address.toLowerCase()
  );
  if (!alreadyExists) {
    custom.push(token);
    localStorage.setItem('ricwallet_custom_tokens', JSON.stringify(custom));
  }
}

export function removeCustomToken(address) {
  const custom = getCustomTokens().filter(
    t => t.address.toLowerCase() !== address.toLowerCase()
  );
  localStorage.setItem('ricwallet_custom_tokens', JSON.stringify(custom));
}

export function getAllTokens() {
  return [...KNOWN_TOKENS, ...getCustomTokens()];
}

// -- Fetch token info from chain (for custom token lookup) -----
// Called when user pastes a contract address.
// Returns { address, symbol, name, decimals, color } or null.
export async function fetchTokenInfo(address) {
  const RPC_URL = 'https://rpc.shibarium.shib.io';

  async function call(to, data) {
    const res = await fetch(RPC_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: Date.now(),
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
      }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  }

  try {
    // Fetch symbol() and decimals() in parallel
    const [symHex, decHex] = await Promise.all([
      call(address, '0x95d89b41'), // symbol()
      call(address, '0x313ce567'), // decimals()
    ]);

    const symbol   = _hexToString(symHex);
    const decimals = parseInt(decHex, 16);

    if (!symbol || isNaN(decimals)) return null;

    return {
      address,
      symbol,
      name:     symbol,
      decimals,
      color:    '#4a4d60',
      isCustom: true,
    };
  } catch {
    return null;
  }
}

// -- ABI string decoder (for fetchTokenInfo) -------------------
function _hexToString(hex) {
  if (!hex || hex === '0x') return '';
  const stripped = hex.slice(2);
  // ABI encoded string: 32 bytes offset + 32 bytes length + content
  if (stripped.length < 128) {
    // Short return -- some tokens return raw bytes32 instead of string ABI
    let str = '';
    for (let i = 0; i < stripped.length; i += 2) {
      const code = parseInt(stripped.slice(i, i + 2), 16);
      if (code === 0) break;
      if (code > 31 && code < 127) str += String.fromCharCode(code);
    }
    return str.trim();
  }
  const lenHex  = stripped.slice(64, 128);
  const len     = parseInt(lenHex, 16);
  const content = stripped.slice(128, 128 + len * 2);
  let str = '';
  for (let i = 0; i < content.length; i += 2) {
    const code = parseInt(content.slice(i, i + 2), 16);
    if (code > 0 && code < 128) str += String.fromCharCode(code);
  }
  return str.trim();
}
