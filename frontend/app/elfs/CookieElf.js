import { getCsrfToken } from "./WebserviceElf";
let CSRF_HEADER_NAME = "";
export const getFromCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(";").shift());
  }

  return null;
};

/**
 * Get CSRF token from cookie
 */
export const getCsrfTokenFromCookie = () => {
  return getFromCookie(CSRF_HEADER_NAME);
};

export const initCsrf = async () => {
  const token = await getCsrfToken();
  const headerName = token.headerName;
  const value = token.value;
  CSRF_HEADER_NAME = headerName;
  document.cookie = `${headerName}=${value}; path=/`;
};
