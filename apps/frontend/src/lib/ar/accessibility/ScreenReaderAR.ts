/**
 * Screen reader descriptions for AR: live region announcements and scene description.
 * @module ar/accessibility/ScreenReaderAR
 */

import { logger } from '@/lib/logger';

let liveRegion: HTMLDivElement | null = null;

function getLiveRegion(): HTMLDivElement {
  if (liveRegion && document.body.contains(liveRegion)) return liveRegion;
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');
  liveRegion.className = 'ar-screen-reader-live';
  liveRegion.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
  document.body.appendChild(liveRegion);
  return liveRegion;
}

/**
 * Announces messages to screen readers and describes AR scene/interactions.
 */
export class ScreenReaderAR {
  /**
   * Announce a message to screen readers (ARIA live region).
   */
  announce(message: string): void {
    if (typeof document === 'undefined') return;
    const region = getLiveRegion();
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
      logger.debug('ScreenReaderAR: announce', { message });
    });
  }

  /**
   * Describe what's in the AR view (object list).
   */
  describeScene(objects: { name?: string; count?: number }[]): void {
    const parts = objects.map((o) => (o.count && o.count > 1 ? `${o.name ?? 'Object'} (${o.count})` : o.name ?? 'Object'));
    const text = parts.length ? `AR view contains: ${parts.join(', ')}` : 'AR view is empty';
    this.announce(text);
  }

  /**
   * Describe the current user action (e.g. placement, removal).
   */
  describeInteraction(type: string): void {
    const messages: Record<string, string> = {
      place: 'Object placed in scene',
      remove: 'Object removed',
      screenshot: 'Screenshot captured',
      bigger: 'Object enlarged',
      smaller: 'Object reduced',
    };
    this.announce(messages[type] ?? `Action: ${type}`);
  }
}
