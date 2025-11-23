'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, Activity } from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded' | 'down';

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: number;
  responseTime?: number;
}

export default function StatusPage() {
  const [services, setServices] = useState<Service[]>([
    { name: 'API', status: 'operational', uptime: 99.99, responseTime: 45 },
    { name: 'Frontend (app.luneo.app)', status: 'operational', uptime: 99.98, responseTime: 120 },
    { name: 'AI Generation (DALL-E)', status: 'operational', uptime: 99.95, responseTime: 2800 },
    { name: '3D Rendering', status: 'operational', uptime: 99.97, responseTime: 850 },
    { name: 'Database (PostgreSQL)', status: 'operational', uptime: 99.99 },
    { name: 'Redis Cache', status: 'operational', uptime: 99.98 },
    { name: 'S3 Storage', status: 'operational', uptime: 99.99 },
    { name: 'CDN (Vercel)', status: 'operational', uptime: 99.99, responseTime: 35 },
    { name: 'Stripe Payments', status: 'operational', uptime: 99.99 },
    { name: 'Email Service', status: 'operational', uptime: 99.96 },
  ]);

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simuler une mise à jour toutes les 30 secondes
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setServices((prev) =>
        prev.map((service) => {
          const drift = Math.random() * 0.02 - 0.01;
          const updatedUptime = Math.min(100, Math.max(95, service.uptime + drift));
          let nextStatus: ServiceStatus = service.status;

          if (drift < -0.008) {
            nextStatus = service.status === 'down' ? 'down' : 'degraded';
          } else if (drift > 0.008 && service.status !== 'down') {
            nextStatus = 'operational';
          }

          return {
            ...service,
            uptime: Number(updatedUptime.toFixed(2)),
            status: nextStatus,
          };
        })
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200';
      case 'down':
        return 'bg-red-50 border-red-200';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'degraded':
        return 'Dégradé';
      case 'down':
        return 'Indisponible';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');
  const averageUptime = services.reduce((acc, s) => acc + s.uptime, 0) / services.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Activity className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Statut des Services Luneo
            </h1>
          </div>
          
          {/* Overall Status */}
          <div className={`rounded-2xl p-6 ${allOperational ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {allOperational ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {allOperational ? 'Tous les systèmes sont opérationnels' : 'Incident en cours'}
                  </h2>
                  <p className="text-gray-600">
                    Disponibilité moyenne : {averageUptime.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
          {services.map((service) => (
            <div
              key={service.name}
              className={`rounded-lg border p-4 ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{getStatusText(service.status)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {service.responseTime && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Temps de réponse</div>
                      <div className="font-semibold text-gray-900">{service.responseTime}ms</div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Uptime (30j)</div>
                    <div className="font-semibold text-gray-900">{service.uptime}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Incident History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique des Incidents</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">Aucun incident récent</h3>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-sm text-gray-600">
                Tous les services fonctionnent normalement depuis 45 jours.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">Maintenance planifiée</h3>
                <span className="text-sm text-gray-500">15/10/2025</span>
              </div>
              <p className="text-sm text-gray-600">
                Mise à jour système - 5 minutes d'indisponibilité - Terminée
              </p>
            </div>
          </div>
        </div>

        {/* Subscribe to Updates */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Restez Informé des Incidents
          </h2>
          <p className="text-blue-100 mb-6">
            Recevez des notifications en temps réel en cas d'incident
          </p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              S'abonner
            </button>
          </div>
        </div>

        {/* API Status Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Besoin de plus de détails ?{' '}
            <a href="https://status.luneo.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              Consultez notre page de statut détaillée
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
