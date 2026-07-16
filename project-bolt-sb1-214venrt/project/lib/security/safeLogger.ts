/**
 * Secret-redacting logger for server routes.
 * Wired: POST /api/payments/create-order
 * @see docs/security/secret-management.md
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY_PATTERN =
  /secret|password|token|signature|authorization|api[_-]?key|service[_-]?role/i;

const SENSITIVE_VALUE_PATTERNS = [
  /^rzp_(live|test)_[a-zA-Z0-9]+$/i,
  /^pay_[a-zA-Z0-9]+$/i,
  /^order_[a-zA-Z0-9]+$/i,
];

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }
  if (typeof value === 'string') {
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        return '[REDACTED]';
      }
    }
    if (value.length > 64) {
      return `${value.slice(0, 8)}…[truncated]`;
    }
  }
  return value;
}

function redactObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = redactObject(value as Record<string, unknown>);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
}

export function safeLog(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...redactObject(fields),
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}
