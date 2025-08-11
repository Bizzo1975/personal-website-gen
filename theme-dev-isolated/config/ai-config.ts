// AI Configuration for client-side usage
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    isConfigured: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your_openai_api_key_here'
  },
  stability: {
    apiKey: process.env.NEXT_PUBLIC_STABILITY_API_KEY || '',
    isConfigured: !!process.env.NEXT_PUBLIC_STABILITY_API_KEY && process.env.NEXT_PUBLIC_STABILITY_API_KEY !== 'your_stability_api_key_here'
  }
};

export const isAIConfigured = () => {
  return AI_CONFIG.openai.isConfigured || AI_CONFIG.stability.isConfigured;
};

export const getConfiguredProviders = () => {
  const providers = [];
  if (AI_CONFIG.openai.isConfigured) providers.push('OpenAI (DALL-E 3)');
  if (AI_CONFIG.stability.isConfigured) providers.push('Stability AI (Stable Diffusion)');
  return providers;
};
