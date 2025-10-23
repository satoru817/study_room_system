export const STUDENT = 'ROLE_STUDENT';
export const TEACHER = 'ROLE_TEACHER';
export const ROLE = 'role';
import { getFromCookie, setCookie } from '../elfs/CookieElf';

export const getRole = (name) => {
    return getFromCookie(ROLE);
};

export const setRole = (roleName) => {
    setCookie(ROLE, roleName);
};
