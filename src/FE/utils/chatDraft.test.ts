import { chatDraftKey, createChatDraftStore } from './chatDraft.ts';
import {
  clearUserInfo,
  clearUserSession,
  getSessionUserId,
  saveUserInfo,
  setUserSession,
} from './user.ts';

import assert from 'node:assert/strict';
import { test } from 'node:test';

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

test('an edit is persisted immediately and restored after closing the composer', () => {
  const local = storage();
  const composer = createChatDraftStore('user-1', 'chat-1', () => local);
  const text = '输入到一半\n  还没写完 😀';
  composer.setText(text);

  assert.equal(local.getItem(chatDraftKey('user-1', 'chat-1')), text);
  assert.equal(
    createChatDraftStore('user-1', 'chat-1', () => local).getSnapshot(),
    text,
  );
});

test('drafts are isolated by account, conversation, and the welcome composer', () => {
  const local = storage();
  const draft = (user: string, chat: string | null) =>
    createChatDraftStore(user, chat, () => local);
  draft('user-1', 'chat-1').setText('first chat');
  draft('user-1', 'chat-2').setText('second chat');
  draft('user-2', 'chat-1').setText('other user');
  draft('user-1', null).setText('new chat');

  assert.equal(draft('user-1', 'chat-1').getSnapshot(), 'first chat');
  assert.equal(draft('user-1', 'chat-2').getSnapshot(), 'second chat');
  assert.equal(draft('user-2', 'chat-1').getSnapshot(), 'other user');
  assert.equal(draft('user-1', null).getSnapshot(), 'new chat');
  assert.notEqual(chatDraftKey('a:b', 'c'), chatDraftKey('a', 'b:c'));
  assert.notEqual(chatDraftKey('a', null), chatDraftKey('a', 'new'));
});

test('clearing a draft removes it from storage and notifies the input', () => {
  const local = storage();
  const composer = createChatDraftStore('user-1', 'chat-1', () => local);
  let notifications = 0;
  const unsubscribe = composer.subscribe(() => {
    notifications++;
  });
  composer.setText('draft');
  composer.setText('');
  unsubscribe();
  composer.setText('later');

  assert.equal(notifications, 2);
  composer.setText('');
  assert.equal(local.getItem(chatDraftKey('user-1', 'chat-1')), null);
  assert.equal(
    createChatDraftStore('user-1', 'chat-1', () => local).getSnapshot(),
    '',
  );
});

test('server acknowledgement does not clear text edited after clicking send', () => {
  const local = storage();
  const composer = createChatDraftStore('user-1', 'chat-1', () => local);
  composer.setText('submitted text');
  const submitted = composer.getSnapshot();
  composer.setText('later edit');
  composer.setText((current) => (current === submitted ? '' : current));

  assert.equal(
    createChatDraftStore('user-1', 'chat-1', () => local).getSnapshot(),
    'later edit',
  );
});

test('blocked or full storage still allows editing, functional updates and clearing', () => {
  const composer = createChatDraftStore('user-1', 'chat-1', () => {
    throw new Error('Storage blocked');
  });
  composer.setText('draft');
  composer.setText((current) => `${current} continued`);
  assert.equal(composer.getSnapshot(), 'draft continued');
  composer.setText('');
  assert.equal(composer.getSnapshot(), '');
});

test('a composer without an identified account never accesses stored drafts', () => {
  const composer = createChatDraftStore(null, 'chat-1', () => {
    assert.fail('No storage access');
  });
  assert.equal(composer.getSnapshot(), '');
  composer.setText('anonymous text');
  assert.equal(composer.getSnapshot(), 'anonymous text');
});

test('logout preserves drafts, while another account cannot read them', () => {
  const local = storage();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: local,
  });
  const token = (claims: object) =>
    `header.${Buffer.from(JSON.stringify(claims)).toString(
      'base64url',
    )}.signature`;
  const login = (id: string) => {
    setUserSession(
      token({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    // Display names can coincide, so draft ownership must use the JWT subject.
    saveUserInfo({
      username: 'same display name',
      role: '-',
      apiKeyEnabled: false,
    });
  };
  login('user-1');
  createChatDraftStore(getSessionUserId(), 'chat-1', () => local).setText(
    '未发送草稿',
  );
  clearUserSession();
  clearUserInfo();
  assert.equal(getSessionUserId(), null);

  login('user-2');
  assert.equal(
    createChatDraftStore(
      getSessionUserId(),
      'chat-1',
      () => local,
    ).getSnapshot(),
    '',
  );
  login('user-1');
  assert.equal(
    createChatDraftStore(
      getSessionUserId(),
      'chat-1',
      () => local,
    ).getSnapshot(),
    '未发送草稿',
  );
});
