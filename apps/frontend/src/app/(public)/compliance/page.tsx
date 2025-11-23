import { FileCheck, Shield } from 'lucide-react';

export const metadata = {
  title: 'Compliance & Certifications - Luneo',
};

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <FileCheck className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Compliance & Certifications</h1>
          <p className="text-xl text-blue-100">Luneo respecte les plus hauts standards de sécurité</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'RGPD Compliant', desc: 'Conforme Règlement Européen' },
            { title: 'ISO 27001', desc: 'Certification sécurité' },
            { title: 'SOC 2 Type II', desc: 'Audit de sécurité' },
          ].map((cert) => (
            <div key={cert.title} className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">{cert.title}</h3>
              <p className="text-gray-600">{cert.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



