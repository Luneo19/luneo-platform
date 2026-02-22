'use client';

import { useDesignerStore } from '../../../store/designerStore';
import { TextEditor } from './TextEditor';

export function TextTool() {
  const { activeTool, addLayer } = useDesignerStore();
  
  if (activeTool !== 'text') {
    return null;
  }
  
  const handleAddText = (content: string, fontFamily: string, fontSize: number) => {
    addLayer('text', {
      data: {
        content,
        fontFamily,
        fontSize,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
      },
    });
  };
  
  return (
    <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[300px]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter du texte</h3>
      <TextEditor onAdd={handleAddText} />
    </div>
  );
}

