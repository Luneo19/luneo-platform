import Link from 'next/link';
import { Code } from 'lucide-react';

export const metadata = {
  title: 'Code Examples - Luneo Documentation',
};

export default function ExamplesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">← Documentation</Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Code className="w-10 h-10 text-green-600" />
          <h1 className="text-4xl font-bold">Code Examples</h1>
        </div>
        <p className="text-xl text-gray-600">Exemples prêts à utiliser</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold mb-6">Create a Design</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`// JavaScript
const response = await fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My T-Shirt',
    template: 't-shirt',
    customizations: { color: '#FF0000' }
  })
});
const design = await response.json();`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">React Component</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { DesignEditor } from '@luneo/react';

export default function MyEditor() {
  return (
    <DesignEditor
      template="t-shirt"
      onSave={(design) => console.log(design)}
    />
  );
}`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Generate with AI</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`const response = await fetch('https://api.luneo.app/v1/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Modern minimalist t-shirt design',
    style: 'photorealistic'
  })
});`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



