const BLOCKING_SEVERITIES = new Set(['moderate', 'high', 'critical']);

export function evaluateAuditReport(report) {
  const vulnerabilities = Object.values(report?.vulnerabilities ?? {});
  const blocking = vulnerabilities.filter(
    (vulnerability) => BLOCKING_SEVERITIES.has(vulnerability?.severity),
  );
  const ignoredLow = vulnerabilities.filter(
    (vulnerability) => !BLOCKING_SEVERITIES.has(vulnerability?.severity),
  );

  return {
    blocking,
    ignoredLow,
  };
}
