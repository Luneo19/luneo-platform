/**
 * Client Component pour la page Library Import
 */

'use client';

import { ImportHeader } from './components/ImportHeader';
import { UploadZone } from './components/UploadZone';
import { FileList } from './components/FileList';
import { useFileUpload } from './hooks/useFileUpload';

export function ImportPageClient() {
  const {
    files,
    isUploading,
    fileInputRef,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles,
    openFileDialog,
  } = useFileUpload();

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const canUpload = pendingFiles.length > 0 && !isUploading;

  const handleUpload = async () => {
    const result = await uploadFiles();
    if (result.success) {
      // Optionnel: rediriger après upload réussi
      // router.push('/dashboard/library');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <ImportHeader
        onUpload={handleUpload}
        isUploading={isUploading}
        canUpload={canUpload}
      />
      <UploadZone
        onFilesSelected={addFiles}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
      />
      {files.length > 0 && (
        <FileList files={files} onRemove={removeFile} />
      )}
      {files.length > 0 && files.every((f) => f.status === 'success') && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={clearFiles}
            className="text-sm text-gray-400 hover:text-white"
          >
            Effacer la liste
          </button>
        </div>
      )}
    </div>
  );
}


