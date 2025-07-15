'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { FiArrowRight, FiCode, FiGithub, FiExternalLink, FiCalendar, FiUser, FiTag } from 'react-icons/fi';

const AnimationDemoPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            3D Animation Effects Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Interactive examples of modern 3D animation effects for cards and components
          </p>
        </div>

        {/* Project Cards Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Project Card Effects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 3D Tilt Effect */}
            <TiltCard />
            
            {/* 3D Flip Card */}
            <FlipCard />
            
            {/* Twist Card with Gradient */}
            <TwistCard />
          </div>
        </section>

        {/* Blog Post Cards Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Blog Post Card Effects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 3D Parallax Hover */}
            <ParallaxCard />
            
            {/* Floating Card with Glow */}
            <FloatingCard />
            
            {/* Morphing Card */}
            <MorphingCard />
          </div>
        </section>
      </div>
    </div>
  );
};

// 3D Tilt Effect Component
const TiltCard = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.05 }}
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform-gpu"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-10" />
        <div className="relative p-6 transform translate-z-12">
          <div className="flex items-center justify-between mb-4">
            <FiCode className="text-2xl text-blue-500" />
            <div className="flex gap-2">
              <FiGithub className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer" />
              <FiExternalLink className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            3D Tilt Effect
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Smooth 3D tilt effect that follows mouse movement with spring animations
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              React
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              Framer Motion
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 3D Flip Card Component
const FlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 h-80">
      <motion.div
        className="relative w-full h-full transform-style-preserve-3d cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-green-400 to-blue-500 rounded-xl p-6 flex flex-col justify-center items-center text-white">
          <FiCode className="text-4xl mb-4" />
          <h3 className="text-xl font-bold mb-2">3D Flip Card</h3>
          <p className="text-center opacity-90">Click to flip and reveal more content</p>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 flex flex-col justify-center text-white rotate-y-180">
          <h3 className="text-xl font-bold mb-4">Project Details</h3>
          <p className="text-sm opacity-90 mb-4">
            This flip card demonstrates a smooth 3D rotation effect with detailed information on the back
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FiUser className="text-sm" />
              <span className="text-sm">John Doe</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-sm" />
              <span className="text-sm">2024</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Twist Card Component
const TwistCard = () => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg"
      whileHover={{ 
        scale: 1.05,
        rotateX: 5,
        rotateY: 5,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 opacity-20"
        whileHover={{ 
          rotate: 180,
          scale: 1.2,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      <div className="relative p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <FiCode className="text-white text-xl" />
          </div>
          <FiArrowRight className="text-gray-600 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Twist Card
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Rotating gradient background with subtle 3D transforms
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm">
            CSS
          </span>
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm">
            Animation
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Parallax Card Component
const ParallaxCard = () => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform-gpu"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 opacity-10"
        style={{
          translateZ: 50,
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
            <FiTag className="text-white text-sm" />
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Dec 15, 2024</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Parallax Blog Post
            </h3>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This card demonstrates 3D parallax effects with mouse-following transforms and layered depth
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUser className="text-sm text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Author Name</span>
          </div>
          <span className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">
            Read More →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Floating Card Component
const FloatingCard = () => {
  return (
    <motion.div
      className="relative"
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-0"
        whileHover={{ opacity: 0.7 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
            <FiCode className="text-white text-lg" />
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Dec 10, 2024</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Floating Card
            </h3>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Hover to see the floating effect with a beautiful glow background that appears on interaction
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
              UI/UX
            </span>
            <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded text-xs">
              Design
            </span>
          </div>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            5 min read
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Morphing Card Component
const MorphingCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <FiCode className="text-white text-lg" />
          </motion.div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Dec 5, 2024</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Morphing Card
            </h3>
          </div>
        </div>
        
        <motion.p
          className="text-gray-600 dark:text-gray-300 mb-4"
          layout
        >
          Click to expand and see the morphing animation effect in action
        </motion.p>

        <motion.div
          layout
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className={isExpanded ? "block" : "hidden"}
        >
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              This expanded content shows how the card can morph and reveal additional information with smooth layout animations.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                React
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                Animation
              </span>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <FiUser className="text-sm text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Developer</span>
          </div>
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {isExpanded ? "Click to collapse" : "Click to expand"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimationDemoPage; 