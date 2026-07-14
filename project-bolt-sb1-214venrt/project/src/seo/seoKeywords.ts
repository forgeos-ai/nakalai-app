/**
 * Programmatic SEO keyword matrix — source of truth for slug landings.
 * Used by the Vite SPA router (App Router–equivalent of app/[slug]/page.tsx).
 */

export type SeoSection = {
  h2: string;
  body: string;
};

export type SeoWorkspacePreset = {
  /** Pre-filled assignment / demo text in the editor */
  text: string;
  /** Matches INK_COLORS id: blue | black | red */
  inkId: string;
  /** Matches PAPER_TYPES id: ruled | plain | grid */
  paperId: string;
};

export type SeoKeywordConfig = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  /** Short lead under the H1 */
  problemLead: string;
  sections: SeoSection[];
  workspace: SeoWorkspacePreset;
};

const SCHOOL_DEMO = `Q1. What is photosynthesis?
Ans. Photosynthesis is the process by which green plants make food using sunlight, water, and carbon dioxide. Chlorophyll in the leaves captures light energy and converts it into chemical energy stored as glucose.

Q2. Name two raw materials of photosynthesis.
Ans. Water and carbon dioxide.`;

const COLLEGE_DEMO = `Aim: To study the effect of load on the extension of a spring.

Theory: Hooke's law states that the extension of a spring is directly proportional to the applied force, within the elastic limit. F = −kx.

Observation: For increasing loads, the measured extension increased linearly until the elastic limit was approached.`;

/** Default when slug is missing from the matrix — never 404. */
export const DEFAULT_SEO_KEYWORD: SeoKeywordConfig = {
  slug: 'handwriting-generator',
  title: 'NakalAI — Free Text to Handwriting Converter for Assignments',
  description:
    'Convert text to handwriting online free. Preview on notebook paper. Unlock 10- or 75-page Standard or Premium Match bundles — write massive records starting at just ₹1.05 per page!',
  h1: 'Text to Handwriting Generator',
  problemLead:
    'Tired of copying assignments by hand? Paste your text below and preview realistic handwriting on A4 notebook paper — free.',
  sections: [
    {
      h2: 'Tired of copying assignments by hand?',
      body: 'Typing is faster. NakalAI turns your typed answers into notebook-style handwriting so you can check layout, ink, and length before you print or download a clean PDF.',
    },
    {
      h2: 'Free preview, page-bundle downloads',
      body: 'Unlimited watermarked previews. Unlock a clean PDF with a 10- or 75-page bundle on Standard fonts or Premium Match My Style. Write massive records starting at just ₹1.05 per page!',
    },
  ],
  workspace: {
    text: SCHOOL_DEMO,
    inkId: 'blue',
    paperId: 'ruled',
  },
};

/** Map: slug → keyword landing configuration */
export const seoKeywords: Record<string, SeoKeywordConfig> = {
  'assignment-handwriting-generator': {
    slug: 'assignment-handwriting-generator',
    title: 'Assignment Handwriting Generator Online | NakalAI',
    description:
      'Generate realistic handwritten assignments from typed text. Free preview on NakalAI. Unlock 10- or 75-page bundles — write massive records starting at just ₹1.05 per page!',
    h1: 'Assignment Handwriting Generator',
    problemLead:
      'Tired of copying assignments by hand? Generate a handwritten look from your typed assignment in seconds.',
    sections: [
      {
        h2: 'Tired of copying assignments by hand?',
        body: 'Paste your assignment or upload a PDF. NakalAI lays text on ruled A4 pages with natural spacing and ink — preview free before you download.',
      },
      {
        h2: 'Built for last-minute assignment drafts',
        body: 'Check page count and neatness instantly. Pay only when you need a watermark-free PDF.',
      },
    ],
    workspace: { text: SCHOOL_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
  'text-to-handwriting': {
    slug: 'text-to-handwriting',
    title: 'Text to Handwriting Converter Online Free | NakalAI',
    description:
      'Convert text to handwriting online for free. Preview on notebook paper, then download a clean handwritten PDF from NakalAI.',
    h1: 'Text to Handwriting Converter',
    problemLead:
      'Convert plain text into realistic handwriting on digital notebook paper — free unlimited preview.',
    sections: [
      {
        h2: 'Paste text, see handwriting instantly',
        body: 'NakalAI converts typed text into cursive or print-style handwriting on A4 preview pages. Adjust ink and paper before you export.',
      },
      {
        h2: 'Why students search for text to handwriting',
        body: 'Typing is faster than rewriting by hand. Preview the handwritten look for drafts and printable notes without starting over.',
      },
    ],
    workspace: {
      text: `The water cycle explains how water moves between the earth and the atmosphere. Evaporation, condensation, and precipitation keep this cycle going every day.

Write neatly and leave a margin on the left side of the page.`,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  'text-to-notebook': {
    slug: 'text-to-notebook',
    title: 'Text to Notebook Paper Online | NakalAI',
    description:
      'Convert text onto ruled notebook paper online. Free A4 preview with NakalAI. Download clean notebook-style PDFs when ready.',
    h1: 'Text to Notebook Converter',
    problemLead:
      'Place typed notes onto ruled notebook pages with realistic handwriting — try it free below.',
    sections: [
      {
        h2: 'Ruled notebook layout for assignments',
        body: 'Blue lines and a pink margin help your text feel like a real notebook page before you print.',
      },
      {
        h2: 'Plain or grid when you need them',
        body: 'Switch paper type in the Look controls. The preview updates immediately.',
      },
    ],
    workspace: { text: SCHOOL_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
  'notebook-generator': {
    slug: 'notebook-generator',
    title: 'Online Notebook Page Generator | NakalAI',
    description:
      'Generate handwritten notebook pages online. Free preview on NakalAI with ruled, plain, or grid paper — pay only to download.',
    h1: 'Notebook Generator',
    problemLead:
      'Fill digital notebook pages from your notes without rewriting everything by hand.',
    sections: [
      {
        h2: 'Fill notebook pages from your notes',
        body: 'Paste notes or extract a PDF. NakalAI paginates across realistic A4 notebook sheets.',
      },
      {
        h2: 'Ink and paper controls',
        body: 'Pick royal blue, black, or red ink and match your college or school notebook format.',
      },
    ],
    workspace: {
      text: `Chapter 4 — Summary Notes

1. Definitions
2. Key formulas
3. Important diagrams (leave space)

Remember to write the date on the top right corner.`,
      inkId: 'black',
      paperId: 'ruled',
    },
  },
  'handwritten-homework-generator': {
    slug: 'handwritten-homework-generator',
    title: 'Handwritten Homework Generator Free | NakalAI',
    description:
      'Create handwritten homework pages from typed text. Free online preview with NakalAI. Page bundles from ₹29 — write massive records starting at just ₹1.05 per page!',
    h1: 'Handwritten Homework Generator',
    problemLead:
      'Tired of copying homework by hand? Generate neat handwritten-looking pages from typed answers.',
    sections: [
      {
        h2: 'Homework that looks handwritten',
        body: 'Ideal for practice worksheets and homework drafts. Type once, preview on notebook paper, download when finished.',
      },
      {
        h2: 'Clear pricing for downloads',
        body: 'Unlimited free previews. Choose 10- or 75-page Standard or Premium Match bundles. Write massive records starting at just ₹1.05 per page!',
      },
    ],
    workspace: { text: SCHOOL_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
  'handwritten-pdf-maker': {
    slug: 'handwritten-pdf-maker',
    title: 'Handwritten PDF Maker Online | NakalAI',
    description:
      'Make a handwritten PDF from text online. Preview free on NakalAI, then download a clean watermark-free PDF.',
    h1: 'Handwritten PDF Maker',
    problemLead:
      'Export typed content as a handwritten-looking PDF — preview free, pay only for a clean file.',
    sections: [
      {
        h2: 'From screen to handwritten PDF',
        body: 'Render high-resolution A4 pages and export when the layout looks right.',
      },
      {
        h2: 'Watermarked preview vs clean export',
        body: 'The preview watermark protects free use. Paying unlocks one clean download pass for that assignment.',
      },
    ],
    workspace: { text: COLLEGE_DEMO, inkId: 'blue', paperId: 'plain' },
  },
  'write-assignment-online': {
    slug: 'write-assignment-online',
    title: 'Write Assignment Online in Handwriting | NakalAI',
    description:
      'Write assignments online and preview them as handwriting. Free on NakalAI — download clean PDFs when you are ready.',
    h1: 'Write Assignment Online',
    problemLead:
      'Compose answers online and see them as handwriting on notebook paper instantly.',
    sections: [
      {
        h2: 'Write faster, present as handwriting',
        body: 'Draft in the editor or extract text from a PDF. NakalAI handles pagination, margins, and handwriting styling.',
      },
      {
        h2: 'Stay ethical with your own words',
        body: 'You provide the content; NakalAI only changes how it looks on the page. Follow your institution’s integrity rules.',
      },
    ],
    workspace: { text: COLLEGE_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
  'pdf-to-handwriting': {
    slug: 'pdf-to-handwriting',
    title: 'PDF to Handwriting Converter Online | NakalAI',
    description:
      'Convert PDF text into handwriting online. Upload one PDF, preview on notebook paper, download a handwritten PDF from NakalAI.',
    h1: 'PDF to Handwriting Converter',
    problemLead:
      'Upload one PDF, restyle the extracted text as handwriting, and preview on notebook paper.',
    sections: [
      {
        h2: 'Upload one PDF, replace the assignment text',
        body: 'Drop a single PDF into the tool. Extracted text becomes your assignment layout — one file, one job.',
      },
      {
        h2: 'Then style and export',
        body: 'Choose paper and ink, optionally Match My Style, preview pages, and download when ready.',
      },
    ],
    workspace: {
      text: `[PDF text will replace this sample]

Use the Upload PDF control in the Text tab to extract your assignment, then preview handwriting here.`,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  'college-assignment-generator': {
    slug: 'college-assignment-generator',
    title: 'College Assignment Handwriting Generator | NakalAI',
    description:
      'Generate college assignment pages in handwriting online. Free preview on NakalAI. Page bundles from ₹29 — bulk from ₹1.05 per page!',
    h1: 'College Assignment Generator',
    problemLead:
      'Format longer college submissions as handwritten A4 pages without rewriting by hand.',
    sections: [
      {
        h2: 'Built for longer college submissions',
        body: 'Long answers paginate across A4 sheets with consistent handwriting styling.',
      },
      {
        h2: 'Match notebook conventions',
        body: 'Use ruled paper and blue ink for a classic college notebook look, or plain sheets when required.',
      },
    ],
    workspace: { text: COLLEGE_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
  'school-assignment-generator': {
    slug: 'school-assignment-generator',
    title: 'School Assignment Handwriting Generator | NakalAI',
    description:
      'Create school assignment handwriting pages online for free preview. Unlock page bundles on NakalAI — bulk from ₹1.05 per page!',
    h1: 'School Assignment Generator',
    problemLead:
      'Tired of copying school assignments by hand? Paste answers and preview neat handwritten pages free.',
    sections: [
      {
        h2: 'Simple flow for school homework',
        body: 'Paste questions and answers, pick blue ink and ruled paper, preview, then download a clean PDF if needed.',
      },
      {
        h2: 'Parents and students both benefit',
        body: 'Typing is easier for long answers. Handwriting preview helps check length and layout before printing.',
      },
    ],
    workspace: { text: SCHOOL_DEMO, inkId: 'blue', paperId: 'ruled' },
  },
};

export const SEO_KEYWORD_SLUGS = Object.keys(seoKeywords);

/** Paths reserved for static trust/blog pages — not keyword canvas landings. */
export const RESERVED_STATIC_SLUGS = new Set([
  'about',
  'privacy',
  'terms',
  'contact',
  'pricing',
  'faq',
  'refund-policy',
  'blog',
  'seo',
  'assets',
  'api',
  'models',
]);
