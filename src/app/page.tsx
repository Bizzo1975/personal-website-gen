import React from 'react';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="py-12">
        <h1 className="text-4xl font-bold mb-4">John Doe</h1>
        <h2 className="text-2xl text-gray-600 mb-6">Full Stack Developer</h2>
        <p className="text-lg max-w-2xl">
          Welcome to my personal website! I'm a passionate developer with expertise in 
          web technologies. Here you can find my portfolio, blog posts, and more about my journey.
        </p>
      </section>
      
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-4">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project cards will go here */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-xl font-semibold">Project Title</h3>
            <p className="text-gray-600 mt-2">
              A brief description of the project and technologies used.
            </p>
          </div>
        </div>
      </section>
      
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-4">Recent Blog Posts</h2>
        <div className="space-y-4">
          {/* Blog post cards will go here */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-xl font-semibold">Blog Post Title</h3>
            <p className="text-sm text-gray-500">January 1, 2023</p>
            <p className="text-gray-600 mt-2">
              A brief excerpt from the blog post to give readers an idea of the content.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 