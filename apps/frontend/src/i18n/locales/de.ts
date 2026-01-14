// German translations
// Import JSON and convert to TypeScript format
import deJson from './de.json';
import enJson from './en.json';

const messages = deJson as unknown as typeof enJson;

export default messages;
