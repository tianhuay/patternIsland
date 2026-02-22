
import { GoogleGenAI } from "@google/genai";
import { Level, PatternType } from "./types";

const GENERIC_HINTS = new Set([
  "look at the pattern one more time",
  "what do you see repeating",
  "look for what repeats"
]);

const trimHint = (hint: string): string => {
  const cleaned = hint.replace(/^"+|"+$/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 12) return cleaned;
  return `${words.slice(0, 12).join(" ")}...`;
};

const localHintForLevel = (level: Level): string => {
  if (level.groupType === PatternType.NUMBER) {
    const nums = level.sequence
      .map((item) => (typeof item.value === "number" ? item.value : null))
      .filter((n): n is number => n !== null);

    if (nums.length >= 4) {
      const diffs = nums.slice(1).map((n, i) => n - nums[i]);
      const allSame = diffs.every((d) => d === diffs[0]);
      if (allSame) return `Count up by ${diffs[0]} each step.`;

      const doubled = nums.slice(1).every((n, i) => n === nums[i] * 2);
      if (doubled) return "Each number doubles. What comes next?";

      const fibLike = nums.length >= 4 && nums[2] === nums[0] + nums[1] && nums[3] === nums[1] + nums[2];
      if (fibLike) return "Add the last two numbers to get next.";
    }
    return "Check how much each number changes each step.";
  }

  switch (level.groupType) {
    case PatternType.COLOR:
      return "Say the colors aloud. Which color repeats next?";
    case PatternType.SHAPE:
      return "Point to each shape in order and find the repeat.";
    case PatternType.SIZE:
      return "Watch size order: small, medium, large. What follows?";
    case PatternType.ROTATION:
      return "Notice arrow turns. Keep turning same amount each time.";
    case PatternType.ALPHABET:
      return "Say letters aloud and move forward in alphabet.";
    case PatternType.QUANTITY:
      return "Count the dots and compare each step.";
    case PatternType.MIRROR:
      return "Fold it in your mind. Right side matches left.";
    default:
      return "Say the pattern out loud. Then choose next piece.";
  }
};

export const getHintFromGemini = async (level: Level): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return localHintForLevel(level);

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rule: Friendly hint for a 7yo child learning patterns. Do not give the answer. Max 12 words.
      Context: This is a ${level.groupType} pattern game.
      Pattern Items: ${JSON.stringify(level.sequence.map(s => ({ shape: s.shape, color: s.color, emoji: s.emoji, val: s.value, rot: s.rotation })))}
      Give a strategy clue only.`,
      config: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 40,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for maximum speed
      },
    });

    const modelHint = trimHint(response.text || "");
    if (!modelHint) return localHintForLevel(level);
    if (GENERIC_HINTS.has(modelHint.toLowerCase())) return localHintForLevel(level);
    return modelHint;
  } catch (error) {
    console.error("Gemini hint error:", error);
    return localHintForLevel(level);
  }
};
