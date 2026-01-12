// Spanish translations
// Import JSON and convert to TypeScript format
import esJson from './es.json';

const messages = esJson as typeof import('./en').default;

export default messages;
