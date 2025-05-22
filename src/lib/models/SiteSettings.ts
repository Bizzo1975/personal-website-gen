import mongoose, { Schema } from 'mongoose';

const SiteSettingsSchema = new Schema({
  logoUrl: {
    type: String,
    default: '/images/wizard-icon.svg',
  },
  logoText: {
    type: String,
    default: 'John Doe',
  },
  footerText: {
    type: String,
    default: 'Built with Next.js and Tailwind CSS',
  },
  bioText: {
    type: String,
    default: 'Full-stack developer specializing in modern web technologies, creating elegant solutions to complex problems.',
  },
  navbarStyle: {
    type: String,
    default: 'default', // default, transparent, sticky, etc.
  },
  navbarLinks: {
    type: [{
      label: String,
      url: String,
      isExternal: Boolean,
    }],
    default: [
      { label: 'Home', url: '/', isExternal: false },
      { label: 'About', url: '/about', isExternal: false },
      { label: 'Projects', url: '/projects', isExternal: false },
      { label: 'Blog', url: '/blog', isExternal: false },
      { label: 'Contact', url: '/contact', isExternal: false },
    ],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Fix for "mongoose.models is undefined" error
export default (mongoose.models && mongoose.models.SiteSettings) 
  ? mongoose.models.SiteSettings 
  : mongoose.model('SiteSettings', SiteSettingsSchema); 