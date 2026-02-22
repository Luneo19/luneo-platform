'use client';

import { useState } from 'react';
import { useDesignerStore } from '../../../store/designerStore';
import { ImageUploader } from './ImageUploader';

export function ImageTool() {
  const { activeTool, addLayer } = useDesignerStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  if (activeTool !== 'image') {
    return null;
  }
  
  const handleImageUploaded = (src: string) => {
    setUploadedImage(src);
    addLayer('image', {
      data: {
        src,
        originalSrc: src,
        width: 200,
        height: 200,
      },
    });
  };
  
  return (
    <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[300px]">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter une image</h3>
      {!uploadedImage ? (
        <ImageUploader onUpload={handleImageUploaded} />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-32 object-contain rounded border border-gray-200"
            />
          </div>
          <button
            onClick={() => setUploadedImage(null)}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Changer l'image
          </button>
        </div>
      )}
    </div>
  );
}

