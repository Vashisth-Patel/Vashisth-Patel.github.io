/**
 * VENTURES world content: "The life of a company that doesn't exist."
 * Nova (hypothetical) moves through nine stages; each stage pairs with real projects.
 * Every quote, number and teammate here is logged in product/fact-check.md (## Ventures).
 */

export interface Figure {
  /** Big number or short value, e.g. "626 → 6" */
  value: string;
  /** What the value measures, one short phrase */
  label: string;
}

export interface Project {
  id: string;
  title: string;
  /** Course or client · school · year (only what is confirmed) */
  context: string;
  /** "With A, B" or "Team of N"; omitted when unknown */
  team?: string;
  /** One or two sentences: the problem and what was done */
  summary: string;
  /** One line for the plain list view */
  short: string;
  /** 1–3 metric chips (field cards render these as key figures) */
  figures: Figure[];
  /** Large "field project" card. The four client/field projects plus the one real role. */
  kind: 'field' | 'role' | 'course';
}

export interface Quote {
  text: string;
  author: string;
  work: string;
  year: string;
  /** Optional marker shown after the citation, e.g. "excerpt" */
  note?: string;
}

export interface Chapter {
  n: number;
  title: string;
  quote: Quote;
  /** Nova's hypothetical situation, 2–3 sentences */
  nova: string;
  projects: Project[];
}

export const chapters: Chapter[] = [
  {
    n: 1,
    title: 'Spot a problem',
    quote: {
      text: 'It is a familiar and significant saying that a problem well put is half-solved.',
      author: 'John Dewey',
      work: 'Logic: The Theory of Inquiry',
      year: '1938',
    },
    nova:
      'Three materials engineers keep hearing the same complaint from battery makers: separators shrink under heat, and nobody trusts the fixes on offer. Each manufacturer describes the problem a little differently. Before Nova builds anything, it has to state the problem in one sentence that everyone agrees with.',
    projects: [
      {
        id: 'dadar-market',
        title: 'Dadar Vegetable Market, Mumbai',
        context: 'Design Thinking · SPJIMR Global Management Programme · 2024',
        summary:
          'Interviewed vendors and customers at Dadar vegetable market and ran brainstorming sessions with both groups. Identified gaps in market visibility and customer experience, and proposed solutions grounded in that research.',
        short: 'Vendor and customer interviews; market-visibility and customer-experience gaps.',
        figures: [
          { value: '2', label: 'stakeholder groups interviewed' },
        ],
        kind: 'course',
      },
      {
        id: 'telecom-video',
        title: 'Should a telecom stream video?',
        context: 'Problem Solving · EBS MSc',
        team: 'Group 6 with Deepthesh Dev Kanchan, Dhairya Goyal, Priyamvada Lal, Udeept Detha',
        summary:
          '1&1, a German telecom with stalled revenue, was weighing a subscription video service. Structured the question with a problem-identification sheet and a MECE issue tree, benchmarked 7 services, mapped GDPR and licensing hurdles, and recommended building on its OpenRAN network, AI personalisation, local content and bundling.',
        short: 'Whether 1&1 should enter video streaming: issue tree, 7-service benchmark, recommendation.',
        figures: [
          { value: '7', label: 'services benchmarked' },
          { value: 'MECE', label: 'issue tree' },
        ],
        kind: 'course',
      },
    ],
  },
  {
    n: 2,
    title: 'Size the opportunity',
    quote: {
      text: 'Markets that do not exist cannot be analyzed.',
      author: 'Clayton M. Christensen',
      work: 'The Innovator’s Dilemma',
      year: '1997',
    },
    nova:
      'Nova’s coating could serve electric cars, grid storage or power tools, and no report sizes a market for a product that does not exist yet. So the founders count who could buy it: every European cell maker, ranked by fit. Most of the list falls away quickly.',
    projects: [
      {
        id: 'battery-screening',
        title: 'Solid-state battery startup screening',
        context: 'Transformative Technologies · EBS MSc · 2025',
        team: 'Team project',
        summary:
          'A small VC investor wanted to know which next-generation battery startups deserved a closer look. Scanned six chemistries, screened 626 European firms on Tracxn against a 7-dimension weighted scorecard, narrowed the field to 6 solid-state startups and ran due diligence on the top candidate.',
        short: '626 European firms screened with a 7-dimension scorecard; 6 solid-state startups shortlisted.',
        figures: [
          { value: '626 → 6', label: 'European firms screened to a shortlist' },
          { value: '7', label: 'weighted scorecard dimensions' },
          { value: '6', label: 'battery chemistries scanned' },
        ],
        kind: 'field',
      },
    ],
  },
  {
    n: 3,
    title: 'Choose how to enter',
    quote: {
      text: 'The essence of strategy is choosing what not to do.',
      author: 'Michael E. Porter',
      work: 'What Is Strategy?, Harvard Business Review',
      year: '1996',
    },
    nova:
      'Nova could sell coated separators, license the process, or partner with one large cell maker. Each path needs a different team and a different kind of money. The founders pick one and write down the two they are saying no to.',
    projects: [
      {
        id: 'kuka',
        title: 'KUKA Robotics, market entry',
        context: 'Client: KUKA · EBS Master Onboarding Project · Fall 2024',
        team: 'Team of 5 with Yang Zhang, Hiya Sharma, Sakshat Sawant, Sebastian Delles',
        summary:
          'Examined how KUKA could reach small and mid-sized manufacturers, an underpenetrated segment, by moving from hardware towards software-defined products. Compared four software business models, benchmarked ABB, Fanuc and Universal Robots, conducted primary research with industry leaders and system integrators, and designed a three-layer platform: hardware, a digital-twin workflow and a customer-facing interface.',
        short: 'SME market entry via software-defined products; 3-layer platform with app store and customer portal.',
        figures: [
          { value: '4', label: 'software business models compared' },
          { value: '3', label: 'platform layers designed' },
          { value: '3', label: 'robot makers benchmarked' },
        ],
        kind: 'field',
      },
      {
        id: 'carlsberg',
        title: 'Carlsberg in Russia',
        context: 'Contemporary International Management · EBS MSc',
        team: 'With Gaurang Yadav, Samant Bhawan, Hari Sankar Anil',
        summary:
          'Analysed how Carlsberg built its Russian business through joint ventures and acquisitions, and the options it faced when it had to leave in 2022.',
        short: 'Entry through joint ventures and acquisitions, and the exit options in 2022.',
        figures: [
          { value: 'JV + M&A', label: 'entry modes analysed' },
          { value: '2022', label: 'exit options' },
        ],
        kind: 'course',
      },
    ],
  },
  {
    n: 4,
    title: 'Build the product',
    quote: {
      text: 'It’s not just what it looks like and feels like. Design is how it works.',
      author: 'Steve Jobs',
      work: 'quoted in “The Guts of a New Machine”, The New York Times Magazine',
      year: '2003',
    },
    nova:
      'The first prototype performs well in Nova’s lab and badly on a customer’s production line, where it slows the winding step. The fix is in the handover: roll width, tension and labelling. Version two is designed around the customer’s line.',
    projects: [
      {
        id: 'irctc',
        title: 'IRCTC app redesign',
        context: 'Digital Product Management · SPJIMR GMP · 2024',
        team: 'Team of 7',
        summary:
          'Mined user reviews of India’s railway booking app for met and unmet needs, then defined 8 product opportunities, from a one-time captcha and regional languages to a ticket-confirmation probability indicator. Built a value proposition canvas, customer journey map, Figma prototypes, a roadmap and a go-to-market plan.',
        short: 'Review mining to 8 product opportunities, Figma prototypes, roadmap and GTM plan.',
        figures: [
          { value: '8', label: 'product opportunities defined' },
          { value: 'Figma', label: 'prototypes' },
        ],
        kind: 'course',
      },
    ],
  },
  {
    n: 5,
    title: 'Find customers',
    quote: {
      text: 'The aim of marketing is to know and understand the customer so well that the product or service fits him and sells itself.',
      author: 'Peter F. Drucker',
      work: 'Management: Tasks, Responsibilities, Practices',
      year: '1973',
    },
    nova:
      'Large cell makers take years to qualify a new supplier, and Nova needs revenue sooner. It looks for smaller buyers who feel the problem most: e-bike and power-tool battery assemblers. The pitch is rewritten in their words.',
    projects: [
      {
        id: 'promotions',
        title: 'Which promotion actually sells?',
        context: 'MS-491 Social Media Marketing Analytics · IIT Gandhinagar',
        team: 'Group 9 with Deep Thakkar, Meet Thumar, Mitesh Solanki, Nikharv Shah',
        summary:
          'Analysed purchase data from 136 households across 4 biscuit brands in Gretl to test which in-store promotions moved sales. Feature and display together converted best; display alone hurt the private-label brand.',
        short: '136 households, 4 biscuit brands: feature plus display converted best.',
        figures: [
          { value: '136', label: 'households analysed' },
          { value: '4', label: 'brands compared' },
        ],
        kind: 'course',
      },
      {
        id: 'waldmuehle',
        title: 'Waldmühle Rheingau communication strategy',
        context: 'Competitive Strategy · EBS MSc',
        team: 'Solo project',
        summary:
          'Designed positioning and a channel plan for a vegetarian restaurant and event venue. Offline through local festivals, NGOs, yoga sessions and farmers’ markets; online through Instagram, TikTok and local sustainability creators, plus an AI-generated promo video.',
        short: 'Positioning and an offline and online channel plan for a vegetarian venue.',
        figures: [
          { value: 'Offline + online', label: 'channel plan' },
        ],
        kind: 'course',
      },
    ],
  },
  {
    n: 6,
    title: 'Make it run',
    quote: {
      text: 'An hour lost at a bottleneck is an hour lost for the entire system.',
      author: 'Eliyahu M. Goldratt and Jeff Cox',
      work: 'The Goal',
      year: '1984',
    },
    nova:
      'Orders arrive faster than the pilot line can coat. The team adds a second coating head and output barely moves, because every roll still waits for the same curing oven.',
    projects: [
      {
        id: 'laundry',
        title: 'Laundry bottleneck, Mumbai',
        context: 'Operations · SPJIMR GMP · On-site',
        summary:
          'Ran an on-site time-and-motion analysis of a local laundry service, mapping process flow, throughput time and rate, and queue lengths at each step. Found ironing and air-drying to be the bottlenecks and recommended process changes that improved system utilisation by 23%.',
        short: 'Time-and-motion study; ironing and air-drying were the bottlenecks; 23% utilisation gain.',
        figures: [
          { value: '23%', label: 'system utilisation gain' },
          { value: '2', label: 'bottlenecks found: ironing, air-drying' },
        ],
        kind: 'field',
      },
      {
        id: 'physics-mindboggler',
        title: 'Physics Mindboggler',
        context: 'Researcher acquisition · Remote · Feb–\u2060Jun\u00a02025',
        summary:
          'Took ownership of researcher acquisition for an early-stage platform connecting industrial R&D projects with domain experts. Followed up with non-responders to find out why conversion sat at 1%, and found a trust deficit rather than too little outreach. Rebuilt outreach around personalised LinkedIn engagement and systematised it into a 6-stage workflow with KPI dashboards.',
        short: 'Rebuilt researcher outreach into a 6-stage workflow; conversion 1% to 30%.',
        figures: [
          { value: '1% → 30%', label: 'researcher conversion' },
          { value: '16', label: 'experts onboarded' },
          { value: '4', label: 'placed in projects' },
        ],
        kind: 'role',
      },
    ],
  },
  {
    n: 7,
    title: 'Close the loop',
    quote: {
      text: 'Waste equals food.',
      author: 'William McDonough and Michael Braungart',
      work: 'Cradle to Cradle',
      year: '2002',
    },
    nova:
      'A customer asks what happens to Nova’s coated separators when a battery pack is retired. Today the answer is incineration. Nova starts designing a take-back route before a regulator or a competitor asks first.',
    projects: [
      {
        id: 'raguse',
        title: 'RAGUSE circular supply chain',
        context: 'Client: RAGUSE, with INDUS Holding · EBS Consulting Field Project · Spring 2025',
        team: 'Team 5 with Samant Bhawan, Mahi Pillai, Gaurang Yadav, Yumeng Gai, Jiaqi Lin',
        summary:
          'Designed a circular system for single-use surgical drapes made by RAGUSE, a German manufacturer: RFID-tagged products, smart collection bins in hospitals, recycling and upcycling partners, and a governance model. Modelled collection and recycling targets, a breakeven analysis and a 6-month pilot roadmap, presented to client leadership.',
        short: 'RFID-tracked take-back system for surgical drapes; breakeven model and 6-month pilot roadmap.',
        figures: [
          { value: '90%', label: 'collection target modelled' },
          { value: '75%', label: 'recycling yield target' },
          { value: 'Year 4', label: 'modelled break-even' },
        ],
        kind: 'field',
      },
    ],
  },
  {
    n: 8,
    title: 'Build the team',
    quote: {
      text: '…the only thing of real importance that leaders do is to create and manage culture.',
      author: 'Edgar H. Schein',
      work: 'Organizational Culture and Leadership',
      year: '1985',
      note: 'excerpt',
    },
    nova:
      'Nova grows from 6 people to 40 in two years. The founders no longer sit in every hiring conversation, and habits that worked at six start to drift. Hiring, pay and promotion have to be written down for the first time.',
    projects: [
      {
        id: 'gender-diversity',
        title: 'Gender diversity strategy',
        context: 'Diversity Management · EBS MSc',
        team: 'With Ritika Dev Choudhury, Udeept Detha',
        summary:
          'A plan to raise women from 15% to 30% of staff at a financial-services firm within five years: blind recruitment, pay-equity analysis, flexible work, and a 4-phase rollout with KPIs.',
        short: 'Plan to raise women from 15% to 30% of staff in five years.',
        figures: [
          { value: '15% → 30%', label: 'women on staff, target' },
          { value: '4', label: 'rollout phases' },
        ],
        kind: 'course',
      },
      {
        id: 'global-talent',
        title: 'Global talent and retention',
        context: 'Intercultural Management · EBS MSc',
        team: 'With Tanish Sahija, Ritika Dev Choudhury',
        summary:
          'Analysed talent acquisition, development and retention across borders through two cases of expatriate assignments that went wrong.',
        short: 'Cross-border talent acquisition and retention, through two expatriate cases.',
        figures: [{ value: '2', label: 'expatriate cases' }],
        kind: 'course',
      },
      {
        id: 'power-motivation',
        title: 'Power and motivation',
        context: 'Organisational Behaviour · EBS MSc',
        team: 'Team project',
        summary:
          'A case analysis of office politics using expectancy theory. Recommended transparent reviews and checks and balances.',
        short: 'Office politics through expectancy theory; transparent reviews recommended.',
        figures: [{ value: 'Expectancy', label: 'theory' }],
        kind: 'course',
      },
    ],
  },
  {
    n: 9,
    title: 'Reinvent',
    quote: {
      text: 'Business success contains the seeds of its own destruction.',
      author: 'Andrew S. Grove',
      work: 'Only the Paranoid Survive',
      year: '1996',
    },
    nova:
      'A new cell chemistry starts to need less of what Nova sells. Revenue is still growing, which makes the decision harder. Nova has to change while the old business still looks healthy.',
    projects: [
      {
        id: 'nike',
        title: 'Nike’s digital transformation',
        context: 'Organisational Change Management · EBS MSc',
        team: 'With Ritika Dev Choudhury, Tanish Sahija',
        summary:
          'Analysed Nike’s Consumer Direct Acceleration strategy through Lewin’s unfreeze, change, refreeze model.',
        short: 'Nike’s Consumer Direct Acceleration through Lewin’s change model.',
        figures: [{ value: 'Lewin’s', label: 'three-stage change model' }],
        kind: 'course',
      },
      {
        id: 'tata-motors',
        title: 'The Tata Motors turnaround',
        context: 'MS-491 · IIT Gandhinagar · 2022',
        team: 'Group 2 with Aditya Raj, Umang Agrawal, Anshita Kanthed, Agam Patel, Durgesh Patil',
        summary:
          'Used SWOT, Porter’s five forces and value-chain analysis to examine how Tata Motors grew its passenger-vehicle market share from about 4.6% in FY16 to over 12% in FY22, by the company’s own figures.',
        short: 'SWOT, five forces and value chain on Tata Motors’ passenger-vehicle recovery.',
        figures: [{ value: '3', label: 'frameworks: SWOT, five forces, value chain' }],
        kind: 'course',
      },
    ],
  },
];

/** All projects in story order, with the chapter they belong to. */
export const allProjects = chapters.flatMap((c) => c.projects.map((p) => ({ ...p, chapter: c.n, chapterTitle: c.title })));

export const pad = (n: number) => String(n).padStart(2, '0');
