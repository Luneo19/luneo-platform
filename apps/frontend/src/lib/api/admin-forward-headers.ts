import { NextRequest } from 'next/server';

type AdminForwardHeadersOptions = {
  contentType?: string;
  includeAuthorization?: boolean;
  includeCsrf?: boolean;
};

export function buildAdminForwardHeaders(
  request: NextRequest,
  options: AdminForwardHeadersOptions = {},
): HeadersInit {
  const {
    contentType = 'application/json',
    includeAuthorization = true,
    includeCsrf = true,
  } = options;

  let cookieHeader = request.headers.get('cookie') || '';

  const headers: HeadersInit = {
    'Content-Type': contentType,
    Cookie: cookieHeader,
  };

  if (includeAuthorization) {
    const auth = request.headers.get('authorization');
    if (auth) headers.Authorization = auth;
  }

  if (includeCsrf) {
    const csrfHeader = request.headers.get('x-csrf-token');
    if (csrfHeader) {
      headers['x-csrf-token'] = csrfHeader;

      // Ensure backend receives the csrf_token cookie expected by CsrfGuard
      // even if the browser has not persisted it yet.
      if (!/(\b|;\s*)csrf_token=/.test(cookieHeader)) {
        cookieHeader = cookieHeader ? `${cookieHeader}; csrf_token=${csrfHeader}` : `csrf_token=${csrfHeader}`;
        headers.Cookie = cookieHeader;
      }
    } else {
      // Fallback: if the browser sent csrf_token cookie but omitted the header,
      // rebuild the double-submit header so backend CSRF guard can validate.
      const csrfCookie = request.cookies.get('csrf_token')?.value;
      if (csrfCookie) headers['x-csrf-token'] = csrfCookie;
    }
  }

  return headers;
}
