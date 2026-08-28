import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { google } from 'googleapis';

function tryLoadEnvFiles() {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const content = readFileSync(file, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          let val = trimmed.slice(eqIndex + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

tryLoadEnvFiles();

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const CALLBACK_PATH = '/oauth2/callback';
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

export function generateOAuthState() {
  return randomBytes(32).toString('base64url');
}

function requiredEnvironment(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`กรุณาตั้งค่า ${name} ใน .env.local ก่อนรันคำสั่งนี้`);
  return value;
}

export async function startLoopbackServer({ expectedState, timeoutMs = CALLBACK_TIMEOUT_MS }) {
  let resolveCode;
  let rejectCode;
  let settled = false;
  let timeout;
  const codePromise = new Promise((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const settle = (callback, value) => {
    if (settled) return;
    settled = true;
    if (timeout) clearTimeout(timeout);
    callback(value);
  };

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method !== 'GET' || url.pathname !== CALLBACK_PATH) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    if (url.searchParams.get('state') !== expectedState) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('OAuth state ไม่ถูกต้อง ปิดหน้านี้แล้วลองใหม่');
      settle(rejectCode, new Error('OAuth state ไม่ถูกต้อง'));
      return;
    }

    const providerError = url.searchParams.get('error');
    const code = url.searchParams.get('code');
    if (providerError || !code) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('ไม่ได้รับ Authorization Code ปิดหน้านี้แล้วลองใหม่');
      settle(rejectCode, new Error('ไม่ได้รับ Authorization Code จาก Google'));
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('เชื่อมต่อ Google Drive สำเร็จ กลับไปที่ Terminal ได้แล้ว');
    settle(resolveCode, code);
  });

  server.on('error', (error) => settle(rejectCode, error));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('ไม่สามารถเปิด OAuth callback ในเครื่องได้');
  }

  timeout = setTimeout(() => {
    settle(rejectCode, new Error('หมดเวลารอ OAuth callback กรุณารันใหม่'));
  }, timeoutMs);
  timeout.unref?.();

  return {
    redirectUri: `http://127.0.0.1:${address.port}${CALLBACK_PATH}`,
    waitForCode: () => codePromise,
    close: () => new Promise((resolve, reject) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function defaultDependencies() {
  return {
    env: process.env,
    randomState: generateOAuthState,
    startLoopbackServer,
    createOAuthClient: ({ clientId, clientSecret, redirectUri }) =>
      new google.auth.OAuth2(clientId, clientSecret, redirectUri),
    createDriveClient: ({ auth }) => google.drive({ version: 'v3', auth }),
    writeOutput: (message) => console.log(message),
  };
}

export async function runSetup(injectedDependencies = {}) {
  const dependencies = { ...defaultDependencies(), ...injectedDependencies };
  const clientId = requiredEnvironment(dependencies.env, 'GOOGLE_DRIVE_OAUTH_CLIENT_ID');
  const clientSecret = requiredEnvironment(dependencies.env, 'GOOGLE_DRIVE_OAUTH_CLIENT_SECRET');
  const state = dependencies.randomState();
  const loopback = await dependencies.startLoopbackServer({ expectedState: state });

  try {
    const oauthClient = dependencies.createOAuthClient({
      clientId,
      clientSecret,
      redirectUri: loopback.redirectUri,
    });
    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: false,
      scope: [DRIVE_FILE_SCOPE],
      state,
    });

    dependencies.writeOutput('เปิด URL นี้ในเบราว์เซอร์ แล้วเข้าสู่ระบบด้วย w10egat.project@gmail.com');
    dependencies.writeOutput(authorizationUrl);

    const authorizationCode = await loopback.waitForCode();
    const tokenResponse = await oauthClient.getToken(authorizationCode);
    const refreshToken = tokenResponse.tokens?.refresh_token;
    if (!refreshToken) {
      throw new Error('ไม่ได้รับ Refresh Token กรุณาถอนสิทธิ์แอปแล้วรันใหม่ด้วย prompt=consent');
    }

    oauthClient.setCredentials(tokenResponse.tokens);
    const drive = dependencies.createDriveClient({ auth: oauthClient });
    const folderResponse = await drive.files.create({
      requestBody: {
        name: 'Picture-OAuth',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    const folderId = folderResponse.data?.id;
    if (!folderId) throw new Error('Google Drive ไม่ส่ง Folder ID กลับมา');

    dependencies.writeOutput('คัดลอกสองค่านี้ไปตั้งใน Vercel Environment Variables:');
    dependencies.writeOutput(`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${refreshToken}`);
    dependencies.writeOutput(`SHOP_ORDER_DRIVE_FOLDER_ID=${folderId}`);
    dependencies.writeOutput('จากนั้นย้ายโฟลเดอร์ Picture-OAuth ไปไว้ใต้ WebApp ShopOrder ได้โดยไม่เปลี่ยน Folder ID');

    return { folderId };
  } finally {
    await loopback.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSetup().catch((error) => {
    console.error(error instanceof Error ? error.message : 'ตั้งค่า OAuth ไม่สำเร็จ');
    process.exitCode = 1;
  });
}