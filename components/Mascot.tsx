
import React from 'react';
import { motion } from 'framer-motion';

interface MascotProps {
  message?: string;
  mood?: 'happy' | 'thinking' | 'excited' | 'celebrating';
}

const Mascot: React.FC<MascotProps> = ({ message, mood = 'happy' }) => {
  return (
    <div className="flex items-center gap-4 relative">
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: mood === 'excited' ? [0, 5, -5, 0] : 0 
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-24 h-24 bg-blue-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg relative"
      >
        {/* Robot Eyes */}
        <div className="flex gap-4">
          <motion.div 
            animate={{ scaleY: [1, 1, 0.1, 1] }} 
            transition={{ duration: 3, repeat: Infinity }}
            className="w-3 h-4 bg-white rounded-full" 
          />
          <motion.div 
            animate={{ scaleY: [1, 1, 0.1, 1] }} 
            transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
            className="w-3 h-4 bg-white rounded-full" 
          />
        </div>
        {/* Mouth */}
        <div className={`absolute bottom-4 w-8 h-2 bg-white rounded-full ${mood === 'happy' ? 'h-3' : 'h-1'}`} />
        
        {/* Antenna */}
        <div className="absolute -top-4 w-1 h-6 bg-blue-600">
          <div className="absolute -top-2 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-4 rounded-2xl rounded-tl-none shadow-md border-2 border-blue-100 max-w-[200px]"
        >
          <p className="text-sm font-medium text-slate-700">{message}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Mascot;
