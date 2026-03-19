/**
 * WhatsApp Service — zero top-level third-party imports.
 * Only Node built-ins at the top so this file can NEVER crash server.js on import.
 */
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR  = join(__dirname, '..', 'wa_auth');

let sock       = null;
let isReady    = false;
let currentQR  = null;
let initError  = null;
let retryCount = 0;
const MAX_RETRY = 5;

export const getWAStatus  = () => ({ isReady, hasQR: !!currentQR, error: initError, retryCount });
export const getQRBase64  = () => currentQR;

export async function initWhatsApp() {
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
    mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version = [2, 3000, 1015901307];
    try { ({ version } = await fetchLatestBaileysVersion()); } catch {}

    sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      logger,
      printQRInTerminal: false,
      browser: ['Adiyogi Admin', 'Chrome', '110.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr && qrcode) {
        try { currentQR = await qrcode.toDataURL(qr); } catch {}
        isReady = false; initError = null;
        console.log('📱 WhatsApp QR ready — scan in Admin Panel → WhatsApp Setup');
      }

      if (connection === 'open') {
        console.log('🟢 WhatsApp connected!');
        isReady = true; currentQR = null; initError = null; retryCount = 0;
      }

      if (connection === 'close') {
        isReady = false;
        let reason = 500;
        try { const { Boom } = await import('@hapi/boom'); reason = new Boom(lastDisconnect?.error)?.output?.statusCode; } catch {}

        if (reason !== DisconnectReason.loggedOut && retryCount < MAX_RETRY) {
          retryCount++;
          setTimeout(() => initWhatsApp(), 3000 * retryCount);
        } else if (reason === DisconnectReason.loggedOut) {
          initError = 'Logged out — rescan QR code in Admin Panel';
          currentQR = null; retryCount = 0;
          try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
          setTimeout(() => initWhatsApp(), 2000);
        } else {
          initError = `Disconnected after ${MAX_RETRY} retries — restart server.`;
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    initError = err.message;
    console.error('⚠️  WhatsApp init error (non-fatal):', err.message);
  }
}

const toJID = (phone) => {
  const d = String(phone).replace(/\D/g, '');
  return (d.length === 10 ? `91${d}` : d) + '@s.whatsapp.net';
};

export async function sendWhatsAppMessage(phone, message) {
  if (!isReady || !sock) return false;
  try { await sock.sendMessage(toJID(phone), { text: message }); return true; }
  catch (err) { console.error('WA send error:', err.message); return false; }
}

export async function sendWhatsAppDocument(phone, filePath, filename, caption) {
  if (!isReady || !sock || !existsSync(filePath)) return false;
  try {
    await sock.sendMessage(toJID(phone), {
      document: readFileSync(filePath), mimetype: 'application/pdf',
      fileName: filename, caption: caption || filename,
    });
    return true;
  } catch (err) { console.error('WA doc error:', err.message); return false; }
}
