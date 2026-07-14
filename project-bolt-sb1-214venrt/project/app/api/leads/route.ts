/**
 * Next.js App Router API — lead commit outline (rate-limited by middleware).
 */

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

  return json(202, {
    ok: true,
    message: 'Lead accepted (outline handler). Connect Supabase server insert here.',
    source_app: body.source_app ?? 'nakalai',
  });
}
