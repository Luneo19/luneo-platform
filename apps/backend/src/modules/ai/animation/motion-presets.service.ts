import { Injectable } from '@nestjs/common';

export interface MotionPreset {
  name: string;
  description: string;
  motion: string;
  duration: number;
  fps: number;
  prompt: string;
  suggestedResolution: string;
}

const PRESETS: MotionPreset[] = [
  {
    name: '360-rotation',
    description: 'Smooth 360 degree product rotation',
    motion: '360-rotation',
    duration: 5,
    fps: 30,
    prompt: 'Smooth 360 degree rotation, professional studio lighting, seamless loop',
    suggestedResolution: '1080p',
  },
  {
    name: 'zoom-in',
    description: 'Cinematic slow zoom-in',
    motion: 'zoom-in',
    duration: 4,
    fps: 30,
    prompt: 'Cinematic slow zoom-in, revealing details, studio lighting',
    suggestedResolution: '1080p',
  },
  {
    name: 'parallax',
    description: 'Subtle parallax depth effect',
    motion: 'parallax',
    duration: 5,
    fps: 30,
    prompt: 'Subtle parallax motion, depth effect, professional photography',
    suggestedResolution: '1080p',
  },
  {
    name: 'turntable',
    description: 'Product turntable rotation',
    motion: 'turntable',
    duration: 6,
    fps: 30,
    prompt: 'Product turntable rotation, even lighting, white background',
    suggestedResolution: '1080p',
  },
  {
    name: 'dolly-zoom',
    description: 'Dolly zoom (Vertigo) effect',
    motion: 'dolly-zoom',
    duration: 4,
    fps: 30,
    prompt: 'Dolly zoom effect, perspective shift, cinematic',
    suggestedResolution: '1080p',
  },
  {
    name: 'orbit',
    description: 'Orbital camera around subject',
    motion: 'orbit',
    duration: 6,
    fps: 30,
    prompt: 'Orbital camera movement around subject, professional lighting',
    suggestedResolution: '1080p',
  },
];

@Injectable()
export class MotionPresetsService {
  private readonly presetsMap = new Map<string, MotionPreset>(
    PRESETS.map((p) => [p.name, p]),
  );

  getPreset(name: string): MotionPreset | undefined {
    return this.presetsMap.get(name);
  }

  getAllPresets(): MotionPreset[] {
    return [...PRESETS];
  }
}
