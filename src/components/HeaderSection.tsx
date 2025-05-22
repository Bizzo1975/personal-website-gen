import React from 'react';
import BackgroundSlideshow from './BackgroundSlideshow';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  showSlideshow?: boolean;
  className?: string;
  compact?: boolean;
  pageData?: {
    headerTitle?: string;
    headerSubtitle?: string;
  };
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subtitle,
  showSlideshow = false,
  className = '',
  compact = false,
  pageData,
}) => {
  // Use headerTitle and headerSubtitle from pageData if provided, otherwise use props
  const displayTitle = pageData?.headerTitle || title;
  const displaySubtitle = pageData?.headerSubtitle || subtitle;
  
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Optional slideshow background */}
      {showSlideshow && <BackgroundSlideshow />}
      
      <div className={`container-modern relative z-10 ${compact ? 'py-6 md:py-8' : 'py-12 md:py-16'}`}>
        <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg max-w-3xl">
          <h1 className={`${compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-bold mb-4 text-white`}>{displayTitle}</h1>
          {displaySubtitle && (
            <p className="text-xl text-white/80 mb-4">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeaderSection; 