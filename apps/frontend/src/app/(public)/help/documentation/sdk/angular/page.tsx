import Link from 'next/link';

export const metadata = {
  title: 'Angular SDK - Luneo Documentation',
  description: 'SDK Angular pour intégrer Luneo',
};

export default function AngularSDKPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Angular SDK</h1>
        <p className="text-xl text-gray-600">Intégrez Luneo dans votre app Angular</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Installation</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`npm install @luneo/angular
# ou
yarn add @luneo/angular`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { NgModule } from '@angular/core';
import { LuneoModule } from '@luneo/angular';

@NgModule({
  imports: [
    LuneoModule.forRoot({
      apiKey: 'YOUR_API_KEY'
    })
  ]
})
export class AppModule { }`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Utilisation</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`import { Component } from '@angular/core';
import { LuneoService } from '@luneo/angular';

@Component({
  selector: 'app-editor',
  template: \`
    <luneo-editor
      [template]="'t-shirt'"
      (save)="onSave($event)"
    ></luneo-editor>
  \`
})
export class EditorComponent {
  constructor(private luneo: LuneoService) {}
  
  onSave(design: any) {
    console.log('Saved:', design);
  }
}`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



