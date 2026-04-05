"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HeartBurst = ({ trigger }) => {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    if (trigger) {
      // Generate 6-10 hearts with random properties
      const newHearts = Array.from({ length: 8 }).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        x: (Math.random() - 0.5) * 100, // Random horizontal offset
        size: Math.random() * (24 - 12) + 12, // Random size between 12 and 24
        duration: Math.random() * (1.5 - 0.8) + 0.8, // Random float duration
        delay: Math.random() * 0.2, // Small random start delay
      }));
      setHearts(prev => [...prev, ...newHearts]);

      // Simple cleanup after 2 seconds
      const timer = setTimeout(() => {
        setHearts([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
            animate={{ 
              y: -150, // Float up
              x: heart.x, // Sway sideways
              opacity: 0, 
              scale: 1.5,
              rotate: (Math.random() - 0.5) * 45
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: heart.duration, 
              ease: "easeOut",
              delay: heart.delay 
            }}
            className="absolute text-pink-500"
            style={{ fontSize: heart.size }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HeartBurst;
