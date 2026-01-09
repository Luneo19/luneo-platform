'use client';

import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { Users, Sparkles, Zap, Globe } from 'lucide-react';

const stats = [
  {
    value: '10,000+',
    label: 'Créateurs actifs',
    icon: <Users className="w-8 h-8" />,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    value: '500M+',
    label: 'Designs générés',
    icon: <Sparkles className="w-8 h-8" />,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    value: '3.2s',
    label: 'Temps moyen génération',
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    value: '150+',
    label: 'Pays',
    icon: <Globe className="w-8 h-8" />,
    gradient: 'from-green-500 to-emerald-500',
  },
];

/**
 * Stats Section - Animated counters with stats
 */
export function StatsSection() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-gray-800 via-purple-900/20 to-gray-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <StaggerChildren className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <StaggerItem key={index} className="text-center">
              <FadeIn delay={index * 0.1}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.gradient} mb-4 text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <p className="text-gray-400 text-sm sm:text-base">
                  {stat.label}
                </p>
              </FadeIn>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
