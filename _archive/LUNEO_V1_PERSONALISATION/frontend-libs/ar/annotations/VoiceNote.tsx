'use client';

/**
 * Voice recording anchored in 3D (MediaRecorder API).
 * @module ar/annotations/VoiceNote
 */

import React, { useState, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface VoiceNoteProps {
  /** Position in 3D (for anchor) */
  position?: { x: number; y: number; z: number };
  onRecordingComplete?: (blob: Blob) => void;
  className?: string;
}

/**
 * React component: record voice note (MediaRecorder), optional anchor in 3D.
 */
export function VoiceNote({
  onRecordingComplete,
  className = '',
}: VoiceNoteProps): React.ReactElement {
  const [recording, setRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingState('stopped');
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingState('recording');
    } catch (err) {
      logger.warn('VoiceNote: startRecording failed', { error: String(err) });
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  }, [recording]);

  return (
    <div
      className={`ar-voice-note ${className}`}
      role="group"
      aria-label="Voice note recorder"
      style={{
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        borderRadius: '8px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          background: recording ? '#ef4444' : '#22c55e',
          color: '#fff',
          cursor: 'pointer',
        }}
      />
      <span style={{ fontSize: '12px' }}>
        {recordingState === 'recording' ? 'Recording…' : recordingState === 'stopped' ? 'Saved' : 'Tap to record'}
      </span>
    </div>
  );
}
