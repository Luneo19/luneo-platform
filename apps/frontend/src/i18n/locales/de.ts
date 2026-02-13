// German translations
// Import JSON and convert to TypeScript format
import deJson from './de.json';
import enJson from './en.json';

export default deJson as unknown as typeof import('./en').default;
