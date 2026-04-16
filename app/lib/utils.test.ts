import { describe, it, expect } from 'vitest';
import { cn, formatSize, cleanJson, validateFeedbackScores } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });
});

describe('formatSize', () => {
  it('should format 0 bytes', () => {
    expect(formatSize(0)).toBe('0 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatSize(1024)).toBe('1 KB');
  });

  it('should format megabytes with decimals', () => {
    expect(formatSize(1536 * 1024)).toBe('1.5 MB');
  });
});

describe('cleanJson', () => {
  it('should extract JSON from clean input', () => {
    const input = '{"score": 85}';
    expect(cleanJson(input)).toBe('{"score": 85}');
  });

  it('should extract JSON from markdown code fences', () => {
    const input = '```json\n{"score": 85}\n```';
    expect(cleanJson(input)).toBe('{"score": 85}');
  });

  it('should extract JSON with leading/trailing text', () => {
    const input = 'Here is the analysis:\n{"score": 85}\nHope this helps!';
    expect(cleanJson(input)).toBe('{"score": 85}');
  });

  it('should handle nested JSON objects', () => {
    const input = '{"ATS": {"score": 70, "tips": []}, "overallScore": 82}';
    expect(cleanJson(input)).toBe(input);
  });

  it('should return original text if no JSON found', () => {
    const input = 'No JSON here';
    expect(cleanJson(input)).toBe('No JSON here');
  });

  it('should handle JSON wrapped in extra whitespace', () => {
    const input = '   \n  {"key": "value"}  \n  ';
    expect(cleanJson(input)).toBe('{"key": "value"}');
  });
});

describe('validateFeedbackScores', () => {
  const baseFeedback: Feedback = {
    overallScore: 75,
    ATS: { score: 80, tips: [] },
    toneAndStyle: { score: 70, tips: [] },
    content: { score: 65, tips: [] },
    structure: { score: 85, tips: [] },
    skills: { score: 72, tips: [] },
  };

  it('should pass through valid scores unchanged', () => {
    const result = validateFeedbackScores(baseFeedback);
    expect(result.overallScore).toBe(75);
    expect(result.ATS.score).toBe(80);
    expect(result.toneAndStyle.score).toBe(70);
    expect(result.content.score).toBe(65);
    expect(result.structure.score).toBe(85);
    expect(result.skills.score).toBe(72);
  });

  it('should clamp scores above 100 to 100', () => {
    const feedback = { ...baseFeedback, overallScore: 150, ATS: { score: 200, tips: [] } };
    const result = validateFeedbackScores(feedback);
    expect(result.overallScore).toBe(100);
    expect(result.ATS.score).toBe(100);
  });

  it('should clamp negative scores to 0', () => {
    const feedback = { ...baseFeedback, overallScore: -10, skills: { score: -5, tips: [] } };
    const result = validateFeedbackScores(feedback);
    expect(result.overallScore).toBe(0);
    expect(result.skills.score).toBe(0);
  });

  it('should round decimal scores to integers', () => {
    const feedback = { ...baseFeedback, overallScore: 72.7, content: { score: 68.3, tips: [] } };
    const result = validateFeedbackScores(feedback);
    expect(result.overallScore).toBe(73);
    expect(result.content.score).toBe(68);
  });

  it('should handle boundary values correctly', () => {
    const feedback = { ...baseFeedback, overallScore: 0, ATS: { score: 100, tips: [] } };
    const result = validateFeedbackScores(feedback);
    expect(result.overallScore).toBe(0);
    expect(result.ATS.score).toBe(100);
  });

  it('should preserve tips array', () => {
    const tips = [{ type: 'improve' as const, tip: 'Add keywords', explanation: 'Missing React' }];
    const feedback = { ...baseFeedback, ATS: { score: 60, tips } };
    const result = validateFeedbackScores(feedback);
    expect(result.ATS.tips).toEqual(tips);
  });
});
