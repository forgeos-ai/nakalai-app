import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PaperSheet from './components/PaperSheet';
import {
  INK_COLORS,
  PAPER_TYPES,
  FONT_STYLES,
  DEFAULT_TEXT,
} from './constants';

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [paperType, setPaperType] = useState(PAPER_TYPES[0]);
  const [fontStyle, setFontStyle] = useState(FONT_STYLES[0]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      <div className="h-full w-full md:w-2/5">
        <ControlPanel
          text={text}
          onTextChange={setText}
          inkColor={inkColor}
          onInkColorChange={setInkColor}
          paperType={paperType}
          onPaperTypeChange={setPaperType}
          fontStyle={fontStyle}
          onFontStyleChange={setFontStyle}
        />
      </div>
      <div className="h-full w-full md:w-3/5">
        <PaperSheet text={text} inkColor={inkColor} fontStyle={fontStyle} />
      </div>
    </div>
  );
}
