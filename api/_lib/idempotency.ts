// api/_lib/idempotency.ts

const seenTokens = new Map<string, { timestamp: number; transitionId: string }>();
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function checkAndStoreToken(clientToken: string, transitionId: string): { duplicate: boolean; existingId?: string } {
  const now = Date.now();

  // Clean old entries periodically
  for (const [token, data] of seenTokens.entries()) {
    if (now - data.timestamp > TOKEN_TTL_MS) {
      seenTokens.delete(token);
    }
  }

  if (seenTokens.has(clientToken)) {
    const existing = seenTokens.get(clientToken)!;
    return { duplicate: true, existingId: existing.transitionId };
  }

  seenTokens.set(clientToken, { timestamp: now, transitionId });
  return { duplicate: false };
}
