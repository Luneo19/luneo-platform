// Italian translations
// Import JSON and convert to TypeScript format
import itJson from './it.json';

const messages = itJson as typeof import('./en').default;

export default messages;
