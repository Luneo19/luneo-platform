import Link from 'next/link';
import { Terminal } from 'lucide-react';

export const metadata = {
  title: 'CLI - Luneo Documentation',
};

export default function CLIPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">← Documentation</Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Terminal className="w-10 h-10 text-gray-900" />
          <h1 className="text-4xl font-bold">Luneo CLI</h1>
        </div>
        <p className="text-xl text-gray-600">Command-line interface pour automatisation</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Installation</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`npm install -g @luneo/cli
# ou
yarn global add @luneo/cli`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`luneo login
# Entrez votre API key`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Commandes</h2>
          
          <h3 className="text-2xl font-bold mb-4">Create Design</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
            <pre>{`luneo create design \\
  --template t-shirt \\
  --color "#FF0000" \\
  --output design.json`}</pre>
          </div>

          <h3 className="text-2xl font-bold mb-4">Generate AI</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6">
            <pre>{`luneo generate \\
  --prompt "Modern t-shirt design" \\
  --style photorealistic \\
  --output generated.png`}</pre>
          </div>

          <h3 className="text-2xl font-bold mb-4">Export</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`luneo export design_123 \\
  --format glb \\
  --output model.glb`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">CI/CD Integration</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`# GitHub Actions example
- name: Generate designs
  run: |
    npm install -g @luneo/cli
    luneo login --api-key \${{ secrets.LUNEO_API_KEY }}
    luneo generate --prompt "Design for campaign" --output design.png`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



