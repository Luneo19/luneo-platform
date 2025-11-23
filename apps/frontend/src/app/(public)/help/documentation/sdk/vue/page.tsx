import Link from 'next/link';

export const metadata = {
  title: 'Vue SDK - Luneo Documentation',
  description: 'SDK Vue.js pour intégrer Luneo',
};

export default function VueSDKPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Vue SDK</h1>
        <p className="text-xl text-gray-600">Intégrez Luneo dans votre app Vue.js</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Installation</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`npm install @luneo/vue
# ou
yarn add @luneo/vue`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { createApp } from 'vue';
import { LuneoPlugin } from '@luneo/vue';

const app = createApp(App);
app.use(LuneoPlugin, {
  apiKey: 'YOUR_API_KEY'
});
app.mount('#app');`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Composants</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`<template>
  <luneo-editor
    template="t-shirt"
    @save="onSave"
  />
</template>

<script setup>
const onSave = (design) => {
  console.log('Saved:', design);
};
</script>`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



