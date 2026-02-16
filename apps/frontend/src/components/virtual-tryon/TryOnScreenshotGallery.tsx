'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface TryOnScreenshotGalleryProps {
  screenshots: string[];
  onRemove?: (index: number) => void;
  onBatchUpload?: (screenshots: string[]) => Promise<void>;
  onShare?: (dataUrl: string) => void;
  isUploading?: boolean;
  className?: string;
}

/**
 * ScreenshotModal - Accessible full-screen preview dialog.
 * Traps focus, closes on Escape, uses dialog role.
 */
function ScreenshotModal({
  screenshots,
  previewIndex,
  onClose,
  onPrev,
  onNext,
  onShare,
}: {
  screenshots: string[];
  previewIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShare: (dataUrl: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape key
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && previewIndex > 0) {
        onPrev();
        return;
      }
      if (e.key === 'ArrowRight' && previewIndex < screenshots.length - 1) {
        onNext();
        return;
      }
      // Focus trap: keep focus within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, previewIndex, screenshots.length]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Capture ${previewIndex + 1} sur ${screenshots.length}`}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={screenshots[previewIndex]}
          alt={`Capture ${previewIndex + 1}`}
          className="w-full h-full object-contain rounded-lg"
        />

        {/* Navigation */}
        {screenshots.length > 1 && (
          <>
            {previewIndex > 0 && (
              <button
                onClick={onPrev}
                aria-label="Image precedente"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
              >
                &#x2190;
              </button>
            )}
            {previewIndex < screenshots.length - 1 && (
              <button
                onClick={onNext}
                aria-label="Image suivante"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
              >
                &#x2192;
              </button>
            )}
          </>
        )}

        {/* Actions bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={() => onShare(screenshots[previewIndex])}
            className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            Partager
          </button>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>
        </div>

        {/* Counter */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-sm" aria-live="polite">
          {previewIndex + 1} / {screenshots.length}
        </div>
      </div>
    </div>
  );
}

/**
 * TryOnScreenshotGallery - Displays and manages session screenshots.
 *
 * Features:
 * - Grid preview of captured screenshots
 * - Full-screen modal preview with a11y (dialog, focus trap, Escape)
 * - Local deletion
 * - Web Share API integration
 * - Batch upload to backend at end of session
 */
export default function TryOnScreenshotGallery({
  screenshots,
  onRemove,
  onBatchUpload,
  onShare,
  isUploading = false,
  className,
}: TryOnScreenshotGalleryProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // Close modal if screenshots change and index becomes invalid
  useEffect(() => {
    if (previewIndex !== null && previewIndex >= screenshots.length) {
      setPreviewIndex(null);
    }
  }, [screenshots.length, previewIndex]);

  const handleShare = useCallback(
    async (dataUrl: string) => {
      if (onShare) {
        onShare(dataUrl);
        return;
      }

      // Try Web Share API
      if (navigator.share) {
        try {
          const blob = await fetch(dataUrl).then((r) => r.blob());
          const file = new File([blob], 'try-on-screenshot.png', {
            type: 'image/png',
          });

          await navigator.share({
            title: 'Virtual Try-On',
            text: 'Regardez mon essayage virtuel !',
            files: [file],
          });
        } catch {
          // User cancelled or not supported
        }
      } else {
        // Fallback: download
        const link = document.createElement('a');
        link.download = `try-on-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    },
    [onShare],
  );

  const handleBatchUpload = useCallback(async () => {
    if (onBatchUpload && screenshots.length > 0) {
      await onBatchUpload(screenshots);
    }
  }, [onBatchUpload, screenshots]);

  if (screenshots.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        <div className="text-3xl mb-2">&#x1F4F7;</div>
        <p className="text-sm">Aucune capture pour le moment</p>
        <p className="text-xs opacity-60 mt-1">
          Capturez des screenshots pendant l&apos;essayage
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {screenshots.map((dataUrl, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setPreviewIndex(index)}
          >
            <img
              src={dataUrl}
              alt={`Capture ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity">
                Agrandir
              </span>
            </div>
            {/* Remove button */}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Supprimer"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {onBatchUpload && (
          <button
            onClick={handleBatchUpload}
            disabled={isUploading}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isUploading
              ? 'Upload en cours...'
              : `Sauvegarder ${screenshots.length} capture${screenshots.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Full-screen preview modal (a11y: dialog role, focus trap, Escape key) */}
      {previewIndex !== null && previewIndex < screenshots.length && (
        <ScreenshotModal
          screenshots={screenshots}
          previewIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onPrev={() => setPreviewIndex(previewIndex - 1)}
          onNext={() => setPreviewIndex(previewIndex + 1)}
          onShare={(dataUrl) => handleShare(dataUrl)}
        />
      )}
    </div>
  );
}
