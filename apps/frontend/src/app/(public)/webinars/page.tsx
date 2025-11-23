import Link from 'next/link';
import { Calendar, Clock, Video } from 'lucide-react';

export default function WebinarsPage() {
  const webinars = [
    {
      title: 'Démarrer avec Luneo en 30 minutes',
      date: '15 Nov 2025',
      time: '14:00 CET',
      duration: '30 min',
      status: 'upcoming',
    },
    {
      title: 'AI Studio : Générer 1000 designs/jour',
      date: '20 Nov 2025',
      time: '15:00 CET',
      duration: '45 min',
      status: 'upcoming',
    },
    {
      title: 'Virtual Try-On : Guide Complet',
      date: '1 Nov 2025',
      time: '14:00 CET',
      duration: '60 min',
      status: 'replay',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Webinars
        </h1>
        <p className="text-center text-xl text-gray-600 dark:text-gray-300 mb-16">
          Formations gratuites en direct avec nos experts
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {webinars.map((webinar, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <Video className="w-10 h-10 text-purple-600" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  webinar.status === 'upcoming' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {webinar.status === 'upcoming' ? 'À venir' : 'Replay'}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {webinar.title}
              </h3>

              <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{webinar.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{webinar.time} • {webinar.duration}</span>
                </div>
              </div>

              <Link 
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
              >
                {webinar.status === 'upcoming' ? 'S\'inscrire gratuitement' : 'Voir le replay'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

