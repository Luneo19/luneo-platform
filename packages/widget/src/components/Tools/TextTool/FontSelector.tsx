'use client';

import { AVAILABLE_FONTS } from '../../../constants/fonts';

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ fontFamily: value }}
    >
      {AVAILABLE_FONTS.map((font) => (
        <option key={font} value={font} style={{ fontFamily: font }}>
          {font}
        </option>
      ))}
    </select>
  );
}



