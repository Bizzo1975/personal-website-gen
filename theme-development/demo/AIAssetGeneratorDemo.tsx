'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAIService } from '../hooks/useAIService';
import { ImageGenerationRequest, PromptTemplate } from '../types/ai';

const AIAssetGeneratorDemo: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<'comic' | 'startrek'>('comic');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait'>('square');
  const [category, setCategory] = useState('general');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const {
    isLoading,
    error,
    assets,
    activeJobs,
    usageStats,
    isConfigured,
    generateImage,
    getPromptTemplates,
    generatePromptFromTemplate,
    deleteAsset,
    clearAllAssets,
    getUsageStats
  } = useAIService();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    const request: ImageGenerationRequest = {
      prompt: prompt.trim(),
      theme: selectedTheme,
      size,
      aspectRatio,
      category,
      tags: [selectedTheme, category]
    };

    try {
      await generateImage(request);
      setPrompt('');
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});
  };

  const handleTemplateVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [variable]: value }));
  };

  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) return;

    const generatedPrompt = generatePromptFromTemplate(selectedTemplate, templateVariables);
    setPrompt(generatedPrompt);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset(id);
    }
  };

  const handleClearAllAssets = async () => {
    if (confirm('Are you sure you want to delete all assets? This cannot be undone.')) {
      await clearAllAssets();
    }
  };

  const handleGetUsageStats = async () => {
    await getUsageStats();
  };

  const templates = getPromptTemplates(selectedTheme);

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
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">API Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConfigured.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">OpenAI DALL-E 3</span>
              <span className={`text-sm ${isConfigured.openai ? 'text-green-600' : 'text-red-600'}`}>
                {isConfigured.openai ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConfigured.stability ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Stability AI</span>
              <span className={`text-sm ${isConfigured.stability ? 'text-green-600' : 'text-red-600'}`}>
                {isConfigured.stability ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
          {(!isConfigured.openai || !isConfigured.stability) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                To use AI generation, please configure your API keys in the environment variables:
                <br />
                <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> and{' '}
                <code className="bg-yellow-100 px-2 py-1 rounded">NEXT_PUBLIC_STABILITY_API_KEY</code>
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-semibold mb-6">Generate Image</h2>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedTheme('comic')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedTheme === 'comic'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Comic Book
                </button>
                <button
                  onClick={() => setSelectedTheme('startrek')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedTheme === 'startrek'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Star Trek
                </button>
              </div>
            </div>

            {/* Prompt Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Templates</label>
              <select
                value={selectedTemplate?.name || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.name === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Variables */}
            {selectedTemplate && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
                <div className="space-y-2">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs text-gray-600 mb-1">{variable}</label>
                      <input
                        type="text"
                        value={templateVariables[variable] || ''}
                        onChange={(e) => handleTemplateVariableChange(variable, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleGenerateFromTemplate}
                    className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Generate Prompt from Template
                  </button>
                </div>
              </div>
            )}

            {/* Custom Prompt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder={`Enter your ${selectedTheme} theme prompt...`}
              />
            </div>

            {/* Generation Options */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small (256x256)</option>
                  <option value="medium">Medium (512x512)</option>
                  <option value="large">Large (1024x1024)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="square">Square</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., superhero, background, interface"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateImage}
              disabled={isLoading || !prompt.trim() || (!isConfigured.openai && !isConfigured.stability)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </motion.div>

          {/* Assets Gallery */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Generated Assets</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleGetUsageStats}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                >
                  Stats
                </button>
                <button
                  onClick={handleClearAllAssets}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Usage Stats */}
            {usageStats && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Usage Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Assets:</span>
                    <span className="ml-2 font-medium">{usageStats.totalAssets}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="ml-2 font-medium">${usageStats.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Active Jobs</h3>
                <div className="space-y-2">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="p-3 bg-blue-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{job.request.prompt.substring(0, 50)}...</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      {job.progress && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Grid */}
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {assets.map((asset) => (
                <div key={asset.id} className="relative group">
                  <img
                    src={asset.url}
                    alt={asset.metadata.prompt}
                    className="w-full h-32 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 truncate">{asset.metadata.prompt.substring(0, 30)}...</p>
                    <p className="text-xs text-gray-500">{asset.theme} • {asset.metadata.size}</p>
                  </div>
                </div>
              ))}
            </div>

            {assets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No assets generated yet.</p>
                <p className="text-sm">Generate your first image to see it here!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIAssetGeneratorDemo;
