/**
 * Single source of truth for all portfolio content.
 *
 * Everything wrapped in <> is a placeholder — replace it and the whole site
 * updates. Nothing else in the codebase hardcodes copy.
 */

export type PillarId = "build" | "deploy" | "ai";

export const profile = {
  name: "Pratan Nilson",
  shortName: "Pratan",
  roles: ["Software Engineer", "Full-Stack Developer", "AI Engineer"],
  location: "Bangkok, Thailand",
  timezone: "ICT (UTC+7)",
  tagline: "I turn user problems into products that actually ship.",
  /** Alternates kept here so they are easy to swap into the hero. */
  taglineAlternates: [
    "Full-stack engineering, from first commit to production.",
    "Products people use. Systems that hold up.",
  ],
  intro:
    "I'm a full-stack engineer working across frontend, backend, and applied AI. Most recently I built product features for an AI assistant used by over 500,000 people to track their money.",
  bio: [
    "I'm a software engineer in Bangkok, currently finishing a Computer Science degree at Sripatum University while working on products that reach real users. My experience runs across frontend and backend development, plus bringing AI capabilities into live software systems.",
    "Beyond shipping features, I care about understanding user needs, business goals, and system quality. I like looking at the bigger picture, solving problems end to end, and picking up new technology when it leads to a better outcome. My current interests are full-stack development, product development, DevOps, and DevSecOps — building systems that ship efficiently, run reliably, and take security seriously throughout the lifecycle.",
  ],
  email: "sayhixdd@gmail.com",
  resumeUrl: "https://www.linkedin.com/in/pratan-nilson-327a33290/",
  /** Bangkok — drives the contact globe marker. Do not edit unless you move. */
  coordinates: { lat: 13.7563, lng: 100.5018 },
  socials: {
    github: "https://github.com/Sayhighz",
    linkedin: "https://www.linkedin.com/in/pratan-nilson-327a33290/",
    email: "mailto:sayhixdd@gmail.com",
  },
} as const;

/** Hero stat callouts + About section tickers. */
export const stats = [
  { value: 500, suffix: "K+", label: "Users reached", detail: "On an AI assistant I shipped features for" },
  { value: 2, suffix: "+", label: "Years shipping", detail: "Across product, platform and AI work" },
  { value: 5, suffix: "", label: "Competitions placed", detail: "Hackathons and national contests" },
  { value: 20, suffix: "+", label: "Projects built", detail: "Product, coursework and side projects" },
] as const;

export const pillars: {
  id: PillarId;
  index: string;
  title: string;
  kicker: string;
  description: string;
  skills: string[];
  colorVar: string;
}[] = [
  {
    id: "build",
    index: "01",
    title: "Build",
    kicker: "Full-Stack Development",
    description:
      "Product code across the stack — typed frontends and the APIs behind them, built for features people actually use every day.",
    skills: ["TypeScript", "React", "Next.js", "Node.js", "Express", "Python", "FastAPI", "Kotlin"],
    colorVar: "var(--pillar-build)",
  },
  {
    id: "deploy",
    index: "02",
    title: "Deploy",
    kicker: "DevOps & DevSecOps",
    description:
      "Getting work from a branch into production: containerised services, automated pipelines, and security folded into the lifecycle rather than bolted on at the end.",
    skills: ["Docker", "Docker Compose", "GitHub Actions", "Linux", "PostgreSQL", "MySQL", "Redis", "Socket.IO"],
    colorVar: "var(--pillar-deploy)",
  },
  {
    id: "ai",
    index: "03",
    title: "Intelligence",
    kicker: "Applied AI",
    description:
      "LLM features that hold up in front of real users — natural language understanding, automatic categorisation, OCR pipelines, and agents with real tools.",
    skills: ["LLM apps", "LangChain", "OpenAI API", "OpenRouter", "RAG", "Agents", "EasyOCR", "Zero-knowledge proofs"],
    colorVar: "var(--pillar-ai)",
  },
];

/** Marquee logo strip. */
export const techStack = [
  "TypeScript", "JavaScript", "Python", "Kotlin", "React", "Next.js",
  "Node.js", "Express", "FastAPI", "Docker", "PostgreSQL", "MySQL",
  "Redis", "GitHub Actions", "LangChain", "ChromaDB", "React Native", "Socket.IO",
];

export type Project = {
  slug: string;
  title: string;
  pillar: PillarId;
  year: string;
  summary: string;
  problem: string;
  solution: string;
  impact: { metric: string; label: string }[];
  stack: string[];
  links: { github?: string; live?: string };
  /** Path under /public, shown inside a browser mockup. */
  image?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "ai-money-assistant",
    title: "AI Money Assistant at Scale",
    pillar: "ai",
    year: "2026",
    summary:
      "A chat-based assistant that lets 500,000+ people track income and expenses by typing the way they already talk.",
    problem:
      "Personal finance apps ask people to open an app, pick a category and fill in a form for every coffee they buy. Almost nobody keeps that up, so the data goes stale within a week and the app gets deleted.",
    solution:
      "Built product features across frontend and backend for a chat assistant where recording a transaction is one short message — 'ข้าวมันไก่ 45'. An LLM layer handles the natural language understanding and categorises each transaction automatically, so there is no form and no app to switch to. I developed APIs, shipped features, and resolved production issues on a system serving a very large user base.",
    impact: [
      { metric: "500K+", label: "Users on the platform" },
      { metric: "0", label: "Forms to fill in" },
      { metric: "8mo", label: "Shipping product features" },
    ],
    stack: ["TypeScript", "Node.js", "LLM / NLU", "REST APIs", "PostgreSQL"],
    links: {},
    featured: true,
  },
  {
    slug: "zero-id",
    title: "ZeroID — Privacy-Preserving Identity Wallet",
    pillar: "ai",
    year: "2026",
    summary:
      "A digital identity wallet that proves who you are without handing over the data that proves it.",
    problem:
      "Thailand keeps having large personal-data breaches, largely because every verifier stores a full copy of your identity documents just to check one fact — that you are over 20, or that you are a citizen.",
    solution:
      "Built an Android wallet that answers eligibility questions with zero-knowledge proofs instead of raw data. Private keys stay isolated in Samsung Knox Vault via StrongBox-backed Android Keystore, proofs are generated locally with Circom and snarkjs, and a verifier only ever sees true or false. Biometric liveness detection guards against deepfakes at enrolment. Top 20 finalist at the Samsung × KBTG Digital Fraud Cybersecurity Hackathon.",
    impact: [
      { metric: "Top 20", label: "Samsung × KBTG Hackathon" },
      { metric: "0 bytes", label: "Personal data transmitted" },
      { metric: "On-device", label: "Proof generation" },
    ],
    stack: ["Kotlin", "Jetpack Compose", "Circom", "snarkjs", "Android Keystore", "Node.js"],
    links: { github: "https://github.com/Sayhighz/zero-id" },
    featured: true,
  },
  {
    slug: "slideme",
    title: "SlideMe — Tow Truck Service Platform",
    pillar: "build",
    year: "2025",
    summary:
      "Two React Native apps and a realtime backend connecting stranded drivers with nearby tow truck operators.",
    problem:
      "Finding a tow truck in Thailand meant calling around and haggling on price with no visibility into who was actually nearby or what the job should cost. On the operator side, verifying a new driver meant a human reading vehicle registration books and ID cards by hand.",
    solution:
      "Built a two-sided platform: a customer app for requesting a tow with live maps and route preview, a driver app that takes jobs in the background with location tracking and audible alerts, and an Express server matching the two over Socket.IO with JWT auth. Driver onboarding is automated by a companion OCR service trained on Thai documents — it reads licence plates, owner names and ID card details from photos.",
    impact: [
      { metric: "2 apps", label: "Customer and driver, one backend" },
      { metric: "Realtime", label: "Socket.IO job dispatch" },
      { metric: "85-90%", label: "Thai OCR accuracy" },
    ],
    stack: ["React Native", "Expo", "Express", "Socket.IO", "MySQL", "JWT", "Python", "EasyOCR"],
    links: { github: "https://github.com/Sayhighz/SlideMe" },
    featured: true,
  },
  {
    slug: "gapforge",
    title: "GapForge — Evidence-Backed Research Harness",
    pillar: "ai",
    year: "2026",
    summary:
      "A CLI research pipeline that hunts for recurring business problems and makes every claim cite its source.",
    problem:
      "Asking an LLM to find market gaps produces confident, unfalsifiable answers. There is no trail back to evidence and no way to tell a real pattern from a plausible-sounding one.",
    solution:
      "Built a harness that collects and validates sources, keeps full history in PostgreSQL, clusters recurring pain points, and turns them into scored Evidence Cards that then get run through an adversarial critique pass. Python owns workflow state and the safety gates; the Codex CLI is confined to bounded, read-only reasoning, and raw evidence is never executed.",
    impact: [
      { metric: "Cited", label: "Every claim traced to a source" },
      { metric: "Adversarial", label: "Built-in critique pass" },
    ],
    stack: ["Python 3.12", "PostgreSQL 16", "Docker Compose", "uv", "pytest", "Codex CLI"],
    links: { github: "https://github.com/Sayhighz/gapforge" },
  },
  {
    slug: "buddybuilder",
    title: "BuddyBuilder AI — Interior Design Assistant",
    pillar: "build",
    year: "2026",
    summary:
      "A RAG chatbot and agentic pipeline that turns a described room into a validated 3D furniture layout.",
    problem:
      "Asking an LLM to arrange a room gives you plausible prose, not a usable plan — furniture overlaps, walkways get blocked, and nothing checks whether the result would physically fit the space.",
    solution:
      "Built a FastAPI backend in two halves. A RAG chatbot answers interior design questions over a ChromaDB vector store, and a five-step agentic pipeline parses the room spec, generates furniture placements, detects spatial conflicts, repairs them, then explains its reasoning in Thai. Output is JSON ready for 3D rendering, consumed by a Next.js frontend. Structured with domain-driven design so modules can split into services later.",
    impact: [
      { metric: "5 steps", label: "Generate → detect → repair → explain" },
      { metric: "JSON", label: "Render-ready 3D output" },
    ],
    stack: ["Python", "FastAPI", "LangChain", "ChromaDB", "PostgreSQL", "SQLModel", "Next.js", "TypeScript"],
    links: { github: "https://github.com/buddybuilder-ai" },
  },
  {
    slug: "code-quest",
    title: "Code Quest — Learn to Code by Playing",
    pillar: "build",
    year: "2024",
    summary:
      "A browser action-RPG where the only way to move your character is to write real code.",
    problem:
      "Beginners bounce off programming because the feedback loop is abstract — you write a loop, you get a number in a console, and nothing about it feels like it mattered.",
    solution:
      "Built a Phaser 3 game where the player types commands into an editor beside the map and the character executes them. The command set widens as you progress: movement and attacks on the first map, `loop(int){action}` on the second, conditionals on the third — so control flow is introduced as a new ability rather than a new syntax lesson. The editor has line numbers and autocomplete scoped to the commands the current map has unlocked, and the whole thing is in Thai. Semifinalist at the National Software Contest 2024, Central Region.",
    impact: [
      { metric: "Semifinalist", label: "National Software Contest 2024" },
      { metric: "3 maps", label: "Movement → loops → conditionals" },
      { metric: "Thai", label: "Built for local learners" },
    ],
    stack: ["JavaScript", "Phaser 3", "Matter.js", "Tiled", "HTML/CSS"],
    links: { github: "https://github.com/Sayhighz/Jack-Pen-Cowboy" },
  },
];

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const experience: ExperienceItem[] = [
  {
    company: "Parnuan (Intentions Labs Co., Ltd.)",
    role: "Software Engineer",
    period: "Jan 2026 — Aug 2026",
    location: "Thailand",
    summary:
      "Built and maintained product features across frontend and backend for an AI assistant used by more than 500,000 people to record and categorise their income and expenses.",
    highlights: [
      "Shipped features across frontend and backend systems for a product serving a 500,000+ user base.",
      "Integrated AI into product workflows — natural language understanding and automatic transaction categorisation.",
      "Developed APIs, improved system functionality, and resolved production issues.",
      "Worked with product and engineering to deliver features used at large scale.",
    ],
    stack: ["TypeScript", "Node.js", "LLM / NLU", "REST APIs", "PostgreSQL"],
  },
  {
    company: "DevX (Thailand) Co., Ltd.",
    role: "Part-time Frontend Developer",
    period: "Nov 2024 — Feb 2025",
    location: "Thailand · Remote",
    summary:
      "Contributed frontend work to an Internal Audit System built for the Royal Thai Police.",
    highlights: [
      "Developed and improved frontend interfaces against project requirements.",
      "Collaborated remotely with the development team to implement features and resolve technical issues.",
    ],
    stack: ["JavaScript", "React", "HTML/CSS"],
  },
  {
    company: "Sripatum University",
    role: "BSc Computer Science & Software Development Innovation",
    period: "Aug 2023 — Dec 2027",
    location: "Bangkok, Thailand",
    summary:
      "Studying computer science while building competition and product work alongside coursework.",
    highlights: [
      "Runner-up — BRICS E-commerce Operations Data Analysis Competition 2025.",
      "Top 20 Finalist — Samsung × KBTG Digital Fraud Cybersecurity Hackathon.",
      "Top 10 Finalist — AI-Preneur Regional Hackathon 2026, Central Region.",
      "Semifinalist — National Software Contest 2024, Central Region.",
    ],
    stack: ["Python", "JavaScript", "Kotlin", "Data Analysis"],
  },
];

/** Hero terminal — the command that introduces the pipeline metaphor. */
export const terminalLines = [
  { type: "command" as const, text: "deploy pratan --env=production" },
  { type: "log" as const, text: "✓ build      compiled 3 disciplines" },
  { type: "log" as const, text: "✓ deploy     infrastructure reconciled" },
  { type: "log" as const, text: "✓ intelligence  models wired in" },
  { type: "success" as const, text: "Ready in 3s — scroll to inspect." },
];

/**
 * Second-phase hero copy. The left column cross-fades to this as the portrait
 * scrubs into its humanoid form, so the thesis lands at the end of the
 * transformation rather than competing with it at the start.
 */
export const heroTransformCopy = {
  kicker: "intelligence online —",
  headline: "systems.",
  headlineLead: "not",
  headlineStrike: "screens,",
  tagline: "The same three disciplines, wired into one thing that thinks.",
  readout: [
    "build       3 disciplines compiled",
    "deploy      infrastructure reconciled",
    "intelligence  models wired in",
  ],
} as const;

export const navItems = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;
