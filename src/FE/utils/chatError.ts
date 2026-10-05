export const CHAT_ERROR_PARSE_CAP = 16 * 1024;
export const CHAT_ERROR_RAW_DISPLAY_LIMIT = 4 * 1024;

export const STREAM_ENDED_KEY =
  'The response stream ended unexpectedly. Reload this conversation to check the saved reply.';

export const FALLBACK_BODY_KEY =
  'There were some errors during the chat. You can switch models or try again later.';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KNOWN_I18N_KEYS = new Set([
  'Insufficient balance',
  'Subscription has expired',
  'The Model does not exist or access is denied.',
  'Conversation cancelled',
  'Content Filtered',
  FALLBACK_BODY_KEY,
  STREAM_ENDED_KEY,
]);

const SECRET_KEYS = [
  'api_key',
  'authorization',
  'token',
  'access_token',
  'client_secret',
  'x-api-key',
  'api-key',
  'cookie',
  'private_key',
  'password',
  'secret',
];

export type ChatErrorCategory =
  | 'transient'
  | 'rate_limit'
  | 'auth_quota'
  | 'content_policy'
  | 'context_too_long'
  | 'cancelled'
  | 'unknown';

export type ParseChatErrorOptions = {
  keepStacks?: boolean;
};

export type ChatErrorTranslate = (key: string) => string;

export interface ParsedChatError {
  category: ChatErrorCategory;
  titleKey: string;
  bodyKey: string | null;
  providerMessage: string | null;
  code: string | null;
  type: string | null;
  requestId: string | null;
  httpStatus: number | null;
  isJson: boolean;
  isKnownI18nKey: boolean;
  raw: string;
  displayRaw: string;
  rawTruncated: boolean;
}

type FlattenedError = {
  message: string | null;
  code: string | null;
  type: string | null;
  requestId: string | null;
  httpStatus: number | null;
};

const TITLE_KEYS: Record<ChatErrorCategory, string> = {
  transient: 'Service temporarily unavailable',
  rate_limit: 'Too many requests',
  auth_quota: 'This model is unavailable',
  content_policy: 'Response blocked by safety policy',
  context_too_long: 'Context is too long',
  cancelled: 'Generation cancelled',
  unknown: "Couldn't generate a response",
};

const BODY_KEYS: Record<ChatErrorCategory, string> = {
  transient: 'The model provider did not respond. Please retry in a moment.',
  rate_limit:
    'The provider rate limit was reached. Please wait and retry, or switch models.',
  auth_quota:
    'Balance, subscription, or access is blocking this model. Recharge, or switch to another model.',
  content_policy:
    'The provider rejected this request. Edit the prompt and try again, or switch models.',
  context_too_long:
    'This request exceeded the model window. Compact earlier turns, then retry.',
  cancelled: 'This response was cancelled. You can regenerate it.',
  unknown: FALLBACK_BODY_KEY,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function own(obj: unknown, key: string): unknown {
  if (!isPlainObject(obj)) return undefined;
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return undefined;
  return obj[key];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asCode(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asHttpStatus(value: unknown): number | null {
  if (typeof value === 'number' && value >= 400 && value <= 599) return value;
  if (typeof value === 'string' && /^\d{3}$/.test(value)) {
    const n = Number(value);
    if (n >= 400 && n <= 599) return n;
  }
  return null;
}

function stripJsonWrappers(text: string): string {
  let s = text.trim();
  s = s.replace(/^Error:\s*/i, '').trim();
  const fenced = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenced) s = fenced[1].trim();
  return s;
}

function looksLikeJson(text: string): boolean {
  const c = text.trimStart()[0];
  return c === '{' || c === '[';
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function pickMessage(source: unknown): string | null {
  const nested = own(source, 'error');
  const fromNested = asString(own(nested, 'message'));
  if (fromNested) return fromNested;
  const errorAsString = asString(nested);
  if (errorAsString) return errorAsString;
  const top = asString(own(source, 'message'));
  if (top) return top;
  const errorMsg = asString(own(nested, 'msg'));
  if (errorMsg) return errorMsg;
  const msg = asString(own(source, 'msg'));
  if (msg) return msg;
  const detail = asString(own(source, 'detail'));
  if (detail) return detail;
  const title = asString(own(source, 'title'));
  if (title && /nginx|error|gateway/i.test(title)) return title;
  return null;
}

function pickCode(source: unknown): string | null {
  const nested = own(source, 'error');
  return (
    asCode(own(nested, 'code')) ??
    asCode(own(source, 'code')) ??
    asCode(own(source, 'error_code')) ??
    asCode(own(source, 'status_code'))
  );
}

function pickType(source: unknown): string | null {
  const nested = own(source, 'error');
  return (
    asString(own(nested, 'type')) ??
    asString(own(nested, 'status')) ??
    asString(own(source, 'type'))
  );
}

function pickRequestId(source: unknown): string | null {
  const nested = own(source, 'error');
  const candidates = [
    asString(own(nested, 'request_id')),
    asString(own(source, 'request_id')),
    asString(own(source, 'requestId')),
    asString(own(source, 'id')),
  ];
  for (const value of candidates) {
    if (!value) continue;
    if (value === asString(own(source, 'id')) && !UUID_RE.test(value)) continue;
    return value;
  }
  return null;
}

function pickHttpStatus(source: unknown): number | null {
  const nested = own(source, 'error');
  return (
    asHttpStatus(own(source, 'status')) ??
    asHttpStatus(own(source, 'status_code')) ??
    asHttpStatus(own(nested, 'code'))
  );
}

function flattenObject(source: unknown): FlattenedError {
  const message = pickMessage(source);
  let parsedMessage = message;
  if (message && looksLikeJson(message.trim())) {
    const inner = parseJson(message.trim());
    if (inner !== undefined) {
      const innerMessage = pickMessage(inner);
      return {
        message: innerMessage ?? (typeof inner === 'string' ? null : message),
        code: pickCode(inner) ?? pickCode(source),
        type: pickType(inner) ?? pickType(source),
        requestId: pickRequestId(inner) ?? pickRequestId(source),
        httpStatus: pickHttpStatus(inner) ?? pickHttpStatus(source),
      };
    }
  }
  return {
    message: parsedMessage,
    code: pickCode(source),
    type: pickType(source),
    requestId: pickRequestId(source),
    httpStatus: pickHttpStatus(source),
  };
}

function flattenUnknown(value: unknown): FlattenedError {
  if (Array.isArray(value)) {
    const first = value[0];
    if (isPlainObject(first)) return flattenObject(first);
    return {
      message: null,
      code: null,
      type: null,
      requestId: null,
      httpStatus: null,
    };
  }
  if (isPlainObject(value)) return flattenObject(value);
  return {
    message: null,
    code: null,
    type: null,
    requestId: null,
    httpStatus: null,
  };
}

function isHumanMessage(text: string | null): text is string {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 8 || trimmed.length > 240) return false;
  if (trimmed.includes('{') || trimmed.includes('}')) return false;
  if (/<html/i.test(trimmed)) return false;
  if (/\bat \S+\.\S+/.test(trimmed)) return false;
  if (UUID_RE.test(trimmed)) return false;
  return true;
}

function haystackOf(raw: string, flat: FlattenedError): string {
  return [raw, flat.message, flat.code, flat.type]
    .filter((part): part is string => !!part)
    .join('\n')
    .toLowerCase();
}

function hasToken(hay: string, token: string): boolean {
  return hay.includes(token.toLowerCase());
}

function hasWord(hay: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(hay);
}

function classify(raw: string, flat: FlattenedError): ChatErrorCategory {
  const hay = haystackOf(raw, flat);
  const code = (flat.code ?? '').toLowerCase();
  const type = (flat.type ?? '').toLowerCase();
  const status = flat.httpStatus;

  if (
    hasToken(hay, 'conversation cancelled') ||
    hasToken(hay, 'taskcanceledexception') ||
    hasToken(hay, 'operation was canceled') ||
    hasToken(hay, 'operation was cancelled')
  ) {
    return 'cancelled';
  }

  if (
    hasToken(hay, 'content filtered') ||
    hasToken(hay, 'content_filter') ||
    hasToken(hay, 'content_policy') ||
    hasToken(hay, 'safety_violation')
  ) {
    return 'content_policy';
  }

  if (
    hasToken(hay, 'insufficient balance') ||
    hasToken(hay, 'subscription has expired') ||
    hasToken(hay, 'the model does not exist or access is denied') ||
    hasToken(hay, 'insufficient_quota') ||
    hasToken(hay, 'authentication_error') ||
    hasToken(hay, 'permission_error') ||
    hasToken(hay, 'invalid_api_key') ||
    hasToken(hay, 'invalid_model') ||
    type === 'not_found' ||
    code === 'not_found' ||
    hasToken(hay, 'model is not found') ||
    status === 401 ||
    status === 403 ||
    hasWord(hay, '401') ||
    hasWord(hay, '403')
  ) {
    return 'auth_quota';
  }

  if (
    hasToken(hay, 'context_length_exceeded') ||
    hasToken(hay, 'context_length') ||
    hasToken(hay, 'maximum context') ||
    hasToken(hay, 'too many tokens')
  ) {
    return 'context_too_long';
  }

  if (
    status === 429 ||
    hasWord(hay, '429') ||
    hasToken(hay, 'rate_limit') ||
    hasToken(hay, 'rate_limit_error') ||
    hasToken(hay, 'too many requests') ||
    hasWord(hay, 'tpm') ||
    hasWord(hay, 'rpm') ||
    hasToken(hay, 'retry-after') ||
    type === 'resource_exhausted' ||
    code === 'resource_exhausted' ||
    hasToken(hay, 'resource_exhausted')
  ) {
    return 'rate_limit';
  }

  if (
    type === 'upstream_error' ||
    code === 'upstream_error' ||
    type === 'overloaded_error' ||
    code === 'overloaded_error' ||
    type === 'api_error' ||
    code === 'api_error' ||
    type === 'server_error' ||
    code === 'server_error' ||
    hasToken(hay, 'temporarily unavailable') ||
    hasToken(hay, 'service unavailable') ||
    hasToken(hay, 'bad gateway') ||
    hasToken(hay, 'timed out') ||
    hasToken(hay, 'timeout') ||
    hasToken(hay, 'ended unexpectedly') ||
    /<!doctype|<html|<center>|nginx/i.test(raw) ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 408 ||
    hasWord(hay, '502') ||
    hasWord(hay, '503') ||
    hasWord(hay, '504') ||
    hasWord(hay, '408')
  ) {
    return 'transient';
  }

  return 'unknown';
}

function redactSecrets(text: string): string {
  let s = text.replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]');
  for (const key of SECRET_KEYS) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(
      new RegExp(`(["']${escaped}["']\\s*:\\s*["'])([^"']*)(["'])`, 'gi'),
      '$1[redacted]$3',
    );
    s = s.replace(
      new RegExp(`([?&]${escaped}=)([^&\\s]+)`, 'gi'),
      '$1[redacted]',
    );
  }
  return s;
}

function stripStacks(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^\s*at \S+\.\S+/.test(line))
    .join('\n');
}

function truncateDisplay(text: string): { text: string; truncated: boolean } {
  if (text.length <= CHAT_ERROR_RAW_DISPLAY_LIMIT) {
    return { text, truncated: false };
  }
  return {
    text: `${text.slice(0, CHAT_ERROR_RAW_DISPLAY_LIMIT)}\n…(truncated)`,
    truncated: true,
  };
}

function emptyParsed(raw: string): ParsedChatError {
  return {
    category: 'unknown',
    titleKey: TITLE_KEYS.unknown,
    bodyKey: FALLBACK_BODY_KEY,
    providerMessage: null,
    code: null,
    type: null,
    requestId: null,
    httpStatus: null,
    isJson: false,
    isKnownI18nKey: false,
    raw,
    displayRaw: '',
    rawTruncated: false,
  };
}

export function parseChatError(
  raw: string | undefined | null,
  options?: ParseChatErrorOptions,
): ParsedChatError {
  const keepStacks = !!options?.keepStacks;
  const original = raw ?? '';
  if (!original.trim()) {
    return emptyParsed(original);
  }

  const inspect =
    original.length > CHAT_ERROR_PARSE_CAP
      ? original.slice(0, CHAT_ERROR_PARSE_CAP)
      : original;

  let working = stripJsonWrappers(inspect);
  if (working.trimStart().startsWith('"')) {
    const decoded = parseJson(working);
    if (typeof decoded === 'string') {
      working = stripJsonWrappers(decoded);
    }
  }

  let isJson = false;
  let flat: FlattenedError = {
    message: null,
    code: null,
    type: null,
    requestId: null,
    httpStatus: null,
  };

  if (looksLikeJson(working)) {
    const parsed = parseJson(working);
    if (parsed !== undefined) {
      isJson = true;
      flat = flattenUnknown(parsed);
    }
  }

  const trimmedRaw = original.trim();
  const knownFromRaw = KNOWN_I18N_KEYS.has(trimmedRaw);
  const knownFromMessage = !!flat.message && KNOWN_I18N_KEYS.has(flat.message.trim());
  const isKnownI18nKey = knownFromRaw || knownFromMessage;
  const category = classify(inspect, flat);
  const providerMessage = isHumanMessage(flat.message) ? flat.message.trim() : null;

  let displaySource = redactSecrets(inspect);
  if (!keepStacks) {
    displaySource = stripStacks(displaySource);
  }
  const displayed = truncateDisplay(displaySource);

  const bodyKey =
    category === 'unknown' && providerMessage && !isKnownI18nKey
      ? null
      : BODY_KEYS[category];

  return {
    category,
    titleKey: TITLE_KEYS[category],
    bodyKey,
    providerMessage: isKnownI18nKey
      ? (flat.message ?? trimmedRaw).trim()
      : providerMessage,
    code: flat.code,
    type: flat.type,
    requestId: flat.requestId,
    httpStatus: flat.httpStatus,
    isJson,
    isKnownI18nKey,
    raw: original,
    displayRaw: displayed.text,
    rawTruncated: displayed.truncated,
  };
}

export function resolveChatErrorBody(
  parsed: ParsedChatError,
  t: ChatErrorTranslate,
): string {
  if (parsed.isKnownI18nKey) {
    return t((parsed.providerMessage ?? parsed.raw ?? '').trim());
  }
  if (parsed.bodyKey) return t(parsed.bodyKey);
  if (parsed.providerMessage) return parsed.providerMessage;
  return t(FALLBACK_BODY_KEY);
}

export function formatChatErrorCopyText(
  parsed: ParsedChatError,
  t: ChatErrorTranslate,
): string {
  const lines = [t(parsed.titleKey), resolveChatErrorBody(parsed, t)];
  if (parsed.requestId) {
    lines.push(`Request ID: ${parsed.requestId}`);
  }
  return lines.join('\n');
}

export function categoryTitleKey(category: ChatErrorCategory): string {
  return TITLE_KEYS[category];
}
