import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Determine the appropriate unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with 2 decimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

/**
 * Extracts a JSON object from a string that may contain extra text around it.
 * Handles AI responses that include markdown code fences or other wrapper text.
 */
export function cleanJson(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1) return text.substring(first, last + 1);
  return text;
}

/** Clamps a value to a valid score (integer between 0 and 100). */
function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Validates and sanitizes AI feedback scores to ensure they are integers between 0–100.
 * Prevents display of out-of-range or non-numeric scores from the AI model.
 */
export function validateFeedbackScores(feedback: Feedback): Feedback {
  return {
    ...feedback,
    overallScore: clampScore(feedback.overallScore),
    ATS: { ...feedback.ATS, score: clampScore(feedback.ATS.score) },
    toneAndStyle: { ...feedback.toneAndStyle, score: clampScore(feedback.toneAndStyle.score) },
    content: { ...feedback.content, score: clampScore(feedback.content.score) },
    structure: { ...feedback.structure, score: clampScore(feedback.structure.score) },
    skills: { ...feedback.skills, score: clampScore(feedback.skills.score) },
  };
}
