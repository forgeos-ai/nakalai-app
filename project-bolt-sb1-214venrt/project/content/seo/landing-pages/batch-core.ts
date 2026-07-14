import type { LandingPageConfig } from './types';
import {
  SCHOOL_DEMO,
  COLLEGE_DEMO,
  NOTES_DEMO,
  PDF_PLACEHOLDER,
} from './demos';

export const coreLandingPages: LandingPageConfig[] = [
  {
    slug: 'assignment-handwriting-generator',
    title: 'Assignment Handwriting Generator — NakalAI Free Preview',
    description:
      'Turn typed assignments into realistic handwritten pages with NakalAI. Free preview, then download bundles from ₹29.',
    h1: 'Assignment Handwriting Generator for Students',
    problemLead:
      'Typing an assignment is fast, but many teachers still want neat handwritten submissions. NakalAI bridges that gap by converting your finished text into natural-looking ink on ruled notebook paper—without hours of copying by hand.',
    audience:
      'School and college students who already have typed answers but need a convincing handwritten version for submission or practice.',
    benefits: [
      'Preview every page free before you pay a single rupee',
      'Natural stroke variation that reads like real pen work, not a font',
      'Ruled notebook layout sized for standard A4 printing',
      'Page bundles from ₹29—roughly ₹1.05 per sheet at higher packs',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste your assignment text',
        body: 'Copy questions and answers from Docs, Word, or your notes into the NakalAI workspace. Line breaks are preserved so numbering stays intact.',
      },
      {
        step: 2,
        title: 'Pick ink and paper style',
        body: 'Choose blue or black ink on ruled, plain, or grid paper. Adjust spacing if your teacher prefers tighter or looser lines.',
      },
      {
        step: 3,
        title: 'Preview free, then download',
        body: 'Scroll through the full handwritten preview at no cost. When it looks right, unlock your PDF bundle and print or submit digitally.',
      },
    ],
    sections: [
      {
        h2: 'Why students use a handwriting generator',
        body: 'Handwritten assignments still carry weight in many classrooms. NakalAI lets you focus on content quality first, then produce pages that look carefully written—ideal when deadlines leave no time for manual copying.',
      },
      {
        h2: 'Looks like pen, not a novelty font',
        body: 'Generic handwriting fonts repeat identical letter shapes. NakalAI renders stroke-level variation so margins, slant, and line flow feel like a real notebook page photographed on a desk.',
      },
      {
        h2: 'Affordable page bundles for busy terms',
        body: 'During exam season you might need dozens of sheets. NakalAI page packs start at ₹29, with per-page cost dropping to about ₹1.05 when you buy larger bundles—cheaper than rushing to a print shop.',
      },
    ],
    tips: [
      'Break long answers into short paragraphs so line wraps look natural on ruled paper.',
      'Match ink colour to what your class typically uses—blue is common for school work.',
      'Run a free preview and zoom in on digits and punctuation before purchasing.',
    ],
    examples: [
      'A Class 10 student pastes five short-answer biology responses and downloads a 3-page ruled PDF.',
      'A B.Com student converts a typed case-study summary into blue-ink pages for a file submission.',
    ],
    faqs: [
      {
        question: 'Is the assignment handwriting preview really free?',
        answer:
          'Yes. NakalAI shows the full handwritten preview before checkout. You only pay when you download the final PDF bundle.',
      },
      {
        question: 'Can I use this for long essays?',
        answer:
          'Long text is supported. Very large assignments may span many pages; check the preview page count before buying a bundle.',
      },
      {
        question: 'Will teachers know it was generated?',
        answer:
          'Output mimics natural handwriting variation. Always follow your institution’s academic honesty rules when submitting work.',
      },
      {
        question: 'What file format do I get?',
        answer:
          'You receive a print-ready PDF sized for A4. Open it on any phone or laptop and print at home or a shop.',
      },
      {
        question: 'How much do page bundles cost?',
        answer:
          'Bundles start at ₹29. Larger packs bring the effective rate to about ₹1.05 per page.',
      },
      {
        question: 'Can I edit text after generating?',
        answer:
          'Change your source text in the workspace and regenerate. Each new preview is free until you download again.',
      },
    ],
    relatedSlugs: [
      'write-assignment-online',
      'handwritten-homework-generator',
      'school-assignment-generator',
      'assignment-pdf-generator',
    ],
    cta: {
      headline: 'Generate your assignment handwriting now',
      body: 'Paste your text, preview every page free on NakalAI, and unlock affordable bundles from ₹29 when you are ready.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'write-assignment-online',
    title: 'Write Assignment Online — Handwritten Output | NakalAI',
    description:
      'Write and format assignments online, then export realistic handwriting with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Write Assignments Online and Export Handwriting',
    problemLead:
      'Switching between typing tools and blank notebooks slows you down. NakalAI keeps writing online while still delivering pages that look hand-copied—perfect when you draft digitally but submit on paper.',
    audience:
      'Students who compose assignments in browsers or cloud docs and want a single flow from draft to handwritten PDF.',
    benefits: [
      'Draft online without installing desktop software',
      'Instant free preview of every handwritten page',
      'College-friendly ruled layouts for lab summaries and theory',
      'Pay only for downloads—page packs from ₹29 upward',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Compose in the browser workspace',
        body: 'Type or paste your assignment directly into NakalAI. Headings, numbered lists, and paragraph breaks carry through to the notebook view.',
      },
      {
        step: 2,
        title: 'Tune paper and ink settings',
        body: 'Select ruled paper for standard submissions or plain sheets for diagrams-heavy work. Blue ink suits most university files.',
      },
      {
        step: 3,
        title: 'Review and export',
        body: 'Walk through the free preview page by page. Purchase a bundle only when spacing, margins, and ink colour meet your needs.',
      },
    ],
    sections: [
      {
        h2: 'One tab for writing and handwriting',
        body: 'Instead of exporting to Word, printing, and tracing, NakalAI collapses the workflow: edit online, see ink immediately, and download when satisfied.',
      },
      {
        h2: 'Built for college submission formats',
        body: 'Experiment write-ups, short theory answers, and observation notes fit cleanly on ruled pages. Line density options help match departmental expectations.',
      },
      {
        h2: 'Transparent pricing before download',
        body: 'The preview costs nothing. When you commit, NakalAI bundles start at ₹29—with larger packs averaging near ₹1.05 per page for heavy semesters.',
      },
    ],
    tips: [
      'Use blank lines between questions so the online editor and final notebook stay aligned.',
      'Preview the first and last page—teachers often skim those for neatness.',
      'Save your source text separately so you can regenerate after edits without retyping.',
    ],
    examples: [
      'A physics student writes Hooke’s law procedure online and downloads a 2-page blue-ink PDF.',
      'An arts student formats a critique essay and exports black-ink plain paper for a portfolio scan.',
    ],
    faqs: [
      {
        question: 'Do I need to install anything to write online?',
        answer:
          'No. NakalAI runs in your browser on phone or computer. Paste text and preview handwriting immediately.',
      },
      {
        question: 'Can I work on mobile?',
        answer:
          'Yes. The workspace is responsive. Long assignments are easier on a laptop, but quick edits work on mobile.',
      },
      {
        question: 'Is there a word limit?',
        answer:
          'There is no small cap for typical student work. Extremely long theses may need multiple preview scrolls.',
      },
      {
        question: 'When am I charged?',
        answer:
          'Browsing and previewing are free. Payment applies only when you download the finished PDF bundle.',
      },
      {
        question: 'Can I switch ink colour after writing?',
        answer:
          'Change ink in settings and regenerate the preview at no cost until you download.',
      },
      {
        question: 'Does it support Hindi or mixed language text?',
        answer:
          'Unicode text is supported. Preview mixed-language assignments to confirm spacing looks correct.',
      },
    ],
    relatedSlugs: [
      'assignment-handwriting-generator',
      'college-assignment-generator',
      'text-to-assignment',
      'handwritten-assignment-online',
    ],
    cta: {
      headline: 'Start writing your assignment online',
      body: 'Open NakalAI, draft in the browser, and preview handwritten pages free before choosing a bundle from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'text-to-handwriting',
    title: 'Text to Handwriting Converter — NakalAI Free Preview',
    description:
      'Convert plain text into realistic handwritten notebook pages with NakalAI. Free preview, PDF bundles from ₹29.',
    h1: 'Text to Handwriting — Realistic Notebook Pages',
    problemLead:
      'You already have the words—maybe in a chat, email, or study notes—but you need them on paper. NakalAI converts any pasted text into believable pen strokes without retyping line by line.',
    audience:
      'Anyone with digital text who needs a handwritten appearance for study, submission, or printing.',
    benefits: [
      'Paste from any source—PDFs, websites, or notes apps',
      'Stroke-level realism instead of repetitive font loops',
      'Free full-page preview before purchase',
      'Economical bundles from ₹29, about ₹1.05 per page at scale',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Insert your plain text',
        body: 'Drop copied paragraphs into NakalAI. Bullet points and numbered lines are respected in the layout engine.',
      },
      {
        step: 2,
        title: 'Choose notebook styling',
        body: 'Pick ruled or plain paper and blue, black, or red ink depending on how you want the page to read.',
      },
      {
        step: 3,
        title: 'Convert and download',
        body: 'Watch the text-to-handwriting transformation in the free preview. Download the PDF bundle when the flow looks natural.',
      },
    ],
    sections: [
      {
        h2: 'From clipboard to notebook in minutes',
        body: 'Manual transcription errors waste time. NakalAI maps your existing text onto notebook lines with consistent margins and realistic letter joins.',
      },
      {
        h2: 'Better than handwriting fonts',
        body: 'TrueType handwriting fonts cycle the same glyphs. NakalAI varies strokes so repeated letters do not look cloned—a common giveaway with basic converters.',
      },
      {
        h2: 'Preview-first pricing',
        body: 'See every converted page before spending. Starter bundles begin at ₹29; bulk packs bring the unit cost down to roughly ₹1.05 per sheet.',
      },
    ],
    tips: [
      'Remove double spaces from copied web text—they can create awkward gaps on ruled lines.',
      'For lists, use simple dashes or numbers so wrapping stays predictable.',
      'Try both blue and black ink in preview to see which scans better on your printer.',
    ],
    examples: [
      'A coaching student converts typed revision points into a 4-page handwritten summary.',
      'A freelancer turns meeting bullet notes into plain-paper ink pages for a client binder.',
    ],
    faqs: [
      {
        question: 'What text formats can I paste?',
        answer:
          'Plain text from any app works. Formatting like bold may strip to text, which is ideal for notebook output.',
      },
      {
        question: 'How realistic is text-to-handwriting output?',
        answer:
          'NakalAI focuses on natural variation in slant, spacing, and stroke weight—not flat font simulation.',
      },
      {
        question: 'Is the preview unlimited?',
        answer:
          'You can regenerate previews freely while editing. Charges apply only to PDF downloads.',
      },
      {
        question: 'Can I convert very short snippets?',
        answer:
          'Yes. Even a single paragraph converts. Pricing is per downloaded page, not per session.',
      },
      {
        question: 'What paper types are available?',
        answer:
          'Choose ruled, plain, or grid backgrounds to match lab books, essays, or math work.',
      },
      {
        question: 'Will line breaks stay where I put them?',
        answer:
          'Manual line breaks are preserved. Long lines wrap automatically to the next ruled row.',
      },
    ],
    relatedSlugs: [
      'convert-notes-to-handwriting',
      'ai-handwriting-generator',
      'realistic-handwriting-generator',
      'text-to-notebook',
    ],
    cta: {
      headline: 'Convert your text to handwriting',
      body: 'Paste any text into NakalAI, review the free preview, and download affordable page bundles starting at ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'blue',
      paperId: 'plain',
    },
  },
  {
    slug: 'text-to-notebook',
    title: 'Text to Notebook Pages — NakalAI Handwriting Tool',
    description:
      'Turn digital text into ruled notebook pages with NakalAI. Free preview, then print-ready PDFs from ₹29 per bundle.',
    h1: 'Text to Notebook — Ruled Pages Ready to Print',
    problemLead:
      'Digital notes are searchable, but notebooks still win for revision and submission. NakalAI transforms typed study material into lined pages that look like you wrote them during lecture.',
    audience:
      'Students building revision notebooks from typed summaries, definitions, and exam pointers.',
    benefits: [
      'Ruled notebook layout with realistic line adherence',
      'Free scroll-through preview of the full notebook export',
      'Works for unit summaries, formulas, and definition lists',
      'Bundle pricing from ₹29—near ₹1.05 per page on larger packs',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste study text',
        body: 'Add chapter summaries or Q&A sets into NakalAI. Section headings help the engine break pages cleanly.',
      },
      {
        step: 2,
        title: 'Set ruled paper defaults',
        body: 'Ruled paper is pre-selected for notebook mode. Adjust ink to blue for everyday notes or black for formal submissions.',
      },
      {
        step: 3,
        title: 'Export notebook PDF',
        body: 'Verify page breaks in the free preview, then download and bind or clip pages like a regular notebook.',
      },
    ],
    sections: [
      {
        h2: 'Notebook aesthetics without manual copying',
        body: 'Rewriting an entire unit by hand can take a whole evening. NakalAI fills ruled sheets from your typed master copy while keeping a consistent hand.',
      },
      {
        h2: 'Structured pages for revision',
        body: 'Headings sit on their own lines, bullet concepts wrap neatly, and margins match what teachers expect in spiral-bound books.',
      },
      {
        h2: 'Student-friendly bundle costs',
        body: 'Preview everything first. When you buy, NakalAI packs start at ₹29—making multi-chapter notebooks affordable at roughly ₹1.05 per printed page.',
      },
    ],
    tips: [
      'Group related definitions under a single heading to avoid orphan lines at page bottoms.',
      'Leave one empty line before major units so the notebook breathes visually.',
      'Print double-sided only after checking bleed in the free preview.',
    ],
    examples: [
      'An economics student exports Unit 3 market-structure notes onto 5 ruled pages.',
      'A NEET aspirant turns a typed formula sheet into a pocket notebook PDF.',
    ],
    faqs: [
      {
        question: 'Does text-to-notebook use ruled lines automatically?',
        answer:
          'Yes. This flow defaults to ruled paper. You can switch to plain or grid in settings.',
      },
      {
        question: 'Can I make multiple chapters in one file?',
        answer:
          'Paste all chapters together. Use headings so page breaks fall at sensible points.',
      },
      {
        question: 'Is preview free for long notebooks?',
        answer:
          'Every page previews free regardless of length. You pay only when downloading.',
      },
      {
        question: 'Will math symbols convert correctly?',
        answer:
          'Unicode symbols paste fine. Complex equations may need spacing tweaks—check preview zoom.',
      },
      {
        question: 'How do bundles work?',
        answer:
          'Choose a pack that covers your page count. Entry bundles start at ₹29 with better per-page rates on bigger packs.',
      },
      {
        question: 'Can I reuse the same text for a friend?',
        answer:
          'Each download is tied to your account purchase. Regenerate previews anytime for your own edits.',
      },
    ],
    relatedSlugs: [
      'notebook-generator',
      'ruled-notebook-generator',
      'handwritten-notes-generator',
      'text-to-handwriting',
    ],
    cta: {
      headline: 'Build your notebook from text',
      body: 'Paste study notes into NakalAI, preview ruled pages free, and unlock PDF bundles from ₹29 when ready.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'black',
      paperId: 'ruled',
    },
  },
  {
    slug: 'notebook-generator',
    title: 'Notebook Generator Online — NakalAI Handwriting',
    description:
      'Generate ruled notebook pages from typed content with NakalAI. Free preview, affordable PDF bundles from ₹29.',
    h1: 'Online Notebook Generator for Typed Content',
    problemLead:
      'Buying blank notebooks is easy; filling them with neat, consistent handwriting is not. NakalAI generates notebook pages from your text so every sheet matches the same legible style.',
    audience:
      'Students and self-learners who want printable notebook pages without writing each line manually.',
    benefits: [
      'Generate multi-page notebooks from one paste action',
      'Consistent handwriting style across every sheet',
      'Ruled, plain, and grid paper options',
      'Free preview; downloads from ₹29 (~₹1.05/page in bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Add notebook content',
        body: 'Enter notes, assignments, or journal entries. NakalAI treats each paragraph as notebook prose.',
      },
      {
        step: 2,
        title: 'Configure page type',
        body: 'Select ruled lines for school work or plain paper for sketch-plus-text layouts.',
      },
      {
        step: 3,
        title: 'Generate and print',
        body: 'Use the free preview to count pages, then download a PDF bundle and print at home.',
      },
    ],
    sections: [
      {
        h2: 'Printable notebooks on demand',
        body: 'Instead of a fixed 200-page spiral, generate exactly the sheets you need for one unit test or one week of lecture notes.',
      },
      {
        h2: 'Uniform handwriting across chapters',
        body: 'Hand fatigue changes your script mid-notebook. NakalAI keeps stroke style steady from page one to page fifty.',
      },
      {
        h2: 'Low cost for custom page counts',
        body: 'Because you preview first, you never over-buy. Bundles from ₹29 scale to about ₹1.05 per page when you plan a full term upfront.',
      },
    ],
    tips: [
      'Number pages in your source text if you need a table of contents later.',
      'For grid notebooks, switch paper type before previewing math-heavy sections.',
      'Buy a slightly larger bundle if you expect edits—you can regenerate before re-downloading.',
    ],
    examples: [
      'A history student generates a 12-page ruled notebook for one semester’s weekly summaries.',
      'A language learner creates plain-paper vocabulary notebooks with English and translated terms.',
    ],
    faqs: [
      {
        question: 'How is this different from text-to-notebook?',
        answer:
          'Both produce lined pages. Notebook generator emphasizes multi-page printable sets and consistent styling across long content.',
      },
      {
        question: 'Can I mix ruled and plain in one PDF?',
        answer:
          'One export uses one paper type. Generate separate previews for mixed layouts.',
      },
      {
        question: 'What is the minimum page count?',
        answer:
          'Even a single page generates. Pricing follows downloaded pages, not a minimum order.',
      },
      {
        question: 'Do I need a printer at home?',
        answer:
          'You get a PDF. Print at home or at a shop—A4 sizing is standard.',
      },
      {
        question: 'Are regenerations free?',
        answer:
          'Preview regenerations are free. You pay again only if you download a new bundle after major changes.',
      },
      {
        question: 'Can teachers use this for handouts?',
        answer:
          'Educators can generate sample notebook pages for demos. Check school policy before distributing student-facing material.',
      },
    ],
    relatedSlugs: [
      'text-to-notebook',
      'unruled-notebook-generator',
      'ruled-notebook-generator',
      'handwritten-notes-generator',
    ],
    cta: {
      headline: 'Generate your notebook pages',
      body: 'Type or paste content in NakalAI, preview the full notebook free, and download bundles from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'handwritten-pdf-maker',
    title: 'Handwritten PDF Maker — NakalAI Free Page Preview',
    description:
      'Create handwritten-style PDFs from text or uploaded files with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Handwritten PDF Maker for Assignments',
    problemLead:
      'Teachers increasingly accept PDFs, but typed PDFs feel impersonal. NakalAI produces handwritten-style PDFs you can email or upload to portals—after checking every page in a free preview.',
    audience:
      'Students submitting digital files who still want the appearance of pen-on-paper work.',
    benefits: [
      'PDF output optimized for A4 viewing and printing',
      'Upload source PDFs to extract text automatically',
      'Full-document preview before any payment',
      'Page bundles from ₹29 with per-page savings at volume',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Upload or paste source material',
        body: 'Use the PDF upload control to extract assignment text, or paste manually if you already cleaned it up.',
      },
      {
        step: 2,
        title: 'Style as handwritten pages',
        body: 'Pick ink and paper. NakalAI reflows extracted content onto notebook-style sheets inside the PDF layout.',
      },
      {
        step: 3,
        title: 'Download the handwritten PDF',
        body: 'Confirm page order in the free preview, then unlock the bundle and share the file directly.',
      },
    ],
    sections: [
      {
        h2: 'PDF submissions that look handwritten',
        body: 'Portal uploads often reject photos of messy notebooks. A crisp handwritten PDF balances authenticity with readable scans.',
      },
      {
        h2: 'Extract text from existing PDFs',
        body: 'When assignments arrive as digital PDFs, NakalAI pulls text out so you do not retype problem statements—then renders them in ink.',
      },
      {
        h2: 'Know the cost before checkout',
        body: 'Scroll the entire preview gratis. Paid bundles start at ₹29, with effective rates near ₹1.05 per page on larger packs.',
      },
    ],
    tips: [
      'After PDF upload, skim extracted text for missing symbols before styling.',
      'Name your download clearly—CourseName_Assignment_Handwritten.pdf helps professors.',
      'Compare file size limits on your college portal before uploading.',
    ],
    examples: [
      'A student uploads a question PDF and exports handwritten answers as a 6-page submission file.',
      'An intern converts typed meeting notes into a handwritten PDF for a manager who prefers ink-style memos.',
    ],
    faqs: [
      {
        question: 'Can NakalAI read scanned PDFs?',
        answer:
          'Text-based PDFs extract best. Scanned image PDFs may need OCR elsewhere before paste.',
      },
      {
        question: 'Is the handwritten PDF searchable?',
        answer:
          'Output is visual handwriting rendered to PDF—expect image-like pages rather than selectable typed text.',
      },
      {
        question: 'What resolution is the PDF?',
        answer:
          'Pages target clear A4 printing. Zoom the free preview to verify readability.',
      },
      {
        question: 'How many pages can one PDF have?',
        answer:
          'Long documents split across many pages. Preview shows the total before you buy a bundle.',
      },
      {
        question: 'Can I merge with other PDFs?',
        answer:
          'Use external PDF tools to merge after download. NakalAI exports your handwritten section as one file.',
      },
      {
        question: 'When do I pay?',
        answer:
          'Preview is free. Payment triggers on bundle download, starting at ₹29.',
      },
    ],
    relatedSlugs: [
      'assignment-pdf-generator',
      'pdf-to-handwriting',
      'a4-handwriting-generator',
      'pdf-to-notebook',
    ],
    cta: {
      headline: 'Make your handwritten PDF',
      body: 'Upload or paste into NakalAI, preview every page free, and download PDF bundles from ₹29.',
    },
    workspace: {
      text: PDF_PLACEHOLDER,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'handwritten-homework-generator',
    title: 'Handwritten Homework Generator — NakalAI for Students',
    description:
      'Generate handwritten homework pages from typed answers with NakalAI. Free preview, page bundles from ₹29.',
    h1: 'Handwritten Homework Generator — Fast Submissions',
    problemLead:
      'Homework due tomorrow should not mean wrist pain tonight. NakalAI turns finished typed answers into homework sheets that look carefully written in blue ink on ruled paper.',
    audience:
      'School students with daily homework in subjects like science, social studies, and language.',
    benefits: [
      'Homework-sized outputs—short Q&A sets to multi-page essays',
      'Kid-friendly ruled spacing for clear teacher marking',
      'Free preview so parents can check before paying',
      'Affordable packs from ₹29, about ₹1.05 per page in bulk',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Enter homework answers',
        body: 'Paste questions and answers from your textbook photo transcriptions or typed drafts.',
      },
      {
        step: 2,
        title: 'Use school-style defaults',
        body: 'Blue ink on ruled paper matches common homework notebooks in many Indian schools.',
      },
      {
        step: 3,
        title: 'Print or submit',
        body: 'Preview free, then download and staple pages for class or photograph for WhatsApp submission.',
      },
    ],
    sections: [
      {
        h2: 'Homework nights without hand cramps',
        body: 'Focus on getting answers right first. NakalAI handles the repetitive copying so you still submit neat handwritten work.',
      },
      {
        h2: 'Readable for teacher corrections',
        body: 'Line spacing leaves room for red-pen marks. Margins align so teachers can tick answers without overlapping text.',
      },
      {
        h2: 'Budget-friendly for daily use',
        body: 'Frequent homework adds up. NakalAI bundles from ₹29 keep costs predictable—large packs drop toward ₹1.05 per sheet.',
      },
    ],
    tips: [
      'Copy question numbers exactly as the worksheet shows for easy teacher cross-check.',
      'Keep answers concise—long pasted paragraphs may push homework to extra pages.',
      'Photograph printed pages in daylight if submitting images instead of PDFs.',
    ],
    examples: [
      'A Class 8 student generates 2 pages of science homework on photosynthesis.',
      'A Class 6 learner converts maths word-problem answers into ruled handwriting sheets.',
    ],
    faqs: [
      {
        question: 'Is this suitable for primary school homework?',
        answer:
          'Yes, for typed or pasted content. Younger students should still understand answers they submit.',
      },
      {
        question: 'Can I do one subject tonight and another tomorrow?',
        answer:
          'Each session is independent. Preview each homework set free before downloading.',
      },
      {
        question: 'Will ruled lines show when I photograph pages?',
        answer:
          'Yes. Ruled backgrounds print lightly so photos look like real notebook pages.',
      },
      {
        question: 'How fast is generation?',
        answer:
          'Preview renders in seconds for typical homework length. Long chapters take a few extra moments.',
      },
      {
        question: 'Do bundles expire?',
        answer:
          'Check current NakalAI policy at checkout. Downloads are generally available after purchase for re-print.',
      },
      {
        question: 'Can parents preview before paying?',
        answer:
          'Absolutely. The full homework preview is free so guardians can verify content.',
      },
    ],
    relatedSlugs: [
      'homework-writer',
      'school-assignment-generator',
      'assignment-handwriting-generator',
      'student-assignment-maker',
    ],
    cta: {
      headline: 'Generate homework handwriting tonight',
      body: 'Paste answers in NakalAI, preview homework pages free, and unlock bundles from ₹29 when it looks right.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'pdf-to-handwriting',
    title: 'PDF to Handwriting Converter — NakalAI Online Tool',
    description:
      'Convert PDF text into realistic handwriting pages with NakalAI. Upload, preview free, download from ₹29.',
    h1: 'PDF to Handwriting — Upload and Convert',
    problemLead:
      'Assignments often arrive as PDF attachments. Retyping them wastes hours. NakalAI extracts readable text from PDFs and redraws it as handwriting on notebook paper you can preview for free.',
    audience:
      'Students who receive question papers or reading PDFs and need handwritten answer sheets.',
    benefits: [
      'PDF upload extracts text into the handwriting workspace',
      'Preserves paragraph structure from the source document',
      'Free multi-page preview before buying',
      'Bundles from ₹29—effective ₹1.05 per page on larger packs',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Upload your PDF',
        body: 'Use the Text tab upload control. NakalAI pulls extractable text into the editor for review.',
      },
      {
        step: 2,
        title: 'Edit and configure ink',
        body: 'Fix any extraction gaps, then choose ink colour and ruled or plain paper for the handwriting pass.',
      },
      {
        step: 3,
        title: 'Convert to handwriting PDF',
        body: 'Inspect the conversion in the free preview. Download when handwriting layout matches your needs.',
      },
    ],
    sections: [
      {
        h2: 'Skip retyping PDF assignments',
        body: 'When professors share typed PDFs, copying questions by hand doubles the work. Extraction plus handwriting conversion keeps you on answer quality.',
      },
      {
        h2: 'Review extracted text before ink',
        body: 'The editor step catches missing bullets or symbols. Small fixes upfront prevent surprises in the final handwritten export.',
      },
      {
        h2: 'Pay after you see the conversion',
        body: 'PDF-to-handwriting preview is unlimited before purchase. Starter bundles at ₹29 scale down to roughly ₹1.05 per page.',
      },
    ],
    tips: [
      'For two-column PDFs, paste columns separately if extraction order looks jumbled.',
      'Replace placeholder brackets in lab PDFs before converting to handwriting.',
      'If extraction fails, paste manually—handwriting still works the same way.',
    ],
    examples: [
      'A student uploads a 3-page tutorial PDF and converts discussion questions to handwritten responses.',
      'A law student extracts case summary text and exports black-ink plain pages for annotations.',
    ],
    faqs: [
      {
        question: 'Does PDF to handwriting work on phone?',
        answer:
          'Upload works on modern mobile browsers. Editing long PDF text is easier on desktop.',
      },
      {
        question: 'What if my PDF is password protected?',
        answer:
          'Remove protection or copy text manually before upload. Locked files cannot extract.',
      },
      {
        question: 'Are images in PDFs converted?',
        answer:
          'Text extraction only. Paste descriptions of figures separately if needed.',
      },
      {
        question: 'Can I convert only part of a PDF?',
        answer:
          'Delete unwanted paragraphs in the editor after extraction, then preview handwriting.',
      },
      {
        question: 'Is OCR included?',
        answer:
          'Native PDF text extracts directly. Scanned pages may need external OCR first.',
      },
      {
        question: 'How is pricing calculated?',
        answer:
          'By downloaded handwritten pages. Preview free; bundles from ₹29 based on page count.',
      },
    ],
    relatedSlugs: [
      'pdf-to-notebook',
      'handwritten-pdf-maker',
      'assignment-pdf-generator',
      'text-to-handwriting',
    ],
    cta: {
      headline: 'Convert your PDF to handwriting',
      body: 'Upload to NakalAI, fix text if needed, preview free, and download bundles from ₹29.',
    },
    workspace: {
      text: PDF_PLACEHOLDER,
      inkId: 'black',
      paperId: 'plain',
    },
  },
  {
    slug: 'pdf-to-notebook',
    title: 'PDF to Notebook Converter — NakalAI Ruled Pages',
    description:
      'Transform PDF content into ruled notebook handwriting with NakalAI. Free preview, PDF bundles from ₹29.',
    h1: 'PDF to Notebook — Ruled Handwriting Export',
    problemLead:
      'Course PDFs are convenient to read but hard to annotate like a lecture notebook. NakalAI maps extracted PDF text onto ruled pages with consistent handwriting for study binders.',
    audience:
      'College students turning slide PDFs or reading packs into handwritten revision notebooks.',
    benefits: [
      'PDF extract flows directly into ruled notebook layout',
      'Handwriting styled for dense academic paragraphs',
      'Free preview across all notebook pages',
      'Economical downloads from ₹29 (~₹1.05/page at volume)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Import PDF content',
        body: 'Upload the PDF and let NakalAI populate the text field with extractable content.',
      },
      {
        step: 2,
        title: 'Format for notebook rows',
        body: 'Trim headers or page numbers, then confirm ruled paper and ink settings for notebook output.',
      },
      {
        step: 3,
        title: 'Export ruled notebook PDF',
        body: 'Scroll the free preview to see how PDF sections break across lines, then download.',
      },
    ],
    sections: [
      {
        h2: 'Lecture PDFs as physical notebooks',
        body: 'Some students recall better from handwritten notes. PDF-to-notebook gives you that format without transcribing every slide bullet.',
      },
      {
        h2: 'Ruled alignment for dense readings',
        body: 'Long PDF paragraphs wrap cleanly to ruled lines, keeping left margins straight for fast scanning during exams.',
      },
      {
        h2: 'Student pricing with preview safety',
        body: 'See the entire notebook free. Paid bundles start at ₹29 with better per-page rates near ₹1.05 on bigger packs.',
      },
    ],
    tips: [
      'Remove repeated PDF headers—they waste notebook lines on every page break.',
      'Split very long PDFs by chapter to keep preview loading manageable.',
      'Use black ink if you plan to photocopy notebook pages for study groups.',
    ],
    examples: [
      'An MBA student converts a marketing case PDF into a 8-page ruled revision notebook.',
      'An engineering student turns a lab manual excerpt into grid-style notebook pages for calculations.',
    ],
    faqs: [
      {
        question: 'Will PDF headings stay bold?',
        answer:
          'Handwriting output is uniform ink. Use ALL CAPS or spacing in text to emphasize headings.',
      },
      {
        question: 'Can I choose grid paper after PDF import?',
        answer:
          'Yes. Switch paper type to grid before preview if the PDF contains tables or equations.',
      },
      {
        question: 'Does it handle footnotes?',
        answer:
          'Footnotes extract inline. Move them to paragraph ends manually for cleaner notebooks.',
      },
      {
        question: 'Is the notebook preview paginated?',
        answer:
          'Yes. Scroll page by page exactly as the downloaded PDF will appear.',
      },
      {
        question: 'Can I annotate after download?',
        answer:
          'Print and annotate by hand, or annotate digitally on the PDF with a tablet stylus.',
      },
      {
        question: 'What bundle size do I need?',
        answer:
          'Match bundle page count to preview total. Entry packs start at ₹29.',
      },
    ],
    relatedSlugs: [
      'pdf-to-handwriting',
      'text-to-notebook',
      'notebook-generator',
      'ruled-notebook-generator',
    ],
    cta: {
      headline: 'Turn your PDF into a notebook',
      body: 'Upload PDF text to NakalAI, preview ruled handwriting free, and download from ₹29 per bundle.',
    },
    workspace: {
      text: PDF_PLACEHOLDER,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'assignment-generator',
    title: 'Assignment Generator — Handwritten Pages | NakalAI',
    description:
      'Generate complete handwritten assignments from typed text with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Assignment Generator with Handwritten Output',
    problemLead:
      'Starting from a blank assignment sheet is stressful when the hard part—research and drafting—is already done. NakalAI generates finished handwritten assignment pages from your typed master copy.',
    audience:
      'Higher secondary and undergraduate students producing end-to-end assignment submissions.',
    benefits: [
      'End-to-end flow from typed draft to handwritten PDF',
      'Supports Q&A, essay, and short report structures',
      'Zero-cost preview of the full assignment',
      'Page bundles from ₹29 with ~₹1.05 per page at scale',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Load assignment content',
        body: 'Paste introduction, body sections, and conclusion—or numbered short answers—in one block.',
      },
      {
        step: 2,
        title: 'Apply assignment formatting',
        body: 'Choose ink and paper suited to your department. Ruled paper works for most theory assignments.',
      },
      {
        step: 3,
        title: 'Generate and submit',
        body: 'Review the assignment in free preview, download, print, and bind as required.',
      },
    ],
    sections: [
      {
        h2: 'From draft to submission-ready pages',
        body: 'Word processors solve writing; NakalAI solves presentation. Generate assignments that look submission-ready without a second rewrite by hand.',
      },
      {
        h2: 'Flexible for essays and structured answers',
        body: 'Whether your rubric asks for five short questions or a 1500-word essay, the generator scales page count automatically.',
      },
      {
        h2: 'Clear costs for tight deadlines',
        body: 'Preview the entire assignment before paying. Bundles begin at ₹29—bulk packs average about ₹1.05 per page when assignments run long.',
      },
    ],
    tips: [
      'Include your name and roll number in the text block if the cover page must be handwritten too.',
      'Check word limits after preview—page count is the real constraint for file submissions.',
      'Regenerate after supervisor feedback without paying until you download again.',
    ],
    examples: [
      'A BA student generates a 5-page social science assignment from a Google Doc draft.',
      'A diploma student produces numbered short answers for a weekly assignment sheet.',
    ],
    faqs: [
      {
        question: 'Can one assignment span multiple topics?',
        answer:
          'Yes. Use headings to separate topics so page breaks stay logical in preview.',
      },
      {
        question: 'Does it add a title page automatically?',
        answer:
          'Type your title as the first lines of text. NakalAI renders it in handwriting like the rest.',
      },
      {
        question: 'Is bibliography supported?',
        answer:
          'Paste references as plain text. Long URLs may wrap—verify in preview zoom.',
      },
      {
        question: 'Can I generate in black ink for formal courses?',
        answer:
          'Switch ink to black in settings before previewing.',
      },
      {
        question: 'How do I estimate bundle size?',
        answer:
          'The free preview shows total pages. Pick a ₹29 or larger pack covering that count.',
      },
      {
        question: 'Is content stored on NakalAI servers?',
        answer:
          'Treat sensitive work like any cloud tool—avoid pasting confidential data if policy forbids it.',
      },
    ],
    relatedSlugs: [
      'assignment-handwriting-generator',
      'college-assignment-generator',
      'text-to-assignment',
      'student-assignment-maker',
    ],
    cta: {
      headline: 'Generate your assignment handwriting',
      body: 'Paste your finished assignment in NakalAI, preview every page free, and download bundles from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'black',
      paperId: 'ruled',
    },
  },
];
