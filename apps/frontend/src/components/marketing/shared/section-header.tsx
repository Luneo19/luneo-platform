'use client';

interface SectionHeaderProps {
  tag?: string;
  title: string;
  description?: string;
  centered?: boolean;
  gradient?: string;
}

/**
 * Section Header Component - Reusable section header
 * Consistent design for all sections across pages
 */
export function SectionHeader({ 
  tag, 
  title, 
  description, 
  centered = true,
  gradient = 'from-indigo-600 to-purple-600'
}: SectionHeaderProps) {
  const containerClass = centered 
    ? 'text-center max-w-2xl mx-auto mb-16' 
    : 'mb-16';

  return (
    <div className={containerClass} data-animate="fade-up">
      {tag && (
        <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
          {tag}
        </span>
      )}
      <h2 className="text-4xl sm:text-5xl font-bold mb-4">
        {title.split(' ').map((word, i, arr) => {
          // Highlight last word or specific words
          if (i === arr.length - 1 || title.includes('Luneo')) {
            return (
              <span key={i} className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {word}{i < arr.length - 1 ? ' ' : ''}
              </span>
            );
          }
          return <span key={i}>{word} </span>;
        })}
      </h2>
      {description && (
        <p className="text-lg text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
