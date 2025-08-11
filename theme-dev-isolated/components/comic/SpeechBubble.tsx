'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SpeechBubbleProps {
  text: string;
  type?: 'speech' | 'thought' | 'narrative';
  character?: string;
  emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  type = 'speech',
  character,
  emotion = 'neutral',
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const getBubbleStyle = () => {
    const baseStyle = `speech-bubble speech-${type} emotion-${emotion} position-${position}`;
    return `${baseStyle} ${className}`;
  };

  return (
    <motion.div
      className={getBubbleStyle()}
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {character && (
        <div className="character-name">
          {character}
        </div>
      )}
      <div className="bubble-text">
        {text}
      </div>
      <div className={`bubble-tail tail-${position}`}></div>
    </motion.div>
  );
};

export default SpeechBubble;
