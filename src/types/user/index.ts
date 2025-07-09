export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  jobTitle?: string;
  location?: string;
  githubUsername?: string;
  linkedinUsername?: string;
  websiteUrl?: string;
  skills?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Extended user properties
  role?: 'admin' | 'user';
  permissions?: string[];
  lastLogin?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    marketingEmails?: boolean;
  };
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user'
}

export interface UserProfile {
  location?: string;
  website?: string;
  twitterHandle?: string;
  githubHandle?: string;
  linkedInUrl?: string;
} 