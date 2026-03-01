'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AngularSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = `npm install @luneo/widget`;

  const moduleExample = `// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LuneoWidgetModule } from '@luneo/widget/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    LuneoWidgetModule.forRoot({
      apiKey: 'pk_live_xxx',
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}`;

  const componentExample = `<!-- app.component.html -->
<div>
  <h1>Mon Application</h1>
  <luneo-widget
    [agentId]="'agent_xxx'"
    position="bottom-right"
    theme="dark"
    [primaryColor]="'#6366f1'"
    welcomeMessage="Bonjour ! Comment puis-je vous aider ?"
    [user]="currentUser"
    (onMessage)="handleMessage($event)"
    (onOpen)="handleOpen()"
    (onClose)="handleClose()"
  ></luneo-widget>
</div>`;

  const serviceExample = `// support.component.ts
import { Component } from '@angular/core';
import { LuneoService } from '@luneo/widget/angular';

@Component({
  selector: 'app-support',
  template: \`
    <button (click)="openChat()">Contacter le support</button>
    <p *ngIf="luneo.isOpen$ | async">Le chat est ouvert</p>
  \`,
})
export class SupportComponent {
  constructor(public luneo: LuneoService) {}

  openChat() {
    this.luneo.open();
    this.luneo.sendMessage('Je souhaite contacter le support.');
  }
}`;

  const standaloneExample = `// app.component.ts (Standalone)
import { Component } from '@angular/core';
import { LuneoWidgetComponent } from '@luneo/widget/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LuneoWidgetComponent],
  template: \`
    <h1>Mon Application</h1>
    <luneo-widget
      [agentId]="'agent_xxx'"
      theme="dark"
    ></luneo-widget>
  \`,
})
export class AppComponent {}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">Intégration Angular</h1>
        <p className="text-xl text-gray-400">
          Intégrez le widget de chat Luneo dans votre application Angular.
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
        <h2 className="text-2xl font-bold text-white mb-4">Configuration du module</h2>
        <p className="text-gray-400 mb-4">
          Importez <code className="text-blue-400">LuneoWidgetModule</code> dans votre module principal.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {moduleExample}
          </pre>
          <button onClick={() => copyCode(moduleExample, 'module')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'module' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Utilisation dans un template</h2>
        <p className="text-gray-400 mb-4">
          Ajoutez le composant <code className="text-blue-400">&lt;luneo-widget&gt;</code> dans vos templates Angular.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {componentExample}
          </pre>
          <button onClick={() => copyCode(componentExample, 'component')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'component' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Service LuneoService</h2>
        <p className="text-gray-400 mb-4">
          Contrôlez le widget programmatiquement via le service injectable.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {serviceExample}
          </pre>
          <button onClick={() => copyCode(serviceExample, 'service')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'service' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Standalone Components (Angular 17+)</h2>
        <p className="text-gray-400 mb-4">
          Pour les applications utilisant les standalone components.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {standaloneExample}
          </pre>
          <button onClick={() => copyCode(standaloneExample, 'standalone')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'standalone' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>
    </div>
  );
}
