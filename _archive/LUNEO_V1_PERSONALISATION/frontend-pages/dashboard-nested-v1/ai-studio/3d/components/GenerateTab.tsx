'use client';

import { useCallback } from 'react';
import { GenerateParamsPanel } from './GenerateParamsPanel';
import { GenerateResultsPanel } from './GenerateResultsPanel';
import { TipsCard } from './TipsCard';
import { formatDate, formatRelativeTime } from './utils';
import type { AIStudioTab } from './types';
import type { GeneratedModel } from './types';
import type { ToastFn } from './GenerateParamsPanel';

interface GenerateTabProps {
  prompt: string;
  setPrompt: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  complexity: string;
  setComplexity: (v: string) => void;
  resolution: string;
  setResolution: (v: string) => void;
  polyCount: number[];
  setPolyCount: (v: number[]) => void;
  textureQuality: number[];
  setTextureQuality: (v: number[]) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  isGenerating: boolean;
  generationProgress: number;
  credits: number;
  enableBatch: boolean;
  setEnableBatch: (v: boolean) => void;
  batchCount: number;
  setBatchCount: (v: number) => void;
  filteredModels: GeneratedModel[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterComplexity: string;
  setFilterComplexity: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  setActiveTab: (tab: AIStudioTab) => void;
  handleGenerate: () => void;
  onPreview: (model: GeneratedModel) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (model: GeneratedModel) => void;
  onExport: () => void;
  toast: ToastFn;
}

export function GenerateTab(props: GenerateTabProps) {
  const formatRelativeTimeFn = useCallback(
    (ts: number) => formatRelativeTime(ts, formatDate),
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <GenerateParamsPanel
          prompt={props.prompt}
          setPrompt={props.setPrompt}
          category={props.category}
          setCategory={props.setCategory}
          complexity={props.complexity}
          setComplexity={props.setComplexity}
          resolution={props.resolution}
          setResolution={props.setResolution}
          polyCount={props.polyCount}
          setPolyCount={props.setPolyCount}
          textureQuality={props.textureQuality}
          setTextureQuality={props.setTextureQuality}
          showAdvanced={props.showAdvanced}
          setShowAdvanced={props.setShowAdvanced}
          isGenerating={props.isGenerating}
          generationProgress={props.generationProgress}
          credits={props.credits}
          enableBatch={props.enableBatch}
          setEnableBatch={props.setEnableBatch}
          batchCount={props.batchCount}
          setBatchCount={props.setBatchCount}
          handleGenerate={props.handleGenerate}
          toast={props.toast}
        />
        <TipsCard />
      </div>
      <GenerateResultsPanel
        filteredModels={props.filteredModels}
        isGenerating={props.isGenerating}
        generationProgress={props.generationProgress}
        searchTerm={props.searchTerm}
        setSearchTerm={props.setSearchTerm}
        filterCategory={props.filterCategory}
        setFilterCategory={props.setFilterCategory}
        filterComplexity={props.filterComplexity}
        setFilterComplexity={props.setFilterComplexity}
        viewMode={props.viewMode}
        setViewMode={props.setViewMode}
        setActiveTab={props.setActiveTab}
        formatRelativeTimeFn={formatRelativeTimeFn}
        onPreview={props.onPreview}
        onToggleFavorite={props.onToggleFavorite}
        onViewDetails={props.onViewDetails}
        onExport={props.onExport}
      />
    </div>
  );
}
