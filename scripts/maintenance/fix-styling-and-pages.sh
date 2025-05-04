#!/bin/bash

# Fix styling issues and set up pages feature

echo "Starting styling and pages setup..."

# Install required packages
echo "Installing required packages..."
npm install react-simplemde-editor easymde

# Initialize home and about pages
echo "Setting up home and about pages in the database..."
node init-pages.js

# Create admin redirects
echo "Creating admin redirects..."
mkdir -p src/app/admin/pages/[id]

# Fix styling issues 
echo "Applying styling fixes..."

# Update the global.css to ensure proper styling
cat > src/styles/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-50: 236 253 245;
  --primary-100: 209 250 229;
  --primary-200: 167 243 208;
  --primary-300: 110 231 183;
  --primary-400: 52 211 153;
  --primary-500: 16 185 129;
  --primary-600: 5 150 105;
  --primary-700: 4 120 87;
  --primary-800: 6 95 70;
  --primary-900: 4 78 56;
  --primary-950: 2 44 34;
}

.dark {
  --background: 10 10 10;
  --foreground: 250 250 250;
  --card: 25 25 25;
  --card-foreground: 250 250 250;
  --popover: 25 25 25;
  --popover-foreground: 250 250 250;
  --primary: 14 165 233;
  --primary-foreground: 250 250 250;
  --secondary: 30 58 138;
  --secondary-foreground: 250 250 250;
  --muted: 40 40 40;
  --muted-foreground: 160 160 160;
  --accent: 30 58 138;
  --accent-foreground: 250 250 250;
  --destructive: 239 68 68;
  --destructive-foreground: 250 250 250;
  --border: 40 40 40;
  --input: 40 40 40;
  --ring: 14 165 233;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  .prose {
    @apply max-w-none;
  }
  .prose h1,
  .prose h2,
  .prose h3,
  .prose h4,
  .prose h5,
  .prose h6 {
    @apply font-semibold text-foreground;
  }
}

/* Markdown editor styles */
.EasyMDEContainer {
  @apply font-sans;
}

.EasyMDEContainer .CodeMirror {
  @apply border border-gray-300 dark:border-gray-700 rounded-md;
  @apply bg-white dark:bg-gray-900;
  @apply text-gray-900 dark:text-gray-100;
}

.EasyMDEContainer .editor-toolbar {
  @apply border border-gray-300 dark:border-gray-700 rounded-t-md;
  @apply bg-white dark:bg-gray-800;
}

.EasyMDEContainer .editor-toolbar button {
  @apply text-gray-700 dark:text-gray-300;
}

.EasyMDEContainer .editor-toolbar button:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

.EasyMDEContainer .editor-toolbar button.active {
  @apply bg-gray-200 dark:bg-gray-600;
}

.EasyMDEContainer .CodeMirror-cursor {
  @apply border-l-2 border-primary-600 dark:border-primary-400;
}

/* Fix layout issues */
.container {
  @apply px-4 mx-auto max-w-screen-xl;
}

.section {
  @apply py-12 md:py-20;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
}

.gradient-bg {
  background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(14, 165, 233, 0.1));
}
EOL

echo "Setup complete!"
echo "To test the implementation, run: npm run dev"

exit 0 