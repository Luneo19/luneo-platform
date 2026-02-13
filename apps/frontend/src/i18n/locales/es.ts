// Spanish translations
// Import JSON and convert to TypeScript format
import esJson from './es.json';
import enJson from './en.json';

export default esJson as unknown as typeof import('./en').default;
