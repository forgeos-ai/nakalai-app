import type { LandingPageConfig } from './types';
import {
  SCHOOL_DEMO,
  COLLEGE_DEMO,
  ENGINEERING_DEMO,
  NURSING_DEMO,
  LAB_RECORD_DEMO,
  NOTES_DEMO,
} from './demos';

export const educationLandingPages: LandingPageConfig[] = [
  {
    slug: 'college-assignment-generator',
    title: 'College Assignment Generator — NakalAI Handwriting',
    description:
      'Generate college assignment handwriting from typed drafts with NakalAI. Free preview, bundles from ₹29.',
    h1: 'College Assignment Generator for Typed Drafts',
    problemLead:
      'College assignments mix theory, citations, and neat presentation—often on short notice. NakalAI converts your polished typed draft into ruled handwritten pages that match departmental submission habits.',
    audience:
      'Undergraduate and postgraduate students in arts, science, and professional degree programmes.',
    benefits: [
      'Handles multi-section college essays and lab summaries',
      'Ruled layouts suited to file and folder submissions',
      'Complete free preview before any bundle purchase',
      'Affordable page packs from ₹29 (~₹1.05 per sheet in bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste college draft',
        body: 'Import your assignment from Google Docs or Word—including aim, procedure, and results sections for practicals.',
      },
      {
        step: 2,
        title: 'Match department style',
        body: 'Blue ink on ruled paper fits many colleges; switch to black for stricter formal guidelines.',
      },
      {
        step: 3,
        title: 'Preview and file',
        body: 'Scroll the free preview, download the PDF bundle, print, and attach to your submission cover.',
      },
    ],
    sections: [
      {
        h2: 'College deadlines without rewrite marathons',
        body: 'When submission is tomorrow and handwriting is mandatory, NakalAI lets you keep editing digitally until the last hour, then export ink pages in minutes.',
      },
      {
        h2: 'Practical records and theory in one tool',
        body: 'From Hooke’s law write-ups to essay-style papers, the same workspace produces consistent handwriting across different assignment types.',
      },
      {
        h2: 'Pricing that fits student budgets',
        body: 'Every page previews free. Download bundles start at ₹29, with larger packs averaging near ₹1.05 per page for semester-long workloads.',
      },
    ],
    tips: [
      'Add your course code in the header block so printed pages sort correctly in folders.',
      'For citations, keep author names on the same line as years to avoid awkward wraps.',
      'Compare preview page count to your professor’s maximum sheet limit before downloading.',
    ],
    examples: [
      'A B.Sc student exports a spring-extension practical as a 3-page blue-ink assignment.',
      'An English honours student converts a 1200-word essay into six ruled handwritten pages.',
    ],
    faqs: [
      {
        question: 'Is this different from the general assignment generator?',
        answer:
          'College assignment generator presets target undergraduate formats—longer paragraphs, practical headings, and ruled A4 layouts.',
      },
      {
        question: 'Can I include diagrams?',
        answer:
          'Text converts to handwriting. Draw diagrams on printed pages or leave blank lines as placeholders.',
      },
      {
        question: 'Does it support APA-style references?',
        answer:
          'Paste references as plain text. Verify wrapping in the free preview.',
      },
      {
        question: 'Can I submit the PDF directly?',
        answer:
          'Many colleges accept PDF uploads. Confirm portal requirements with your department.',
      },
      {
        question: 'How many free previews can I run?',
        answer:
          'Regenerate previews freely while editing. Payment applies only on PDF download.',
      },
      {
        question: 'What if my assignment is rejected for formatting?',
        answer:
          'Adjust margins via line breaks and regenerate. Preview again at no cost before re-downloading.',
      },
    ],
    relatedSlugs: [
      'assignment-generator',
      'write-assignment-online',
      'engineering-assignment-generator',
      'handwritten-assignment-online',
    ],
    cta: {
      headline: 'Generate your college assignment',
      body: 'Paste your draft into NakalAI, preview handwritten pages free, and unlock bundles from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'school-assignment-generator',
    title: 'School Assignment Generator — NakalAI for Classes',
    description:
      'Create school assignment handwriting from typed answers with NakalAI. Free preview, page bundles from ₹29.',
    h1: 'School Assignment Generator — Classes 6 to 12',
    problemLead:
      'School teachers often want neat blue-ink notebooks, but students draft faster on phones and laptops. NakalAI generates school assignment pages that look thoughtfully copied from your typed answers.',
    audience:
      'Students in middle and senior school preparing subject assignments and project write-ups.',
    benefits: [
      'Short-answer and paragraph formats for school subjects',
      'Blue-ink ruled pages familiar to school notebooks',
      'Parents can review the free preview before payment',
      'Low-cost bundles from ₹29—about ₹1.05 per page at volume',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Add school answers',
        body: 'Paste question numbers and answers from your textbook notes or typed worksheet.',
      },
      {
        step: 2,
        title: 'Use school notebook styling',
        body: 'Default blue ink on ruled paper mirrors standard school exercise books.',
      },
      {
        step: 3,
        title: 'Print for class',
        body: 'Check the free preview with a parent or teacher, then download and staple pages.',
      },
    ],
    sections: [
      {
        h2: 'School submissions that look uniform',
        body: 'Messy rushed handwriting can hide good answers. NakalAI keeps every school assignment page legible so teachers focus on content.',
      },
      {
        h2: 'Works across science, social, and language',
        body: 'Whether answering “Name two raw materials” or writing a half-page explanation, the generator scales to your subject.',
      },
      {
        h2: 'Affordable for monthly assignments',
        body: 'Preview costs nothing. When you buy, NakalAI bundles from ₹29 keep recurring school assignments budget-friendly at roughly ₹1.05 per printed page.',
      },
    ],
    tips: [
      'Write question numbers in the same format as the worksheet (Q1, 1., etc.).',
      'Leave a margin line empty at the top for teacher name and date if required.',
      'Print on A4 and trim only if your teacher specifies a smaller notebook size.',
    ],
    examples: [
      'A Class 10 student submits a biology assignment on photosynthesis in blue ink.',
      'A Class 7 student generates a history paragraph assignment for notebook checking.',
    ],
    faqs: [
      {
        question: 'Which classes is this meant for?',
        answer:
          'Typically Classes 6–12, but any student with typed school answers can use it.',
      },
      {
        question: 'Can teachers tell it is generated?',
        answer:
          'Output mimics natural handwriting. Follow school honesty policies and understand your answers.',
      },
      {
        question: 'Is blue ink required?',
        answer:
          'Blue is common in schools. Switch to black in settings if your teacher prefers it.',
      },
      {
        question: 'Can I submit photos instead of printing?',
        answer:
          'Yes. Print or display PDF pages and photograph clearly in good lighting.',
      },
      {
        question: 'How much for a 4-page assignment?',
        answer:
          'Choose a bundle covering four pages. Entry packs start at ₹29 depending on current offers.',
      },
      {
        question: 'Does NakalAI store school assignments?',
        answer:
          'Avoid pasting personal information unnecessarily. Clear browser sessions on shared family devices.',
      },
    ],
    relatedSlugs: [
      'handwritten-homework-generator',
      'homework-writer',
      'student-assignment-maker',
      'assignment-handwriting-generator',
    ],
    cta: {
      headline: 'Generate school assignment pages',
      body: 'Paste school answers in NakalAI, preview free, and download handwriting bundles from ₹29.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'engineering-assignment-generator',
    title: 'Engineering Assignment Generator — NakalAI Labs',
    description:
      'Generate engineering lab and theory assignments as handwriting with NakalAI. Free preview, from ₹29.',
    h1: 'Engineering Assignment Generator for Lab Work',
    problemLead:
      'Engineering submissions combine experiment titles, apparatus lists, and calculated results—easy to type, tedious to copy by hand. NakalAI renders your lab write-up as grid-friendly handwritten pages ready for file submission.',
    audience:
      'Diploma and B.Tech students preparing experiment records, tutorials, and short theory assignments.',
    benefits: [
      'Grid paper preset suits calculations and observation tables',
      'Structured sections for aim, apparatus, procedure, result',
      'Free engineering assignment preview before checkout',
      'Page bundles from ₹29 with ~₹1.05 per page on larger packs',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste lab content',
        body: 'Enter experiment number, apparatus, procedure steps, and results from your typed draft.',
      },
      {
        step: 2,
        title: 'Select grid notebook paper',
        body: 'Grid backgrounds help alignment for tables and numeric columns in engineering records.',
      },
      {
        step: 3,
        title: 'Export lab file pages',
        body: 'Verify tables and symbols in the free preview, then download for binding or PDF upload.',
      },
    ],
    sections: [
      {
        h2: 'Lab records without table drift',
        body: 'Hand-copying observation tables invites misaligned columns. NakalAI keeps monospace-friendly spacing on grid paper for cleaner engineering submissions.',
      },
      {
        h2: 'Ohm’s law to complex experiments',
        body: 'From first-year verification experiments to upper-semester reports, the same handwriting engine scales with your typed content length.',
      },
      {
        h2: 'Engineering student pricing',
        body: 'Long lab semesters mean many pages. NakalAI previews free; bundles from ₹29 drop toward ₹1.05 per page when you plan ahead.',
      },
    ],
    tips: [
      'Use spaces or tabs to align table columns before previewing on grid paper.',
      'Write units beside every numerical result—teachers check units first.',
      'Keep experiment numbers in the header so bound files stay ordered.',
    ],
    examples: [
      'An EE student generates an Ohm’s law verification record on grid paper.',
      'A mechanical student exports a thermodynamics tutorial assignment in black ink.',
    ],
    faqs: [
      {
        question: 'Why grid paper for engineering?',
        answer:
          'Grid lines help align tables and sketches. Switch to ruled if your department insists.',
      },
      {
        question: 'Are circuit symbols supported?',
        answer:
          'Unicode symbols paste fine. Complex diagrams may need manual drawing on printouts.',
      },
      {
        question: 'Can I include calculation steps?',
        answer:
          'Yes. Paste step-by-step derivations; preview to ensure page breaks do not split equations awkwardly.',
      },
      {
        question: 'Is this for internal marks only?',
        answer:
          'Use for any assignment your institute allows. Follow academic integrity rules.',
      },
      {
        question: 'How long are previews stored?',
        answer:
          'Regenerate anytime while your session content remains. Download when satisfied.',
      },
      {
        question: 'Bulk pricing for entire semester labs?',
        answer:
          'Large bundles reduce per-page cost to about ₹1.05. Count pages in preview first.',
      },
    ],
    relatedSlugs: [
      'lab-record-generator',
      'record-writing-generator',
      'college-assignment-generator',
      'a4-handwriting-generator',
    ],
    cta: {
      headline: 'Generate engineering assignment pages',
      body: 'Paste lab content in NakalAI, preview grid handwriting free, and download bundles from ₹29.',
    },
    workspace: {
      text: ENGINEERING_DEMO,
      inkId: 'black',
      paperId: 'grid',
    },
  },
  {
    slug: 'nursing-assignment-generator',
    title: 'Nursing Assignment Generator — NakalAI Care Plans',
    description:
      'Create nursing care plan and clinical assignment handwriting with NakalAI. Free preview, from ₹29.',
    h1: 'Nursing Assignment Generator for Clinical Work',
    problemLead:
      'Nursing students document vitals, diagnoses, and interventions daily—often by hand for clinical files. NakalAI converts typed care plans into realistic handwritten sheets while you focus on patient-centred accuracy.',
    audience:
      'Nursing diploma and degree students preparing care plans, case presentations, and clinical logs.',
    benefits: [
      'Preset demo text structured like shift care documentation',
      'Plain paper option for narrative clinical notes',
      'Free preview of every handwritten care plan page',
      'Affordable bundles from ₹29 (~₹1.05 per page in bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Enter care plan text',
        body: 'Paste vitals, nursing diagnosis, interventions, and evaluation notes from your draft.',
      },
      {
        step: 2,
        title: 'Choose clinical note styling',
        body: 'Black ink on plain paper reads cleanly in hospital file photocopies.',
      },
      {
        step: 3,
        title: 'Review and submit to faculty',
        body: 'Use free preview to check medical abbreviations, then download for clinical portfolio binding.',
      },
    ],
    sections: [
      {
        h2: 'Clinical documentation without hand fatigue',
        body: 'After long shifts, rewriting care plans hurts focus. NakalAI produces legible handwritten pages from drafts you typed while details were fresh.',
      },
      {
        h2: 'Structured sections faculty expect',
        body: 'Vitals blocks, NANDA-style diagnoses, and intervention lists stay separated when you format with line breaks before generating.',
      },
      {
        h2: 'Budget-friendly for clinical rotations',
        body: 'Rotations generate many files. Preview free, then use NakalAI bundles from ₹29—large packs near ₹1.05 per page for the term.',
      },
    ],
    tips: [
      'Spell out abbreviations once if your instructor prefers full terms in submissions.',
      'Double-check dosage and vital values in preview—they must match your clinical source.',
      'Use plain paper for narrative case studies; ruled if your college mandates lines.',
    ],
    examples: [
      'A GNM student exports a day-shift care plan with vitals and interventions.',
      'A B.Sc Nursing student converts a pediatric case presentation into handwritten file pages.',
    ],
    faqs: [
      {
        question: 'Can I use this for real patient records?',
        answer:
          'NakalAI is for student assignments. Never put identifiable patient data into public tools without institutional approval.',
      },
      {
        question: 'Are medical symbols supported?',
        answer:
          'Common Unicode symbols work. Verify SpO₂ and temperature formatting in preview.',
      },
      {
        question: 'Does faculty accept handwritten PDFs?',
        answer:
          'Many nursing colleges accept PDF uploads. Confirm with your clinical instructor.',
      },
      {
        question: 'Can I anonymize case details?',
        answer:
          'Replace names with initials before pasting. Preview ensures no identifiers remain.',
      },
      {
        question: 'How many care plans fit one bundle?',
        answer:
          'Count total preview pages across plans. Bundles start at ₹29 for small sets.',
      },
      {
        question: 'Red ink for corrections?',
        answer:
          'Primary output uses blue or black. Add manual corrections on printed pages if required.',
      },
    ],
    relatedSlugs: [
      'record-writing-generator',
      'college-assignment-generator',
      'handwritten-notes-generator',
      'realistic-handwriting-generator',
    ],
    cta: {
      headline: 'Generate nursing assignment handwriting',
      body: 'Paste care plan text in NakalAI, preview clinical pages free, and download from ₹29.',
    },
    workspace: {
      text: NURSING_DEMO,
      inkId: 'black',
      paperId: 'plain',
    },
  },
  {
    slug: 'lab-record-generator',
    title: 'Lab Record Generator — NakalAI Handwriting Tool',
    description:
      'Generate lab record handwriting for chemistry and science labs with NakalAI. Free preview, from ₹29.',
    h1: 'Lab Record Generator — Observation Tables',
    problemLead:
      'Lab records demand dated pages, aim statements, and neat observation tables—repetitive to write by hand every week. NakalAI fills lab book pages from your typed experiment notes with grid-aligned handwriting.',
    audience:
      'Science and engineering students maintaining weekly lab manuals and practical files.',
    benefits: [
      'Lab record demo structure with aim, table, and result blocks',
      'Grid paper for titration and measurement tables',
      'Free full-file preview before purchasing pages',
      'Bundles from ₹29—roughly ₹1.05 per page at higher tiers',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste experiment record',
        body: 'Include date, aim, observation table rows, and result calculation from your lab draft.',
      },
      {
        step: 2,
        title: 'Enable grid layout',
        body: 'Grid paper keeps numeric columns readable—ideal for burette readings and trial rows.',
      },
      {
        step: 3,
        title: 'Download lab pages',
        body: 'Confirm table alignment in free preview, then print and paste into your bound lab record.',
      },
    ],
    sections: [
      {
        h2: 'Weekly labs without smudged tables',
        body: 'Rushed handwriting smears ink across grid lines. NakalAI produces consistent dark strokes that photocopy clearly for external lab exams.',
      },
      {
        h2: 'Acid-base titration to physics graphs',
        body: 'Any experiment you can type—including calculation placeholders—maps onto lab record pages with uniform margins.',
      },
      {
        h2: 'Semester lab pricing',
        body: 'Preview every experiment free. NakalAI page packs from ₹29 make a full semester affordable at about ₹1.05 per sheet in bulk.',
      },
    ],
    tips: [
      'Leave blank underscores for values you fill after lab if the demo uses placeholders.',
      'Align decimal points in observation tables using spaces before preview.',
      'Number experiments sequentially to match your lab manual index.',
    ],
    examples: [
      'A chemistry student generates an acid-base titration record with trial table.',
      'A physics student exports a optics experiment write-up on grid pages.',
    ],
    faqs: [
      {
        question: 'Can I generate blank table templates?',
        answer:
          'Type placeholder rows and underscores. NakalAI renders them as handwritten lines.',
      },
      {
        question: 'Will grid print on home printers?',
        answer:
          'Yes. Grid lines are light so they scan like real lab books.',
      },
      {
        question: 'Does it support combined chemistry and biology labs?',
        answer:
          'Any typed lab content works. Switch demos mentally—paste your own subject text.',
      },
      {
        question: 'Can external examiners tell?',
        answer:
          'Focus on accurate data. Handwriting style is consistent; content must be yours.',
      },
      {
        question: 'How to handle cancelled trials?',
        answer:
          'Edit text before preview to mark cancelled trials or regenerate after lab class.',
      },
      {
        question: 'Bundle size for 15 experiments?',
        answer:
          'Multiply average pages per experiment by 15, then choose a pack above that—starting ₹29.',
      },
    ],
    relatedSlugs: [
      'record-writing-generator',
      'engineering-assignment-generator',
      'ruled-notebook-generator',
      'assignment-generator',
    ],
    cta: {
      headline: 'Generate your lab record pages',
      body: 'Paste experiment notes in NakalAI, preview grid handwriting free, and download bundles from ₹29.',
    },
    workspace: {
      text: LAB_RECORD_DEMO,
      inkId: 'blue',
      paperId: 'grid',
    },
  },
  {
    slug: 'record-writing-generator',
    title: 'Record Writing Generator — NakalAI for Files',
    description:
      'Generate record writing and file pages as handwriting with NakalAI. Free preview, PDF bundles from ₹29.',
    h1: 'Record Writing Generator for Practical Files',
    problemLead:
      'Practical files, ward records, and workshop logs share one pain point: repetitive structured writing. NakalAI generates record pages from templates you type once and reuse all semester.',
    audience:
      'Students in nursing, pharmacy, vocational trades, and science programmes with continuous record files.',
    benefits: [
      'Structured headings for dated record entries',
      'Works on ruled, plain, or grid paper per record type',
      'Unlimited free preview while refining entries',
      'Page bundles from ₹29 with volume rates near ₹1.05',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Type record entry',
        body: 'Format date, title, body paragraphs, and sign-off lines as you would in a official record book.',
      },
      {
        step: 2,
        title: 'Pick record-appropriate paper',
        body: 'Grid for numeric logs, ruled for general files, plain for narrative records.',
      },
      {
        step: 3,
        title: 'Export and bind',
        body: 'Preview entries free, download PDF sheets, and insert into your record file folder.',
      },
    ],
    sections: [
      {
        h2: 'Continuous records without weekly copying',
        body: 'When every Friday needs a new record sheet, typing once and generating handwriting saves hours across the term.',
      },
      {
        h2: 'Cross-discipline record formats',
        body: 'Lab observations, clinical logs, and workshop safety checks all paste as plain text—NakalAI handles the ink presentation.',
      },
      {
        h2: 'Predictable per-page costs',
        body: 'See total pages in free preview. Buy NakalAI bundles from ₹29; scale up for about ₹1.05 per page on larger packs.',
      },
    ],
    tips: [
      'Keep a master template in Notes app and swap date and body each week.',
      'Sign and stamp physically after printing if records require wet signatures.',
      'Use consistent date formats (DD/MM/YYYY) your faculty specifies.',
    ],
    examples: [
      'A pharmacy student generates weekly dispensing log pages for a file.',
      'A vocational student exports workshop tool-check records on ruled paper.',
    ],
    faqs: [
      {
        question: 'Is this only for science labs?',
        answer:
          'No. Any structured record you can type—clinical, technical, or administrative—can generate.',
      },
      {
        question: 'Can I combine multiple weeks in one PDF?',
        answer:
          'Paste all weeks with page-break spacing. Preview shows combined page count.',
      },
      {
        question: 'Do records need blue or black ink?',
        answer:
          'Choose either in settings. Many institutions prefer blue for daily records.',
      },
      {
        question: 'Can supervisors sign digital PDFs?',
        answer:
          'Print for wet signatures unless your institute accepts digital sign-offs.',
      },
      {
        question: 'What if I miss a week?',
        answer:
          'Generate a backdated entry from typed notes. Ensure dates match your logbook policy.',
      },
      {
        question: 'Pricing for 40 record pages?',
        answer:
          'Select a bundle covering 40 preview pages. Bulk tiers reduce cost toward ₹1.05 each.',
      },
    ],
    relatedSlugs: [
      'lab-record-generator',
      'nursing-assignment-generator',
      'engineering-assignment-generator',
      'notebook-generator',
    ],
    cta: {
      headline: 'Generate record writing pages',
      body: 'Type record entries in NakalAI, preview handwriting free, and download bundles from ₹29.',
    },
    workspace: {
      text: LAB_RECORD_DEMO,
      inkId: 'black',
      paperId: 'ruled',
    },
  },
  {
    slug: 'homework-writer',
    title: 'Homework Writer Online — NakalAI Handwriting Export',
    description:
      'Write homework online and export as handwritten pages with NakalAI. Free preview, bundles from ₹29.',
    h1: 'Homework Writer — Type Then Hand In Ink',
    problemLead:
      'Homework writers in apps produce typed text, but teachers still collect notebooks. NakalAI closes the loop: compose homework online, export believable ink pages, and hand in on time.',
    audience:
      'School students who prefer typing homework but must submit handwritten work.',
    benefits: [
      'Compose homework in-browser without extra apps',
      'Quick turnaround from draft to printable ink pages',
      'Free homework preview for every assignment',
      'Starter bundles at ₹29 (~₹1.05 per page on larger packs)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Write homework online',
        body: 'Draft answers directly in NakalAI or paste from your notes app after finishing research.',
      },
      {
        step: 2,
        title: 'Apply homework defaults',
        body: 'Blue ruled pages mirror everyday homework notebooks in many schools.',
      },
      {
        step: 3,
        title: 'Hand in handwritten pages',
        body: 'Print from the free preview-approved PDF or share digitally if teachers allow.',
      },
    ],
    sections: [
      {
        h2: 'Homework writer meets notebook culture',
        body: 'Digital drafting improves spelling and structure. NakalAI translates that polish into handwriting teachers recognize from exercise books.',
      },
      {
        h2: 'Same-night homework rescue',
        body: 'When homework was forgotten until 9 p.m., online writing plus instant handwriting beats panic copying.',
      },
      {
        h2: 'Small spend per assignment',
        body: 'Preview is free. Most homework fits small bundles starting at ₹29—often just ₹1.05 per page when you buy term-sized packs.',
      },
    ],
    tips: [
      'Read answers aloud once before generating—catches typos typing missed.',
      'Keep homework under your teacher’s page guideline to avoid extra sheets.',
      'Save screenshots of preview if you need proof before payment approval from parents.',
    ],
    examples: [
      'A Class 9 student writes English comprehension answers online and prints 2 pages.',
      'A Class 11 student exports chemistry numerical homework before morning assembly.',
    ],
    faqs: [
      {
        question: 'How is homework writer different from homework generator?',
        answer:
          'Homework writer emphasizes composing online first; generator focuses on converting existing pasted answers.',
      },
      {
        question: 'Can I write on phone?',
        answer:
          'Yes for short homework. Long answers benefit from a keyboard on laptop or tablet.',
      },
      {
        question: 'Will teachers accept printed homework?',
        answer:
          'Many do if handwriting looks natural. Ask if your teacher requires a specific notebook brand.',
      },
      {
        question: 'Can siblings share an account?',
        answer:
          'Each download uses bundle credits. Family accounts should track page purchases separately.',
      },
      {
        question: 'Is spell-check available?',
        answer:
          'Use browser spell-check while typing. Handwriting preview will not auto-correct after generation.',
      },
      {
        question: 'Refund if homework page count wrong?',
        answer:
          'Preview shows exact pages before payment. Adjust text and regenerate if count is off.',
      },
    ],
    relatedSlugs: [
      'handwritten-homework-generator',
      'school-assignment-generator',
      'write-assignment-online',
      'student-assignment-maker',
    ],
    cta: {
      headline: 'Write homework and export handwriting',
      body: 'Draft homework in NakalAI, preview ink pages free, and download bundles from ₹29.',
    },
    workspace: {
      text: SCHOOL_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
  {
    slug: 'handwritten-notes-generator',
    title: 'Handwritten Notes Generator — NakalAI Study Tool',
    description:
      'Turn typed study notes into handwritten pages with NakalAI. Free preview, note bundles from ₹29.',
    h1: 'Handwritten Notes Generator for Revision',
    problemLead:
      'Research shows many students recall better from handwritten notes—but typing is faster during lectures. NakalAI generates handwritten note pages from your typed capture so revision feels like a real notebook.',
    audience:
      'Exam aspirants and students building handwritten revision sets from digital summaries.',
    benefits: [
      'Unit-wise notes with headings and bullet concepts',
      'Plain or ruled paper for different study styles',
      'Free preview of entire note sets before buying',
      'Affordable packs from ₹29 (~₹1.05 per page bulk)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Paste study notes',
        body: 'Import chapter summaries, formula lists, or definition banks from your digital notes.',
      },
      {
        step: 2,
        title: 'Style for revision',
        body: 'Plain paper suits highlight-heavy notes; ruled keeps lines tidy for fast rereading.',
      },
      {
        step: 3,
        title: 'Print revision notebook',
        body: 'Flip through free preview pages, download, and carry a lightweight printed note stack.',
      },
    ],
    sections: [
      {
        h2: 'Digital capture, handwritten recall',
        body: 'Type quickly in class, generate ink pages at night, and revise from paper that triggers muscle memory.',
      },
      {
        h2: 'Exam-tip blocks and mnemonics',
        body: 'Inline exam tips and acronyms paste cleanly—use CAPS or spacing so they stand out in handwriting preview.',
      },
      {
        h2: 'Cheap note stacks for competitive exams',
        body: 'NEET, JEE, and board aspirants need volume. NakalAI previews free; bundles from ₹29 scale to about ₹1.05 per page.',
      },
    ],
    tips: [
      'One chapter per paste keeps preview loading fast and page counts clear.',
      'Add “⭐” markers in text for concepts you want to find quickly after printing.',
      'Use black ink for photocopying notes for study groups.',
    ],
    examples: [
      'An economics student generates Unit 3 market-structure handwritten notes.',
      'A NEET repeater converts a biology formula list into pocket revision pages.',
    ],
    faqs: [
      {
        question: 'Can I highlight after printing?',
        answer:
          'Yes. Print notes and use physical highlighters as with normal notebooks.',
      },
      {
        question: 'Are diagrams included?',
        answer:
          'Text only. Sketch diagrams in margins after printing or leave blank lines.',
      },
      {
        question: 'Best paper for formula sheets?',
        answer:
          'Plain paper keeps focus on dense formulas without ruled line interference.',
      },
      {
        question: 'Can I sell generated notes?',
        answer:
          'Check NakalAI terms and copyright on source material before commercial use.',
      },
      {
        question: 'How many chapters in one download?',
        answer:
          'No hard limit—preview total pages and pick an appropriate bundle from ₹29 upward.',
      },
      {
        question: 'Will small text stay readable?',
        answer:
          'Zoom preview. Split overly dense sections into two paste blocks if needed.',
      },
    ],
    relatedSlugs: [
      'convert-notes-to-handwriting',
      'text-to-notebook',
      'notebook-generator',
      'text-to-handwriting',
    ],
    cta: {
      headline: 'Generate handwritten study notes',
      body: 'Paste notes into NakalAI, preview every page free, and download bundles from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'black',
      paperId: 'plain',
    },
  },
  {
    slug: 'ai-handwriting-generator',
    title: 'AI Handwriting Generator — Realistic Ink | NakalAI',
    description:
      'AI-powered handwriting generator for assignments and notes. NakalAI free preview, bundles from ₹29.',
    h1: 'AI Handwriting Generator — Natural Ink Strokes',
    problemLead:
      'Old converters used rigid fonts. NakalAI uses AI-driven stroke rendering so each letter connection varies slightly—closer to how a person actually writes on notebook paper.',
    audience:
      'Students and creators who want AI-generated handwriting that avoids repetitive font tells.',
    benefits: [
      'AI stroke variation—not a static handwriting font',
      'Adapts spacing to ruled, plain, and grid backgrounds',
      'Full free preview before spending on downloads',
      'Page bundles from ₹29 (~₹1.05 per page at volume)',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Provide source text',
        body: 'Paste assignments, notes, or captions. The AI handwriting engine processes plain Unicode text.',
      },
      {
        step: 2,
        title: 'Configure visual style',
        body: 'Select ink colour and paper type. AI layout wraps lines to match notebook constraints.',
      },
      {
        step: 3,
        title: 'Review AI output',
        body: 'Inspect stroke realism in the free preview. Download when the AI handwriting meets your standard.',
      },
    ],
    sections: [
      {
        h2: 'Beyond font-based “AI” tools',
        body: 'Many sites label fonts as AI. NakalAI focuses on perceptual realism—stroke weight changes, natural slant drift, and non-identical repeated letters.',
      },
      {
        h2: 'AI speed for last-minute work',
        body: 'Large pastes render in seconds. Preview instantly, iterate on spacing, and export without waiting for manual copying.',
      },
      {
        h2: 'Transparent AI pricing',
        body: 'AI generation previews are free. Paid PDF bundles start at ₹29 with effective rates near ₹1.05 per page on bigger packs.',
      },
    ],
    tips: [
      'Compare AI preview zoom to a photo of your real handwriting for plausibility.',
      'Shorter lines look more human—break at punctuation where possible.',
      'Regenerate after minor edits; AI re-renders fresh stroke patterns each time.',
    ],
    examples: [
      'A content creator generates AI handwriting captions for study Instagram carousels.',
      'A student exports AI ink pages for a scholarship essay practice notebook.',
    ],
    faqs: [
      {
        question: 'What makes NakalAI different from font generators?',
        answer:
          'Stroke-level variation mimics pen pressure and join differences fonts cannot replicate.',
      },
      {
        question: 'Does AI change my words?',
        answer:
          'No. AI affects appearance only. Your text content stays exactly as pasted.',
      },
      {
        question: 'Is an account required for AI preview?',
        answer:
          'Follow on-site signup rules. Preview itself is free once you access the workspace.',
      },
      {
        question: 'Can AI handwriting include emojis?',
        answer:
          'Stick to text characters for best results. Emojis may render inconsistently.',
      },
      {
        question: 'Will AI improve over time?',
        answer:
          'NakalAI updates rendering periodically. Re-preview older projects if curious.',
      },
      {
        question: 'Ethical use for submissions?',
        answer:
          'Understand your institution’s policies. AI handwriting is a tool—not a substitute for learning.',
      },
    ],
    relatedSlugs: [
      'realistic-handwriting-generator',
      'text-to-handwriting',
      'assignment-handwriting-generator',
      'convert-notes-to-handwriting',
    ],
    cta: {
      headline: 'Try AI handwriting generation',
      body: 'Paste text in NakalAI, preview AI ink strokes free, and download bundles from ₹29.',
    },
    workspace: {
      text: NOTES_DEMO,
      inkId: 'blue',
      paperId: 'plain',
    },
  },
  {
    slug: 'realistic-handwriting-generator',
    title: 'Realistic Handwriting Generator — NakalAI Preview',
    description:
      'Create realistic handwriting pages for assignments with NakalAI. Free preview, affordable bundles from ₹29.',
    h1: 'Realistic Handwriting Generator for Submissions',
    problemLead:
      'Unrealistic handwriting breaks trust—too perfect, too repetitive. NakalAI targets believable imperfection: slight slant changes, organic line spacing, and ink that looks laid down by a ballpoint—not stamped by software.',
    audience:
      'Students who need handwriting output that holds up to teacher scrutiny and photocopying.',
    benefits: [
      'Believable ballpoint-style stroke rendering',
      'Readable at A4 print and phone-photo submission sizes',
      'Zero-cost preview to judge realism yourself',
      'Bundles from ₹29 with ~₹1.05 per page on large packs',
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Insert final text',
        body: 'Use finished assignment or report text—realism shows best on content you will actually submit.',
      },
      {
        step: 2,
        title: 'Tune paper context',
        body: 'Ruled college pages or plain narrative sheets both support realistic ink placement.',
      },
      {
        step: 3,
        title: 'Validate realism in preview',
        body: 'Zoom to letter level in the free preview. Download only when strokes look naturally written.',
      },
    ],
    sections: [
      {
        h2: 'Realism checks that matter',
        body: 'Teachers notice identical loops and perfect baselines. NakalAI introduces subtle variation so repeated words do not look copy-pasted visually.',
      },
      {
        h2: 'Photocopy and WhatsApp friendly',
        body: 'Output contrast suits phone cameras and Xerox machines—important when submissions travel through unofficial channels before filing.',
      },
      {
        h2: 'Honest pricing after honest preview',
        body: 'Judge realism yourself for free. Pay for downloads starting at ₹29—about ₹1.05 per page when buying semester-scale bundles.',
      },
    ],
    tips: [
      'Avoid ALL CAPS blocks—they look less natural in handwriting preview.',
      'Mix short and long sentences so line endings vary visually.',
      'Print one test page before buying a large bundle to compare with real ink.',
    ],
    examples: [
      'A college student exports a realistic lab report for internal assessment.',
      'A school topper generates realistic pages for a handwriting-consistency practice set.',
    ],
    faqs: [
      {
        question: 'How realistic compared to my own writing?',
        answer:
          'It mimics generic neat student handwriting. It will not match your unique glyph shapes exactly.',
      },
      {
        question: 'Can I make it messier?',
        answer:
          'Spacing tweaks help. NakalAI optimizes for legible realism rather than sloppy scripts.',
      },
      {
        question: 'Does realism differ by ink colour?',
        answer:
          'Blue and black both render with variation. Preview both on your printer.',
      },
      {
        question: 'Will repeated assignments look identical?',
        answer:
          'Stroke patterns vary between generations. Content repetition still looks natural enough for separate days.',
      },
      {
        question: 'Is realistic mode slower?',
        answer:
          'Preview speed is similar across modes for typical student page counts.',
      },
      {
        question: 'Can teachers scan for AI handwriting?',
        answer:
          'No widely adopted scan exists. Still follow academic integrity policies at your school.',
      },
    ],
    relatedSlugs: [
      'ai-handwriting-generator',
      'blue-ink-handwriting',
      'black-ink-handwriting',
      'assignment-handwriting-generator',
    ],
    cta: {
      headline: 'Generate realistic handwriting',
      body: 'Paste your text in NakalAI, inspect realistic strokes in free preview, and download from ₹29.',
    },
    workspace: {
      text: COLLEGE_DEMO,
      inkId: 'blue',
      paperId: 'ruled',
    },
  },
];
