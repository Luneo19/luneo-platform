// Italian translations
// Import JSON and convert to TypeScript format
import itJson from './it.json';
import enJson from './en.json';

export default itJson as unknown as typeof import('./en').default;
