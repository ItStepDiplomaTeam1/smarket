import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface ThemeToggleProps {
  isDark?: boolean;
  onChange?: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark: controlledIsDark, onChange }) => {
  const [internalIsDark, setInternalIsDark] = useState(false);
  
  const isDark = controlledIsDark !== undefined ? controlledIsDark : internalIsDark;

  const handleToggle = () => {
    const nextState = !isDark;
    console.log('[ThemeToggle] Clicked. Current isDark:', isDark, 'Next state:', nextState);
    if (controlledIsDark === undefined) {
      setInternalIsDark(nextState);
    }
    onChange?.(nextState);
  };

  return (
    <svg
      width="56"
      height="26"
      viewBox="0 0 56 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleToggle}
      style={{ cursor: 'pointer', overflow: 'visible' }}
      aria-label="Toggle dark mode"
      role="switch"
      aria-checked={isDark}
    >
      {/* Thin Track */}
      <motion.rect
        x="0"
        y="7"
        width="56"
        height="12"
        rx="6"
        animate={{ fill: isDark ? '#42E38B' : '#234E3F' }}
        transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
      />

      {/* Knob A (Light Mode Active) */}
      <motion.g
        initial={false}
        animate={{
          x: isDark ? 30 : 0,
          rotate: isDark ? 90 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        style={{ originX: '13px', originY: '13px' }}
      >
        {/* Outer Bulge Border */}
        <motion.circle
          cx="13"
          cy="13"
          r="13"
          animate={{ fill: isDark ? '#42E38B' : '#234E3F' }}
          transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        />
        {/* Inner Colored Knob */}
        <motion.circle
          cx="13"
          cy="13"
          r="8"
          animate={{ fill: isDark ? '#234E3F' : '#42E38B' }}
          transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        />
        {/* Glare */}
        <motion.ellipse
          cx="9.5"
          cy="9.5"
          rx="3.5"
          ry="2"
          fill="#FFFFFF"
          transform="rotate(-45 9.5 9.5)"
        />
      </motion.g>

      {/* Knob B (Dark Mode Active) */}
      <motion.g
        initial={false}
        animate={{
          x: isDark ? 30 : 0,
          rotate: isDark ? 0 : -90,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        style={{ originX: '13px', originY: '13px' }}
      >
        {/* Outer Bulge Border */}
        <motion.circle
          cx="13"
          cy="13"
          r="13"
          animate={{ fill: isDark ? '#42E38B' : '#234E3F' }}
          transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        />
        {/* Inner Colored Knob */}
        <motion.circle
          cx="13"
          cy="13"
          r="8"
          animate={{ fill: isDark ? '#234E3F' : '#42E38B' }}
          transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        />
        {/* Glare */}
        <motion.ellipse
          cx="9.5"
          cy="9.5"
          rx="3.5"
          ry="2"
          fill="#FFFFFF"
          transform="rotate(-45 9.5 9.5)"
        />
      </motion.g>
    </svg>
  );
};
