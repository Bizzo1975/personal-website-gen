'use client';

import React, { useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import { Logo } from '@/components/Logo';
import { Icon, IconButton, IconWithText, StatusIcon, availableIcons } from '@/components/IconSystem';
import { 
  EnhancedAnimatedElement, 
  StaggeredChildren, 
  ScrollAnimation, 
  HoverAnimation, 
  LoadingAnimation 
} from '@/components/EnhancedAnimationLibrary';
import { generateAllFavicons, generateAllSocialAssets, downloadCanvas, generateFaviconCanvas, generateSocialAssetCanvas, socialMediaAssets } from '@/utils/faviconGenerator';

const BrandManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logos' | 'icons' | 'animations' | 'typography' | 'colors' | 'assets'>('overview');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [generatedFavicons, setGeneratedFavicons] = useState<{[key: string]: string}>({});
  const [generatedSocialAssets, setGeneratedSocialAssets] = useState<{[key: string]: string}>({});

  const handleGenerateFavicons = () => {
    const favicons = generateAllFavicons(selectedTheme === 'auto' ? 'light' : selectedTheme);
    setGeneratedFavicons(favicons);
  };

  const handleGenerateSocialAssets = () => {
    const assets = generateAllSocialAssets(selectedTheme === 'auto' ? 'light' : selectedTheme);
    setGeneratedSocialAssets(assets);
  };

  const handleDownloadFavicon = (size: number) => {
    const canvas = generateFaviconCanvas(size, selectedTheme === 'auto' ? 'light' : selectedTheme);
    downloadCanvas(canvas, `favicon-${size}x${size}`);
  };

  const handleDownloadSocialAsset = (assetName: string) => {
    const asset = socialMediaAssets.find(a => a.name === assetName);
    if (asset) {
      const canvas = generateSocialAssetCanvas(asset, selectedTheme === 'auto' ? 'light' : selectedTheme);
      downloadCanvas(canvas, assetName.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'logos', label: 'Logos', icon: 'photo' },
    { id: 'icons', label: 'Icons', icon: 'star' },
    { id: 'animations', label: 'Animations', icon: 'bolt' },
    { id: 'typography', label: 'Typography', icon: 'document' },
    { id: 'colors', label: 'Colors', icon: 'adjustments' },
    { id: 'assets', label: 'Assets', icon: 'download' },
  ];

  const OverviewSection = () => (
    <div className="space-y-12">
      <div className="text-center">
        <EnhancedAnimatedElement type="fadeIn" duration={0.8}>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Brand Management System</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Manage your comprehensive design system featuring enhanced dark mode, animation library, 
            icon system, typography scale, and brand identity components.
          </p>
        </EnhancedAnimatedElement>
      </div>

      <StaggeredChildren
        type="slideUp"
        staggerDelay={0.1}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          {
            title: 'Logo Variations',
            description: 'Multiple logo formats with theme support',
            icon: 'photo',
            demo: <Logo variant="full" size="lg" />
          },
          {
            title: 'Icon System',
            description: '50+ icons with multiple variants',
            icon: 'star',
            demo: (
              <div className="flex space-x-2">
                <Icon name="heart" size="lg" color="error" variant="solid" />
                <Icon name="star" size="lg" color="warning" variant="solid" />
                <Icon name="check-circle" size="lg" color="success" variant="solid" />
              </div>
            )
          },
          {
            title: 'Animations',
            description: '25+ animation types with accessibility',
            icon: 'bolt',
            demo: (
              <div className="flex space-x-2">
                <EnhancedAnimatedElement type="bounce" repeat={true}>
                  <div className="w-4 h-4 bg-blue-500 rounded-full" />
                </EnhancedAnimatedElement>
                <EnhancedAnimatedElement type="pulse" repeat={true}>
                  <div className="w-4 h-4 bg-purple-500 rounded-full" />
                </EnhancedAnimatedElement>
                <EnhancedAnimatedElement type="heartbeat" repeat={true}>
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                </EnhancedAnimatedElement>
              </div>
            )
          },
          {
            title: 'Typography',
            description: 'Responsive hierarchy with accessibility',
            icon: 'document',
            demo: (
              <div className="space-y-1">
                <div className="text-lg font-bold">Heading</div>
                <div className="text-sm">Body text example</div>
                <div className="text-xs text-gray-500">Caption text</div>
              </div>
            )
          },
          {
            title: 'Color System',
            description: 'Semantic colors with dark mode',
            icon: 'adjustments',
            demo: (
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <div className="w-4 h-4 bg-purple-500 rounded" />
                <div className="w-4 h-4 bg-green-500 rounded" />
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <div className="w-4 h-4 bg-red-500 rounded" />
              </div>
            )
          },
          {
            title: 'Asset Generation',
            description: 'Automated favicon and social media assets',
            icon: 'download',
            demo: (
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  JLK
                </div>
                <div className="w-8 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">
                  Social
                </div>
              </div>
            )
          }
        ].map((item, index) => (
          <div key={item.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center space-y-4">
            <Icon name={item.icon as any} size="xl" color="primary" className="mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
            <div className="flex justify-center">
              {item.demo}
            </div>
          </div>
        ))}
      </StaggeredChildren>
    </div>
  );

  const LogosSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Logo Variations</h2>
        <p className="text-gray-600 dark:text-gray-400">Multiple logo formats for different use cases and themes</p>
      </div>

      <div className="space-y-8">
        {/* Theme Selector */}
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['light', 'dark', 'auto'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTheme === theme
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Variations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { variant: 'full' as const, title: 'Full Logo', description: 'Complete logo with icon and text' },
            { variant: 'icon' as const, title: 'Icon Only', description: 'Just the logo icon' },
            { variant: 'text' as const, title: 'Text Only', description: 'Just the text portion' },
            { variant: 'minimal' as const, title: 'Minimal', description: 'Simplified square version' }
          ].map((logo) => (
            <div key={logo.variant} className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="mb-4">
                  <Logo variant={logo.variant} size="xl" theme={selectedTheme} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{logo.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{logo.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Logo Sizes */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Size Variations</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center space-x-8">
              {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                <div key={size} className="text-center space-y-2">
                  <Logo variant="full" size={size} theme={selectedTheme} />
                  <div className="text-xs text-gray-500">{size}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AssetsSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Asset Generation</h2>
        <p className="text-gray-600 dark:text-gray-400">Generate favicons and social media assets automatically</p>
      </div>

      {/* Theme Selector */}
      <div className="flex justify-center">
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTheme === theme
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
              }`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Favicon Generation */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Favicon Generation</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={handleGenerateFavicons}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Generate All Favicons
            </button>
          </div>

          {Object.keys(generatedFavicons).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(generatedFavicons).map(([size, dataUrl]) => (
                <div key={size} className="text-center space-y-2">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <img src={dataUrl} alt={`Favicon ${size}`} className="mx-auto" />
                  </div>
                  <div className="text-sm font-medium">{size}</div>
                  <button
                    onClick={() => handleDownloadFavicon(parseInt(size))}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Social Media Assets */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Social Media Assets</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={handleGenerateSocialAssets}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Generate Social Assets
            </button>
          </div>

          {Object.keys(generatedSocialAssets).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(generatedSocialAssets).map(([assetName, dataUrl]) => (
                <div key={assetName} className="space-y-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <img src={dataUrl} alt={assetName} className="w-full rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{assetName}</div>
                    <button
                      onClick={() => handleDownloadSocialAsset(assetName)}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection />;
      case 'logos':
        return <LogosSection />;
      case 'assets':
        return <AssetsSection />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {tabs.find(tab => tab.id === activeTab)?.label} Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This section is under development. More features coming soon!
            </p>
          </div>
        );
    }
  };

  return (
    <AdminLayout title="Brand Management">
      <AdminPageLayout
        title="Brand Management"
        description="Manage your design system, brand assets, and visual identity"
      >
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon name={tab.icon as any} size="sm" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-screen">
            {renderContent()}
          </div>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default BrandManagementPage; 
