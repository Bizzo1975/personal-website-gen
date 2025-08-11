'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AI_CONFIG, isAIConfigured, getConfiguredProviders } from '../config/ai-config';

const SimpleAIGenerator: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<'comic' | 'startrek'>('comic');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait'>('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string, prompt: string}>>([]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (!isAIConfigured()) {
      alert('Please configure your API keys in the .env.local file');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const mockImage = {
        id: `img_${Date.now()}`,
        url: `https://via.placeholder.com/512x512/3b82f6/ffffff?text=${encodeURIComponent(prompt)}`,
        prompt: prompt
      };
      
      setGeneratedImages(prev => [mockImage, ...prev]);
      setPrompt('');
      setIsGenerating(false);
    }, 2000);
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  const configuredProviders = getConfiguredProviders();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI Asset Generator Demo
          </h1>
          <p className="text-lg text-gray-600">
            Generate theme-specific images using AI for your comic book and Star Trek themes
          </p>
        </motion.div>

        {/* Configuration Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configuration Status</h2>
          {isAIConfigured() ? (
            <div className="text-green-600">
              <p className="font-medium">✓ AI Services Configured</p>
              <p className="text-sm mt-1">Available providers: {configuredProviders.join(', ')}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-medium">✗ AI Services Not Configured</p>
              <p className="text-sm mt-1">
                Please add your API keys to the .env.local file:
              </p>
              <div className="mt-2 p-3 bg-gray-100 rounded text-sm font-mono">
                NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here<br/>
                NEXT_PUBLIC_STABILITY_API_KEY=your_stability_key_here
              </div>
            </div>
          )}
        </motion.div>

        {/* Generation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Generate Image</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as 'comic' | 'startrek')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="comic">Comic Book Style</option>
                <option value="startrek">Star Trek LCARS</option>
              </select>
            </div>

            {/* Size Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="small">Small (256x256)</option>
                <option value="medium">Medium (512x512)</option>
                <option value="large">Large (1024x1024)</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as 'square' | 'landscape' | 'portrait')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="square">Square (1:1)</option>
                <option value="landscape">Landscape (16:9)</option>
                <option value="portrait">Portrait (9:16)</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe the ${selectedTheme === 'comic' ? 'comic book' : 'Star Trek'} image you want to generate...`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !isAIConfigured()}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                isGenerating || !isAIConfigured()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </motion.div>

        {/* Generated Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Generated Images</h2>
          
          {generatedImages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No images generated yet. Create your first AI-generated image above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {image.prompt}
                    </p>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SimpleAIGenerator;
