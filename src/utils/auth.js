export const safeParseUser = (rawValue) => {
  if (!rawValue) return {};

  if (typeof rawValue === 'object') {
    return rawValue || {};
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return {};
  }
};

export const getStoredUser = () => {
  const sessionUser = safeParseUser(sessionStorage.getItem('user'));
  if (sessionUser && Object.keys(sessionUser).length > 0) {
    return sessionUser;
  }

  return safeParseUser(localStorage.getItem('user'));
};
