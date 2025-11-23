import Link from 'next/link';

export const metadata = {
  title: 'React SDK - Luneo Documentation',
  description: 'SDK React pour intégrer Luneo en 5 minutes',
};

export default function ReactSDKPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">React SDK</h1>
        <p className="text-xl text-gray-600">Intégrez Luneo dans votre app React</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Installation</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`npm install @luneo/react
# ou
yarn add @luneo/react`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { LuneoProvider } from '@luneo/react';

function App() {
  return (
    <LuneoProvider apiKey="YOUR_API_KEY">
      <YourApp />
    </LuneoProvider>
  );
}`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Composants</h2>
          
          <h3 className="text-2xl font-bold mb-4">Design Editor</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
            <pre>{`import { DesignEditor } from '@luneo/react';

function MyEditor() {
  return (
    <DesignEditor
      template="t-shirt"
      onSave={(design) => console.log('Saved:', design)}
    />
  );
}`}</pre>
          </div>

          <h3 className="text-2xl font-bold mb-4">3D Viewer</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
            <pre>{`import { Viewer3D } from '@luneo/react';

function MyViewer() {
  return (
    <Viewer3D
      modelUrl="https://luneo.app/models/design_123.glb"
      enableAR={true}
    />
  );
}`}</pre>
          </div>

          <h3 className="text-2xl font-bold mb-4">AI Generator</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { AIGenerator } from '@luneo/react';

function MyGenerator() {
  return (
    <AIGenerator
      prompt="Modern t-shirt design"
      onGenerate={(result) => console.log(result)}
    />
  );
}`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Hooks</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { useDesigns, useCreateDesign } from '@luneo/react';

function MyComponent() {
  const { designs, loading } = useDesigns();
  const { create, creating } = useCreateDesign();
  
  const handleCreate = async () => {
    const design = await create({
      name: 'New Design',
      template: 't-shirt'
    });
  };
  
  return (
    <div>
      {designs.map(d => <div key={d.id}>{d.name}</div>)}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



