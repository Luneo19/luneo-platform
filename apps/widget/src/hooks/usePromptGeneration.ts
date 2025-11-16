import type { WidgetConfig } from '../types';
import type { Design } from '../types';
import { useLuneoWidget } from './useLuneoWidget';

export const usePromptGeneration = (
  config: WidgetConfig,
  callbacks?: {
    onDesignGenerated?: (design: Design) => void;
    onError?: (error: Error) => void;
  }
) =>
  useLuneoWidget(config, callbacks?.onDesignGenerated, callbacks?.onError);


