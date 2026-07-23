const DEFAULT_REDIRECT = '/';

export const getSafeAuthReturnTo = (): string => {
  const rawReturnTo = new URLSearchParams(window.location.search).get('returnTo');
  if (!rawReturnTo || !rawReturnTo.startsWith('/') || rawReturnTo.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  try {
    const destination = new URL(rawReturnTo, window.location.origin);
    if (destination.origin !== window.location.origin) {
      return DEFAULT_REDIRECT;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
};
