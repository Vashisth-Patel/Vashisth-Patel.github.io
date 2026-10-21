/** Shared identity + links. Owned by the coordinator; worlds import read-only. */
export const site = {
  name: 'Vashisth Patel',
  email: 'vashisth@vashisthpatel.com',
  linkedin: 'https://linkedin.com/in/vashisth-patel',
  github: 'https://github.com/Vashisth-Patel',
  location: 'Wiesbaden, Germany',
  /** GoatCounter site code (tensaigori.goatcounter.com). Counting runs only in production builds. */
  goatcounter: 'tensaigori',
} as const;

/** The previous one-page site, kept as a simple alternative ("Classic view"). */
export const classicPath = 'classic/';

export type WorldId = 'atoms' | 'bits' | 'ventures';

export const worlds: { id: WorldId; name: string; tagline: string; path: string }[] = [
  { id: 'atoms', name: 'Atoms', tagline: 'materials & physics', path: 'atoms/' },
  { id: 'bits', name: 'Bits', tagline: 'terminal & games', path: 'bits/' },
  { id: 'ventures', name: 'Ventures', tagline: 'a company story', path: 'ventures/' },
];
