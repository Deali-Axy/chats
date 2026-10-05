import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CONTENT_ERROR,
  CONTENT_TEXT,
  STATUS_FAILED,
  STATUS_NONE,
  STATUS_PENDING,
  STREAM_ENDED_KEY,
  applyEndStep,
  applyErrorEvent,
  applyNetworkFailure,
  applyResponseMessage,
  hasErrorContent,
} from './chatErrorSse.ts';

const upstreamJson =
  '{"code":"upstream_error","message":"The service is temporarily unavailable. Please retry later.","request_id":"66722dd8-8914-480c-bcbe-e64262ae8f14","type":"upstream_error"}';

function pendingAssistant() {
  return {
    id: 'TEMP-1',
    status: STATUS_PENDING,
    siblingIds: [],
    steps: [{ id: '', contents: [], edited: false, createdAt: '' }],
  };
}

function contentsOf(message: { steps?: { contents?: unknown[] }[] }) {
  return message.steps?.flatMap((step) => step.contents ?? []) ?? [];
}

test('Error+EndStep+ResponseMessage keeps persisted error step and Failed', () => {
  const json = upstreamJson;
  let message = applyErrorEvent(pendingAssistant(), json);
  const serverStep = {
    id: 'step-1',
    contents: [{ i: 'e1', $type: CONTENT_ERROR, c: json }],
    edited: false,
    createdAt: '2026-01-01',
  };
  message = applyEndStep(message, serverStep);
  const persisted = {
    id: 'msg-1',
    status: STATUS_NONE,
    siblingIds: ['msg-1'],
    steps: [serverStep],
  };
  message = applyResponseMessage(message, persisted);

  assert.equal(message.status, STATUS_FAILED);
  assert.equal(message.id, 'msg-1');
  assert.equal(message.steps?.length, 1);
  const contents = contentsOf(message);
  assert.equal(contents.length, 1);
  assert.equal(contents[0]?.$type, CONTENT_ERROR);
  assert.equal(contents[0]?.c, json);
  assert.equal(
    contents.some((c) => c?.$type === CONTENT_TEXT && String(c.c).includes('upstream_error')),
    false,
  );
});

test('abort after Error keeps raw error and Failed, no JSON text', () => {
  const message = applyErrorEvent(pendingAssistant(), upstreamJson);
  assert.equal(message.status, STATUS_FAILED);
  const contents = contentsOf(message);
  assert.equal(contents.length, 1);
  assert.equal(contents[0]?.$type, CONTENT_ERROR);
  assert.equal(contents[0]?.c, upstreamJson);
  assert.equal(
    contents.some((c) => c?.$type === CONTENT_TEXT),
    false,
  );
});

test('abort after Error+EndStep does not push an empty follow-up step', () => {
  let message = applyErrorEvent(pendingAssistant(), upstreamJson);
  message = applyEndStep(message, {
    id: 'step-1',
    contents: [{ i: '', $type: CONTENT_ERROR, c: upstreamJson }],
    edited: false,
    createdAt: '',
  });
  assert.equal(message.status, STATUS_FAILED);
  assert.equal(message.steps?.length, 1);
  assert.equal(message.steps?.[0]?.id, 'step-1');
});

test('applyNetworkFailure without Error row writes stream-ended error', () => {
  const message = applyNetworkFailure(pendingAssistant(), STREAM_ENDED_KEY);
  assert.equal(message.status, STATUS_FAILED);
  const contents = contentsOf(message);
  assert.equal(contents.length, 1);
  assert.equal(contents[0]?.$type, CONTENT_ERROR);
  assert.equal(contents[0]?.c, STREAM_ENDED_KEY);
  assert.equal(hasErrorContent(message), true);
});

test('applyNetworkFailure does not overwrite an existing Error row', () => {
  const failed = applyErrorEvent(pendingAssistant(), upstreamJson);
  const after = applyNetworkFailure(failed, STREAM_ENDED_KEY);
  const contents = contentsOf(after);
  assert.equal(contents[0]?.c, upstreamJson);
  assert.equal(after.status, STATUS_FAILED);
});

test('failed ResponseMessage with empty persisted steps keeps temp error', () => {
  const failed = applyErrorEvent(pendingAssistant(), upstreamJson);
  const next = applyResponseMessage(failed, {
    id: 'msg-empty',
    status: STATUS_NONE,
    siblingIds: ['msg-empty'],
    steps: [],
  });
  assert.equal(next.status, STATUS_FAILED);
  assert.equal(next.id, 'msg-empty');
  const contents = contentsOf(next);
  assert.equal(contents[0]?.$type, CONTENT_ERROR);
  assert.equal(contents[0]?.c, upstreamJson);
});

test('successful EndStep still appends an empty follow-up step', () => {
  const chatting = {
    id: 'TEMP-1',
    status: 2,
    steps: [{ id: '', contents: [{ i: '', $type: CONTENT_TEXT, c: 'hi' }] }],
  };
  const next = applyEndStep(chatting, {
    id: 'step-1',
    contents: [{ i: '', $type: CONTENT_TEXT, c: 'hi' }],
  });
  assert.equal(next.steps?.length, 2);
  assert.deepEqual(next.steps?.[1]?.contents, []);
});
