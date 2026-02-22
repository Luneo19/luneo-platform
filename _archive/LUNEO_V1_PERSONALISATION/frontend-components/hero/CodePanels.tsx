'use client';

/**
 * CodePanels - Panneaux de code/data flottants
 * CSS uniquement pour performance maximale
 */

import React, { useMemo } from 'react';
import styles from './CodePanels.module.css';

interface CodePanel {
  id: string;
  left: string;
  top: string;
  delay: string;
  rotation: string;
  lines: string[];
  showPromptButton?: boolean;
}

export function CodePanels() {
  const panels = useMemo<CodePanel[]>(
    () => [
      {
        id: 'panel-1',
        left: '55%',
        top: '30%',
        delay: '0s',
        rotation: '2deg',
        lines: ['const ai = {', '  model: "3D",', '  type: "AR"', '};'],
      },
      {
        id: 'panel-2',
        left: '62%',
        top: '58%',
        delay: '1s',
        rotation: '-1.5deg',
        lines: ['function', 'generate() {', '  return 3D;', '}'],
        showPromptButton: true,
      },
      {
        id: 'panel-3',
        left: '10%',
        top: '48%',
        delay: '1.5s',
        rotation: '3deg',
        lines: ['data:', '{', '  prompt: "..."', '}'],
      },
      {
        id: 'panel-4',
        left: '15%',
        top: '22%',
        delay: '2s',
        rotation: '-2deg',
        lines: ['render:', '{', '  quality: "HD"', '}'],
      },
    ],
    []
  );

  return (
    <>
      {panels.map((panel) => (
        <div
          key={panel.id}
          className={styles.codePanel}
          style={{
            left: panel.left,
            top: panel.top,
            animationDelay: panel.delay,
            transform: `rotate(${panel.rotation})`,
          }}
        >
          <div className={styles.codePanelHeader} />
          <div className={styles.codePanelContent}>
            {panel.lines.map((line, index) => (
              <div key={index} className={styles.codeLine}>
                {line}
              </div>
            ))}
            {panel.showPromptButton && (
              <button className={styles.promptButton}>Prompt</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

