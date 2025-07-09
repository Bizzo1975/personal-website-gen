// PostgreSQL Profile interface matching the profiles table schema
export interface Profile {
  id: string;
  name: string;
  imageUrl: string;
  skills: string[];
  location?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileData {
  id?: string;
  name: string;
  imageUrl: string;
  skills: string[];
  location?: string;
  email?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface CreateProfileData {
  name: string;
  imageUrl: string;
  skills: string[];
  location?: string;
  email?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

// Type for updating a profile
export interface UpdateProfileData {
  name?: string;
  image_url?: string;
  skills?: string[];
  location?: string;
  email?: string;
  bio?: string;
  social_links?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
} 