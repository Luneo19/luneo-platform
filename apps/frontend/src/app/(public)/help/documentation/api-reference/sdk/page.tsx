import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ApiSdkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            SDKs Officiels
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Intégrez Luneo facilement avec nos SDKs officiels
          </p>
        </div>

        {/* JavaScript/TypeScript SDK */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            JavaScript / TypeScript
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
{`npm install @luneo/sdk
# or
yarn add @luneo/sdk`}
            </pre>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { LuneoClient } from '@luneo/sdk';

const luneo = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY
});

const design = await luneo.designs.create({
  name: 'Mon Design',
  template: 'tshirt'
});`}
            </pre>
          </div>

          <Link href="/help/documentation/sdks/node" className="inline-block mt-4 text-purple-600 hover:text-purple-700">
            Documentation complète Node.js →
          </Link>
        </div>

        {/* React SDK */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            React
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
{`npm install @luneo/react`}
            </pre>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { ProductCustomizer } from '@luneo/react';

function MyComponent() {
  return (
    <ProductCustomizer
      apiKey={process.env.NEXT_PUBLIC_LUNEO_API_KEY}
      productId="prod_123"
    />
  );
}`}
            </pre>
          </div>

          <Link href="/help/documentation/sdks/react" className="inline-block mt-4 text-purple-600 hover:text-purple-700">
            Documentation complète React →
          </Link>
        </div>

        {/* Python SDK */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Python
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
{`pip install luneo`}
            </pre>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`from luneo import LuneoClient

client = LuneoClient(api_key="your_api_key")

design = client.designs.create(
    name="Mon Design",
    template="tshirt"
)`}
            </pre>
          </div>

          <Link href="/help/documentation/sdks/python" className="inline-block mt-4 text-purple-600 hover:text-purple-700">
            Documentation complète Python →
          </Link>
        </div>

        {/* CLI */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            CLI
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
{`npm install -g @luneo/cli`}
            </pre>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`luneo auth login
luneo designs create --template tshirt
luneo designs list
luneo assets optimize model.glb`}
            </pre>
          </div>

          <Link href="/help/documentation/cli/installation" className="inline-block mt-4 text-purple-600 hover:text-purple-700">
            Documentation complète CLI →
          </Link>
        </div>
      </div>
    </div>
  );
}

