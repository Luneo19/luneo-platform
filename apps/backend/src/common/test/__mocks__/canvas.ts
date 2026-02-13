/**
 * Mock for native 'canvas' module
 * Used in tests when native canvas bindings are not available (outside Docker)
 */

const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  clip: jest.fn(),
  rect: jest.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  textAlign: 'left',
  textBaseline: 'top',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  toBuffer: jest.fn(() => Buffer.from([])),
  toDataURL: jest.fn(() => 'data:image/png;base64,'),
  width: 0,
  height: 0,
};

export function createCanvas(width: number, height: number) {
  return { ...mockCanvas, width, height };
}

export function loadImage(_src: string) {
  return Promise.resolve({
    width: 100,
    height: 100,
    naturalWidth: 100,
    naturalHeight: 100,
  });
}

export type CanvasRenderingContext2D = typeof mockContext;
export type CanvasTextAlign = 'start' | 'end' | 'left' | 'right' | 'center';
export type Image = {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

export default { createCanvas, loadImage };
