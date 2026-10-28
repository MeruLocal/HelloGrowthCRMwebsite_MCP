/**
 * Turn a parsed /health body into an audit warning when claim overrides have passed
 * their review-by date. Pure so it can be tested without a network.
 * Degraded health is a monitoring signal only; it never changes what tools serve.
 */
export function overrideWarning(health) {
  const o = health && health.overrides;
  if (!o || typeof o.expired !== "number") return null;
  if (o.expired > 0) {
    return `${o.expired} of ${o.total} claim override(s) are past their review-by date: re-check each against its known-truth id and renew the date or remove the override`;
  }
  return null;
}
