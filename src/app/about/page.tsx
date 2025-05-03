import React from 'react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">About Me</h1>
      
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
          <h2 className="text-2xl font-semibold mb-4">John Doe</h2>
          <p className="text-lg mb-4">
            I'm a passionate Full Stack Developer with expertise in JavaScript, TypeScript, React, 
            Node.js, and modern web technologies.
          </p>
          <p className="mb-4">
            With over 5 years of experience in software development, I've worked on a variety of projects 
            ranging from e-commerce platforms to real-time applications. I'm passionate about creating 
            clean, efficient, and user-friendly web applications.
          </p>
          <p>
            When I'm not coding, you can find me hiking, reading tech blogs, or experimenting with 
            new technologies. I'm always open to learning new things and taking on challenging projects.
          </p>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {skills.map((skill, index) => (
            <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
              {skill}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Experience</h2>
        {experiences.map((exp, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xl font-medium">{exp.role}</h3>
            <p className="text-gray-600 dark:text-gray-400">{exp.company} | {exp.period}</p>
            <p className="mt-2">{exp.description}</p>
          </div>
        ))}
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Education</h2>
        {education.map((edu, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xl font-medium">{edu.degree}</h3>
            <p className="text-gray-600 dark:text-gray-400">{edu.institution} | {edu.period}</p>
            <p className="mt-2">{edu.description}</p>
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

const experiences = [
  {
    role: 'Senior Frontend Developer',
    company: 'Tech Innovations Inc.',
    period: '2021 - Present',
    description: 'Lead frontend development for multiple projects, mentoring junior developers, and implementing best practices for code quality and performance optimization.'
  },
  {
    role: 'Full Stack Developer',
    company: 'WebSolutions Co.',
    period: '2019 - 2021',
    description: 'Developed full-stack applications using React, Node.js, and MongoDB. Collaborated with designers and stakeholders to deliver high-quality web experiences.'
  },
  {
    role: 'Junior Web Developer',
    company: 'Digital Agency XYZ',
    period: '2017 - 2019',
    description: 'Created responsive websites and web applications for clients in various industries using HTML, CSS, JavaScript, and PHP.'
  }
];

const education = [
  {
    degree: 'Master of Computer Science',
    institution: 'University of Technology',
    period: '2015 - 2017',
    description: 'Specialized in Web Technologies and Software Engineering. Graduated with honors.'
  },
  {
    degree: 'Bachelor of Science in Computer Science',
    institution: 'State University',
    period: '2011 - 2015',
    description: 'Focused on programming fundamentals, data structures, and software development principles.'
  }
]; 