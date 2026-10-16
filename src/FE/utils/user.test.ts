import {
  getSessionUserId,
  getUserSession,
  readSessionClaims,
  setUserSession,
} from './user.ts';

import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

const values = new Map<string, string>();
const local = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
  removeItem: (key: string) => {
    values.delete(key);
  },
};
beforeEach(() => {
  values.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: local,
  });
});

const token = (claims: object) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString(
    'base64url',
  )}.signature`;

test('session storage follows the JWT expiry rather than a fixed seven-day lifetime', () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const sessionId = token({ sub: 'user-1', exp, name: '名字😀' });
  setUserSession(sessionId);

  assert.equal(JSON.parse(local.getItem('session')!).expires, exp * 1000);
  assert.equal(getUserSession(), sessionId);
  assert.equal(getSessionUserId(), 'user-1');
});

test('legacy seven-day storage cannot keep an expired JWT logged in', () => {
  const sessionId = token({
    sub: 'user-1',
    exp: Math.floor(Date.now() / 1000) - 1,
  });
  local.setItem(
    'session',
    JSON.stringify({ sessionId, expires: Date.now() + 7 * 86400000 }),
  );

  assert.equal(getUserSession(), '');
  assert.equal(getSessionUserId(), 'user-1');
});

test('corrupt sessions, malformed tokens and unavailable storage fail closed', () => {
  for (const value of [
    '{',
    'null',
    '[]',
    '{"sessionId":42}',
    '{"sessionId":"invalid"}',
  ]) {
    local.setItem('session', value);
    assert.equal(getUserSession(), '');
    assert.equal(getSessionUserId(), null);
  }
  assert.equal(readSessionClaims('invalid'), null);
  assert.equal(readSessionClaims('x.%%%.y'), null);
  assert.throws(
    () => setUserSession(token({ exp: 'tomorrow' })),
    /Invalid login session/,
  );
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => {
      throw new Error('Storage denied');
    },
  });
  assert.equal(getUserSession(), '');
  assert.equal(getSessionUserId(), null);
});
