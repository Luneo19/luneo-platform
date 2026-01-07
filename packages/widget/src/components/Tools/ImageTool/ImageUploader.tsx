'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (src: string) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Convert to base64 for now (in production, upload to server)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          onUpload(result);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
      <p className="text-sm text-gray-600 mb-2">
        Glissez une image ici ou
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isUploading ? 'Téléchargement...' : 'Parcourir'}
      </button>
    </div>
  );
}





