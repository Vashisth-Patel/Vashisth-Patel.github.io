/** Landing page content. Every fact here is logged in product/fact-check.md (Landing). */

export const hero = {
  eyebrow: 'Wiesbaden · 50.08° N, 8.24° E',
  name: 'Vashisth Patel',
  line: 'Materials engineer, now studying management in Wiesbaden. Curious about how things work: atoms, code, companies, and the history in between.',
};

export interface Interest {
  id: string;
  label: string;
  note: string;
  /** Position inside the constellation viewBox (0–100). */
  x: number;
  y: number;
}

export const interests: Interest[] = [
  {
    id: 'physics',
    label: 'Physics',
    note: 'In 2020 I took a University of Tokyo course on the Big Bang and dark energy, for no reason other than wanting to know.',
    x: 22,
    y: 26,
  },
  {
    id: 'technology',
    label: 'Technology',
    note: 'I build small automation systems with n8n, Python and LLM APIs. My 2022 Python games survived too. They live in Bits.',
    x: 74,
    y: 16,
  },
  {
    id: 'business',
    label: 'Business',
    note: 'Studied at SPJIMR and EBS. What interests me most is why some operations run smoothly and others do not.',
    x: 84,
    y: 70,
  },
  {
    id: 'history',
    label: 'History',
    note: 'Favourite end-semester talk: ancient trade between India and China, and how both civilisations worked out π on their own.',
    x: 30,
    y: 82,
  },
];

export interface Stat {
  value: number;
  decimals: number;
  prefix?: string;
  suffix?: string;
  display?: string; // overrides the count-up text
  label: string;
  detail: string;
}

export const stats: Stat[] = [
  { value: 99.17, decimals: 2, label: 'percentile', detail: 'JEE Main, India’s engineering entrance exam' },
  { value: 99.7, decimals: 1, label: 'percentile', detail: 'CAT 2023, Quantitative Ability' },
  { value: 99.4, decimals: 1, label: 'percentile', detail: 'CAT 2023, Data Interpretation & Logical Reasoning' },
  { value: 2, decimals: 0, prefix: 'Top ', label: 'of the cohort', detail: 'Dean’s Honour List, SPJIMR Global Management Programme' },
];

export const quote = {
  eyebrow: 'How I think',
  paragraphs: [
    'I like to think from first principles and ask what is really causing something, at work and in life. But I don’t need to explain everything. Some things I simply enjoy being dumbfounded by.',
    'The goal is simple: to be someone capable and experienced enough to build a business, or solve a problem, whenever the need arises.',
  ],
};

export interface Stop {
  when: string;
  title: string;
  place: string;
  note?: string;
  now?: boolean;
}

export const education: Stop[] = [
  {
    when: '2019 – 2023',
    title: 'B.Tech, Materials Science & Engineering',
    place: 'IIT Gandhinagar',
    note: 'Undergraduate research in electrokinetic energy harvesting.',
  },
  {
    when: 'Dec 2023 – Jun 2024',
    title: 'Global Management Programme',
    place: 'SP Jain Institute of Management & Research, Mumbai',
    note: 'Dean’s Honour List, top 2 of the cohort.',
  },
  {
    when: 'Aug 2024 – Jun 2027',
    title: 'MSc Management',
    place: 'EBS Universität, Wiesbaden',
    note: 'Thesis: business model innovation in technology-driven firms.',
    now: true,
  },
];

export const work: Stop[] = [
  {
    when: 'Feb – Jun 2025',
    title: 'Working Student, Researcher Acquisition',
    place: 'Physics Mindboggler (remote)',
    note: 'Found why researchers were not joining and rebuilt the outreach process. Conversion went from 1% to 30%.',
  },
  {
    when: 'Jul 2025',
    title: 'Outstanding Performance',
    place: 'Fraunhofer IPT Hackathon with MTU Aero Engines, Aachen',
    note: 'Team safety-monitoring prototype built in 24 hours: a teammate built the Arduino hardware, I built the live Python dashboard.',
  },
  {
    when: 'Apr 2026',
    title: '2nd place, Quantathon',
    place: 'EBS Invest, Wiesbaden',
    note: 'Asset-price prediction model for algorithmic trading.',
  },
];

/**
 * Background photographs (Hubble, ESA/Hubble, CC BY 4.0). One is picked at random per visit
 * and captioned top-right with a linked credit. Optimised WebP in public/img/space/.
 */
export interface SpaceImage {
  src: string; // path under /public
  title: string;
  description: string;
  credit: string;
  creditUrl: string;
  position?: string; // CSS object-position
}

export const spaceImages: SpaceImage[] = [
  {
    src: 'img/space/westerlund-2.webp',
    title: 'Westerlund 2',
    description: 'A young star cluster in the constellation Carina, about 20,000 light-years away. Hubble’s 25th-anniversary image.',
    credit: 'NASA, ESA, the Hubble Heritage Team (STScI/AURA), A. Nota (ESA/STScI), and the Westerlund 2 Science Team',
    creditUrl: 'https://esahubble.org/images/heic1509a/',
  },
  {
    src: 'img/space/pillars-of-creation.webp',
    title: 'Pillars of Creation',
    description: 'Columns of gas and dust in the Eagle Nebula, about 7,000 light-years away, where new stars are forming.',
    credit: 'NASA, ESA/Hubble and the Hubble Heritage Team',
    creditUrl: 'https://esahubble.org/images/heic1501a/',
  },
  {
    src: 'img/space/mystic-mountain.webp',
    title: 'Mystic Mountain',
    description: 'A pillar of gas and dust in the Carina Nebula, about 7,500 light-years away, eroded by starlight. Hubble’s 20th-anniversary image.',
    credit: 'NASA, ESA, M. Livio and the Hubble 20th Anniversary Team (STScI)',
    creditUrl: 'https://esahubble.org/images/heic1007a/',
  },
  {
    src: 'img/space/ultra-deep-field.webp',
    title: 'Hubble Ultra Deep Field',
    description: 'About 10,000 galaxies in one tiny patch of sky. The faintest date to roughly 800 million years after the Big Bang.',
    credit: 'NASA, ESA, and S. Beckwith (STScI) and the HUDF Team',
    creditUrl: 'https://esahubble.org/images/heic0406a/',
  },
];
