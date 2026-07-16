export type {
  RendererDNA,
  GlyphPaintInstruction,
  LinePaintInstruction,
  PagePaintPlan,
} from './types';
export { buildPagePaintPlan } from './instructions';
export { executePagePaintPlan } from './executePlan';
export { comparePaintPlans } from './planParity';
export {
  renderDnaToCanvas,
  buildProductionPaintPlan,
  type DnaCanvasRenderRequest,
} from './paint';
export { profileToLightweightDna } from './fromProfile';
export { getDnaDebugSnapshot, drawDnaDebugOverlay } from './debug';
