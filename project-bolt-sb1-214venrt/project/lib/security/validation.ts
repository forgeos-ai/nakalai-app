/**
 * Input validation helpers for API routes.
 * @see docs/security/api-security.md
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; error: string };

export function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function requireNonEmpty(
  value: unknown,
  fieldName: string,
): ValidationResult<string> {
  const trimmed = trimString(value);
  if (!trimmed) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: `${fieldName} is required.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function requireMinLength(
  value: string,
  min: number,
  fieldName: string,
): ValidationResult<string> {
  if (value.length < min) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: `${fieldName} must be at least ${min} characters.`,
    };
  }
  return { ok: true, value };
}

export function requirePositiveInt(
  value: unknown,
  fieldName: string,
): ValidationResult<number> {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: `${fieldName} must be a positive integer.`,
    };
  }
  return { ok: true, value: n };
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): ValidationResult<T> {
  const trimmed = trimString(value) as T;
  if (!allowed.includes(trimmed)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      error: `${fieldName} must be one of: ${allowed.join(', ')}.`,
    };
  }
  return { ok: true, value: trimmed };
}

/** Reject client-supplied monetary amounts — server owns pricing. */
export function rejectClientAmountFields(
  body: Record<string, unknown>,
): ValidationResult<Record<string, unknown>> {
  const forbidden = ['amount', 'amountPaise', 'amountInr', 'price', 'currency'];
  for (const key of forbidden) {
    if (key in body && body[key] !== undefined) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        error: 'Client-supplied amounts are not accepted.',
      };
    }
  }
  return { ok: true, value: body };
}
