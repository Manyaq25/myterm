// Her ücretli istekte: kullanıcı kimliği → hız sınırı → gerçek uygulama
// kontrolü → abonelik kontrolü.
import type { IncomingMessage } from 'http';

import { requirePro } from './entitlement';
import { HttpError, header } from './http';
import { verifyRequest } from './integrity';
import { perMinute } from './limits';

const APP_USER_ID = /^[\x21-\x7e]{1,128}$/;

export function appUserIdFrom(req: IncomingMessage): string {
  const id = header(req, 'x-app-user-id');
  if (!id || !APP_USER_ID.test(id)) throw new HttpError(401, 'user_missing');
  return id;
}

export async function guardPaid(req: IncomingMessage, rawBody: string): Promise<string> {
  const appUserId = appUserIdFrom(req);
  await perMinute(appUserId);
  await verifyRequest(req, rawBody, appUserId);
  await requirePro(appUserId);
  return appUserId;
}
