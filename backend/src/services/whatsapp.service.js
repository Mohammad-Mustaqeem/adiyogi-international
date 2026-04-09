/**
 * WhatsApp Service — zero top-level third-party imports.
 * Only Node built-ins at the top so this file can NEVER crash server.js on import.
 */
import { mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR  = join(__dirname, '..', '..', 'wa_auth');

let sock           = null;
let isReady        = false;
let currentQR      = null;
let initError      = null;
let retryCount     = 0;
let isInitializing = false;
let initTimeout    = null;
const MAX_RETRY = 5;
const INIT_TIMEOUT_MS = 60_000; // 60s — give up if no connection event

export const getWAStatus  = () => ({ isReady, hasQR: !!currentQR, error: initError, retryCount, isInitializing });
export const getQRBase64  = () => currentQR;

function clearInitTimeout() {
  if (initTimeout) { clearTimeout(initTimeout); initTimeout = null; }
}

function cleanupSocket() {
  if (sock) {
    try { sock.ev.removeAllListeners('connection.update'); } catch {}
    try { sock.ev.removeAllListeners('creds.update'); } catch {}
    try { sock.end(undefined); } catch {}
    sock = null;
  }
}

export function resetSession() {
  clearInitTimeout();
  cleanupSocket();
  isReady = false;
  currentQR = null;
  initError = null;
  retryCount = 0;
  isInitializing = false;
  try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
}

export async function initWhatsApp() {
  if (isInitializing || isReady) return;
  isInitializing = true;
  initError = null;
  currentQR = null;

  // Safety timeout — if no connection event fires, don't stay stuck forever
  clearInitTimeout();
  initTimeout = setTimeout(() => {
    if (!isReady && isInitializing) {
      console.warn('⚠️  WhatsApp init timed out after 60s');
      isInitializing = false;
      initError = 'Connection timed out — click Retry or Reset Session.';
    }
  }, INIT_TIMEOUT_MS);

  // ── 1. Load qrcode ────────────────────────────────────────────────────────
  let qrcode;
  try { qrcode = (await import('qrcode')).default; }
  catch { qrcode = null; }

  // ── 2. Load baileys ───────────────────────────────────────────────────────
  let baileys;
  try { baileys = await import('@whiskeysockets/baileys'); }
  catch (err) {
    initError = 'WhatsApp not set up yet — run: npm install (in backend folder)';
    console.warn('⚠️  WhatsApp disabled (baileys missing):', err.message);
    isInitializing = false;
    clearInitTimeout();
    return;
  }

  const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = baileys;

  // ── 3. Load pino (silent logger) ──────────────────────────────────────────
  let logger;
  try {
    logger = (await import('pino')).default({ level: 'silent' });
  } catch {
    // stub logger so baileys doesn't crash without pino
    const noop = () => {};
    logger = { level: 'silent', info: noop, warn: noop, error: noop, debug: noop, trace: noop, fatal: noop, child() { return this; } };
  }

  // ── 4. Init socket ────────────────────────────────────────────────────────
  try {
    // Clean up any previous socket to prevent listener leaks
    cleanupSocket();

    mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version;
    try { ({ version } = await fetchLatestBaileysVersion()); } catch {}

    const socketOpts = {
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      logger,
      printQRInTerminal: false,
      browser: ['Adiyogi Admin', 'Chrome', '110.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
    };
    if (version) socketOpts.version = version;

    sock = makeWASocket(socketOpts);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr && qrcode) {
        try { currentQR = await qrcode.toDataURL(qr); } catch {}
        isReady = false; initError = null;
        // Reset timeout — QR appeared, user needs time to scan
        clearInitTimeout();
        initTimeout = setTimeout(() => {
          if (!isReady && isInitializing) {
            console.warn('⚠️  WhatsApp QR scan timed out');
            isInitializing = false;
            initError = 'QR code expired — click Retry to generate a new one.';
            currentQR = null;
          }
        }, 120_000); // 2 min to scan QR
        console.log('📱 WhatsApp QR ready — scan in Admin Panel → WhatsApp Setup');
      }

      if (connection === 'open') {
        console.log('🟢 WhatsApp connected!');
        isReady = true; currentQR = null; initError = null; retryCount = 0; isInitializing = false;
        clearInitTimeout();
      }

      if (connection === 'close') {
        isReady = false; isInitializing = false;
        clearInitTimeout();

        let reason = 500;
        try {
          const { Boom } = await import('@hapi/boom');
          reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        } catch {}
        console.warn(`⚠️  WhatsApp disconnected (reason: ${reason}, retry: ${retryCount}/${MAX_RETRY})`);

        if (reason === DisconnectReason.loggedOut) {
          console.warn('⚠️  WhatsApp logged out — clearing session for re-scan');
          initError = 'Logged out — click Retry to rescan QR code.';
          currentQR = null; retryCount = 0;
          try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
          setTimeout(() => initWhatsApp(), 2000);
        } else if (retryCount < MAX_RETRY) {
          retryCount++;
          const delay = 3000 * retryCount;
          console.log(`🔄 WhatsApp reconnecting in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRY})...`);
          setTimeout(() => initWhatsApp(), delay);
        } else {
          initError = `Disconnected after ${MAX_RETRY} retries — click Retry to try again.`;
          retryCount = 0; // Reset so manual retry works
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    initError = err.message;
    isInitializing = false;
    clearInitTimeout();
    console.error('⚠️  WhatsApp init error (non-fatal):', err.message);
  }
}

const toJID = (phone) => {
  const d = String(phone).replace(/\D/g, '');
  return (d.length === 10 ? `91${d}` : d) + '@s.whatsapp.net';
};

export async function sendWhatsAppMessage(phone, message) {
  if (!isReady || !sock) {
    console.warn(`⚠️  WA send skipped — isReady:${isReady} sock:${!!sock}`);
    return false;
  }
  const jid = toJID(phone);
  console.log(`📤 WA sending to JID: ${jid}`);
  try {
    await sock.sendMessage(jid, { text: message });
    console.log(`✅ WA sent OK to: ${jid}`);
    return true;
  } catch (err) {
    console.error(`❌ WA send error to ${jid}:`, err.message);
    return false;
  }
}

export async function sendWhatsAppDocumentBuffer(phone, buffer, filename, caption) {
  if (!isReady || !sock) return false;
  try {
    await sock.sendMessage(toJID(phone), {
      document: buffer, mimetype: 'application/pdf',
      fileName: filename, caption: caption || filename,
    });
    return true;
  } catch (err) { console.error('WA doc error:', err.message); return false; }
}
