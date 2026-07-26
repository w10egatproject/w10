import { describe, expect, it, vi } from 'vitest';
import {
  DRIVE_FILE_SCOPE,
  classifyDriveOAuthError,
  createDriveOAuthClient,
  readDriveOAuthEnvironment,
} from './drive-oauth';

describe('Shop Order Drive OAuth', () => {
  it('requires all three server-only OAuth values', () => {
    expect(() =>
      readDriveOAuthEnvironment({
        GOOGLE_DRIVE_OAUTH_CLIENT_ID: 'client-id',
        GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: 'client-secret',
      }),
    ).toThrow('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN');
  });

  it('trims OAuth environment values without exposing additional fields', () => {
    expect(
      readDriveOAuthEnvironment({
        GOOGLE_DRIVE_OAUTH_CLIENT_ID: ' client-id ',
        GOOGLE_DRIVE_OAUTH_CLIENT_SECRET: ' client-secret ',
        GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: ' refresh-token ',
        NEXT_PUBLIC_GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: 'public-token',
      }),
    ).toEqual({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    });
  });

  it('configures OAuth2 with a refresh token and exposes only drive.file scope', () => {
    const oauthClient = {
      setCredentials: vi.fn(),
      getAccessToken: vi.fn(),
    };
    const OAuth2 = vi.fn(function OAuth2Constructor() {
      return oauthClient;
    });

    const result = createDriveOAuthClient(
      { auth: { OAuth2 } },
      {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
      },
    );

    expect(DRIVE_FILE_SCOPE).toBe(
      'https://www.googleapis.com/auth/drive.file',
    );
    expect(OAuth2).toHaveBeenCalledWith('client-id', 'client-secret');
    expect(oauthClient.setCredentials).toHaveBeenCalledWith({
      refresh_token: 'refresh-token',
    });
    expect(result).toBe(oauthClient);
  });

  it.each([
    [
      { response: { status: 401 }, code: 'invalid_grant' },
      'DRIVE_OAUTH_REAUTH_REQUIRED',
    ],
    [
      {
        response: {
          status: 403,
          data: {
            error: {
              errors: [{ reason: 'storageQuotaExceeded' }],
            },
          },
        },
      },
      'DRIVE_QUOTA_EXCEEDED',
    ],
    [
      { response: { status: 403 }, errors: [{ reason: 'storageQuotaExceeded' }] },
      'DRIVE_QUOTA_EXCEEDED',
    ],
    [
      { response: { status: 404 } },
      'DRIVE_FOLDER_CONFIGURATION_REQUIRED',
    ],
    [{ response: { status: 403 } }, 'DRIVE_ACCESS_FORBIDDEN'],
    [{ response: { status: 500 } }, 'DRIVE_UNAVAILABLE'],
    [new Error('network failed'), 'DRIVE_UNAVAILABLE'],
  ])(
    'maps Google failures to safe code %# without returning response bodies',
    (error, expected) => {
      expect(classifyDriveOAuthError(error)).toBe(expected);
    },
  );
});
