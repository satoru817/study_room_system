
// Function to get a cookie value by name
// - name: the name of the cookie to retrieve
// - Returns: the value of the cookie as a string, or null if not found
export const getFromCookie = (name) => {
  // Use a regular expression to find the cookie with the given name
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  // If found, decode the value to handle special characters or non-ASCII text
  return match ? decodeURIComponent(match[2]) : null;
};

// Function to set a cookie
// - name: the name of the cookie
// - value: the value to store
// - maxAge: expiration time in seconds (default: 3600 seconds = 1 hour)
export const setCookie = (name, value, maxAge = 3600) => {
  // Encode the value to safely handle spaces, symbols, or non-ASCII characters
  let cookieStr = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge}`;
//
//  // Add 'Secure' attribute only if using HTTPS (won't work on local HTTP)
//  if (location.protocol === 'https:') cookieStr += 'secure;';

  // Write the cookie to the browser
  document.cookie = cookieStr;
};

export const initCsrf = async() => {
    try {
        // csrf token will be stored in cookie
        await fetch(`/api/csrf-token`, {
         credentials: 'include'
        });
        console.log('CSRF token initialized');
    }
    catch (error) {
        console.error('Failed to initialize CSRF:', error);
    }
};