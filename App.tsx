
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Home, 
  Star,
  Lightbulb,
  Layers,
  Crown,
  Flame,
  Zap,
  Medal
} from 'lucide-react';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

import PatternCard from './components/PatternCard';
import { LEVELS } from './constants';
import { Difficulty, Level, PatternType, UserStats } from './types';
import { getHintFromGemini } from './geminiService';
import { sounds } from './utils/audio';

type LevelResult = {
  mistakes: number;
  usedHint: boolean;
  solveMs: number;
};

const RANKS = [
  { title: 'Explorer', minXp: 0 },
  { title: 'Pattern Scout', minXp: 300 },
  { title: 'Pattern Pro', minXp: 900 },
  { title: 'Pattern Hero', minXp: 1800 },
  { title: 'Pattern Master', minXp: 3200 }
];

const BADGE_LABELS: Record<string, string> = {
  first_boss: 'First Boss Win',
  streak_10: 'Streak x10',
  speedster: 'Lightning Solver',
  perfectionist: 'Perfect x20'
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const createDefaultStats = (): UserStats => ({
  stars: 0,
  streak: 1,
  bestStreak: 1,
  completedLevels: [],
  unlockedGroups: Object.values(PatternType),
  lastPlayed: new Date().toISOString(),
  xp: 0,
  badges: [],
  fastestSolveMs: null,
  bossesCompleted: 0,
  perfectCompletions: 0,
  daily: {
    dateKey: getTodayKey(),
    completedToday: 0,
    perfectToday: 0,
    bossesToday: 0
  }
});

const withFreshDaily = (stats: UserStats): UserStats => {
  if (stats.daily.dateKey === getTodayKey()) return stats;
  return {
    ...stats,
    daily: {
      dateKey: getTodayKey(),
      completedToday: 0,
      perfectToday: 0,
      bossesToday: 0
    }
  };
};

const getTierFromDifficulty = (difficulty: Difficulty): string => {
  if (difficulty === Difficulty.BEGINNER) return 'Tier 1';
  if (difficulty === Difficulty.INTERMEDIATE) return 'Tier 2';
  return 'Tier 3';
};

const unlockBadges = (stats: UserStats): string[] => {
  const next = new Set(stats.badges);
  if (stats.bossesCompleted >= 1) next.add('first_boss');
  if (stats.bestStreak >= 10) next.add('streak_10');
  if (stats.fastestSolveMs !== null && stats.fastestSolveMs <= 7000) next.add('speedster');
  if (stats.perfectCompletions >= 20) next.add('perfectionist');
  return Array.from(next);
};

const HomeScreen: React.FC<{ stats: UserStats; onStart: (levelId: number) => void }> = ({ stats, onStart }) => {
  const groups = Object.values(PatternType);
  const totalLevels = LEVELS.length;
  const completedLevelsCount = stats.completedLevels.length;
  const progressPercent = Math.round((completedLevelsCount / totalLevels) * 100);
  const currentRank = [...RANKS].reverse().find((rank) => stats.xp >= rank.minXp) || RANKS[0];
  const nextRank = RANKS.find((rank) => rank.minXp > stats.xp);
  const currentRankFloor = currentRank.minXp;
  const nextRankCeiling = nextRank?.minXp ?? currentRankFloor + 600;
  const rankProgress = Math.max(0, Math.min(100, Math.round(((stats.xp - currentRankFloor) / (nextRankCeiling - currentRankFloor)) * 100)));
  const quests = [
    { id: 'q1', label: 'Complete 5 levels today', progress: stats.daily.completedToday, goal: 5 },
    { id: 'q2', label: 'Reach streak x5', progress: Math.min(stats.streak, 5), goal: 5 },
    { id: 'q3', label: 'Beat 1 boss level today', progress: stats.daily.bossesToday, goal: 1 }
  ];
  const badges = stats.badges.slice(0, 4);

  return (
    <div className="flex flex-col items-center h-full w-full bg-blue-50 overflow-y-auto pb-32 no-scrollbar">
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mt-12 mb-8 px-4 flex-shrink-0 w-full max-w-4xl"
      >
        <div className="flex justify-center gap-6 mb-6">
          <div className="bg-white px-8 py-3 rounded-full shadow-lg flex items-center gap-3 border-2 border-yellow-100">
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
            <span className="font-black text-2xl text-slate-700">{stats.stars}</span>
          </div>
          <div className="bg-white px-8 py-3 rounded-full shadow-lg flex items-center gap-3 border-2 border-violet-100">
            <Zap className="text-violet-500" size={24} />
            <span className="font-black text-2xl text-slate-700">{stats.xp} XP</span>
          </div>
          <div className="bg-white px-8 py-3 rounded-full shadow-lg flex items-center gap-3 border-2 border-blue-100">
            <Trophy className="text-blue-500" size={24} />
            <span className="font-black text-2xl text-slate-700">{completedLevelsCount}/{totalLevels}</span>
          </div>
        </div>
        
        <h1 className="text-7xl font-black text-blue-600 mb-4 tracking-tighter drop-shadow-sm">Pattern Island</h1>

        <div className="bg-violet-50 p-6 rounded-[2rem] border-4 border-violet-100 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-2 gap-8">
            <p className="text-violet-700 font-black text-xl flex items-center gap-2">
              <Medal size={20} />
              {currentRank.title}
            </p>
            <p className="text-violet-500 font-bold text-sm uppercase tracking-widest">
              {nextRank ? `${nextRank.minXp - stats.xp} XP to ${nextRank.title}` : 'MAX RANK'}
            </p>
          </div>
          <div className="w-full bg-violet-100 h-4 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rankProgress}%` }}
              className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400"
            />
          </div>
        </div>
        
        {/* Global Progress Dashboard */}
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white mb-12 flex flex-col items-center">
           <div className="flex justify-between items-center w-full mb-4 px-4">
             <div className="flex items-center gap-2">
               <Trophy className="text-blue-500" size={20} />
               <span className="font-bold text-slate-500 uppercase tracking-widest text-sm">Overall Mastery</span>
             </div>
             <span className="font-black text-blue-600 text-xl">{completedLevelsCount} / {totalLevels} SOLVED</span>
           </div>
           <div className="w-full bg-slate-100 h-8 rounded-full overflow-hidden border-2 border-slate-50 relative">
             <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
             />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-blue-900 mix-blend-overlay">{progressPercent}% EXPLORED</span>
             </div>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 w-full mb-8">
          {quests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.progress / quest.goal) * 100));
            const done = quest.progress >= quest.goal;
            return (
              <div key={quest.id} className={`rounded-3xl border-4 p-5 text-left ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Daily Quest</p>
                <p className="font-black text-slate-700 mb-3">{quest.label}</p>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div style={{ width: `${pct}%` }} className={`h-full ${done ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                </div>
                <p className="text-sm font-bold text-slate-500">{Math.min(quest.progress, quest.goal)} / {quest.goal}</p>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-white border-4 border-orange-100 rounded-3xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-orange-400 mb-2">Personal Bests</p>
            <div className="flex items-center justify-between text-slate-700 font-black">
              <span className="flex items-center gap-2"><Flame size={18} className="text-orange-500" /> Best Streak</span>
              <span>{stats.bestStreak}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-black mt-2">
              <span>Fastest Solve</span>
              <span>{stats.fastestSolveMs !== null ? `${(stats.fastestSolveMs / 1000).toFixed(1)}s` : '--'}</span>
            </div>
          </div>
          <div className="bg-white border-4 border-yellow-100 rounded-3xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-yellow-500 mb-2">Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.length > 0 ? badges.map((badge) => (
                <span key={badge} className="px-3 py-1 rounded-full bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-bold text-sm">
                  {BADGE_LABELS[badge] || badge}
                </span>
              )) : (
                <span className="text-slate-400 font-semibold">Earn your first badge!</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="w-full max-w-7xl px-8 space-y-12">
        {groups.map((group) => {
          const groupLevels = LEVELS.filter(l => l.groupType === group);
          const completedInGroup = groupLevels.filter(l => stats.completedLevels.includes(l.id)).length;

          return (
            <div key={group} className="relative p-8 rounded-[3rem] bg-white shadow-xl border-b-8 border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-800">{group} QUEST</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest">{completedInGroup} / 10 COMPLETED</p>
                </div>
                <div className="p-4 rounded-3xl bg-blue-500 text-white shadow-lg">
                  <Layers size={32} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-4">
                {groupLevels.map((level) => {
                  const isDone = stats.completedLevels.includes(level.id);
                  const tier = getTierFromDifficulty(level.difficulty);

                  return (
                    <motion.button
                      key={level.id}
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => sounds.hover()}
                      onClick={() => {
                        sounds.click();
                        onStart(level.id);
                      }}
                      className={`
                        aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-4 relative
                        ${isDone ? 'bg-green-100 border-green-200 text-green-600' : level.isBoss ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-md' : 'bg-blue-50 border-blue-100 text-blue-600 shadow-md'}
                      `}
                    >
                      {level.isBoss && (
                        <span className="absolute -top-2 -right-2 p-1 rounded-full bg-purple-500 text-white">
                          <Crown size={12} />
                        </span>
                      )}
                      <span className="text-2xl font-black">{level.levelInGroup}</span>
                      <span className="text-[10px] font-black tracking-wider">{tier}</span>
                      {isDone && <Star size={16} className="fill-current" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GameScreen: React.FC<{ level: Level; onBack: () => void; onComplete: (result: LevelResult) => void }> = ({ level, onBack, onComplete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const levelStartRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedId(null);
    setFeedback(null);
    setHint(null);
    setLoadingHint(false);
    setMistakes(0);
    setUsedHint(false);
    levelStartRef.current = Date.now();
  }, [level.id]);

  const correctOption = useMemo(
    () => level.options.find((option) => option.id === level.correctAnswerId),
    [level.options, level.correctAnswerId]
  );

  const shouldRevealAnswer = feedback === 'correct' && selectedId === level.correctAnswerId && !!correctOption;

  const handleChoice = (id: string) => {
    if (feedback === 'correct') return;
    
    setSelectedId(id);
    if (id === level.correctAnswerId) {
      sounds.correct();
      setFeedback('correct');
      setHint(null);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 }
      });
      setTimeout(() => {
        onComplete({
          mistakes,
          usedHint,
          solveMs: Date.now() - levelStartRef.current
        });
      }, 1000);
    } else {
      sounds.wrong();
      setFeedback('wrong');
      setMistakes((prev) => prev + 1);
      setTimeout(() => {
        setFeedback(null);
        setSelectedId(null);
      }, 800);
    }
  };

  const getHint = async () => {
    if (loadingHint) return;
    sounds.hint();
    setUsedHint(true);
    setLoadingHint(true);
    setHint("Thinking..."); // Immediate feedback for the user
    const h = await getHintFromGemini(level);
    setHint(h);
    setLoadingHint(false);
  };

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col overflow-y-auto relative no-scrollbar">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none -z-0">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-slate-200" />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="p-8 flex justify-between items-center z-10 w-full sticky top-0 bg-white/50 backdrop-blur-sm">
        <button 
          onClick={() => { sounds.click(); onBack(); }} 
          className="p-6 bg-white rounded-[2rem] shadow-xl border-4 border-slate-50 hover:bg-slate-50 active:scale-90 transition-transform flex items-center gap-2"
        >
          <Home className="text-slate-600" size={32} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/90 backdrop-blur-md px-10 py-5 rounded-full border-4 border-blue-400 shadow-2xl flex items-center gap-4">
            <span className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              {level.groupType} &bull; {level.levelInGroup}/10
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-slate-500">
              {getTierFromDifficulty(level.difficulty)}
            </span>
            {level.isBoss && (
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Crown size={14} />
                Boss
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={getHint} 
          disabled={loadingHint && hint === "Thinking..."}
          className={`p-6 bg-yellow-100 text-yellow-700 rounded-[2rem] shadow-xl border-4 border-yellow-200 hover:bg-yellow-200 active:scale-90 transition-transform ${loadingHint && hint === "Thinking..." ? 'opacity-50' : ''}`}
        >
          <Lightbulb size={32} className={loadingHint && hint === "Thinking..." ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4 py-12 z-10">
        <motion.div
          key={level.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center gap-12"
        >
          <h2 className="text-5xl md:text-7xl font-black text-slate-800 text-center drop-shadow-sm max-w-[90vw]">
            {level.instruction}
          </h2>

          <AnimatePresence>
            {hint && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-yellow-50 border-4 border-yellow-200 p-6 rounded-3xl shadow-xl max-w-2xl text-center"
              >
                <p className="text-2xl font-black text-yellow-800 italic">"{hint}"</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pattern Area */}
          <div className="flex items-center justify-center flex-wrap gap-8 w-full py-8">
            {level.sequence.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <PatternCard item={item} animate={false} />
              </motion.div>
            ))}
            <AnimatePresence mode="wait">
              {shouldRevealAnswer && correctOption ? (
                <motion.div
                  key="revealed-answer"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <PatternCard item={correctOption} animate={false} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder-answer"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <PatternCard item={{} as any} isPlaceholder />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Options */}
          <div className="flex gap-12 flex-wrap justify-center items-center mt-4 mb-20">
            {level.options.map((option, idx) => (
              <motion.div 
                key={option.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (idx * 0.05) }}
                onClick={() => handleChoice(option.id)}
                className={`
                  p-4 rounded-[3rem] transition-all cursor-pointer shadow-2xl
                  ${selectedId === option.id && feedback === 'correct' ? 'bg-green-100 scale-125 ring-[12px] ring-green-400' : ''}
                  ${selectedId === option.id && feedback === 'wrong' ? 'bg-red-100 scale-90 animate-shake ring-[8px] ring-red-400' : 'hover:scale-110 active:scale-90 bg-white border-4 border-slate-50'}
                `}
              >
                <PatternCard item={option} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-15px) rotate(-3deg); }
          40% { transform: translateX(15px) rotate(3deg); }
          60% { transform: translateX(-15px) rotate(-3deg); }
          80% { transform: translateX(15px) rotate(3deg); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'game'>('home');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('pattern_island_stats_v3') || localStorage.getItem('pattern_island_stats_v2');
    const defaults = createDefaultStats();
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<UserStats>;
        const merged: UserStats = {
          ...defaults,
          ...parsed,
          completedLevels: parsed.completedLevels || [],
          unlockedGroups: parsed.unlockedGroups || defaults.unlockedGroups,
          badges: parsed.badges || [],
          daily: {
            ...defaults.daily,
            ...(parsed.daily || {})
          }
        };
        return withFreshDaily(merged);
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    }
    return defaults;
  });
  const currentLevel = useMemo(() => LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0], [currentLevelId]);

  useEffect(() => {
    localStorage.setItem('pattern_island_stats_v3', JSON.stringify(stats));
  }, [stats]);

  const handleLevelStart = (levelId: number) => {
    setCurrentLevelId(levelId);
    setView('game');
  };

  const handleLevelComplete = (result: LevelResult) => {
    setStats((prev) => {
      const refreshed = withFreshDaily(prev);
      const isNewLevel = !prev.completedLevels.includes(currentLevelId);
      const tierBonus = currentLevel.difficulty === Difficulty.BEGINNER ? 10 : currentLevel.difficulty === Difficulty.INTERMEDIATE ? 25 : 45;
      const bossBonus = currentLevel.isBoss ? 80 : 0;
      const speedBonus = result.solveMs <= 7000 ? 20 : 0;
      const perfectBonus = result.mistakes === 0 && !result.usedHint ? 30 : 0;
      const xpGain = 60 + tierBonus + bossBonus + speedBonus + perfectBonus;
      const nextStreak = result.mistakes === 0 ? refreshed.streak + 1 : 1;
      const nextStats: UserStats = {
        ...refreshed,
        stars: refreshed.stars + (isNewLevel ? 50 + (currentLevel.isBoss ? 50 : 0) : 10),
        xp: refreshed.xp + xpGain,
        streak: nextStreak,
        bestStreak: Math.max(refreshed.bestStreak, nextStreak),
        completedLevels: Array.from(new Set([...refreshed.completedLevels, currentLevelId])),
        fastestSolveMs: refreshed.fastestSolveMs === null ? result.solveMs : Math.min(refreshed.fastestSolveMs, result.solveMs),
        bossesCompleted: refreshed.bossesCompleted + (currentLevel.isBoss ? 1 : 0),
        perfectCompletions: refreshed.perfectCompletions + (result.mistakes === 0 && !result.usedHint ? 1 : 0),
        daily: {
          ...refreshed.daily,
          completedToday: refreshed.daily.completedToday + 1,
          perfectToday: refreshed.daily.perfectToday + (result.mistakes === 0 && !result.usedHint ? 1 : 0),
          bossesToday: refreshed.daily.bossesToday + (currentLevel.isBoss ? 1 : 0)
        },
        lastPlayed: new Date().toISOString()
      };
      nextStats.badges = unlockBadges(nextStats);

      return {
        ...nextStats
      };
    });

    if (currentLevelId < LEVELS.length) {
      setCurrentLevelId(prev => prev + 1);
    } else {
      setView('home');
    }
  };

  return (
    <div className="w-screen h-screen font-sans select-none overflow-hidden bg-blue-50">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <HomeScreen 
              stats={stats} 
              onStart={handleLevelStart} 
            />
          </motion.div>
        )}

        {view === 'game' && (
          <motion.div 
            key={`game-${currentLevelId}`}
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, scale: 1.1 }}
            className="h-full w-full"
          >
            <GameScreen 
              level={currentLevel}
              onBack={() => setView('home')} 
              onComplete={handleLevelComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
