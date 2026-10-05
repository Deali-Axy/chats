import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CHAT_ERROR_PARSE_CAP,
  FALLBACK_BODY_KEY,
  STREAM_ENDED_KEY,
  formatChatErrorCopyText,
  parseChatError,
} from './chatError.ts';

const t = (key: string) => key;

test('user screenshot JSON is transient with request id', () => {
  const raw = JSON.stringify({
    code: 'upstream_error',
    message: 'The service is temporarily unavailable. Please retry later.',
    request_id: '66722dd8-8914-480c-bcbe-e64262ae8f14',
    type: 'upstream_error',
  });
  const parsed = parseChatError(raw);
  assert.equal(parsed.category, 'transient');
  assert.equal(parsed.titleKey, 'Service temporarily unavailable');
  assert.equal(parsed.requestId, '66722dd8-8914-480c-bcbe-e64262ae8f14');
  assert.equal(parsed.isJson, true);
  assert.equal(parsed.isKnownI18nKey, false);
});

test('OpenAI nested error envelope', () => {
  const parsed = parseChatError(
    JSON.stringify({
      error: { message: 'bad request', code: 'invalid_request', type: 'invalid_request_error' },
    }),
  );
  assert.equal(parsed.providerMessage, 'bad request');
  assert.equal(parsed.code, 'invalid_request');
  assert.equal(parsed.type, 'invalid_request_error');
});

test('Anthropic error.type', () => {
  const parsed = parseChatError(
    JSON.stringify({
      type: 'error',
      error: { type: 'overloaded_error', message: 'Overloaded' },
    }),
  );
  assert.equal(parsed.category, 'transient');
  assert.equal(parsed.type, 'overloaded_error');
});

test('Google RESOURCE_EXHAUSTED with quota wording is rate_limit', () => {
  const parsed = parseChatError(
    JSON.stringify({
      error: {
        status: 'RESOURCE_EXHAUSTED',
        message: 'You exceeded your current quota.',
      },
    }),
  );
  assert.equal(parsed.category, 'rate_limit');
  assert.equal(parsed.titleKey, 'Too many requests');
});

test('Google NOT_FOUND is auth_quota', () => {
  const parsed = parseChatError(
    JSON.stringify({
      error: {
        status: 'NOT_FOUND',
        message: 'Model is not found for API version v1beta.',
      },
    }),
  );
  assert.equal(parsed.category, 'auth_quota');
});

test('keepStacks false strips stacks and still redacts secrets', () => {
  const raw = 'Boom\n   at Foo.Bar\n{"api_key":"sk-live"}\n   at Baz.Qux';
  const stripped = parseChatError(raw, { keepStacks: false });
  assert.equal(stripped.displayRaw.includes('at Foo.Bar'), false);
  assert.equal(stripped.displayRaw.includes('sk-live'), false);
  assert.equal(stripped.displayRaw.includes('[redacted]'), true);
  const kept = parseChatError(raw, { keepStacks: true });
  assert.equal(kept.displayRaw.includes('at Foo.Bar'), true);
  assert.equal(kept.displayRaw.includes('sk-live'), false);
});

test('100 KiB nginx HTML is transient and does not throw', () => {
  const html = `<!DOCTYPE html><html><center>nginx 504</center>${'x'.repeat(100 * 1024)}`;
  const parsed = parseChatError(html);
  assert.equal(parsed.category, 'transient');
  assert.equal(parsed.isJson, false);
  assert.ok(parsed.displayRaw.length <= CHAT_ERROR_PARSE_CAP + 32);
});

test('object message is ignored', () => {
  const parsed = parseChatError(JSON.stringify({ message: { nested: true } }));
  assert.equal(parsed.providerMessage, null);
});

test('Google numeric error.code maps to httpStatus', () => {
  const parsed = parseChatError(JSON.stringify({ error: { code: 404, message: 'missing' } }));
  assert.equal(parsed.httpStatus, 404);
  assert.equal(parsed.code, '404');
});

test('truncated JSON falls back to plain text', () => {
  const parsed = parseChatError('{ "message": "');
  assert.equal(parsed.isJson, false);
});

test('Error: prefix still extracts request_id', () => {
  const parsed = parseChatError(
    'Error: {"message":"nope","request_id":"66722dd8-8914-480c-bcbe-e64262ae8f14"}',
  );
  assert.equal(parsed.requestId, '66722dd8-8914-480c-bcbe-e64262ae8f14');
  assert.equal(parsed.isJson, true);
});

test('markdown fence json is parsed', () => {
  const parsed = parseChatError(
    '```json\n{"code":"upstream_error","message":"The service is temporarily unavailable."}\n```',
  );
  assert.equal(parsed.category, 'transient');
});

test('double-encoded JSON string', () => {
  const parsed = parseChatError(JSON.stringify('{"message":"hello there"}'));
  assert.equal(parsed.providerMessage, 'hello there');
  assert.equal(parsed.isJson, true);
});

test('Insufficient balance plain text and JSON wrapper', () => {
  const plain = parseChatError('Insufficient balance');
  assert.equal(plain.category, 'auth_quota');
  assert.equal(plain.isKnownI18nKey, true);
  assert.equal(plain.titleKey, 'This model is unavailable');
  const nested = parseChatError(JSON.stringify({ message: 'Insufficient balance' }));
  assert.equal(nested.category, 'auth_quota');
  assert.equal(nested.isKnownI18nKey, true);
});

test('empty string uses unknown fallback', () => {
  const parsed = parseChatError('');
  assert.equal(parsed.category, 'unknown');
  assert.equal(parsed.bodyKey, FALLBACK_BODY_KEY);
  assert.equal(parsed.isKnownI18nKey, false);
});

test('illegal brace is unknown', () => {
  const parsed = parseChatError('{');
  assert.equal(parsed.isJson, false);
  assert.equal(parsed.category, 'unknown');
});

test('Bearer and client_secret are redacted', () => {
  const parsed = parseChatError(
    'Authorization Bearer abc.def\n{"client_secret":"shh"}',
  );
  assert.equal(parsed.displayRaw.includes('abc.def'), false);
  assert.equal(parsed.displayRaw.includes('shh'), false);
});

test('__proto__ pollution does not enter the result', () => {
  const parsed = parseChatError('{"__proto__":{"polluted":true},"message":"hello there"}');
  assert.equal(parsed.providerMessage, 'hello there');
  assert.equal(Object.hasOwn(parsed, 'polluted'), false);
  assert.equal((parsed as { polluted?: boolean }).polluted, undefined);
});

test('numeric error field is ignored', () => {
  const parsed = parseChatError(JSON.stringify({ error: 123, message: 'hello there' }));
  assert.equal(parsed.providerMessage, 'hello there');
});

test('RFC 4122 UUID vs completion id', () => {
  const uuid = parseChatError(
    JSON.stringify({ id: '66722dd8-8914-480c-bcbe-e64262ae8f14', message: 'hello there' }),
  );
  assert.equal(uuid.requestId, '66722dd8-8914-480c-bcbe-e64262ae8f14');
  const completion = parseChatError(
    JSON.stringify({ id: 'chatcmpl-abc', message: 'hello there' }),
  );
  assert.equal(completion.requestId, null);
});

test('stream ended key is transient known i18n', () => {
  const parsed = parseChatError(STREAM_ENDED_KEY);
  assert.equal(parsed.category, 'transient');
  assert.equal(parsed.isKnownI18nKey, true);
});

test('copy text uses translated title and omits raw json', () => {
  const parsed = parseChatError(
    JSON.stringify({
      code: 'upstream_error',
      message: 'The service is temporarily unavailable. Please retry later.',
      request_id: '66722dd8-8914-480c-bcbe-e64262ae8f14',
    }),
  );
  const copy = formatChatErrorCopyText(parsed, t);
  assert.equal(copy.includes('Service temporarily unavailable'), true);
  assert.equal(copy.includes('Request ID: 66722dd8-8914-480c-bcbe-e64262ae8f14'), true);
  assert.equal(copy.includes('upstream_error'), false);
  assert.equal(copy.includes('{'), false);
});

test('content_policy ignores bare safety/refusal', () => {
  const parsed = parseChatError('this was a safety reminder and a refusal');
  assert.notEqual(parsed.category, 'content_policy');
});

test('Content Filtered is content_policy', () => {
  const parsed = parseChatError('Content Filtered');
  assert.equal(parsed.category, 'content_policy');
  assert.equal(parsed.isKnownI18nKey, true);
});
