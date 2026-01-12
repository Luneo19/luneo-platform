// German translations
// Import JSON and convert to TypeScript format
import deJson from './de.json';

const messages = deJson as typeof import('./en').default;

export default messages;
