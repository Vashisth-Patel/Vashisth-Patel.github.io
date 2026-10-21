/**
 * Build an internal URL that respects Astro's `base` (staging lives under /vashisthpatel-v2/).
 * Always use this for internal links and for files in /public. Never hard-code "/something".
 *   withBase('')            -> "/vashisthpatel-v2/"   (or "/" in production)
 *   withBase('atoms/')      -> "/vashisthpatel-v2/atoms/"
 *   withBase('img/me.jpeg') -> "/vashisthpatel-v2/img/me.jpeg"
 */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
