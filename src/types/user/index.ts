export interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user'
}

export interface UserProfile {
  bio?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;
  githubHandle?: string;
  linkedInUrl?: string;
} 