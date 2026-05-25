const isBrowser = typeof window !== 'undefined';

const base64UrlToBase64 = (value) => {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  return base64;
};

export function getToken() {
  if (!isBrowser) return null;
  return localStorage.getItem('authToken');
}

export function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  try {
    const decoded = atob(base64UrlToBase64(parts[0]));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function isTokenValid() {
  const token = getToken();
  const payload = decodeToken(token);
  return payload && typeof payload.exp === 'number' && payload.exp > Date.now();
}

export function getUserFromToken() {
  const payload = decodeToken(getToken());
  if (!payload || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
    return null;
  }
  return { email: payload.email, name: payload.name };
}

export function setToken(token) {
  if (!isBrowser) return;
  localStorage.setItem('authToken', token);
}

export function logout() {
  if (!isBrowser) return;
  localStorage.removeItem('authToken');
}
