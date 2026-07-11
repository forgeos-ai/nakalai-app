/**
 * Production outline: lead / profile commit endpoint.
 *
 * Matched by root `middleware.ts` for POST/PUT/PATCH rate limiting.
 * Wire this handler to your Supabase insert (or keep browser→Supabase and
 * use this route as a hardened proxy later).
 *
 * Deployed as a Vercel Serverless Function when the project is hosted on Vercel.
 */

const RATE_LIMIT_MESSAGE =
  'Too many submission attempts. Please wait a few minutes.';

type LeadBody = {
  full_name?: string;
  email?: string;
  mobile_number?: string;
  source_app?: string;
  dpdp_consent?: boolean;
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return json(400, { error: 'Invalid JSON body.', code: 'BAD_REQUEST' });
  }

  if (!body.full_name || !body.email || !body.mobile_number) {
    return json(400, {
      error: 'full_name, email, and mobile_number are required.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (body.dpdp_consent !== true) {
    return json(400, {
      error: 'DPDP consent is required.',
      code: 'CONSENT_REQUIRED',
    });
  }

  // Placeholder success — replace with server-side Supabase insert when ready.
  // Middleware already enforced edge rate limits before this handler runs.
  return json(202, {
    ok: true,
    message: 'Lead accepted (outline handler). Connect Supabase server insert here.',
    source_app: body.source_app ?? 'nakalai',
  });
}

/** Explicit 429 shape for clients that hit this route after middleware bypass. */
export function rateLimitedResponse(retryAfterSeconds = 60): Response {
  return new Response(
    JSON.stringify({
      error: RATE_LIMIT_MESSAGE,
      code: 'RATE_LIMITED',
      retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(retryAfterSeconds),
        'Cache-Control': 'no-store',
      },
    },
  );
}
