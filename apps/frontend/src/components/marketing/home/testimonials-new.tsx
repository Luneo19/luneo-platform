'use client';

const testimonials = [
  {
    quote: 'Luneo a transformé la façon dont notre équipe travaille. Nous avons augmenté notre productivité de 300% depuis le changement.',
    author: 'Sarah Chen',
    role: 'CEO chez TechFlow',
    avatar: 'https://i.pravatar.cc/60?img=11',
    featured: false,
  },
  {
    quote: 'Le meilleur investissement que nous ayons fait pour notre startup. Les analytics à eux seuls nous ont fait économiser d\'innombrables heures et nous ont aidés à prendre de meilleures décisions.',
    author: 'Michael Roberts',
    role: 'Fondateur chez LaunchPad',
    avatar: 'https://i.pravatar.cc/60?img=12',
    featured: true,
  },
  {
    quote: 'Plateforme incroyable avec un support exceptionnel. Leur équipe va au-delà pour aider.',
    author: 'Emily Watson',
    role: 'Product Lead chez Innovate',
    avatar: 'https://i.pravatar.cc/60?img=13',
    featured: false,
  },
];

/**
 * Testimonials Section - Customer testimonials
 * Based on Pandawa template, adapted for Luneo
 */
export function TestimonialsNew() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" data-animate="fade-up">
          <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Témoignages
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Apprécié par des{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              milliers
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Découvrez ce que nos clients ont à dire sur leur expérience avec Luneo.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className={`p-8 rounded-2xl border transition-all hover:-translate-y-2 hover:shadow-xl ${
                testimonial.featured
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-transparent text-white'
                  : 'bg-white border-gray-100'
              }`}
              data-animate="fade-up"
              data-delay={index * 100}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base">★</span>
                ))}
              </div>
              <p className={`mb-6 leading-relaxed ${testimonial.featured ? 'text-white' : 'text-gray-700'}`}>
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className={`font-semibold ${testimonial.featured ? 'text-white' : 'text-gray-900'}`}>
                    {testimonial.author}
                  </div>
                  <div className={`text-sm ${testimonial.featured ? 'text-white/80' : 'text-gray-500'}`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
