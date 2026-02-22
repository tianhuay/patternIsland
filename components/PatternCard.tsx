
import React from 'react';
import { motion } from 'framer-motion';
import { PatternItem } from '../types';
import { 
  Star, Heart, Circle, Square, Triangle, 
  ArrowUp, Sun, Moon, Cloud 
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface PatternCardProps {
  item: PatternItem;
  isPlaceholder?: boolean;
  animate?: boolean;
}

const ShapeIcon = ({ shape, size }: { shape: string, size: string }) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;
  const props = { size: iconSize, className: "text-white fill-current" };
  
  switch (shape) {
    case 'star': return <Star {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'circle': return <Circle {...props} />;
    case 'square': return <Square {...props} />;
    case 'triangle': return <Triangle {...props} />;
    case 'arrow': return <ArrowUp {...props} />;
    case 'dot': return <div className={`bg-white rounded-full ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'}`} />;
    case 'sun': return <Sun {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'cloud': return <Cloud {...props} />;
    default: return <Circle {...props} />;
  }
};

const PatternCard: React.FC<PatternCardProps> = ({ item, isPlaceholder, animate = true }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  if (isPlaceholder) {
    return (
      <div className="w-24 h-24 bg-slate-100 rounded-3xl border-4 border-dashed border-slate-300 flex items-center justify-center">
        <span className="text-3xl font-black text-slate-300">?</span>
      </div>
    );
  }

  // Normalize rotation
  const rotation = typeof item.rotation === 'number' ? item.rotation : 0;

  return (
    <motion.div
      onMouseEnter={() => animate && sounds.hover()}
      initial={{ rotate: rotation }}
      animate={{ 
        rotate: rotation,
        scale: 1 
      }}
      // Explicitly keep rotation on hover to prevent resetting orientation
      whileHover={animate ? { scale: 1.1, rotate: rotation } : {}}
      whileTap={animate ? { scale: 0.95, rotate: rotation } : {}}
      className={`${sizeClasses[item.size || 'md']} ${item.color || 'bg-blue-400'} rounded-[2rem] shadow-lg border-4 border-white/40 flex items-center justify-center overflow-hidden cursor-pointer`}
    >
      {item.emoji ? (
        <span className="text-5xl">{item.emoji}</span>
      ) : item.value ? (
        <span className="text-4xl font-black text-white drop-shadow-md">{item.value}</span>
      ) : (
        <ShapeIcon shape={item.shape || 'circle'} size={item.size || 'md'} />
      )}
    </motion.div>
  );
};

export default PatternCard;
