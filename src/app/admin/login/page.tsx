'use client'
import '@/styles/globals.css';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for error or success message in URL
  React.useEffect(() => {
    const errorMsg = searchParams.get('error');
    const successMsg = searchParams.get('success');
    
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    } else if (successMsg) {
      // Handle success message if needed
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in with:', { email });
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        setError(`Authentication failed. Please check your email and password.`);
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(`An unexpected error occurred. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 