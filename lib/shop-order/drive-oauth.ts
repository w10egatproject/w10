export const DRIVE_FILE_SCOPE =
  'https://www.googleapis.com/auth/drive.file';

export type DriveFailureCode =
  | 'DRIVE_OAUTH_REAUTH_REQUIRED'
  | 'DRIVE_QUOTA_EXCEEDED'
  | 'DRIVE_FOLDER_CONFIGURATION_REQUIRED'
  | 'DRIVE_ACCESS_FORBIDDEN'
  | 'DRIVE_UNAVAILABLE';

export interface DriveOAuthEnvironment {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface DriveOAuthClient {
  setCredentials(credentials: { refresh_token: string }): void;
  getAccessToken(): Promise<
    string | null | undefined | { token?: string | null }
  >;
}

interface GoogleOAuthFactory<TClient extends DriveOAuthClient> {
  auth: {
    OAuth2: new (
      clientId: string,
      clientSecret: string,
    ) => TClient;
  };
}

type UnknownRecord = Record<string, unknown>;
type EnvironmentSource = Readonly<Record<string, string | undefined>>;

function requiredEnvironment(
  env: EnvironmentSource,
  name: string,
): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function readDriveOAuthEnvironment(
  env: EnvironmentSource,
): DriveOAuthEnvironment {
  return {
    clientId: requiredEnvironment(env, 'GOOGLE_DRIVE_OAUTH_CLIENT_ID'),
    clientSecret: requiredEnvironment(
      env,
      'GOOGLE_DRIVE_OAUTH_CLIENT_SECRET',
    ),
    refreshToken: requiredEnvironment(
      env,
      'GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN',
    ),
  };
}

export function createDriveOAuthClient<TClient extends DriveOAuthClient>(
  google: GoogleOAuthFactory<TClient>,
  environment: DriveOAuthEnvironment,
): TClient {
  const client = new google.auth.OAuth2(
    environment.clientId,
    environment.clientSecret,
  );
  client.setCredentials({ refresh_token: environment.refreshToken });
  return client;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === 'object'
    ? (value as UnknownRecord)
    : undefined;
}

function responseStatus(error: UnknownRecord): number | undefined {
  const response = asRecord(error.response);
  const status = response?.status ?? error.status;
  return typeof status === 'number' ? status : undefined;
}

function googleErrorCode(error: UnknownRecord): string | undefined {
  if (typeof error.code === 'string') return error.code;
  const response = asRecord(error.response);
  const data = asRecord(response?.data);
  if (typeof data?.error === 'string') return data.error;
  const nestedError = asRecord(data?.error);
  return typeof nestedError?.status === 'string'
    ? nestedError.status
    : undefined;
}

function googleErrorReasons(error: UnknownRecord): string[] {
  const response = asRecord(error.response);
  const data = asRecord(response?.data);
  const nestedError = asRecord(data?.error);
  const candidateLists = [error.errors, nestedError?.errors];
  const reasons: string[] = [];

  for (const candidates of candidateLists) {
    if (!Array.isArray(candidates)) continue;
    for (const candidate of candidates) {
      const reason = asRecord(candidate)?.reason;
      if (typeof reason === 'string') reasons.push(reason);
    }
  }
  return reasons;
}

export function classifyDriveOAuthError(error: unknown): DriveFailureCode {
  const record = asRecord(error);
  if (!record) return 'DRIVE_UNAVAILABLE';

  const status = responseStatus(record);
  const code = googleErrorCode(record);
  if (status === 401 || code === 'invalid_grant') {
    return 'DRIVE_OAUTH_REAUTH_REQUIRED';
  }

  if (googleErrorReasons(record).includes('storageQuotaExceeded')) {
    return 'DRIVE_QUOTA_EXCEEDED';
  }

  if (status === 404) {
    return 'DRIVE_FOLDER_CONFIGURATION_REQUIRED';
  }
  if (status === 403) {
    return 'DRIVE_ACCESS_FORBIDDEN';
  }
  return 'DRIVE_UNAVAILABLE';
}
