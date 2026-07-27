import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateOAuthState, runSetup, startLoopbackServer } from './setup-shop-order-drive-oauth.mjs';

function createDependencies(overrides = {}) {
  const output = [];
  const observed = { authParams: null, folderRequest: null };
  const oauthClient = {
    generateAuthUrl(params) {
      observed.authParams = params;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, Array.isArray(value) ? value.join(' ') : String(value));
      }
      return url.toString();
    },
    async getToken(code) {
      assert.equal(code, 'authorization-code');
      return { tokens: { refresh_token: 'refresh-secret', access_token: 'must-not-print' } };
    },
    setCredentials() {},
  };

  return {
    dependencies: {
      env: {
        GOOGLE_DRIVE_OAUTH_CLIENT_ID: 'client-id',
        GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: 'client-secret',
      },
      randomState: () => 'random-state',
      startLoopbackServer: async ({ expectedState }) => ({
        redirectUri: 'http://127.0.0.1:43123/oauth2/callback',
        waitForCode: async () => {
          assert.equal(expectedState, 'random-state');
          return 'authorization-code';
        },
        close: async () => {},
      }),
      createOAuthClient: () => oauthClient,
      createDriveClient: () => ({
        files: {
          async create(request) {
            observed.folderRequest = request;
            return { data: { id: 'new-folder-id' } };
          },
        },
      }),
      writeOutput: (message) => output.push(message),
      ...overrides,
    },
    observed,
    output,
  };
}

test('requests offline drive.file consent and prints only deployable values', async () => {
  const { dependencies, observed, output } = createDependencies();

  await runSetup(dependencies);

  assert.equal(observed.authParams.access_type, 'offline');
  assert.equal(observed.authParams.prompt, 'consent');
  assert.equal(observed.authParams.include_granted_scopes, false);
  assert.deepEqual(observed.authParams.scope, ['https://www.googleapis.com/auth/drive.file']);
  assert.equal(observed.authParams.state, 'random-state');
  assert.equal(observed.folderRequest.requestBody.name, 'Picture-OAuth');
  assert.equal(observed.folderRequest.requestBody.mimeType, 'application/vnd.google-apps.folder');
  assert.equal(observed.folderRequest.fields, 'id');

  const rendered = output.join('\n');
  assert.match(rendered, /GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=refresh-secret/);
  assert.match(rendered, /SHOP_ORDER_DRIVE_FOLDER_ID=new-folder-id/);
  assert.doesNotMatch(rendered, /access_token|must-not-print|client-secret/);
});

test('always closes the loopback server when callback validation fails', async () => {
  let closed = false;
  const { dependencies } = createDependencies({
    startLoopbackServer: async () => ({
      redirectUri: 'http://127.0.0.1:43123/oauth2/callback',
      waitForCode: async () => { throw new Error('OAuth state ไม่ถูกต้อง'); },
      close: async () => { closed = true; },
    }),
  });

  await assert.rejects(runSetup(dependencies), /OAuth state ไม่ถูกต้อง/);
  assert.equal(closed, true);
});

test('rejects token responses without a refresh token', async () => {
  const { dependencies } = createDependencies({
    createOAuthClient: () => ({
      generateAuthUrl: () => 'https://accounts.google.com/auth',
      async getToken() { return { tokens: { access_token: 'hidden' } }; },
      setCredentials() {},
    }),
  });

  await assert.rejects(runSetup(dependencies), /ไม่ได้รับ Refresh Token/);
});

test('generates unpredictable state values', () => {
  const first = generateOAuthState();
  const second = generateOAuthState();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
});
test('loopback callback rejects a mismatched state', async () => {
  const loopback = await startLoopbackServer({ expectedState: 'expected', timeoutMs: 2_000 });
  try {
    const rejectedCallback = assert.rejects(loopback.waitForCode(), /OAuth state ไม่ถูกต้อง/);
    const response = await fetch(`${loopback.redirectUri}?state=wrong&code=authorization-code`);
    assert.equal(response.status, 400);
    await rejectedCallback;
  } finally {
    await loopback.close();
  }
});