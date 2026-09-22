export function getErrorStatus(error) {
  if (!error) return null;
  if (typeof error.status === "number") return error.status;
  if (typeof error.statusCode === "number") return error.statusCode;

  const message = String(error?.message || error);
  const match = message.match(
    /\b(400|401|403|404|408|409|429|500|502|503|504)\b/,
  );

  return match ? Number(match[1]) : null;
}

export function isFallbackError(error) {
  const status = getErrorStatus(error);
  const errorText = String(error?.message || error).toUpperCase();

  return (
    [400, 401, 403, 404, 408, 409, 429, 500, 502, 503, 504].includes(status) ||
    [
      "RESOURCE_EXHAUSTED",
      "RATE LIMIT",
      "TOO MANY REQUESTS",
      "UNAVAILABLE",
      "TIMEOUT",
      "DEADLINE_EXCEEDED",
      "INTERNAL SERVER ERROR",
      "MODEL IS UNAVAILABLE",
      "DOES NOT EXIST",
      "DO NOT HAVE ACCESS",
      "NOT FOUND",
      "FORBIDDEN",
      "UNAUTHORIZED",
      "FREE",
    ].some((term) => errorText.includes(term))
  );
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
