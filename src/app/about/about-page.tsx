'use client';

import React from 'react';
import Image from 'next/image';

interface AboutPageProps {
  content: React.ReactNode; // MDX content is now a React node
}

export default function AboutPage({ content }: AboutPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="md:w-1/3">
          <div className="relative h-80 w-full rounded-lg overflow-hidden">
            <Image 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" 
              alt="John Doe" 
              fill 
              style={{objectFit: 'cover'}}
              className="rounded-lg"
            />
          </div>
        </div>
        
        <div className="md:w-2/3">
          {/* Render the markdown content from MongoDB */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {content}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
        {skills.map((skill, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
}

const skills = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 
  'Express', 'MongoDB', 'PostgreSQL', 'HTML5', 'CSS3', 
  'Tailwind CSS', 'Git', 'Docker', 'AWS'
]; 