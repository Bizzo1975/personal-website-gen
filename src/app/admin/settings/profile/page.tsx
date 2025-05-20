'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Image from 'next/image';

interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

interface ProfileData {
  id?: string;
  name: string;
  imageUrl: string;
  skills: string[];
  bio?: string;
  location?: string;
  email?: string;
  socialLinks?: SocialLinks;
}

export default function ProfilePage() {
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    imageUrl: '',
    skills: [],
    bio: '',
    location: '',
    email: '',
    socialLinks: {
      github: '',
      twitter: '',
      linkedin: '',
      website: '',
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Fetch the profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile data');
        const response = await fetch('/api/profile');
        
        if (!response.ok) {
          console.error('API response error:', response.status, response.statusText);
          throw new Error(`Failed to fetch profile data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched profile data:', data);
        setProfileData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please check console for details.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const socialField = name.split('.')[1];
      setProfileData({
        ...profileData,
        socialLinks: {
          ...profileData.socialLinks,
          [socialField]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value,
      });
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...profileData.skills];
    updatedSkills.splice(index, 1);
    setProfileData({
      ...profileData,
      skills: updatedSkills
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      console.log('Updating profile with data:', profileData);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API save error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to save profile: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Profile updated successfully:', result);
      
      // Revalidate the pages that use profile data
      try {
        // Revalidate the about page
        console.log('Revalidating pages with profile data...');
        
        // Array of paths to revalidate
        const pathsToRevalidate = ['/about', '/contact'];
        
        // Revalidate all paths sequentially
        for (const path of pathsToRevalidate) {
          const revalidateResponse = await fetch(`/api/revalidate?path=${path}`, {
            method: 'POST',
          });
          
          if (revalidateResponse.ok) {
            const revalidateResult = await revalidateResponse.json();
            console.log(`Revalidation result for ${path}:`, revalidateResult);
          } else {
            console.error(`Failed to revalidate ${path}:`, revalidateResponse.status);
          }
        }
      } catch (revalidateErr) {
        console.error('Error during revalidation:', revalidateErr);
      }
      
      setSaving(false);
      setSaveSuccess(true);
      
      // Update with the returned data
      setProfileData(result);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading profile data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          Profile saved successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Preview Card */}
        <Card variant="default" className="p-6 flex flex-col items-center space-y-4">
          <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
          <div className="relative h-48 w-48 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <Image 
              src={profileData.imageUrl || 'https://via.placeholder.com/200?text=Profile+Image'} 
              alt="Profile Preview" 
              fill
              style={{objectFit: 'cover'}}
              className="rounded-full"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Preview of your profile image
          </div>
        </Card>

        {/* Profile Data Form */}
        <Card variant="default" className="md:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={profileData.imageUrl || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter a valid image URL (e.g., from Unsplash)</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileData.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md min-h-[100px]">
                  {profileData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                      <span>{skill}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="newSkill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                    placeholder="Add a skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddSkill}
                    variant="outline"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 pt-2">Social Links</h3>
              
              <div>
                <label htmlFor="social.github" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  id="social.github"
                  name="social.github"
                  value={profileData.socialLinks?.github || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div>
                <label htmlFor="social.twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  id="social.twitter"
                  name="social.twitter"
                  value={profileData.socialLinks?.twitter || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div>
                <label htmlFor="social.linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="social.linkedin"
                  name="social.linkedin"
                  value={profileData.socialLinks?.linkedin || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>

              <div>
                <label htmlFor="social.website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personal Website URL
                </label>
                <input
                  type="url"
                  id="social.website"
                  name="social.website"
                  value={profileData.socialLinks?.website || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 