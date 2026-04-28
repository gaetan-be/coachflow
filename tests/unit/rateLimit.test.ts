import { describe, it, expect } from 'vitest';
import { QUESTIONNAIRE_WINDOW_MS, QUESTIONNAIRE_MAX_REQUESTS } from '../../src/middleware/rateLimit';

describe('questionnaireRateLimit config', () => {
  it('allows 5 requests per hour', () => {
    expect(QUESTIONNAIRE_MAX_REQUESTS).toBe(5);
  });

  it('uses a 1-hour window', () => {
    expect(QUESTIONNAIRE_WINDOW_MS).toBe(60 * 60 * 1000);
  });
});
