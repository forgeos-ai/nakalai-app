export type InkColor = {
  id: string;
  label: string;
  hex: string;
};

export type PaperType = {
  id: string;
  label: string;
};

export type FontStyle = {
  id: string;
  label: string;
  className: string;
};

export const INK_COLORS: InkColor[] = [
  { id: 'blue', label: 'Royal Blue', hex: '#1e40af' },
  { id: 'black', label: 'Jet Black', hex: '#1f2937' },
  { id: 'red', label: 'Ink Red', hex: '#b91c1c' },
];

export const PAPER_TYPES: PaperType[] = [
  { id: 'ruled', label: 'Ruled Notebook' },
  { id: 'plain', label: 'Plain Paper' },
  { id: 'grid', label: 'Grid Paper' },
];

export const FONT_STYLES: FontStyle[] = [
  { id: 'caveat', label: 'Caveat', className: 'font-caveat' },
  { id: 'kalam', label: 'Kalam', className: 'font-kalam' },
  { id: 'architects', label: "Architect's Daughter", className: 'font-architects' },
];

export const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog.

Handwriting is the writing done with a writing instrument, such as a pen or pencil, in the hand. It includes both printing and cursive styles, and is distinct from formal calligraphy or typeface.

Each person's handwriting is unique and can be used to verify a document's writer. The study of handwriting is known as graphology, and it has been used in various fields including forensics, psychology, and historical analysis.

In the modern digital age, handwriting has become less common as a means of communication, but it remains an important skill. Many educators argue that handwriting helps with cognitive development, memory retention, and fine motor skills.

There are several styles of handwriting, including print, cursive, and a combination of both. Each style has its own characteristics and is suited to different purposes. Print writing is typically easier to read, while cursive writing is faster to produce.

The tools used for handwriting have evolved over time, from quills and inkwells to fountain pens, ballpoint pens, and pencils. Each tool produces a distinct line quality and texture on the page.

Handwriting analysis is also used in forensic science to authenticate documents and identify forgeries. Experts examine characteristics such as letter formation, spacing, slant, and pressure to determine the authenticity of a document.`;
