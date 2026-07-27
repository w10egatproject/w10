import { loadEnvConfig } from '@next/env';
import { google } from 'googleapis';

loadEnvConfig(process.cwd());

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
);
auth.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth });
const response = await drive.files.list({
  q: `'${process.env.SHOP_ORDER_DRIVE_FOLDER_ID}' in parents and trashed = false`,
  orderBy: 'createdTime desc',
  pageSize: 10,
  fields:
    'files(id,size,mimeType,createdTime,appProperties,permissions(type,role),webViewLink)',
});

const safeRows = (response.data.files ?? []).map((file, index) => ({
  index: index + 1,
  createdTime: file.createdTime,
  mimeType: file.mimeType,
  size: file.size,
  status: file.appProperties?.status ?? null,
  hasExpectedMetadata: Boolean(
    file.appProperties?.expectedName &&
      file.appProperties?.expectedMime &&
      file.appProperties?.expectedSize,
  ),
  hasAnyoneReader: Boolean(
    file.permissions?.some(
      (permission) =>
        permission.type === 'anyone' && permission.role === 'reader',
    ),
  ),
  hasCanonicalWebView:
    typeof file.webViewLink === 'string' &&
    file.webViewLink.includes(`/file/d/${file.id}/view`),
}));

console.log(JSON.stringify(safeRows, null, 2));
