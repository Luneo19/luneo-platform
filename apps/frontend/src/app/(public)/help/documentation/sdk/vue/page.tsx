'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function VueSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = `npm install @luneo/widget`;

  const basicExample = `<template>
  <div>
    <h1>Mon Site</h1>
    <LuneoWidget agent-id="agent_xxx" />
  </div>
</template>

<script setup>
import { LuneoWidget } from '@luneo/widget/vue';
</script>`;

  const propsExample = `<template>
  <LuneoWidget
    agent-id="agent_xxx"
    position="bottom-right"
    theme="dark"
    primary-color="#6366f1"
    welcome-message="Bonjour ! Comment puis-je vous aider ?"
    placeholder="Écrivez votre message..."
    :user="currentUser"
    @message="onMessage"
    @open="onOpen"
    @close="onClose"
  />
</template>

<script setup>
import { ref } from 'vue';
import { LuneoWidget } from '@luneo/widget/vue';

const currentUser = ref({
  id: 'user_123',
  name: 'Jean Dupont',
  email: 'jean@example.com',
});

function onMessage(msg) {
  console.log('Message:', msg);
}
function onOpen() {
  console.log('Widget ouvert');
}
function onClose() {
  console.log('Widget fermé');
}
</script>`;

  const pluginExample = `// main.ts
import { createApp } from 'vue';
import { LuneoPlugin } from '@luneo/widget/vue';
import App from './App.vue';

const app = createApp(App);

app.use(LuneoPlugin, {
  apiKey: 'pk_live_xxx',
  defaultAgent: 'agent_xxx',
  theme: 'dark',
});

app.mount('#app');`;

  const composableExample = `<script setup>
import { useLuneo } from '@luneo/widget/vue';

const { open, close, sendMessage, isOpen } = useLuneo();

function askSupport() {
  open();
  sendMessage('Je souhaite contacter le support.');
}
</script>

<template>
  <button @click="askSupport">
    Contacter le support
  </button>
  <p v-if="isOpen">Le chat est ouvert</p>
</template>`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">Intégration Vue</h1>
        <p className="text-xl text-gray-400">
          Intégrez le widget de chat Luneo dans votre application Vue 3.
        </p>
      </div>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {installCode}
          </pre>
          <button onClick={() => copyCode(installCode, 'install')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'install' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Utilisation basique</h2>
        <p className="text-gray-400 mb-4">
          Importez et utilisez le composant <code className="text-blue-400">LuneoWidget</code> dans vos templates Vue.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {basicExample}
          </pre>
          <button onClick={() => copyCode(basicExample, 'basic')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'basic' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Props et événements</h2>
        <p className="text-gray-400 mb-4">
          Personnalisez le widget et réagissez aux interactions utilisateur.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {propsExample}
          </pre>
          <button onClick={() => copyCode(propsExample, 'props')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'props' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Plugin Vue</h2>
        <p className="text-gray-400 mb-4">
          Enregistrez le plugin globalement pour une configuration centralisée.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {pluginExample}
          </pre>
          <button onClick={() => copyCode(pluginExample, 'plugin')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'plugin' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Composable useLuneo</h2>
        <p className="text-gray-400 mb-4">
          Contrôlez le widget programmatiquement avec le composable <code className="text-blue-400">useLuneo</code>.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {composableExample}
          </pre>
          <button onClick={() => copyCode(composableExample, 'composable')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'composable' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>
    </div>
  );
}
