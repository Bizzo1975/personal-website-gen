'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '../../components/AdminLayout';
import AdminPageLayout from '../../components/AdminPageLayout';
import AdminFormLayout from '../../components/AdminFormLayout';
import { AdminInput, AdminTextarea } from '../../components/AdminFormField';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  website?: string;
}

interface ProfileData {
  id?: string;
  name: string;
  imageUrl: string;
  skills: string[];
  homePageSkills?: string[];
  location?: string;
  email?: string;
  socialLinks?: SocialLinks;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    imageUrl: '',
    skills: [],
    homePageSkills: [],
    location: '',
    email: '',
    socialLinks: {
      github: '',
      linkedin: '',
      website: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

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
        // Ensure skills is always an array and socialLinks is always an object
        setProfileData({
          ...data,
          skills: data.skills || [],
          homePageSkills: data.homePageSkills || [],
          socialLinks: data.socialLinks || {}
        });
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
      const socialField = name.replace('social.', '');
      setProfileData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'profile');
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setProfileData({
            ...profileData,
            imageUrl: result.path
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading profile image:', error);
        setError('Failed to upload profile image');
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Show skill input field
  const showSkillInput = () => {
    setIsAddingSkill(true);
    // Focus the input field after it appears
    setTimeout(() => {
      if (skillInputRef.current) {
        skillInputRef.current.focus();
      }
    }, 10);
  };

  // Handle adding a skill
  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...(profileData.skills || []), newSkill.trim()]
      });
      setNewSkill('');
      setIsAddingSkill(false);
    } else if (isAddingSkill) {
      // If the field is empty and they click add, just hide the field
      setIsAddingSkill(false);
    }
  };

  // Cancel adding a skill
  const handleCancelAddSkill = () => {
    setNewSkill('');
    setIsAddingSkill(false);
  };

  // Handle pressing Enter or Escape in the skill input
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    } else if (e.key === 'Escape') {
      handleCancelAddSkill();
    }
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...(profileData.skills || [])];
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
        const pathsToRevalidate = ['/about', '/contact', '/'];
        
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
    return (
      <AdminLayout title="Loading...">
        <div className="text-center py-10">Loading profile data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Profile">
      <AdminPageLayout
        title="Edit Profile"
        status={
          saveSuccess 
            ? { type: 'success', message: 'Profile saved successfully!' }
            : error 
              ? { type: 'error', message: error }
              : undefined
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Preview Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center space-y-4">
            <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            {/* Clickable profile image */}
            <div 
              className="relative h-48 w-48 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleImageClick}
              title="Click to upload a new image"
            >
              <Image 
                src={profileData.imageUrl || '/images/placeholder-image.png'} 
                alt="Profile Preview" 
                fill
                style={{objectFit: 'cover'}}
                className="rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity text-white">
                <span>Upload Photo</span>
              </div>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
              Click on the image to upload a new photo
            </div>
            
            {/* Skills section moved here */}
            <div className="w-full mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-md font-semibold mb-3 text-center">Skills</h3>
              
              {isAddingSkill ? (
                <div className="flex w-full border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden">
                  <input
                    type="text"
                    id="newSkill"
                    ref={skillInputRef}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="w-[calc(100%-64px)] h-10 px-3 border-0 dark:bg-slate-800 text-sm focus:outline-none focus:ring-0"
                    placeholder="Add a skill (e.g., React, Node.js)"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="w-16 h-10 bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors border-0 flex items-center justify-center"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={showSkillInput}
                  className="w-full h-9 flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Skill</span>
                </button>
              )}
              
              <div className="mt-2 flex flex-wrap gap-2">
                {(profileData.skills || []).map((skill, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full flex items-center"
                  >
                    <span className="text-sm text-slate-800 dark:text-slate-200">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Home Page Skills Selection */}
              {(profileData.skills || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
                    Professional Skills Card (Home Page)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Click skills to select which ones appear on the home page Professional Skills card:
                  </p>
                  
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {(profileData.skills || []).map((skill, index) => {
                      const isSelected = (profileData.homePageSkills || []).includes(skill);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const currentHomePageSkills = profileData.homePageSkills || [];
                            if (isSelected) {
                              setProfileData({
                                ...profileData,
                                homePageSkills: currentHomePageSkills.filter(s => s !== skill)
                              });
                            } else {
                              setProfileData({
                                ...profileData,
                                homePageSkills: [...currentHomePageSkills, skill]
                              });
                            }
                          }}
                          className={`
                            px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105
                            ${isSelected 
                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }
                          `}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setProfileData({
                        ...profileData,
                        homePageSkills: [...(profileData.skills || [])]
                      })}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileData({
                        ...profileData,
                        homePageSkills: []
                      })}
                      className="text-xs text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Selected: {(profileData.homePageSkills || []).length} of {(profileData.skills || []).length} skills
                    {(profileData.homePageSkills || []).length > 0 && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        ({(profileData.homePageSkills || []).join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Data Form */}
          <div className="md:col-span-2">
            <AdminFormLayout 
              onSubmit={handleSubmit}
              isSubmitting={saving}
              submitLabel="Save Profile"
            >
              <AdminInput
                id="name"
                name="name"
                label="Name"
                value={profileData.name || ''}
                onChange={handleInputChange}
                required
              />
              
              <AdminInput
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={profileData.email || ''}
                onChange={handleInputChange}
              />
              
              <AdminInput
                id="location"
                name="location"
                label="Location"
                value={profileData.location || ''}
                onChange={handleInputChange}
                placeholder="e.g., San Francisco, CA"
              />
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3">Social Links</h3>
                
                <AdminInput
                  id="github"
                  name="social.github"
                  label="GitHub"
                  type="url"
                  value={profileData.socialLinks?.github || ''}
                  onChange={handleInputChange}
                  placeholder="https://github.com/yourusername"
                />
                
                <AdminInput
                  id="linkedin"
                  name="social.linkedin"
                  label="LinkedIn"
                  type="url"
                  value={profileData.socialLinks?.linkedin || ''}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourusername"
                />
                
                <AdminInput
                  id="website"
                  name="social.website"
                  label="Personal Website"
                  type="url"
                  value={profileData.socialLinks?.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </AdminFormLayout>
          </div>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
} 
