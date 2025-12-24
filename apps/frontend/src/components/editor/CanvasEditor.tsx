'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Canvas Editor - Placeholder
 * TODO: Implement full canvas editor
 */

function CanvasEditorContent() {
  return (
    <div className="flex items-center justify-center h-full p-8 bg-slate-900 rounded-lg">
      <p className="text-slate-400">Canvas Editor - Coming Soon</p>
    </div>
  );
}

const CanvasEditorContentMemo = memo(CanvasEditorContent);

export default function CanvasEditor() {
  return (
    <ErrorBoundary componentName="CanvasEditor">
      <CanvasEditorContentMemo />
    </ErrorBoundary>
  );
}

