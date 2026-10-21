/**
 * ATOMS world content: intro lines, quiz, random facts, planets and projects.
 * Every number here is logged in product/fact-check.md under "## Atoms".
 * Text may use *word* for emphasis (rendered as <em>).
 */

export const sunLabel = 'IIT Gandhinagar · B.Tech MSE · 2019–2023';

export const introLines: string[] = [
  'Oh. A visitor.',
  'Welcome to ATOMS. Everything here is made of something.',
  'Vashisth spent four years at IIT Gandhinagar finding out what: metals, composites, nanoparticles, implants.',
  'Each planet out there is one of those worlds. Their moons hold the projects.',
  'But first, an emergency.',
];

export const returnLine = 'Welcome back. The emergency is still on.';
export const finishLine = 'Now go explore.';
export const rebootLine = 'Universe rebooted. Try a different shield.';

/* ------------------------------------------------------------------ Quiz */

export interface Answer {
  id: string;
  symbol: string;
  number: number;
  name: string;
  /** Small line under the name, e.g. "titanium alloy" */
  sub?: string;
  mass: string;
  /** Periodic-table family, shown as a coloured stripe */
  family: 'metalloid' | 'transition' | 'actinide' | 'alkali' | 'post-transition';
  sfx: string;
  reply: string;
  extra?: string;
  correct?: boolean;
  crash?: boolean;
  /** Opens a moon card from the reply */
  link?: { label: string; moon: string };
}

export interface Question {
  id: 'einstein' | 'implant' | 'melt';
  tag: string;
  prompt: string;
  lead: string;
  answers: Answer[];
}

export const quiz: Question[] = [
  {
    id: 'einstein',
    tag: 'Emergency!',
    prompt:
      'Einstein just stepped out of a wormhole, straight into this website. The room is filling with radiation. Pick a shield. Quickly.',
    lead: 'Quick! Pick a shield.',
    answers: [
      {
        id: 'boron',
        symbol: 'B',
        number: 5,
        name: 'Boron',
        mass: '10.81',
        family: 'metalloid',
        sfx: 'SHHK!',
        reply:
          "Clever. Boron-10 swallows neutrons, which is why it goes into reactor control rods. Einstein survives... but the wormhole did something odd. He is now *ein Stein*. (German for 'a stone'.)",
        correct: true,
      },
      {
        id: 'iron',
        symbol: 'Fe',
        number: 26,
        name: 'Iron',
        mass: '55.85',
        family: 'transition',
        sfx: 'FSSSHH...',
        reply: 'Huh. Iron Man has been vaporised.',
        extra: 'To be fair, iron does block radiation. You just need a lot of it.',
      },
      {
        id: 'uranium',
        symbol: 'U',
        number: 92,
        name: 'Uranium',
        mass: '238.03',
        family: 'actinide',
        sfx: 'BOOOM.',
        reply: '',
        crash: true,
      },
    ],
  },
  {
    id: 'implant',
    tag: 'Surgery',
    prompt: "You're building a hip implant. It has to live inside a person for 20 years. Pick a metal.",
    lead: 'Crisis over. Next one.',
    answers: [
      {
        id: 'titanium',
        symbol: 'Ti',
        number: 22,
        name: 'Ti-6Al-4V',
        sub: 'titanium alloy',
        mass: '47.87',
        family: 'transition',
        sfx: 'TING!',
        reply:
          'Correct. Ti-6Al-4V grows a thin, stable oxide layer that repairs itself when scratched, and the body tolerates it.',
        correct: true,
        link: { label: 'Vashisth wrote about exactly this in MSE 302', moon: 'mse-302' },
      },
      {
        id: 'iron',
        symbol: 'Fe',
        number: 26,
        name: 'Plain iron',
        mass: '55.85',
        family: 'transition',
        sfx: 'KRRSSK',
        reply: 'It rusts. Inside a person. No.',
      },
      {
        id: 'sodium',
        symbol: 'Na',
        number: 11,
        name: 'Sodium',
        mass: '22.99',
        family: 'alkali',
        sfx: 'FWOOMP!',
        reply: "Sodium reacts violently with water. You are roughly 60% water. Please don't.",
      },
    ],
  },
  {
    id: 'melt',
    tag: 'Hands on',
    prompt: 'Which metal melts in your hand?',
    lead: 'Last one. Hold out your hand.',
    answers: [
      {
        id: 'gallium',
        symbol: 'Ga',
        number: 31,
        name: 'Gallium',
        mass: '69.72',
        family: 'post-transition',
        sfx: 'DRIP.',
        reply: 'Correct. Gallium melts at 29.76 °C, below body temperature. Hold it long enough and it melts in your palm.',
        correct: true,
      },
      {
        id: 'tungsten',
        symbol: 'W',
        number: 74,
        name: 'Tungsten',
        mass: '183.84',
        family: 'transition',
        sfx: 'CLONK.',
        reply: '3,422 °C. Highest melting point of any metal. Your hand gives up first.',
      },
      {
        id: 'aluminium',
        symbol: 'Al',
        number: 13,
        name: 'Aluminium',
        mass: '26.98',
        family: 'post-transition',
        sfx: 'NOPE.',
        reply: 'Aluminium melts at 660 °C. You run at about 37 °C. Not close.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ Facts */

export const facts: string[] = [
  'Gallium melts at 29.76 °C. Hold it long enough and it melts in your hand.',
  "Graphene is one atom thick. Its Young's modulus is about 1 TPa, roughly five times that of steel.",
  'Stainless steel stays stainless because chromium forms a passive oxide film only a few nanometres thick, and it repairs itself.',
  'Glass is an amorphous solid: its atoms have no long-range order.',
  'Tungsten has the highest melting point of any metal: 3,422 °C.',
  'Mercury is the only metal that is liquid at room temperature.',
  'Diamond and graphite are both pure carbon. Arrangement is everything.',
  'Smaller nanoparticles melt at lower temperatures than the bulk metal. (We simulated this for nickel in MSE 402.)',
  'In the Cu/Nb study presented in MSE 307, yield strength reached about 475 MPa after 7 accumulative roll bonding cycles.',
  'About 90% of the manganese mined worldwide ends up in steel.',
  'Aluminium was once considered more precious than silver. Napoleon III reportedly kept aluminium cutlery for his most honoured guests.',
];

/* --------------------------------------------------------------- Projects */

export interface Chip {
  n: string;
  l: string;
}

export interface Phase {
  id: string;
  label: string;
  title: string;
  summary: string;
  chips: Chip[];
}

export interface Project {
  id: string;
  course: string;
  courseName?: string;
  title: string;
  prof?: string;
  team: string;
  year?: string;
  /** His own part, when the source document names it */
  role?: string;
  note?: string;
  summary: string;
  chips: Chip[];
  fun?: string;
  phases?: Phase[];
}

export const projects: Record<string, Project> = {
  'mse-304': {
    id: 'mse-304',
    course: 'MSE 304',
    courseName: 'Principles of Metal Extraction and Refining',
    title: 'Ferromanganese, from ore to alloy',
    prof: 'Prof. Surya Pratap Mehrotra',
    team: 'with Shubham Saurabh',
    year: '2021',
    summary:
      'A three-phase study of how India makes ferromanganese, the alloy steelmakers use to add manganese. It runs from the market, through upgrading the ore, to the furnace.',
    chips: [
      { n: '3', l: 'phases: market, ore, furnace' },
      { n: '5.15 Mt', l: "India's installed ferroalloy capacity" },
    ],
    phases: [
      {
        id: 'market',
        label: 'Market',
        title: "India's ferroalloy market",
        summary:
          "Mapped India's ferroalloy industry: installed capacity, the main producers, and trade in manganese ore and ferromanganese. Ferromanganese accounts for about 39% of the country's ferroalloy export value.",
        chips: [
          { n: '5.15 Mt', l: "India's installed ferroalloy capacity" },
          { n: '~39%', l: 'of ferroalloy export value is ferromanganese' },
        ],
      },
      {
        id: 'ore',
        label: 'Ore',
        title: 'Upgrading the ore',
        summary:
          'Analysed how manganese and iron ores are upgraded before smelting: gravity, magnetic and flotation separation, and reduction roasting. Iron and manganese minerals have similar densities, which makes gravity separation hard.',
        chips: [{ n: '4', l: 'upgrading routes: gravity, magnetic, flotation, roasting' }],
      },
      {
        id: 'furnace',
        label: 'Furnace',
        title: 'Into the furnace',
        summary:
          "Described production in submerged electric arc furnaces and refining to medium- and low-carbon grades. Profiled Indian plants, including Tata Steel's ferromanganese plant at Joda, Odisha.",
        chips: [{ n: '3', l: 'carbon grades: high, medium, low' }],
      },
    ],
  },
  'mse-307': {
    id: 'mse-307',
    course: 'MSE 307',
    title: 'Cu/Nb multilayer composites by accumulative roll bonding',
    prof: 'Prof. Pradipta Ghosh',
    team: 'with S N Saikumar',
    year: '2022',
    note: 'Presentation of a published study.',
    summary:
      'Presented a published study of copper/niobium sheets made by accumulative roll bonding: how the microstructure evolves over 7 cycles in SEM, IPF and KAM maps, and the Hall-Petch strengthening that follows. The layers formed no intermetallic compounds, even after 7 cycles.',
    chips: [
      { n: '~475 MPa', l: 'yield strength after 7 cycles' },
      { n: '~3x', l: 'pure Cu or Nb, after only 2 cycles' },
    ],
    fun: 'Each cycle rolls the sheet, cuts it in half, stacks the halves and rolls again, so the number of layers doubles every time.',
  },
  'mse-305': {
    id: 'mse-305',
    course: 'MSE 305',
    courseName: 'Advanced Materials',
    title: 'Graphene and CNT reinforced metal matrix composites',
    prof: 'Prof. Superb Mishra',
    team: 'with Durgesh Patil, Abhishek Janagal, Shubham Saurabh',
    year: '2021',
    role: 'Wrote the discussion section.',
    summary:
      'A literature review of how graphene and carbon nanotubes strengthen metals: dispersion, interface bonding (physisorption vs chemisorption), and strengthening by load transfer, thermal mismatch and Hall-Petch. The focus was the interface and how evenly the graphene spreads through the metal.',
    chips: [
      { n: '~1 TPa', l: "graphene's Young's modulus" },
      { n: '2630 m²/g', l: "graphene's surface area" },
    ],
    fun: 'Graphene is a single layer of carbon atoms, so the reinforcement can be one atom thick.',
  },
  'mse-402': {
    id: 'mse-402',
    course: 'MSE 402',
    title: 'Melting and sintering of nickel nanoparticles',
    prof: 'Prof. Raghavan Ranganathan',
    team: 'with Umang Agrawal, Shubham Saurabh',
    year: '2022',
    summary:
      'Modelled nickel nanoparticles with molecular dynamics and an EAM potential, and compared melting point against particle radius (3, 5, 7 and 9 nm) with theory. Then sintered three particles of 2 nm radius and tracked energy per atom and neck growth.',
    chips: [
      { n: '4', l: 'particle sizes melted' },
      { n: '3', l: 'particles sintered together' },
    ],
    fun: 'Smaller particles melt at lower temperatures than bulk nickel, because more of their atoms sit at the surface.',
  },
  'mse-302': {
    id: 'mse-302',
    course: 'MSE 302',
    courseName: 'Corrosion',
    title: 'Corrosion of biomedical implants',
    prof: 'Prof. Sriharitha Rowthu',
    team: 'with Umang Agrawal, Shubham Saurabh',
    year: '2022',
    role: 'Wrote the abstract, discussion and conclusion.',
    summary:
      'Analysed how implant metals such as Ti-6Al-4V and 316L stainless steel corrode in body fluids, covering passive oxide films, wear-corrosion and coatings. Concluded that a stable passive layer plus a coating is the best protection.',
    chips: [
      { n: '15–20+ yrs', l: 'an implant has to last' },
      { n: '2', l: 'alloys in focus: Ti-6Al-4V and 316L' },
    ],
    fun: 'The body is a harsh place for metal: its fluids carry chlorides, phosphates and carbonates.',
  },
  'es-415': {
    id: 'es-415',
    course: 'ES 415',
    title: 'Bioinspired catalysts for renewable energy',
    prof: 'Prof. Raghavan Ranganathan',
    team: 'with Umang Agrawal',
    year: '2023',
    summary:
      'Reviewed enzymatic biofuel cells, photosynthetic biohybrids and eel-inspired membranes that harvest energy where river water meets seawater. Also covered a laccase-inspired copper cathode as a cheaper alternative to platinum for oxygen reduction.',
    chips: [
      { n: '4', l: 'families of bioinspired catalysts' },
      { n: 'Cu', l: 'in place of platinum at the cathode' },
    ],
    fun: 'Electric eels make electricity by moving ions across cell membranes. The membranes reviewed here copy that trick.',
  },
  'ug-research': {
    id: 'ug-research',
    course: 'Undergraduate research',
    title: 'Electrokinetic energy harvesting',
    prof: 'Prof. Gopinathan Kalon',
    team: 'Research project, IIT Gandhinagar',
    summary:
      'Exploratory research on generating electricity from streaming voltage: reviewed 10–15 papers and built a framework mapping the mechanisms. The project was discontinued before publication.',
    chips: [{ n: '10–15', l: 'papers reviewed' }],
    fun: 'A streaming voltage appears when water flows through narrow charged channels and drags ions along with it.',
  },
  'ma-202': {
    id: 'ma-202',
    course: 'MA 202',
    title: 'Euler-Bernoulli beam deflection by finite differences',
    team: 'Group 38, with Durgesh Patil, Shubham Saurabh, Ashok Kumar',
    year: '2021',
    summary:
      'Derived the fourth-order Euler-Bernoulli equation for a beam under a distributed load and solved it with the finite difference method in MATLAB, using Gaussian elimination. Compared the numerical deflection with the analytical solution.',
    chips: [
      { n: '4th', l: 'order differential equation' },
      { n: 'MATLAB', l: 'finite differences and Gaussian elimination' },
    ],
    fun: 'A beam can be strong enough and still fail its design check by bending too much.',
  },
};

/* ---------------------------------------------------------------- Planets */

export interface Moon {
  id: string;
  /** Short label next to the moon */
  label: string;
  project?: string;
  phase?: string;
  /** Wormhole moons link out instead of opening a card */
  href?: string;
  linkTitle?: string;
  linkText?: string;
}

export interface Planet {
  id: string;
  name: string;
  field: string;
  blurb: string;
  moons: Moon[];
}

export const planets: Planet[] = [
  {
    id: 'forge',
    name: 'Forge',
    field: 'Metallurgy',
    blurb: 'Getting metal out of rock, then making it stronger.',
    moons: [
      { id: 'mse-304-market', label: 'Market', project: 'mse-304', phase: 'market' },
      { id: 'mse-304-ore', label: 'Ore', project: 'mse-304', phase: 'ore' },
      { id: 'mse-304-furnace', label: 'Furnace', project: 'mse-304', phase: 'furnace' },
      { id: 'mse-307', label: 'Cu/Nb', project: 'mse-307' },
    ],
  },
  {
    id: 'nano',
    name: 'Nano & Composites',
    field: 'Nanomaterials',
    blurb: 'Materials engineered a few atoms at a time.',
    moons: [
      { id: 'mse-305', label: 'Graphene', project: 'mse-305' },
      { id: 'mse-402', label: 'Ni nano', project: 'mse-402' },
    ],
  },
  {
    id: 'bio',
    name: 'Surfaces & Bio',
    field: 'Corrosion and biomaterials',
    blurb: 'What happens where metal meets the body.',
    moons: [{ id: 'mse-302', label: 'Implants', project: 'mse-302' }],
  },
  {
    id: 'energy',
    name: 'Energy',
    field: 'Energy materials',
    blurb: 'Catalysts, membranes and currents.',
    moons: [
      { id: 'es-415', label: 'Catalysts', project: 'es-415' },
      { id: 'ug-research', label: 'Streaming', project: 'ug-research' },
      {
        id: 'wormhole',
        label: 'Wormhole',
        href: 'ventures/#ch-2',
        linkTitle: 'Solid-state batteries',
        linkText: 'Battery-startup screening, 626 firms. That story lives in Ventures.',
      },
    ],
  },
  {
    id: 'comp',
    name: 'Computation',
    field: 'Numerical methods',
    blurb: 'Equations a computer can solve.',
    moons: [{ id: 'ma-202', label: 'Beams', project: 'ma-202' }],
  },
];

/** Projects in list-view order, grouped by planet. */
export function projectsFor(planet: Planet): Project[] {
  const seen = new Set<string>();
  const out: Project[] = [];
  for (const m of planet.moons) {
    if (m.project && !seen.has(m.project)) {
      seen.add(m.project);
      out.push(projects[m.project]);
    }
  }
  return out;
}

export const projectCount = Object.keys(projects).length;
