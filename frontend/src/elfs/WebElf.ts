// =================================================================================
//           Helper Functions
// =================================================================================
import type { LoginInfo, Principal } from '../constant/types';
import { getFromCookie } from './CookieElf';

/**
 * Get CSRF token from cookie
 */
const getCsrfTokenFromCookie = () => {
    return getFromCookie('XSRF-TOKEN');
};

/**
 * Generic fetch function
 */
const _fetch = async (
    url: string,
    method: string,
    data?: object | null,
    callIfFailed?: () => void
): Promise<any> => {
    const csrfToken = getCsrfTokenFromCookie();
    const stringBody = data ? JSON.stringify(data) : null;

    console.log(`Fetch initialized with url = ${url}, data = ${stringBody}, method = ${method}`);

    const requestBody: RequestInit = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        },
    };

    if (method !== 'GET' && stringBody) {
        requestBody.body = stringBody;
    }

    try {
        const response = await fetch(url, requestBody);

        if (response.status === 401) {
            console.error('Authentication required - redirecting to login');
            alert('ログインが必要です。ログインページにリダイレクトします。');
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

        if (response.status === 403) {
            console.error('Access forbidden - insufficient permissions');
            alert('アクセス権限がありません。');
            throw new Error('Access forbidden');
        }

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (response.status === 204 || contentType === '') {
            console.log(`Fetch finished with url = ${url}, method = ${method} (No Content)`);
            return null;
        }

        let fetchedData;
        if (contentType.includes('text/plain')) {
            fetchedData = await response.text();
        } else if (contentType.includes('application/json')) {
            fetchedData = await response.json();
        } else {
            fetchedData = await response.text();
        }

        console.log(
            `Fetch finished with url = ${url}, fetchedData = ${JSON.stringify(fetchedData)}, method = ${method}`
        );

        return fetchedData;
    } catch (error) {
        console.error(`Error: ${error}`);

        if (
            error instanceof Error &&
            !error.message.includes('Authentication') &&
            !error.message.includes('forbidden')
        ) {
            alert(`エラー発生：必要であれば管理者に連絡してください。${error}`);
        }

        if (callIfFailed) {
            callIfFailed();
        }
        throw error;
    }
};

/**
 * Fetch with callback
 */
const _fetchWithCallback = async (
    url: string,
    method: string,
    data: any,
    callback: (data: any) => void,
    callIfFailed?: () => void
): Promise<void> => {
    const fetchedData = await _fetch(url, method, data, callIfFailed);
    if (callback) {
        callback(fetchedData);
    }
};

// =================================================================================
//              Functions for Export
// =================================================================================

/**
 * Generic fetch with callback
 */
export async function doFetch(
    url: string,
    method: string,
    data: any,
    callback: (data: any) => void,
    callIfFailed?: () => void
): Promise<void> {
    await _fetchWithCallback(url, method, data, callback, callIfFailed);
}

/**
 * POST request
 */
export async function doPost(url: string, data: any): Promise<any> {
    return await _fetch(url, 'POST', data);
}

/**
 * GET request
 */
export async function doGet(url: string): Promise<any> {
    return await _fetch(url, 'GET');
}

/**
 * Login request (form-urlencoded format for Spring Security)
 */
export async function doLogin(username: string, password: string): Promise<LoginInfo> {
    const csrfToken = getCsrfTokenFromCookie();

    // Create form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('_csrf', csrfToken);

    console.log(`Login initialized with username = ${username}`);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const result: LoginInfo = await response.json();
        console.log(`Login finished, result = ${JSON.stringify(result)}`);

        return result;
    } catch (error) {
        console.error(`Login Error: ${error}`);
        throw error;
    }
}

/**
 * Logout request
 */
export async function doLogout(): Promise<void> {
    await doPost('/api/logout', undefined);
}

/**
 * check if the user is already logged in
 */
export async function checkMe(): Promise<Principal> {
    const principal = await doGet('/api/me');
    return principal;
}
