// =================================================================================
//           Helper Functions
// =================================================================================

/**
 * Get CSRF token from cookie
 */
const getCsrfTokenFromCookie = (): string | null => {
  const name = 'XSRF-TOKEN';
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Generic fetch function
 */
const _fetch = async (
  url: string,
  method: string,
  data?: any,
  callIfFailed?: () => void
): Promise<any> => {
  const csrfToken = getCsrfTokenFromCookie();
  const stringBody = data ? JSON.stringify(data) : null;

  console.log(`Fetch initialized with url = ${url}, data = ${stringBody}, method = ${method}`);

  const requestBody: RequestInit = {
    method: method,
    credentials: 'include', // Required to send/receive cookies
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }) // Add token if available
    }
  };

  // GET method shouldn't have a body field.
  if (method !== 'GET' && stringBody) {
    requestBody.body = stringBody;
  }

  try {
    const response = await fetch(url, requestBody);

    if (!response.ok) {
      throw new Error(`Response Status: ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type') || '';

    // Handle empty response
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
      // For other content types
      fetchedData = await response.text();
    }

    console.log(`Fetch finished with url = ${url}, fetchedData = ${JSON.stringify(fetchedData)}, method = ${method}`);

    return fetchedData;
  } catch (error) {
    console.error(`Error: ${error}`);
    alert(`エラー発生：必要であれば管理者に連絡してください。${error}`);
    if (callIfFailed) {
      callIfFailed();
    }
    throw error; // Re-throw to allow caller to handle
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
 * Fetch related schools by cram school ID
 */
export async function fetchRelatedSchools(cramSchoolId: number): Promise<any> {
  const csrfToken = getCsrfTokenFromCookie();

  const response = await fetch(
    `/api/school-by-cramSchoolId?cramSchoolId=${encodeURIComponent(cramSchoolId)}`,
    {
      credentials: 'include', // Required to send/receive cookies
      headers: {
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }) // Add token if available
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Schools not found");
    } else if (response.status === 400) {
      throw new Error("Invalid request");
    } else {
      throw new Error("Server error occurred");
    }
  }

  return await response.json();
}