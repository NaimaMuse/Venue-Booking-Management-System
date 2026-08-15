const TOKEN_KEY = 'hhf_token';
const USER_KEY = 'hhf_user';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'http://127.0.0.1:5000');

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-changed'));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('hhf_seen_appointment_ids');
  window.dispatchEvent(new Event('auth-changed'));
};

export const getDashboardPath = (role) => {
  if (role === 'admin') {
    return '/admin/dashboard';
  }

  if (role === 'hotel_owner') {
    return '/owner/dashboard';
  }

  return '/customer/dashboard';
};

export const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getFirstName = (fullName = '') =>
  String(fullName).trim().split(/\s+/)[0] || 'Customer';

export const getInitials = (fullName = '') =>
  String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C';

export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return '';
  }
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  return `${API_BASE}${avatarUrl}`;
};

export const updateStoredUser = (user) => {
  const token = getToken();
  if (!token || !user) {
    return;
  }
  saveAuth(token, user);
};
