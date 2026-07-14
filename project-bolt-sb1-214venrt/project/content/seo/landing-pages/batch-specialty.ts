import type { LandingPageConfig } from './types';
import {
  SCHOOL_DEMO,
  COLLEGE_DEMO,
  NOTES_DEMO,
  PDF_PLACEHOLDER,
} from './demos';

export const specialtyLandingPages: LandingPageConfig[] = [
  {
    slug: 'blue-ink-handwriting',
    title: 'Blue Ink Handwriting Generator — NakalAI Notebook',
    description:
      'Generate blue ink handwriting on ruled notebook pages with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Blue Ink Handwriting — School Notebook Style',
    problemLead:
      'Blue ballpoint ink on ruled pages is the default look for Indian school notebooks. NakalAI renders your typed text in consistent blue ink so submissions match what teachers expect on desk inspection.',
    audience:
      'School and college students whose instructors require traditional blue-ink notebook submissions.',
    benefits: [
      'Authentic blue ballpoint colour on screen and print',
      'Pairs naturally with ruled exercise-book layouts',
      'Preview every blue-ink page free before checkout',
      'Page bundles from ₹29 (~₹1.05 per sheet in bulk packs)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste assignment or notes',
        body: 'Add the text you want rendered in blue ink—questions, answers, or revision points.',
      },
      {
        step: 2,
        title: 'Confirm blue ink preset',
        body: 'Blue ink is pre-selected. Combine with ruled paper for classic notebook presentation.',
      },
      {
        step: 3,
        title: 'Preview and print blue pages',
        body: 'Scroll the free blue-ink preview. Download when shade and spacing look right on your printer.',
      },
    ],
    sections: [
      {
        h2: 'Why blue ink still dominates classrooms',
        body: 'Blue distinguishes student work from black-printed textbooks and many teacher red-pen marks. NakalAI matches that cultural default without buying another pen.',
      },
      {
        h2: 'Consistent colour across multi-page work',
        body: 'Real pens fade and smear. Generated blue ink stays uniform from page one to page twenty—helpful for multi-day assignments.',
      },
      {
        h2: 'Student-friendly blue-ink pricing',
        body: 'Test blue rendering free. NakalAI bundles start at ₹29, with larger packs averaging about ₹1.05 per blue-ink page.',
      },
    ],
    tips: [
      'If your notebook brand uses a lighter blue, compare preview to a photo of real pages.',
      'Blue ink scans well—prefer it over red for formal submissions.',
      'Switch to black only if your rubric explicitly demands it.',
    ],
    examples: [
      'A Class 10 student exports a blue-ink biology assignment on ruled A4.',
      'A college fresher submits blue-ink tutorial answers photographed for WhatsApp collection.',
    ],
    faqs: [
      {
        question: 'Can I mix blue and black in one document?',
        answer:
          'One export uses one ink colour. Generate separate files for mixed-colour requirements.',
      },
      {
        question: 'Does blue ink cost extra?',
        answer:
          'No. Ink colour is a setting. Pricing is per downloaded page, bundles from ₹29.',
      },
      {
        question: 'Will blue look grey when printed?',
        answer:
          'Run one test print. Most inkjet and laser printers reproduce NakalAI blue clearly.',
      },
      {
        question: 'Is blue ink available on grid paper?',
        answer:
          'Yes. Set paper to grid and ink to blue before previewing engineering tables.',
      },
      {
        question: 'Can teachers require black instead?',
        answer:
          'Switch ink to black in settings and regenerate preview at no cost.',
      },
      {
        question: 'How many blue pages in the cheapest bundle?',
        answer:
          'Check current ₹29 pack page counts on NakalAI checkout—offers may vary.',
      },
    ],
    relatedSlugs: [
      'black-ink-handwriting',
      'ruled-notebook-generator',
      'school-assignment-generator',
      'assignment-handwriting-generator',
    ],
    cta: {
      headline: 'Generate blue ink handwriting',
      body: 'Paste text in NakalAI, preview blue-ink notebook pages free, and download bundles from ₹29.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'black-ink-handwriting',
    title: 'Black Ink Handwriting Generator — NakalAI Formal',
    description:
      'Create black ink handwriting for formal assignments with NakalAI. Free preview, PDF bundles from ₹29.',
    h1: 'Black Ink Handwriting for Formal Submissions',
    problemLead:
      'Some departments, portfolios, and exam models mandate black ink for seriousness and photocopy clarity. NakalAI outputs crisp black handwriting on your choice of ruled or plain paper.',
    audience:
      'College students, competitive exam practice, and anyone needing formal black-ink documents.',
    benefits: [
      'Deep black strokes optimized for photocopies',
      'Works on plain paper for essays and formal letters',
      'Free preview to verify contrast before paying',
      'Affordable bundles from ₹29 (~₹1.05 per page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Add formal text',
        body: 'Paste essays, reports, or application drafts requiring black-ink presentation.',
      },
      {
        step: 2,
        title: 'Set black ink mode',
        body: 'Black ink is selected by default here. Pair with plain paper for letter-style layouts.',
      },
      {
        step: 3,
        title: 'Export black-ink PDF',
        body: 'Review contrast in free preview, then download for printing or portal upload.',
      },
    ],
    sections: [
      {
        h2: 'When black ink is non-negotiable',
        body: 'University cover sheets, scholarship forms, and certain exam answer scripts specify black. NakalAI saves a second manual rewrite in ballpoint.',
      },
      {
        h2: 'Maximum contrast for archiving',
        body: 'Black ink PDFs survive multiple photocopy generations—useful when submissions pass through admin offices.',
      },
      {
        h2: 'Preview-first black-ink bundles',
        body: 'Inspect every page free. Purchase packs from ₹29; high-volume downloads approach ₹1.05 per black-ink sheet.',
      },
    ],
    tips: [
      'Use plain paper for formal essays without visible ruled lines in scans.',
      'Avoid light grey printer modes—set printer to standard quality.',
      'Compare black preview to a scanned sample your department published.',
    ],
    examples: [
      'An MA student exports a black-ink formal essay on plain A4 for submission.',
      'A job applicant generates black-ink statement-of-purpose pages for scanning.',
    ],
    faqs: [
      {
        question: 'Is black ink darker than blue on screen?',
        answer:
          'Yes. Black uses maximum stroke contrast—check preview zoom before downloading.',
      },
      {
        question: 'Can I use black on ruled paper?',
        answer:
          'Absolutely. Switch paper to ruled if lines are required despite black ink.',
      },
      {
        question: 'Does black ink smudge in PDF?',
        answer:
          'PDF output is dry ink simulation—no physical smudge. Printer smudge depends on your hardware.',
      },
      {
        question: 'Red ink for corrections?',
        answer:
          'NakalAI supports red ink in settings for emphasis—use black for main body text.',
      },
      {
        question: 'Formal bundle pricing?',
        answer:
          'Same as other pages: preview free, bundles from ₹29 based on page count.',
      },
      {
        question: 'Suitable for legal documents?',
        answer:
          'NakalAI is for student-style work. Consult legal professionals for binding documents.',
      },
    ],
    relatedSlugs: [
      'blue-ink-handwriting',
      'a4-handwriting-generator',
      'realistic-handwriting-generator',
      'college-assignment-generator',
    ],
    cta: {
      headline: 'Generate black ink handwriting',
      body: 'Paste formal text in NakalAI, preview black ink free, and download bundles starting at ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'black',
      paperId: 'plain',
    },
  },
  {
    slug: 'ruled-notebook-generator',
    title: 'Ruled Notebook Generator — NakalAI Lined Pages',
    description:
      'Generate ruled notebook handwriting pages online with NakalAI. Free preview, lined PDF bundles from ₹29.',
    h1: 'Ruled Notebook Generator — Lined Pages',
    problemLead:
      'Unruled handwriting floats awkwardly on blank paper. NakalAI locks text to ruled notebook lines so ascenders, descenders, and margins align like a standard school exercise book.',
    audience:
      'Students who must submit on lined paper or print pages to paste into ruled notebooks.',
    benefits: [
      'Text baseline aligns to horizontal ruled lines',
      'Configurable line density for tight or loose writing',
      'Full ruled-notebook preview at zero cost',
      'Bundles from ₹29 (~₹1.05 per ruled page at scale)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste lined-notebook content',
        body: 'Enter homework, assignments, or notes meant for ruled sheets.',
      },
      {
        step: 2,
        title: 'Lock ruled paper mode',
        body: 'Ruled paper is enforced. Choose blue or black ink to match your physical notebook.',
      },
      {
        step: 3,
        title: 'Download lined PDF',
        body: 'Verify line adherence in free preview, print, and trim or punch holes to fit binders.',
      },
    ],
    sections: [
      {
        h2: 'True ruled alignment—not an overlay hack',
        body: 'Text wraps per line count on the sheet. Long sentences break at ruled boundaries instead of drifting mid-line.',
      },
      {
        h2: 'Match school notebook expectations',
        body: 'Teachers judge margin size and line spacing quickly. Ruled mode keeps left gutters consistent page after page.',
      },
      {
        h2: 'Economical ruled page packs',
        body: 'Preview all ruled sheets free. NakalAI bundles begin at ₹29; bulk buyers see per-page costs near ₹1.05.',
      },
    ],
    tips: [
      'Do not force manual line breaks unless you need extra vertical space.',
      'If text sits too high on lines, shorten paragraphs to let the engine reflow.',
      'Print at 100% scale—scaling distorts ruled alignment.',
    ],
    examples: [
      'A student prints 10 ruled pages to paste into a spiral notebook for inspection.',
      'A tutor generates ruled handwriting samples for handwriting improvement class.',
    ],
    faqs: [
      {
        question: 'Can I turn off lines temporarily?',
        answer:
          'Switch paper type to plain in settings for unruled output from the same text.',
      },
      {
        question: 'Are margins included?',
        answer:
          'Yes. Ruled mode includes standard left margins seen in exercise books.',
      },
      {
        question: 'Wide ruled vs college ruled?',
        answer:
          'NakalAI uses a student-friendly default. Preview to confirm spacing meets your need.',
      },
      {
        question: 'Double-sided printing?',
        answer:
          'Supported on your printer. Check show-through in a test print first.',
      },
      {
        question: 'Grid vs ruled difference?',
        answer:
          'Ruled is horizontal lines only. Grid adds vertical guides—better for tables.',
      },
      {
        question: 'Pricing same as plain paper?',
        answer:
          'Yes. Page bundles from ₹29 regardless of paper type.',
      },
    ],
    relatedSlugs: [
      'unruled-notebook-generator',
      'text-to-notebook',
      'notebook-generator',
      'blue-ink-handwriting',
    ],
    cta: {
      headline: 'Generate ruled notebook pages',
      body: 'Paste text in NakalAI, preview lined handwriting free, and download bundles from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'unruled-notebook-generator',
    title: 'Unruled Notebook Generator — Plain Paper | NakalAI',
    description:
      'Create unruled plain-paper handwriting with NakalAI. Free preview, plain-page PDF bundles from ₹29.',
    h1: 'Unruled Notebook Generator — Plain Paper',
    problemLead:
      'Essays, diagrams, and formal letters often need clean plain paper without lines showing through scans. NakalAI fills unruled sheets with natural handwriting while you keep full control of paragraph shape.',
    audience:
      'Students writing essays, letters, and mixed text-diagram notes on blank pages.',
    benefits: [
      'Plain paper background—no visible ruled lines',
      'Ideal for scanned portfolio and application pages',
      'Free preview of every unruled sheet',
      'Page packs from ₹29 (~₹1.05 per plain page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste plain-paper content',
        body: 'Add essay paragraphs, letters, or freeform notes without line constraints.',
      },
      {
        step: 2,
        title: 'Select plain paper',
        body: 'Plain paper removes ruled lines. Pick black ink for formal tone or blue for casual notes.',
      },
      {
        step: 3,
        title: 'Export unruled PDF',
        body: 'Check whitespace balance in free preview, then download for clean plain-paper printing.',
      },
    ],
    sections: [
      {
        h2: 'Plain paper for polished scans',
        body: 'Ruled lines can distract in PDF portfolios. Unruled mode keeps backgrounds white and professional for email submissions.',
      },
      {
        h2: 'Room for sketches and annotations',
        body: 'Leave blank lines in your paste where you will draw diagrams by hand after printing.',
      },
      {
        h2: 'Affordable plain-page bundles',
        body: 'Preview unruled output gratis. Paid bundles start at ₹29 with volume pricing near ₹1.05 per page.',
      },
    ],
    tips: [
      'Use shorter paragraphs on plain paper—without lines, long blocks look dense.',
      'Leave top margin empty for letterheads if required.',
      'Black ink on plain paper scans best for grayscale office copiers.',
    ],
    examples: [
      'An applicant generates unruled black-ink motivation letter pages.',
      'An art history student exports plain-paper essay pages with space for sketching.',
    ],
    faqs: [
      {
        question: 'Is unruled the same as plain paper setting?',
        answer:
          'Yes. Plain paper mode produces unruled notebook-style pages.',
      },
      {
        question: 'Will text drift without lines?',
        answer:
          'NakalAI maintains consistent line spacing internally even without visible rules.',
      },
      {
        question: 'Can I add lines later in Word?',
        answer:
          'Download is PDF image-style handwriting. Edit source text and regenerate instead.',
      },
      {
        question: 'Plain paper for exams?',
        answer:
          'Only if your exam permits typed-to-handwriting workflows. Follow invigilator rules.',
      },
      {
        question: 'Does plain cost less?',
        answer:
          'Pricing is per page, not paper type. Bundles from ₹29 apply uniformly.',
      },
      {
        question: 'Switch from ruled mid-project?',
        answer:
          'Change paper to plain and regenerate preview free before downloading.',
      },
    ],
    relatedSlugs: [
      'ruled-notebook-generator',
      'black-ink-handwriting',
      'handwritten-notes-generator',
      'a4-handwriting-generator',
    ],
    cta: {
      headline: 'Generate unruled plain pages',
      body: 'Paste content in NakalAI, preview plain-paper handwriting free, and download from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'black',
      paperId: 'plain',
    },
  },
  {
    slug: 'a4-handwriting-generator',
    title: 'A4 Handwriting Generator — Print Ready | NakalAI',
    description:
      'Generate A4-sized handwriting PDFs for assignments with NakalAI. Free preview, print bundles from ₹29.',
    h1: 'A4 Handwriting Generator — Print Ready PDFs',
    problemLead:
      'Notebook pages come in odd sizes; printers expect A4. NakalAI formats handwriting to standard A4 sheets so home and shop printers produce full-width pages without awkward scaling.',
    audience:
      'Students printing assignments at home, cyber cafés, or college print shops on A4 stock.',
    benefits: [
      'A4 dimensions for Indian and international printers',
      'Predictable margins for binding and punching',
      'Free A4 preview before buying print bundles',
      'Print bundles from ₹29 (~₹1.05 per A4 page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste printable content',
        body: 'Add assignment or notes text sized for typical A4 page counts.',
      },
      {
        step: 2,
        title: 'Choose A4-friendly paper',
        body: 'Ruled or plain A4 layouts available. Pick ink colour for your submission rules.',
      },
      {
        step: 3,
        title: 'Print A4 PDF',
        body: 'Confirm page breaks on A4 in free preview, download, and print at 100% scale.',
      },
    ],
    sections: [
      {
        h2: 'Stop scaling homework to fit printers',
        body: 'Shrinking notebook photos reduces readability. Native A4 handwriting PDFs print sharp text teachers can mark easily.',
      },
      {
        h2: 'Shop-ready files',
        body: 'Email the PDF to a print shop, specify A4 single-sided, and collect pages that match preview exactly.',
      },
      {
        h2: 'A4 bundle economics',
        body: 'Count A4 pages in free preview. NakalAI packs from ₹29 scale to about ₹1.05 per sheet for full-semester printing.',
      },
    ],
    tips: [
      'Always print at 100%—“fit to page” distorts A4 handwriting spacing.',
      'Check printer tray for A4 vs Letter if studying abroad.',
      'For binding, leave extra blank line at bottom for punch holes.',
    ],
    examples: [
      'A hosteller emails a 12-page A4 PDF to a nearby Xerox shop for binding.',
      'A parent prints A4 handwriting homework on a home inkjet before school.',
    ],
    faqs: [
      {
        question: 'Is output exactly A4 dimensions?',
        answer:
          'Yes. PDFs target standard A4 sizing used in India and most countries.',
      },
      {
        question: 'Letter size in the US?',
        answer:
          'A4 is default. US users may print with slight margin differences—test one page.',
      },
      {
        question: 'Duplex A4 printing?',
        answer:
          'Supported by your printer driver. Preview odd/even page order before duplex.',
      },
      {
        question: 'A4 with grid for labs?',
        answer:
          'Set grid paper before preview for engineering lab tables on A4.',
      },
      {
        question: 'File size for email?',
        answer:
          'Typical student assignments stay email-friendly. Very long PDFs may need cloud links.',
      },
      {
        question: 'A4 pricing?',
        answer:
          'Per-page bundles from ₹29 regardless of physical paper you print on.',
      },
    ],
    relatedSlugs: [
      'assignment-pdf-generator',
      'handwritten-pdf-maker',
      'ruled-notebook-generator',
      'assignment-handwriting-generator',
    ],
    cta: {
      headline: 'Generate A4 handwriting PDFs',
      body: 'Paste text in NakalAI, preview A4 pages free, and download print bundles from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'student-assignment-maker',
    title: 'Student Assignment Maker — NakalAI Handwriting',
    description:
      'Make student assignments as handwritten PDFs with NakalAI. Free preview, student bundles from ₹29.',
    h1: 'Student Assignment Maker — Hand In Neat Ink',
    problemLead:
      'Between classes, coaching, and chores, students need an assignment maker that respects tight schedules. NakalAI turns finished answers into handwriting you can hand in—after a free preview parents and teachers would approve.',
    audience:
      'School and college students juggling multiple subjects and weekly assignment deadlines.',
    benefits: [
      'Multi-subject assignment support in one workspace',
      'Readable handwriting for fast teacher grading',
      'Free preview shareable with parents before payment',
      'Student bundles from ₹29 (~₹1.05 per page at volume)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Make assignment content',
        body: 'Type or paste answers for any subject—short questions or paragraph responses.',
      },
      {
        step: 2,
        title: 'Pick student defaults',
        body: 'Blue ruled pages suit most Indian school assignments; adjust for college files.',
      },
      {
        step: 3,
        title: 'Hand in generated pages',
        body: 'Approve the free preview, download, print, staple, and submit on deadline day.',
      },
    ],
    sections: [
      {
        h2: 'Assignment maker built for student life',
        body: 'No desktop publishing skills needed. Paste, preview ink, pay only when the assignment looks submission-ready.',
      },
      {
        h2: 'Neat enough for quick grading',
        body: 'Teachers skim dozens of books nightly. Consistent legibility helps your answers get fair reading time.',
      },
      {
        h2: 'Wallet-friendly across subjects',
        body: 'One ₹29 bundle can cover several small assignments when page counts stay low—bulk packs hit roughly ₹1.05 per page.',
      },
    ],
    tips: [
      'Batch similar subjects in one evening but generate separate PDFs per teacher.',
      'Write your name at the top of pasted text for automatic handwriting on every page.',
      'Keep digital originals for viva prep—you will answer questions about content.',
    ],
    examples: [
      'A Class 12 student makes physics and chemistry assignments in one study session.',
      'A freshman makes a sociology reflection assignment for a internal marks folder.',
    ],
    faqs: [
      {
        question: 'Is this cheating?',
        answer:
          'NakalAI formats presentation. You must understand and stand behind every answer you submit.',
      },
      {
        question: 'Can groups split bundle costs?',
        answer:
          'Bundles tie to accounts. Each student should preview and download their own edited text.',
      },
      {
        question: 'Works for open-book assignments?',
        answer:
          'Yes when handwriting format is required. Content still comes from your research.',
      },
      {
        question: 'Minimum age to use?',
        answer:
          'Younger students should involve parents for payments and academic honesty discussions.',
      },
      {
        question: 'Replace a full assignment maker app?',
        answer:
          'NakalAI focuses on handwriting output, not research or plagiarism checking.',
      },
      {
        question: 'How fast for 5 pages?',
        answer:
          'Preview typically renders in seconds after paste. Download follows bundle purchase.',
      },
    ],
    relatedSlugs: [
      'school-assignment-generator',
      'homework-writer',
      'assignment-generator',
      'handwritten-assignment-online',
    ],
    cta: {
      headline: 'Make your student assignment',
      body: 'Build assignments in NakalAI, preview handwriting free, and unlock student bundles from ₹29.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'assignment-pdf-generator',
    title: 'Assignment PDF Generator — NakalAI Handwriting',
    description:
      'Generate assignment PDFs with handwritten pages using NakalAI. Upload or paste, free preview, from ₹29.',
    h1: 'Assignment PDF Generator — Handwritten Export',
    problemLead:
      'Portals want PDFs; professors want ink. NakalAI assignment PDF generator merges both—typed source in, multi-page handwritten PDF out—with every sheet visible in a free preview before you pay.',
    audience:
      'Students uploading assignments to LMS portals, email, or Google Classroom as PDF files.',
    benefits: [
      'Single PDF export for entire assignments',
      'Upload source PDFs or paste text directly',
      'Portal-friendly A4 PDF sizing',
      'Bundles from ₹29 (~₹1.05 per PDF page at scale)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Load assignment source',
        body: 'Upload a PDF assignment brief or paste your completed answers into the workspace.',
      },
      {
        step: 2,
        title: 'Style handwriting pages',
        body: 'Configure ink and paper. NakalAI paginates content across PDF sheets automatically.',
      },
      {
        step: 3,
        title: 'Download assignment PDF',
        body: 'Validate page order in free preview, purchase bundle, upload file to your portal.',
      },
    ],
    sections: [
      {
        h2: 'One PDF for the whole assignment',
        body: 'Avoid sending twelve separate images. One handwritten PDF looks organized and meets most digital submission checklists.',
      },
      {
        h2: 'Extract questions from PDF briefs',
        body: 'When teachers share PDF question sheets, upload once, answer beneath extracted prompts, and export unified handwriting.',
      },
      {
        h2: 'PDF bundle pricing',
        body: 'Preview the full PDF free. Paid page bundles start at ₹29—large assignments average about ₹1.05 per sheet.',
      },
    ],
    tips: [
      'Rename PDFs with roll number and subject code before upload to LMS.',
      'Check portal megabyte limits—compress externally only if quality stays readable.',
      'Keep a typed backup in case the portal rejects and you must re-upload quickly.',
    ],
    examples: [
      'A student uploads a generated 8-page handwritten PDF to Moodle before midnight deadline.',
      'A group member merges NakalAI PDF with a cover sheet using a free PDF combiner.',
    ],
    faqs: [
      {
        question: 'Is the PDF one file or per page?',
        answer:
          'One multi-page PDF containing all handwritten assignment sheets.',
      },
      {
        question: 'Can I password-protect output?',
        answer:
          'Use external PDF tools after download. NakalAI exports standard unencrypted PDFs.',
      },
      {
        question: 'Searchable text inside PDF?',
        answer:
          'Handwriting renders visually—expect non-selectable ink unless future features add OCR layers.',
      },
      {
        question: 'Upload handwritten PDF back to Turnitin?',
        answer:
          'Policies vary. Image PDFs may behave differently from typed submissions—ask your instructor.',
      },
      {
        question: 'Regenerate after portal rejection?',
        answer:
          'Edit text, preview free again, and download with an updated bundle if page count changes.',
      },
      {
        question: 'PDF generator vs PDF maker?',
        answer:
          'Both produce handwritten PDFs. This page emphasizes LMS assignment uploads end-to-end.',
      },
    ],
    relatedSlugs: [
      'handwritten-pdf-maker',
      'pdf-to-handwriting',
      'a4-handwriting-generator',
      'assignment-generator',
    ],
    cta: {
      headline: 'Generate your assignment PDF',
      body: 'Paste or upload in NakalAI, preview the full handwritten PDF free, download bundles from ₹29.',
    },
    workspace: {
      text: PDF_PLACEHOLDER,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'convert-notes-to-handwriting',
    title: 'Convert Notes to Handwriting — NakalAI Online',
    description:
      'Convert digital notes to handwriting pages with NakalAI. Free preview, note PDF bundles from ₹29.',
    h1: 'Convert Notes to Handwriting for Revision',
    problemLead:
      'Your best notes live in Notion, OneNote, or Google Keep—but exam prep wants paper. NakalAI converts digital note exports into handwriting notebooks without losing bullet structure or headings.',
    audience:
      'Students converting app-based or typed lecture notes into handwritten revision material.',
    benefits: [
      'Preserves headings and bullet hierarchy from digital notes',
      'Batch convert long note exports in one paste',
      'Free conversion preview before any charge',
      'Note bundles from ₹29 (~₹1.05 per page on larger packs)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Export notes as text',
        body: 'Copy from your notes app—strip rich formatting if needed so plain text lands cleanly.',
      },
      {
        step: 2,
        title: 'Choose notebook styling',
        body: 'Plain paper for dense concept maps; ruled for linear lecture notes.',
      },
      {
        step: 3,
        title: 'Convert and print notes',
        body: 'Walk through the free handwriting preview, then download and ring-bind revision sets.',
      },
    ],
    sections: [
      {
        h2: 'Bridge digital notes and paper memory',
        body: 'Typing during lecture is fast; revising from handwriting boosts recall for many learners. Conversion closes that gap overnight.',
      },
      {
        h2: 'Keep structure from your notes app',
        body: 'Blank lines between bullets become visual separation in ink—headings stay scannable in handwritten form.',
      },
      {
        h2: 'Conversion pricing for long notes',
        body: 'Long exports preview free page by page. NakalAI bundles from ₹29 make even 40-page note conversions affordable at ~₹1.05 each in bulk.',
      },
    ],
    tips: [
      'Export one unit at a time to manage preview length and bundle sizing.',
      'Replace checkbox characters with “[ ]” if they paste as odd symbols.',
      'Highlight manually after printing—conversion does not add marker colours.',
    ],
    examples: [
      'A law student converts constitutional law bullet notes into 15 handwritten pages.',
      'A medical student turns pharmacology summary notes into pocket revision sheets.',
    ],
    faqs: [
      {
        question: 'Can I convert HTML notes?',
        answer:
          'Copy visible text only. HTML tags should not appear in the paste box.',
      },
      {
        question: 'Will indents from Notion survive?',
        answer:
          'Use spaces or dashes for hierarchy. Complex indents may flatten—check preview.',
      },
      {
        question: 'Images in notes?',
        answer:
          'Text converts only. Reinsert images manually on printed pages if needed.',
      },
      {
        question: 'Same notes, two paper types?',
        answer:
          'Generate ruled and plain versions as separate previews and downloads.',
      },
      {
        question: 'Update notes after conversion?',
        answer:
          'Edit source text and regenerate preview free. Pay again only on new download.',
      },
      {
        question: 'Handwritten notes vs this tool?',
        answer:
          'Manual notes take longer. NakalAI converts existing digital notes when time is short.',
      },
    ],
    relatedSlugs: [
      'handwritten-notes-generator',
      'text-to-handwriting',
      'text-to-notebook',
      'notebook-generator',
    ],
    cta: {
      headline: 'Convert notes to handwriting',
      body: 'Paste digital notes into NakalAI, preview converted pages free, and download bundles from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'blue',
      paperId: 'plain',
    },
  },
  {
    slug: 'text-to-assignment',
    title: 'Text to Assignment — Handwritten Export | NakalAI',
    description:
      'Turn plain text into formatted assignment handwriting with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Text to Assignment — From Draft to Hand-In',
    problemLead:
      'You finished the text in a rush—but “assignment” means formatted handwritten pages, not a `.txt` file. NakalAI transforms plain text drafts into structured assignment layouts with questions, spacing, and ink ready for submission.',
    audience:
      'Students with raw text drafts who need assignment formatting plus handwriting in one step.',
    benefits: [
      'Turns unstructured text blocks into assignment-ready pages',
      'Supports numbered questions and section headings',
      'Preview entire assignment transformation free',
      'Bundles from ₹29 (~₹1.05 per assignment page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste raw text draft',
        body: 'Drop unformatted answers from chat drafts, voice-to-text exports, or quick memos.',
      },
      {
        step: 2,
        title: 'Structure as assignment',
        body: 'Add Q/A labels and headings in the editor so NakalAI paginates like a real assignment.',
      },
      {
        step: 3,
        title: 'Export handwritten assignment',
        body: 'Review text-to-assignment output in free preview, then download for print or PDF upload.',
      },
    ],
    sections: [
      {
        h2: 'From rough text to submission layout',
        body: 'Messy drafts hide good research. NakalAI’s assignment flow encourages clear numbering and spacing before ink renders—so teachers see organized work.',
      },
      {
        h2: 'College lab text to assignment pages',
        body: 'Theory sections, observation paragraphs, and result lines from typed lab text become consecutive handwritten assignment sheets.',
      },
      {
        h2: 'Assignment bundle value',
        body: 'See exact page count in free preview. NakalAI packs from ₹29 scale down to roughly ₹1.05 per page for long assignments.',
      },
    ],
    tips: [
      'Prefix lines with “Q1.” and “Ans.” so handwriting mirrors school worksheet formats.',
      'Separate sections with a line of dashes for visual breaks in preview.',
      'Proofread voice-to-text drafts—they often miss homophones before conversion.',
    ],
    examples: [
      'A student converts a voice-memo transcript into a geography assignment PDF.',
      'A lab partners group merges typed sections into one handwritten assignment export.',
    ],
    faqs: [
      {
        question: 'Does NakalAI auto-add question numbers?',
        answer:
          'You add numbering in text. The engine preserves your labels in handwriting.',
      },
      {
        question: 'Can I convert outline bullets to prose?',
        answer:
          'Expand bullets manually before paste for paragraph-style assignments.',
      },
      {
        question: 'Word count limits?',
        answer:
          'Typical assignments fit easily. Very long theses should be split by chapter.',
      },
      {
        question: 'Different from assignment generator?',
        answer:
          'Text-to-assignment highlights messy draft input; generator assumes polished structure.',
      },
      {
        question: 'Collaboration with group text?',
        answer:
          'Merge contributions in one paste block. One student should verify flow before preview.',
      },
      {
        question: 'Pricing for draft iterations?',
        answer:
          'Unlimited free previews while editing. Pay on download—bundles from ₹29.',
      },
    ],
    relatedSlugs: [
      'assignment-generator',
      'write-assignment-online',
      'college-assignment-generator',
      'text-to-handwriting',
    ],
    cta: {
      headline: 'Turn text into an assignment',
      body: 'Paste draft text in NakalAI, preview assignment handwriting free, and download bundles from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'black',
      paperId: 'ruled',
    },
  },
  {
    slug: 'handwritten-assignment-online',
    title: 'Handwritten Assignment Online — NakalAI Free Preview',
    description:
      'Create handwritten assignments online with NakalAI. Browser-based, free preview, bundles from ₹29.',
    h1: 'Handwritten Assignment Online — No Install',
    problemLead:
      'You should not need desktop software or font downloads to produce a handwritten assignment. NakalAI runs entirely online—paste text, preview ink in the browser, and download when your assignment looks ready.',
    audience:
      'Students on shared family laptops, school lab PCs, or phones who need a zero-install handwritten assignment workflow.',
    benefits: [
      '100% browser-based—no app install required',
      'Works on Chrome, Edge, Safari, and mobile browsers',
      'Free online preview of every assignment page',
      'Online checkout for bundles from ₹29 (~₹1.05/page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Open NakalAI online',
        body: 'Visit the site, skip installs, and paste assignment text in the cloud workspace.',
      },
      {
        step: 2,
        title: 'Configure handwriting online',
        body: 'Toggle ink and paper settings in the UI. Changes reflect live in the online preview.',
      },
      {
        step: 3,
        title: 'Download from the browser',
        body: 'After free online review, pay for a bundle and save the PDF directly to your device.',
      },
    ],
    sections: [
      {
        h2: 'Online access from any device',
        body: 'Cyber café before submission? Phone on the bus? NakalAI’s online assignment flow needs only a browser and connection—not admin rights to install software.',
      },
      {
        h2: 'Preview online before parents pay',
        body: 'Share your screen during free preview so guardians verify content before approving ₹29 bundle purchases.',
      },
      {
        h2: 'Online pricing transparency',
        body: 'No hidden desktop upsells. Preview online free; page bundles from ₹29 with about ₹1.05 per sheet on larger online orders.',
      },
    ],
    tips: [
      'Use incognito mode on shared PCs and log out after download.',
      'Save PDF to cloud storage immediately—lab PCs may wipe downloads nightly.',
      'Bookmark NakalAI on your phone home screen for quick online access.',
    ],
    examples: [
      'A student in a school computer lab generates an online handwritten assignment before period ends.',
      'A hostel student uses phone browser to preview assignment pages before midnight upload.',
    ],
    faqs: [
      {
        question: 'Do I need Windows or Mac software?',
        answer:
          'No. Any modern browser on any OS works for online handwritten assignments.',
      },
      {
        question: 'Offline mode available?',
        answer:
          'Internet is required for NakalAI online preview and download.',
      },
      {
        question: 'Mobile browser limitations?',
        answer:
          'Preview works on mobile. Long edits and payments are easier on larger screens.',
      },
      {
        question: 'Is online preview slower?',
        answer:
          'Speed depends on connection. Typical assignments preview in seconds online.',
      },
      {
        question: 'Safe on school Wi-Fi?',
        answer:
          'Use HTTPS as provided. Avoid school networks that block payment gateways if checkout fails.',
      },
      {
        question: 'Account needed online?',
        answer:
          'Follow current NakalAI signup requirements for saving purchases and re-downloads.',
      },
    ],
    relatedSlugs: [
      'write-assignment-online',
      'student-assignment-maker',
      'assignment-handwriting-generator',
      'handwritten-pdf-maker',
    ],
    cta: {
      headline: 'Create handwritten assignments online',
      body: 'Open NakalAI in your browser, preview assignment pages free, and download online bundles from ₹29.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
];
