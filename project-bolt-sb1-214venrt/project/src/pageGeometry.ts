// A4 page geometry constants — all in millimeters, matching real A4 (210mm x 297mm)
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_LEFT_MM = 30; // pink margin line position from left edge
export const LINE_SPACING_MM = 8; // vertical distance between ruled lines
export const PADDING_TOP_MM = 16; // gap before the first ruled line
export const PADDING_RIGHT_MM = 15; // right padding for text area
export const MAX_LINES_PER_PAGE = 32; // capacity of one A4 page at 8mm spacing

// Text rendering defaults
export const DEFAULT_FONT_SIZE_PX = 22; // base font size in pixels (at 96dpi rendering)
/** @deprecated Rule-bound layout uses LINE_SPACING_PX as line-height. */
export const LINE_HEIGHT_MULTIPLIER = 1.45;

// Pixels-per-millimeter at 96dpi (CSS standard)
export const PX_PER_MM = 96 / 25.4;

// Derived: usable text width in mm (from margin line + small gap to right padding)
export const TEXT_AREA_LEFT_MM = MARGIN_LEFT_MM + 4;
export const TEXT_AREA_WIDTH_MM = A4_WIDTH_MM - TEXT_AREA_LEFT_MM - PADDING_RIGHT_MM;

// Derived pixel values for rendering
export const A4_WIDTH_PX = A4_WIDTH_MM * PX_PER_MM; // ~793.7px
export const A4_HEIGHT_PX = A4_HEIGHT_MM * PX_PER_MM; // ~1122.5px
export const LINE_SPACING_PX = LINE_SPACING_MM * PX_PER_MM; // ~30.24px
export const MARGIN_LEFT_PX = MARGIN_LEFT_MM * PX_PER_MM; // ~113.4px
export const PADDING_TOP_PX = PADDING_TOP_MM * PX_PER_MM; // ~60.5px
export const TEXT_AREA_LEFT_PX = TEXT_AREA_LEFT_MM * PX_PER_MM;
export const TEXT_AREA_WIDTH_PX = TEXT_AREA_WIDTH_MM * PX_PER_MM;
