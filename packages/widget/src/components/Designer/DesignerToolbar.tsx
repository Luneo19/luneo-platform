'use client';

import { useDesignerStore } from '../../store/designerStore';
import { 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  Shapes, 
  Hand,
  Undo2,
  Redo2,
  Save,
  Download,
  Eye,
  Sparkles,
  Box
} from 'lucide-react';

interface DesignerToolbarProps {
  onGenerateClick?: () => void;
  onARClick?: () => void;
  showGenerate?: boolean;
  showAR?: boolean;
}

export function DesignerToolbar({ onGenerateClick, onARClick, showGenerate = true, showAR = true }: DesignerToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDesign,
    isSaving,
    toggleLayers,
    showLayers,
    exportAsPNG,
  } = useDesignerStore();
  
  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: 'Sélectionner' },
    { id: 'text' as const, icon: Type, label: 'Texte' },
    { id: 'image' as const, icon: ImageIcon, label: 'Image' },
    { id: 'shape' as const, icon: Shapes, label: 'Forme' },
    { id: 'pan' as const, icon: Hand, label: 'Déplacer' },
  ];
  
  const handleSave = async () => {
    try {
      await saveDesign();
    } catch (error) {
      console.error('Failed to save design:', error);
    }
  };
  
  const handleExport = async () => {
    try {
      await exportAsPNG();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                activeTool === tool.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Annuler"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refaire"
        >
          <Redo2 className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <button
          onClick={toggleLayers}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            showLayers ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
          }`}
          title="Afficher/Masquer les calques"
        >
          <Eye className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleExport}
          className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Exporter"
        >
          <Download className="w-5 h-5" />
        </button>
        
        {showGenerate && onGenerateClick && (
          <button
            onClick={onGenerateClick}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-2"
            title="Generate with AI"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Generate</span>
          </button>
        )}
        
        {showAR && onARClick && (
          <button
            onClick={onARClick}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
            title="View in AR"
          >
            <Box className="w-4 h-4" />
            <span>AR View</span>
          </button>
        )}
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>
    </div>
  );
}

