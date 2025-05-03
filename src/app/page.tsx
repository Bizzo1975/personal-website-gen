import React from 'react';
import Link from 'next/link';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import CodeBlock from '@/components/CodeBlock';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="py-16 flex flex-col md:flex-row gap-12 items-center">
        <div className="md:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            John Doe
          </h1>
          <h2 className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-6">
            Full Stack Developer
          </h2>
          <p className="text-lg max-w-2xl text-slate-700 dark:text-slate-300 mb-8">
            Welcome to my personal website! I'm a passionate developer with expertise in 
            modern web technologies including React, Next.js, and Node.js. I build elegant solutions to complex problems.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="/projects">View Projects</Button>
            <Button href="/contact" variant="outline">Contact Me</Button>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 p-1">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-4xl font-bold text-primary-500">
              JD
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Projects</h2>
          <Button href="/projects" variant="outline" size="sm">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="elevated" className="transition-transform hover:-translate-y-1 duration-300">
            <CardHeader>
              <h3 className="text-xl font-semibold">E-Commerce Platform</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  A full-featured online store with payment integration, user authentication, and admin dashboard.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">React</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="info">MongoDB</Badge>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card variant="elevated" className="transition-transform hover:-translate-y-1 duration-300">
            <CardHeader>
              <h3 className="text-xl font-semibold">Task Management App</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  A productivity tool for managing tasks, projects, and team collaboration with real-time updates.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Next.js</Badge>
                  <Badge variant="secondary">tRPC</Badge>
                  <Badge variant="info">Prisma</Badge>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card variant="elevated" className="transition-transform hover:-translate-y-1 duration-300">
            <CardHeader>
              <h3 className="text-xl font-semibold">AI Image Generator</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  An application that generates images from text descriptions using AI models and APIs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary">Python</Badge>
                  <Badge variant="secondary">TensorFlow</Badge>
                  <Badge variant="info">FastAPI</Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
      
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Recent Blog Posts</h2>
          <Button href="/blog" variant="outline" size="sm">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="bordered" className="transition-shadow hover:shadow-tech-lg duration-300">
            <CardBody>
              <Link href="/blog/getting-started-with-nextjs" className="block space-y-4">
                <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Getting Started with Next.js</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">January 15, 2023</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Learn how to build modern websites with Next.js, from setup to deployment.
                </p>
                <div className="flex gap-2">
                  <Badge variant="primary" size="sm">Next.js</Badge>
                  <Badge variant="info" size="sm">Tutorial</Badge>
                </div>
              </Link>
            </CardBody>
          </Card>
          
          <Card variant="bordered" className="transition-shadow hover:shadow-tech-lg duration-300">
            <CardBody>
              <Link href="/blog/tailwind-css-tips" className="block space-y-4">
                <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400">10 Tailwind CSS Tips for Better Designs</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">February 3, 2023</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Improve your UI design skills with these practical Tailwind CSS techniques.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" size="sm">CSS</Badge>
                  <Badge variant="info" size="sm">Design</Badge>
                </div>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>
      
      <section className="py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Code Snippet</h2>
        <CodeBlock language="typescript" className="max-w-3xl">
{`// Example TypeScript React Hook
import { useState, useEffect } from 'react';

type UseLocalStorageReturnType<T> = [T, (value: T) => void];

export function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageReturnType<T> {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}`}
        </CodeBlock>
      </section>
    </div>
  );
} 