// A stored unit/draft id is a slug, never a path. Reject anything with path
// separators, "..", or unexpected characters before it reaches the store's
// id->path resolution — defense-in-depth on top of @kg/core's containment guard.
export function isSafeId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 200 && /^[A-Za-z0-9._-]+$/.test(id);
}
