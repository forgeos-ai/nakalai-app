/**
 * NakalAI SEO page content — source of truth for static HTML generation.
 * Domain: https://nakalai.in
 */

export const SITE = {
  name: 'NakalAI',
  domain: 'https://nakalai.in',
  tagline: 'Text to Handwriting Converter for Assignments',
  email: 'hello@nakalai.in',
  /** @deprecated Prefer scripts/pricingTiers.mjs page bundles */
  priceStandard: 29,
  pricePremium: 49,
};

/** @typedef {{ path: string, title: string, description: string, h1: string, intent: string, sections: {h2: string, body: string}[], faqs: {q: string, a: string}[], related: string[] }} Landing */

/** @type {Landing[]} */
export const LANDINGS = [
  {
    path: '/assignment-handwriting-generator',
    title: 'Assignment Handwriting Generator Online | NakalAI',
    description:
      'Generate realistic handwritten assignments from typed text. Free preview on NakalAI. Unlock 10- or 75-page Standard or Premium Match bundles — write massive records starting at just ₹1.05 per page!',
    h1: 'Assignment Handwriting Generator',
    intent: 'Create handwritten-looking college or school assignments from typed text.',
    sections: [
      {
        h2: 'Turn typed assignments into notebook-style handwriting',
        body: 'Paste your assignment text or upload a PDF. NakalAI lays it out on ruled or plain A4 pages with natural letter spacing, slant, and ink colour — so your draft looks handwritten before you download.',
      },
      {
        h2: 'Free preview, pay only for a clean PDF',
        body: 'Preview is unlimited and watermarked. When you are happy with the page layout, unlock a clean PDF with a 10- or 75-page Standard or Premium Match bundle. Write massive records starting at just ₹1.05 per page!',
      },
      {
        h2: 'Built for students who need readable pages fast',
        body: 'Use it for last-minute submissions, practice drafts, or printable homework pages. You stay in control of the wording; NakalAI only changes how it looks on paper.',
      },
    ],
    faqs: [
      {
        q: 'Is the assignment handwriting generator free?',
        a: 'Yes. You can preview unlimited pages for free. Payment is required only when you download a clean PDF without the preview watermark.',
      },
      {
        q: 'Can I use my own handwriting style?',
        a: 'Yes. Upload a notebook photo with Match My Style to approximate ink, slant, and letter shape. Custom-style downloads use a Premium Match page bundle.',
      },
    ],
    related: ['/text-to-handwriting', '/handwritten-homework-generator', '/college-assignment-generator'],
  },
  {
    path: '/text-to-handwriting',
    title: 'Text to Handwriting Converter Online Free | NakalAI',
    description:
      'Convert text to handwriting online for free. Preview on notebook paper, then download a clean handwritten PDF from NakalAI.',
    h1: 'Text to Handwriting Converter',
    intent: 'Convert plain text into realistic handwriting on digital paper.',
    sections: [
      {
        h2: 'Paste text, see handwriting instantly',
        body: 'NakalAI converts typed text into cursive or print-style handwriting on A4 preview pages. Adjust ink colour and paper type before you export.',
      },
      {
        h2: 'Why students search for text to handwriting',
        body: 'Typing is faster than writing by hand. A text-to-handwriting converter helps you produce a handwritten look for drafts, practice sheets, and printable notes without rewriting everything manually.',
      },
      {
        h2: 'PDF export when you are ready',
        body: 'Keep iterating for free. Download only when the layout looks right — pick a 10- or 75-page Standard or Premium Match bundle (from ₹1.05/page on bulk).',
      },
    ],
    faqs: [
      {
        q: 'Does text to handwriting work on mobile?',
        a: 'Yes. NakalAI is built for mobile and desktop browsers. Open nakalai.in, paste text, and preview on your phone.',
      },
      {
        q: 'Will the handwriting look the same every time?',
        a: 'Natural micro-variation is applied so pages do not look like a flat typed font stamped on paper.',
      },
    ],
    related: ['/text-to-notebook', '/pdf-to-handwriting', '/handwritten-pdf-maker'],
  },
  {
    path: '/text-to-notebook',
    title: 'Text to Notebook Paper Online | NakalAI',
    description:
      'Convert text onto ruled notebook paper online. Free A4 preview with NakalAI. Download clean notebook-style PDFs when ready.',
    h1: 'Text to Notebook Converter',
    intent: 'Place typed content onto ruled notebook-style pages.',
    sections: [
      {
        h2: 'Ruled notebook layout for assignments',
        body: 'Choose Ruled Notebook paper to show blue lines and a pink margin. Your text flows line by line like a real notebook page.',
      },
      {
        h2: 'Plain or grid paper options',
        body: 'Prefer blank sheets or grid paper? Switch paper type in the controls. The handwriting preview updates immediately.',
      },
      {
        h2: 'From draft to printable PDF',
        body: 'Preview as much as you need. Unlock a 10- or 75-page bundle — Standard fonts or Premium Match. Bulk plans start at just ₹1.05 per page!',
      },
    ],
    faqs: [
      {
        q: 'Can I print the notebook pages?',
        a: 'Yes. After download, open the PDF and print on A4 paper. Preview pages include a watermark; paid downloads do not.',
      },
    ],
    related: ['/notebook-generator', '/text-to-handwriting', '/school-assignment-generator'],
  },
  {
    path: '/notebook-generator',
    title: 'Online Notebook Page Generator | NakalAI',
    description:
      'Generate handwritten notebook pages online. Free preview on NakalAI with ruled, plain, or grid paper — pay only to download.',
    h1: 'Notebook Generator',
    intent: 'Generate digital notebook pages filled with handwriting.',
    sections: [
      {
        h2: 'Fill notebook pages from your notes',
        body: 'Upload a PDF or paste notes. NakalAI paginates content across realistic A4 notebook sheets with handwriting styling.',
      },
      {
        h2: 'Ink and paper controls',
        body: 'Pick royal blue, black, or red ink. Match paper to your college or school notebook format before exporting.',
      },
    ],
    faqs: [
      {
        q: 'How many pages can I generate?',
        a: 'As many as your text needs. Long assignments automatically flow across multiple A4 pages in the preview.',
      },
    ],
    related: ['/text-to-notebook', '/assignment-handwriting-generator', '/pricing'],
  },
  {
    path: '/handwritten-homework-generator',
    title: 'Handwritten Homework Generator Free | NakalAI',
    description:
      'Create handwritten homework pages from typed text. Free online preview with NakalAI. Page bundles from ₹29 — write massive records starting at just ₹1.05 per page!',
    h1: 'Handwritten Homework Generator',
    intent: 'Produce homework sheets that look handwritten.',
    sections: [
      {
        h2: 'Homework that looks handwritten',
        body: 'Ideal for practice worksheets and homework drafts. Type once, preview handwriting on notebook paper, then download when finished.',
      },
      {
        h2: 'Clear pricing for downloads',
        body: 'Unlimited free previews. Choose 10- or 75-page Standard or Premium Match bundles. Write massive records starting at just ₹1.05 per page!',
      },
    ],
    faqs: [
      {
        q: 'Is this for school homework only?',
        a: 'It works for school and college homework. Use school- or college-focused flows depending on your assignment style.',
      },
    ],
    related: ['/school-assignment-generator', '/write-assignment-online', '/faq'],
  },
  {
    path: '/handwritten-pdf-maker',
    title: 'Handwritten PDF Maker Online | NakalAI',
    description:
      'Make a handwritten PDF from text online. Preview free on NakalAI, then download a clean watermark-free PDF.',
    h1: 'Handwritten PDF Maker',
    intent: 'Export typed content as a handwritten-looking PDF file.',
    sections: [
      {
        h2: 'From screen to handwritten PDF',
        body: 'NakalAI renders high-resolution pages and exports them as a downloadable PDF suitable for printing or soft submission drafts.',
      },
      {
        h2: 'Watermarked preview vs clean export',
        body: 'The preview watermark protects free use. Paying removes it and unlocks one clean download pass for that assignment content.',
      },
    ],
    faqs: [
      {
        q: 'What PDF size do I get?',
        a: 'Pages are A4. Export uses a high-resolution capture so printed pages stay sharp.',
      },
    ],
    related: ['/pdf-to-handwriting', '/text-to-handwriting', '/pricing'],
  },
  {
    path: '/write-assignment-online',
    title: 'Write Assignment Online in Handwriting | NakalAI',
    description:
      'Write assignments online and preview them as handwriting. Free on NakalAI — download clean PDFs when you are ready.',
    h1: 'Write Assignment Online',
    intent: 'Compose and format assignments online with a handwritten appearance.',
    sections: [
      {
        h2: 'Write faster, present as handwriting',
        body: 'Draft in a text box or extract text from a PDF. NakalAI handles pagination, margins, and handwriting styling for you.',
      },
      {
        h2: 'Stay ethical with your own words',
        body: 'NakalAI does not invent your answers. You provide the content; we only change how it looks on the page.',
      },
    ],
    faqs: [
      {
        q: 'Do I need an account?',
        a: 'No. Upload or enter your content, preview it, pay for the download, and leave. NakalAI does not require an account or student profile.',
      },
    ],
    related: ['/assignment-handwriting-generator', '/college-assignment-generator', '/about'],
  },
  {
    path: '/pdf-to-handwriting',
    title: 'PDF to Handwriting Converter Online | NakalAI',
    description:
      'Convert PDF text into handwriting online. Upload one PDF, preview on notebook paper, download a handwritten PDF from NakalAI.',
    h1: 'PDF to Handwriting Converter',
    intent: 'Extract text from a PDF and restyle it as handwriting.',
    sections: [
      {
        h2: 'Upload one PDF, replace the assignment text',
        body: 'Drop a single PDF into NakalAI. Extracted text overwrites the editor so one file maps to one assignment layout.',
      },
      {
        h2: 'Then style and export',
        body: 'After extraction, choose paper and ink, optionally Match My Style, preview pages, and download when ready.',
      },
    ],
    faqs: [
      {
        q: 'Can I upload multiple PDFs at once?',
        a: 'No. NakalAI accepts one PDF at a time so pagination stays accurate for a single assignment.',
      },
    ],
    related: ['/handwritten-pdf-maker', '/text-to-handwriting', '/assignment-handwriting-generator'],
  },
  {
    path: '/college-assignment-generator',
    title: 'College Assignment Handwriting Generator | NakalAI',
    description:
      'Generate college assignment pages in handwriting online. Free preview on NakalAI. Page bundles from ₹29 — bulk from ₹1.05 per page!',
    h1: 'College Assignment Generator',
    intent: 'Help college students format typed work as handwritten A4 pages.',
    sections: [
      {
        h2: 'Built for longer college submissions',
        body: 'College assignments often span many pages. NakalAI paginates long text across A4 sheets with consistent handwriting styling.',
      },
      {
        h2: 'Match notebook conventions',
        body: 'Use ruled paper and blue ink for a classic college notebook look, or switch to plain sheets when required.',
      },
    ],
    faqs: [
      {
        q: 'Does Match My Style help college work?',
        a: 'Yes. Upload a sample of your notebook writing to better approximate your ink and slant for a Premium Match page bundle.',
      },
    ],
    related: ['/school-assignment-generator', '/write-assignment-online', '/pricing'],
  },
  {
    path: '/school-assignment-generator',
    title: 'School Assignment Handwriting Generator | NakalAI',
    description:
      'Create school assignment handwriting pages online for free preview. Unlock page bundles on NakalAI — bulk from ₹1.05 per page!',
    h1: 'School Assignment Generator',
    intent: 'Help school students produce handwritten-looking homework pages.',
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
    faqs: [
      {
        q: 'Is NakalAI suitable for younger students?',
        a: 'Yes for generating practice pages. Always follow your school rules about how homework should be submitted.',
      },
    ],
    related: ['/handwritten-homework-generator', '/college-assignment-generator', '/faq'],
  },
];

/** @typedef {{ slug: string, title: string, description: string, date: string, h1: string, sections: {h2: string, body: string}[], ctaPath: string }} BlogPost */

/** @type {BlogPost[]} */
export const BLOG_POSTS = [
  {
    slug: 'how-to-write-assignments-faster',
    title: 'How to Write Assignments Faster Without Losing Clarity | NakalAI Blog',
    description:
      'Practical tips to draft assignments faster, then format them for handwriting preview with NakalAI.',
    date: '2026-07-01',
    h1: 'How to Write Assignments Faster',
    sections: [
      {
        h2: 'Outline before you write',
        body: 'Spend five minutes listing headings and bullet answers. A clear outline cuts rewriting time and keeps page length predictable.',
      },
      {
        h2: 'Type the draft first',
        body: 'Typing is usually faster than handwriting. Once the content is solid, use NakalAI to preview how it looks on notebook paper before you print or submit a draft.',
      },
      {
        h2: 'Check layout early',
        body: 'Long paragraphs can overflow pages. Previewing handwriting spacing helps you trim or split sections before the deadline.',
      },
    ],
    ctaPath: '/write-assignment-online',
  },
  {
    slug: 'how-to-convert-text-into-handwriting',
    title: 'How to Convert Text into Handwriting Online | NakalAI Blog',
    description:
      'Step-by-step guide to converting typed text into handwriting using NakalAI’s free preview and PDF download.',
    date: '2026-07-02',
    h1: 'How to Convert Text into Handwriting',
    sections: [
      {
        h2: 'Paste or upload your text',
        body: 'Open NakalAI, paste text into the editor, or upload a single PDF to extract assignment content.',
      },
      {
        h2: 'Choose paper and ink',
        body: 'Select ruled, plain, or grid paper and an ink colour that matches your usual notebook.',
      },
      {
        h2: 'Preview freely, download when ready',
        body: 'Iterate for free. Pick a 10- or 75-page Standard or Premium Match bundle. Write massive records starting at just ₹1.05 per page!',
      },
    ],
    ctaPath: '/text-to-handwriting',
  },
  {
    slug: 'best-ink-color-for-assignments',
    title: 'Best Ink Colour for Assignments: Blue or Black? | NakalAI Blog',
    description:
      'Learn when to use blue vs black ink for assignments and how to preview both in NakalAI.',
    date: '2026-07-03',
    h1: 'Best Ink Colour for Assignments',
    sections: [
      {
        h2: 'Blue ink is the classroom default',
        body: 'Many Indian schools and colleges prefer royal blue gel or ballpoint. It photographs well and looks traditional on ruled paper.',
      },
      {
        h2: 'Black ink for high contrast',
        body: 'Black ink can look sharper in scans. Use it when your teacher accepts it or when printing drafts for clarity.',
      },
      {
        h2: 'Preview both in NakalAI',
        body: 'Switch ink colours in the Look controls and compare before you download a PDF.',
      },
    ],
    ctaPath: '/assignment-handwriting-generator',
  },
  {
    slug: 'how-teachers-check-assignments',
    title: 'How Teachers Check Assignments (And What Students Miss) | NakalAI Blog',
    description:
      'Understand how teachers review handwritten work — neatness, margins, and completeness — and prepare better drafts.',
    date: '2026-07-04',
    h1: 'How Teachers Check Assignments',
    sections: [
      {
        h2: 'Completeness beats decoration',
        body: 'Teachers look for correct answers and full steps first. Fancy pages cannot replace missing content.',
      },
      {
        h2: 'Neat margins and spacing help readability',
        body: 'Crowded lines are harder to mark. Previewing on ruled paper helps you see if answers look cramped.',
      },
      {
        h2: 'Use tools ethically',
        body: 'NakalAI is for formatting your own work. Always follow your institution’s academic integrity rules.',
      },
    ],
    ctaPath: '/faq',
  },
  {
    slug: 'blue-ink-vs-black-ink',
    title: 'Blue Ink vs Black Ink for School Work | NakalAI Blog',
    description:
      'Compare blue ink vs black ink for notebooks and assignments, plus how to preview both on NakalAI.',
    date: '2026-07-05',
    h1: 'Blue Ink vs Black Ink',
    sections: [
      {
        h2: 'Blue reads as “handwritten school work”',
        body: 'Blue remains the cultural default for many notebooks in India. It is a safe choice unless instructions say otherwise.',
      },
      {
        h2: 'Black for forms and scans',
        body: 'Black often reproduces better on photocopies. Useful for worksheets that will be scanned.',
      },
    ],
    ctaPath: '/text-to-notebook',
  },
  {
    slug: 'best-notebook-formats',
    title: 'Best Notebook Formats for Assignments | NakalAI Blog',
    description:
      'Ruled, plain, and grid notebook formats explained — and how to match them in NakalAI’s paper types.',
    date: '2026-07-06',
    h1: 'Best Notebook Formats',
    sections: [
      {
        h2: 'Ruled paper for long answers',
        body: 'Ruled sheets keep handwriting aligned and are the most common for theory subjects.',
      },
      {
        h2: 'Plain paper for diagrams',
        body: 'Use plain sheets when you need space for figures without fighting blue lines.',
      },
      {
        h2: 'Grid paper for maths and graphs',
        body: 'Grid helps plot points and keep columns aligned. NakalAI includes a grid paper option in preview.',
      },
    ],
    ctaPath: '/notebook-generator',
  },
];

export const TRUST_PAGES = [
  {
    path: '/about',
    title: 'About NakalAI — Text to Handwriting for Students',
    description:
      'Learn about NakalAI, the free-preview text-to-handwriting converter for school and college assignments.',
    h1: 'About NakalAI',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | NakalAI',
    description: 'How NakalAI provides private, account-free assignment previews and paid PDF downloads.',
    h1: 'Privacy Policy',
  },
  {
    path: '/terms',
    title: 'Terms of Service | NakalAI',
    description: 'Terms governing free preview use and paid PDF downloads on NakalAI.',
    h1: 'Terms of Service',
  },
  {
    path: '/contact',
    title: 'Contact NakalAI',
    description: 'Contact NakalAI for product questions, privacy requests, or support.',
    h1: 'Contact',
  },
  {
    path: '/pricing',
    title: 'NakalAI Pricing — 10 & 75 Page Bundles from ₹29',
    description:
      'NakalAI page-bundle pricing: Standard and Premium Match plans for 10 or 75 pages. Write massive records starting at just ₹1.05 per page!',
    h1: 'Pricing',
  },
  {
    path: '/faq',
    title: 'NakalAI FAQ — Handwriting Generator Questions',
    description: 'Frequently asked questions about NakalAI previews, PDF downloads, Match My Style, and payments.',
    h1: 'Frequently Asked Questions',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy | NakalAI',
    description: 'NakalAI refund policy for digital PDF download passes.',
    h1: 'Refund Policy',
  },
];

export const GLOBAL_FAQS = [
  {
    q: 'Is NakalAI free to use?',
    a: 'Previewing handwritten pages is free and unlimited. You pay only when you download a clean PDF without the preview watermark.',
  },
  {
    q: 'Why does the preview have a watermark?',
    a: 'The watermark protects free previews. Paying unlocks one clean download for the current assignment content.',
  },
  {
    q: 'What is the difference between ₹19 and ₹49?',
    a: 'Those flat prices are retired. NakalAI now sells page bundles: 10- or 75-page quotas on Standard (platform fonts) or Premium Match My Style. The 75-page Standard plan starts at about ₹1.05 per page for bulk records.',
  },
  {
    q: 'Which bundle should I buy if my assignment is longer than 10 pages?',
    a: 'Choose a 75-page bundle. If your layout measures above 10 pages, checkout highlights the 75-page options automatically — a 10-page tier cannot unlock that download.',
  },
  {
    q: 'What is the difference between Standard and Premium Match bundles?',
    a: 'Standard uses NakalAI platform handwriting fonts. Premium Match applies when Match My Style is active and unlocks custom writing styling for the selected page quota.',
  },
  {
    q: 'Can I match my own handwriting?',
    a: 'Yes. Upload a clear notebook photo under Match My Style. NakalAI estimates ink, slant, and a handwriting family for the preview.',
  },
  {
    q: 'Do you store my assignments?',
    a: 'Assignment text is processed in your browser session for preview and export. NakalAI does not require an account or collect a student profile, name, email, or phone number.',
  },
];
