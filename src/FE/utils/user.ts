export interface UserInfo {
  username: string;
  role: string;
  apiKeyEnabled: boolean;
}

export const saveUserInfo = (user: UserInfo) => {
  const json = JSON.stringify(user);
  const value = btoa(encodeURIComponent(json));
  localStorage.setItem('user', value);
};
export const clearUserInfo = () => {
  localStorage.removeItem('user');
};

export const getUserInfo = () => {
  try {
    const value = localStorage.getItem('user');
    const user = decodeURIComponent(atob(value || ''));
    if (!user) {
      return null;
    }
    return JSON.parse(user) as UserInfo;
  } catch {
    return null;
  }
};

export const getLoginUrl = () => {
  return '/login';
};

const PUBLIC_PATHS = new Set(['/login', '/authorizing']);

export const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  return pathname === '/share' || pathname.startsWith('/share/');
};

export const redirectToLoginPage = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (isPublicPath(window.location.pathname)) {
    return;
  }
  window.location.replace(getLoginUrl());
};

export const redirectToHomePage = (ms?: number) => {
  const toHome = () => {
    location.href = '/';
  };

  ms ? setTimeout(toHome, ms) : toHome();
};

// These claims identify local drafts and their expiry; the server still validates the JWT.
export const readSessionClaims = (
  sessionId: string,
): {
  sub?: string;
  exp?: number;
} | null => {
  try {
    const parts = sessionId.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (!claims || typeof claims !== 'object' || Array.isArray(claims))
      return null;
    return {
      sub: typeof claims.sub === 'string' ? claims.sub : undefined,
      exp:
        typeof claims.exp === 'number' && Number.isFinite(claims.exp)
          ? claims.exp
          : undefined,
    };
  } catch {
    return null;
  }
};

const getStoredSession = (): { sessionId: string } | null => {
  try {
    const session = JSON.parse(localStorage.getItem('session') || 'null');
    return typeof session?.sessionId === 'string' ? session : null;
  } catch {
    return null;
  }
};

export const setUserSession = (sessionId: string) => {
  const expires = readSessionClaims(sessionId)?.exp;
  if (expires === undefined) throw new Error('Invalid login session');
  localStorage.setItem(
    'session',
    JSON.stringify({
      sessionId,
      expires: expires * 1000,
    }),
  );
};

export const getUserSession = (): string => {
  const session = getStoredSession();
  if (!session) return '';
  const expires = readSessionClaims(session.sessionId)?.exp;
  if (expires !== undefined && expires * 1000 > Date.now())
    return session.sessionId;
  return '';
};

// Keep the draft owner stable even if the token expires while the user is editing.
export const getSessionUserId = (): string | null => {
  const session = getStoredSession();
  return session ? readSessionClaims(session.sessionId)?.sub || null : null;
};

export const isLoggedIn = () => Boolean(getUserSession() && getUserInfo());

export const clearUserSession = () => {
  localStorage.removeItem('session');
};
