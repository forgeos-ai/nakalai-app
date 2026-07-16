export { HANDWRITING_DNA_VERSION, type HandwritingDNA } from './types';
export { assembleHandwritingDNA, type AssembleDnaInput } from './assemble';
export {
  getActiveHandwritingDNA,
  getHandwritingDnaRevision,
  setActiveHandwritingDNA,
  clearHandwritingDNA,
  isHandwritingDnaActive,
} from './session';
export { handwritingDnaToProfile } from './toProfile';
