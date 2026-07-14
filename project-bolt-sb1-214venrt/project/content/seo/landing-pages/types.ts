/** Shared workspace preset — maps to existing INK_COLORS / PAPER_TYPES ids. */
export type LandingWorkspacePreset = {
  text: string;
  inkId: 'blue' | 'black' | 'red';
  paperId: 'ruled' | 'plain' | 'grid';
};

export type LandingSection = {
  h2: string;
  body: string;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export type HowItWorksStep = {
  step: number;
  title: string;
  body: string;
};

export type LandingCta = {
  headline: string;
  body: string;
};

/**
 * Single source of truth for a programmatic SEO landing page.
 * Add a new object to a batch file + registry — no new React page required.
 */
export type LandingPageConfig = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  problemLead: string;
  audience: string;
  benefits: string[];
  howItWorks: HowItWorksStep[];
  sections: LandingSection[];
  tips: string[];
  examples: string[];
  faqs: LandingFaq[];
  relatedSlugs: string[];
  cta: LandingCta;
  workspace: LandingWorkspacePreset;
};
