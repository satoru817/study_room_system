import { doGet } from './WebElf';
// Function to get a cookie value by name
// - name: the name of the cookie to retrieve
// - Returns: the value of the cookie as a string, or null if not found
export const getFromCookie: (arg: string) => string = (name: string) => {
    // Use a regular expression to find the cookie with the given name
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    // If found, decode the value to handle special characters or non-ASCII text
    return match ? decodeURIComponent(match[2]) : '';
};

// Function to set a cookie
// - name: the name of the cookie
// - value: the value to store
// - maxAge: expiration time in seconds (default: 3600 seconds = 1 hour)
export const setCookie = (name: string, value: string, maxAge: number = 3600) => {
    // Encode the value to safely handle spaces, symbols, or non-ASCII characters
    const cookieStr = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge}`;
    //
    //  // Add 'Secure' attribute only if using HTTPS (won't work on local HTTP)
    //  if (location.protocol === 'https:') cookieStr += 'secure;';

    // Write the cookie to the browser
    document.cookie = cookieStr;
};

export const initCsrf: () => void = async () => {
    try {
        await doGet('/api/csrf-token');
        console.log('CSRF token initialized');
    } catch (error) {
        console.error('Failed to initialize CSRF:', error);
    }
};
