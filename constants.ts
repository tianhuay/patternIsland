
import { Level, PatternType, Difficulty, PatternItem } from './types';

const getDifficulty = (index: number): Difficulty => {
  if (index <= 3) return Difficulty.BEGINNER;
  if (index <= 7) return Difficulty.INTERMEDIATE;
  return Difficulty.ADVANCED;
};

const shuffle = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const SHAPES: PatternItem['shape'][] = ['circle', 'square', 'triangle', 'star', 'heart', 'sun', 'moon', 'cloud'];
const COLORS = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-indigo-400', 'bg-teal-400'];
const EMOJI_SETS = [
  ['🦁', '🐯', '🐘', '🦒'],
  ['🍎', '🍌', '🍇', '🍓'],
  ['🚗', '🚀', '🚁', '🚲'],
  ['⚽', '🏀', '🎾', '🏐'],
  ['🍦', '🍩', '🍕', '🍔'],
  ['🐶', '🐱', '🐭', '🐹']
];

/**
 * Generates a unique string key representing the visual state of a PatternItem.
 * Normalizes values to ensure things that look the same get the same key.
 */
const getVisualKey = (item: PatternItem): string => {
  const rot = typeof item.rotation === 'number' ? (item.rotation % 360 + 360) % 360 : 0;
  const parts = [
    item.shape || 'none',
    item.color || 'none',
    item.emoji || 'none',
    String(item.value || 'none'),
    item.size || 'md',
    String(rot)
  ];
  return parts.join('|');
};

const generateLevels = (): Level[] => {
  const levels: Level[] = [];
  const types = Object.values(PatternType);
  let globalId = 1;

  types.forEach((type) => {
    for (let i = 1; i <= 10; i++) {
      const difficulty = getDifficulty(i);
      const isBoss = i % 5 === 0;
      
      const selectedColors = shuffle(COLORS);
      const selectedShapes = shuffle(SHAPES);
      const emojiSet = shuffle(EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)]);
      
      // Shuffle rotations for each level to ensure variety in rotation patterns
      const levelRotations = shuffle([0, 90, 180, 270]);

      const createBaseItem = (poolIdx: number): PatternItem => {
        const item: PatternItem = { id: `item-${type}-${i}-${poolIdx}-${Math.random()}`, size: 'md' };
        switch (type) {
          case PatternType.COLOR:
            item.color = selectedColors[poolIdx % selectedColors.length];
            item.shape = 'circle';
            break;
          case PatternType.SHAPE:
            item.shape = selectedShapes[poolIdx % selectedShapes.length];
            item.color = 'bg-indigo-400';
            break;
          case PatternType.SIZE:
            item.size = (['sm', 'md', 'lg'] as const)[poolIdx % 3];
            item.color = 'bg-green-400';
            item.shape = 'square';
            break;
          case PatternType.NUMBER:
            // Use poolIdx to ensure different numbers across levels
            item.value = (poolIdx + 1) + (i * 2); 
            item.color = 'bg-orange-400';
            break;
          case PatternType.EMOJI:
            item.emoji = emojiSet[poolIdx % emojiSet.length];
            break;
          case PatternType.ROTATION:
            item.shape = 'arrow';
            // Use pre-shuffled rotations for this specific level
            item.rotation = levelRotations[poolIdx % levelRotations.length];
            item.color = 'bg-blue-500';
            break;
          case PatternType.ALPHABET:
            // Start alphabet at different letters based on level index
            const startChar = 65 + (i % 10);
            item.value = String.fromCharCode(startChar + (poolIdx % (26 - (i % 10))));
            item.color = 'bg-pink-400';
            break;
          case PatternType.QUANTITY:
            item.shape = 'dot';
            item.value = ((poolIdx + i) % 9) + 1;
            item.color = 'bg-slate-700';
            break;
          case PatternType.NATURE:
            const nat = ['sun', 'cloud', 'moon', 'star'];
            item.shape = nat[(poolIdx + i) % 4] as any;
            item.color = item.shape === 'sun' ? 'bg-yellow-300' : item.shape === 'moon' ? 'bg-slate-600' : item.shape === 'cloud' ? 'bg-blue-100' : 'bg-yellow-400';
            break;
          case PatternType.FRUIT:
            const fruits = ['🍎', '🍌', '🍇', '🍒', '🍓', '🍍'];
            item.emoji = fruits[(poolIdx + i) % 6];
            break;
          case PatternType.MIRROR:
            item.color = selectedColors[(poolIdx + i) % selectedColors.length];
            item.shape = selectedShapes[(poolIdx + i) % selectedShapes.length];
            break;
          default:
            item.color = selectedColors[poolIdx % selectedColors.length];
            item.shape = selectedShapes[poolIdx % selectedShapes.length];
        }
        return item;
      };

      // Create a randomized "pool" of indices for this specific level's items
      // This ensures A, B, C are different between Level 1 and Level 2 of the same group.
      const levelPool = shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
      const A = createBaseItem(levelPool[0]);
      const B = createBaseItem(levelPool[1]);
      const C = createBaseItem(levelPool[2]);
      const D = createBaseItem(levelPool[3]);

      let sequence: PatternItem[] = [];
      let correctItem: PatternItem;
      let instruction = "Find the missing piece!";

      if (type === PatternType.NUMBER) {
        // Number levels use dedicated progression rules instead of visual rhythm templates.
        let nums: number[] = [];
        let nextNum = 0;

        if (difficulty === Difficulty.BEGINNER) {
          if (i % 2 === 0) {
            const start = 2 + (i % 4);
            nums = [start, start + 1, start + 2, start + 3];
            nextNum = start + 4;
            instruction = "Count up by 1. What number is next?";
          } else {
            const start = 2 + (i % 3);
            nums = [start, start + 2, start + 4, start + 6];
            nextNum = start + 8;
            instruction = "Skip-count by 2. What comes next?";
          }
        } else if (difficulty === Difficulty.INTERMEDIATE) {
          if (i % 3 === 0) {
            const start = 3 + (i % 3);
            nums = [start, start + 3, start + 6, start + 9];
            nextNum = start + 12;
            instruction = "Count up by 3. Find the next number!";
          } else if (i % 3 === 1) {
            const start = 5 + (i % 2);
            nums = [start, start + 5, start + 10, start + 15];
            nextNum = start + 20;
            instruction = "Count up by 5. What's next?";
          } else {
            const start = 2 + (i % 2);
            nums = [start, start * 2, start * 4, start * 8];
            nextNum = start * 16;
            instruction = "Double each number. Which one comes next?";
          }
        } else {
          if (i % 3 === 0) {
            const start = 2 + (i % 3);
            const n2 = start + 1;
            const n3 = n2 + 2;
            const n4 = n3 + 3;
            nums = [start, n2, n3, n4];
            nextNum = n4 + 4;
            instruction = "Add 1, then 2, then 3... what's next?";
          } else if (i % 3 === 1) {
            const a = 2 + (i % 3);
            const b = 3 + (i % 2);
            const c = a + b;
            const d = b + c;
            nums = [a, b, c, d];
            nextNum = c + d;
            instruction = "Add the last two numbers each time. Next?";
          } else {
            const start = 2 + (i % 3);
            const n2 = start * 2 + 1;
            const n3 = n2 * 2 + 1;
            const n4 = n3 * 2 + 1;
            nums = [start, n2, n3, n4];
            nextNum = n4 * 2 + 1;
            instruction = "Double and add 1 each step. What's next?";
          }
        }

        sequence = nums.map((value, idx) => ({
          id: `num-seq-${type}-${i}-${idx}`,
          value,
          color: 'bg-orange-400',
          size: 'md'
        }));
        correctItem = {
          id: `num-correct-${type}-${i}`,
          value: nextNum,
          color: 'bg-orange-400',
          size: 'md'
        };
      } else {
        switch (type) {
          case PatternType.COLOR: {
            const c1 = { ...A, shape: 'circle', color: selectedColors[0] };
            const c2 = { ...B, shape: 'circle', color: selectedColors[1] };
            const c3 = { ...C, shape: 'circle', color: selectedColors[2] };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [c1, c2, c1, c2];
              correctItem = c1;
              instruction = "Find the next repeating color.";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [c1, c2, c3, c1, c2];
              correctItem = c3;
              instruction = "Three colors repeat in order. What's next?";
            } else {
              sequence = [c1, c1, c2, c2, c3, c3];
              correctItem = c1;
              instruction = "Each color appears twice. Which color returns now?";
            }
            break;
          }
          case PatternType.SHAPE: {
            const s1 = { ...A, shape: selectedShapes[0], color: 'bg-indigo-400' };
            const s2 = { ...B, shape: selectedShapes[1], color: 'bg-indigo-400' };
            const s3 = { ...C, shape: selectedShapes[2], color: 'bg-indigo-400' };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [s1, s2, s1, s2];
              correctItem = s1;
              instruction = "Which shape repeats next?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [s1, s2, s3, s1, s2];
              correctItem = s3;
              instruction = "Follow the 3-shape cycle.";
            } else {
              sequence = [s1, s2, s2, s1, s2];
              correctItem = s2;
              instruction = "One shape appears twice each cycle. Pick next.";
            }
            break;
          }
          case PatternType.SIZE: {
            const small = { ...A, shape: 'square', color: 'bg-green-400', size: 'sm' as const };
            const medium = { ...B, shape: 'square', color: 'bg-green-400', size: 'md' as const };
            const large = { ...C, shape: 'square', color: 'bg-green-400', size: 'lg' as const };
            const sizeVariants = difficulty === Difficulty.BEGINNER
              ? [
                  { seq: [small, medium, large], ans: small, text: "Small, medium, large... then what?" },
                  { seq: [large, medium, small], ans: large, text: "Big to small then repeat. What's next?" },
                  { seq: [small, small, medium], ans: medium, text: "Two small, two medium... choose next size." },
                  { seq: [medium, large, medium, large], ans: medium, text: "Middle and large alternate. What's next?" }
                ]
              : difficulty === Difficulty.INTERMEDIATE
                ? [
                    { seq: [small, medium, large, medium], ans: small, text: "Size goes up then down. What comes next?" },
                    { seq: [large, medium, small, medium], ans: large, text: "Size goes down then up. Pick next." },
                    { seq: [small, medium, medium, large, large], ans: small, text: "Each step repeats before growing. Next size?" },
                    { seq: [small, large, medium, small, large], ans: medium, text: "Follow the size jump pattern." }
                  ]
                : [
                    { seq: [small, small, medium, medium, large, large], ans: small, text: "Pairs of sizes loop back. Which starts again?" },
                    { seq: [small, large, small, large, medium, large], ans: small, text: "Two-size bounce with a middle twist. Next?" },
                    { seq: [small, medium, large, large, medium, small], ans: small, text: "Mirror the size pattern. What follows?" },
                    { seq: [medium, small, large, medium, small], ans: large, text: "Three-size sequence repeats. Pick next." }
                  ];

            const chosen = sizeVariants[(i - 1) % sizeVariants.length];
            sequence = chosen.seq;
            correctItem = chosen.ans;
            instruction = chosen.text;
            break;
          }
          case PatternType.EMOJI: {
            const e1 = { ...A, emoji: emojiSet[0], color: undefined, shape: undefined };
            const e2 = { ...B, emoji: emojiSet[1], color: undefined, shape: undefined };
            const e3 = { ...C, emoji: emojiSet[2], color: undefined, shape: undefined };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [e1, e2, e1, e2];
              correctItem = e1;
              instruction = "Which emoji comes next in the repeat?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [e1, e2, e3, e1, e2];
              correctItem = e3;
              instruction = "Emoji team repeats in order. What's next?";
            } else {
              sequence = [e1, e1, e2, e2, e3, e3];
              correctItem = e1;
              instruction = "Each emoji appears twice. Which one returns?";
            }
            break;
          }
          case PatternType.ROTATION: {
            const r1 = { ...A, shape: 'arrow', color: 'bg-blue-500', rotation: 0 };
            const r2 = { ...B, shape: 'arrow', color: 'bg-blue-500', rotation: 90 };
            const r3 = { ...C, shape: 'arrow', color: 'bg-blue-500', rotation: 180 };
            const r4 = { ...D, shape: 'arrow', color: 'bg-blue-500', rotation: 270 };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [r1, r2, r3];
              correctItem = r4;
              instruction = "Arrow turns a quarter turn each step. Next?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [r1, r3, r1, r3];
              correctItem = r1;
              instruction = "Arrow flips between opposite directions.";
            } else {
              sequence = [r1, r2, r4, r1, r2];
              correctItem = r4;
              instruction = "Turn pattern repeats: up, right, left...";
            }
            break;
          }
          case PatternType.ALPHABET: {
            const start = 65 + (i % 8); // A-H starts
            if (difficulty === Difficulty.BEGINNER) {
              const letters = [start, start + 1, start + 2, start + 3].map((code) => String.fromCharCode(code));
              sequence = letters.slice(0, 3).map((value, idx) => ({ ...[A, B, C][idx], value, color: 'bg-pink-400' }));
              correctItem = { ...D, value: letters[3], color: 'bg-pink-400' };
              instruction = "Move one letter forward each time.";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              const letters = [start, start + 2, start + 4, start + 6].map((code) => String.fromCharCode(code));
              sequence = letters.slice(0, 3).map((value, idx) => ({ ...[A, B, C][idx], value, color: 'bg-pink-400' }));
              correctItem = { ...D, value: letters[3], color: 'bg-pink-400' };
              instruction = "Skip one letter each step. What's next?";
            } else {
              const a1 = String.fromCharCode(start);
              const a2 = String.fromCharCode(start + 1);
              const b1 = String.fromCharCode(start + 3);
              const b2 = String.fromCharCode(start + 4);
              sequence = [
                { ...A, value: a1, color: 'bg-pink-400' },
                { ...B, value: a2, color: 'bg-pink-400' },
                { ...C, value: b1, color: 'bg-pink-400' },
                { ...D, value: b2, color: 'bg-pink-400' }
              ];
              correctItem = { ...A, value: String.fromCharCode(start + 6), color: 'bg-pink-400' };
              instruction = "Two-letter blocks jump forward. Find next letter.";
            }
            break;
          }
          case PatternType.QUANTITY: {
            const qStart = 1 + (i % 3);
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [qStart, qStart + 1, qStart + 2].map((value, idx) => ({ ...[A, B, C][idx], value, color: 'bg-slate-700' }));
              correctItem = { ...D, value: qStart + 3, color: 'bg-slate-700' };
              instruction = "Count the amount. Which count comes next?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [qStart, qStart + 2, qStart + 4, qStart + 6].map((value, idx) => ({ ...[A, B, C, D][idx], value, color: 'bg-slate-700' }));
              correctItem = { ...A, value: qStart + 8, color: 'bg-slate-700' };
              instruction = "Count by twos using quantity.";
            } else {
              sequence = [qStart, qStart + 1, qStart + 3, qStart + 6].map((value, idx) => ({ ...[A, B, C, D][idx], value, color: 'bg-slate-700' }));
              correctItem = { ...A, value: qStart + 10, color: 'bg-slate-700' };
              instruction = "Add bigger amounts each step: +1, +2, +3...";
            }
            break;
          }
          case PatternType.NATURE: {
            const sun = { ...A, shape: 'sun', color: 'bg-yellow-300' };
            const cloud = { ...B, shape: 'cloud', color: 'bg-blue-100' };
            const moon = { ...C, shape: 'moon', color: 'bg-slate-600' };
            const star = { ...D, shape: 'star', color: 'bg-yellow-400' };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [sun, cloud, sun, cloud];
              correctItem = sun;
              instruction = "Weather cycle repeats. Which sky icon is next?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [sun, cloud, moon, star, sun, cloud];
              correctItem = moon;
              instruction = "Day to night cycle repeats. What's next?";
            } else {
              sequence = [sun, moon, sun, moon, star];
              correctItem = sun;
              instruction = "Two-part sky rhythm with a sparkle break. Next?";
            }
            break;
          }
          case PatternType.FRUIT: {
            const fruits = ['🍎', '🍌', '🍇', '🍒', '🍓', '🍍'];
            const f1 = { ...A, emoji: fruits[(i + 0) % fruits.length], color: undefined, shape: undefined };
            const f2 = { ...B, emoji: fruits[(i + 1) % fruits.length], color: undefined, shape: undefined };
            const f3 = { ...C, emoji: fruits[(i + 2) % fruits.length], color: undefined, shape: undefined };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [f1, f2, f1, f2];
              correctItem = f1;
              instruction = "Fruit pair repeats. Which fruit comes next?";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [f1, f2, f3, f1, f2];
              correctItem = f3;
              instruction = "Three-fruit basket pattern. Find next fruit.";
            } else {
              sequence = [f1, f1, f2, f2, f3, f3];
              correctItem = f1;
              instruction = "Each fruit appears twice in order.";
            }
            break;
          }
          case PatternType.MIRROR: {
            const m1 = { ...A };
            const m2 = { ...B };
            const m3 = { ...C };
            if (difficulty === Difficulty.BEGINNER) {
              sequence = [m1, m2, m2];
              correctItem = m1;
              instruction = "Mirror it: left side and right side must match.";
            } else if (difficulty === Difficulty.INTERMEDIATE) {
              sequence = [m1, m2, m3, m2];
              correctItem = m1;
              instruction = "Complete the mirror around the center.";
            } else {
              sequence = [m1, m2, m3, m3, m2];
              correctItem = m1;
              instruction = "Symmetry challenge: finish the reflected side.";
            }
            break;
          }
          default:
            sequence = [A, B, C];
            correctItem = D;
            instruction = "Find the missing piece!";
        }
      }

      if (isBoss) {
        instruction = `BOSS ROUND: ${instruction}`;
      }

      // --- Guaranteed Unique Options ---
      const options: PatternItem[] = [];
      const seenVisualKeys = new Set<string>();

      options.push({ ...correctItem, id: 'opt-correct' });
      seenVisualKeys.add(getVisualKey(correctItem));

      if (type === PatternType.NUMBER && typeof correctItem.value === 'number') {
        const correctValue = correctItem.value;
        const numberDistractors = shuffle([
          correctValue + 1,
          correctValue + 2,
          correctValue + 3,
          Math.max(1, correctValue - 1),
          Math.max(1, correctValue - 2),
          correctValue + (difficulty === Difficulty.ADVANCED ? 5 : 4)
        ]).filter((val, idx, arr) => arr.indexOf(val) === idx && val !== correctValue);

        for (const val of numberDistractors) {
          if (options.length >= 3) break;
          const dist: PatternItem = {
            id: `opt-number-${val}`,
            value: val,
            color: 'bg-orange-400',
            size: 'md'
          };
          const vKey = getVisualKey(dist);
          if (!seenVisualKeys.has(vKey)) {
            options.push({ ...dist, id: `opt-wrong-${options.length}` });
            seenVisualKeys.add(vKey);
          }
        }
      } else {
        const distractorIndices = shuffle(Array.from({ length: 15 }, (_, k) => k + 4));
        for (const idx of distractorIndices) {
          if (options.length >= 3) break;
          const dist = createBaseItem(idx);
          const vKey = getVisualKey(dist);
          if (!seenVisualKeys.has(vKey)) {
            options.push({ ...dist, id: `opt-wrong-${options.length}` });
            seenVisualKeys.add(vKey);
          }
        }
      }

      levels.push({
        id: globalId++,
        groupType: type,
        levelInGroup: i,
        difficulty,
        isBoss,
        instruction,
        sequence: sequence.map((s, idx) => ({ ...s, id: `seq-${type}-${i}-${idx}` })),
        options: shuffle(options),
        correctAnswerId: 'opt-correct'
      });
    }
  });

  return levels;
};

export const LEVELS = generateLevels();

export const COLORS_CONFIG = {
  primary: '#7dd3fc',
  secondary: '#f9a8d4',
  accent: '#fde047',
  correct: '#4ade80',
  wrong: '#f87171',
};
