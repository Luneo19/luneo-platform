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

  const headers: HeadersInit = {
    'Content-Type': contentType,
    Cookie: request.headers.get('cookie') || '',
  };

  if (includeAuthorization) {
    const auth = request.headers.get('authorization');
    if (auth) headers.Authorization = auth;
  }

  if (includeCsrf) {
    const csrfHeader = request.headers.get('x-csrf-token');
    if (csrfHeader) {
      headers['x-csrf-token'] = csrfHeader;
    } else {
      // Fallback: if the browser sent csrf_token cookie but omitted the header,
      // rebuild the double-submit header so backend CSRF guard can validate.
      const csrfCookie = request.cookies.get('csrf_token')?.value;
      if (csrfCookie) headers['x-csrf-token'] = csrfCookie;
    }
  }

  return headers;
}
