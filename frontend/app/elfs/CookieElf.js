import { getCsrfToken } from "./WebserviceElf";
let CSRF_HEADER_NAME = "XSRF-TOKEN";

export const getFromCookie = (name) => {
  if (!document || !document.cookie) return null;

  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

/**
 * Get CSRF token from cookie
 */
export const getCsrfTokenFromCookie = () => {
  return getFromCookie(CSRF_HEADER_NAME);
};
