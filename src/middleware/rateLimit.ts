import rateLimit from 'express-rate-limit';

export const QUESTIONNAIRE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const QUESTIONNAIRE_MAX_REQUESTS = 5;

export const questionnaireRateLimit = rateLimit({
  windowMs: QUESTIONNAIRE_WINDOW_MS,
  max: QUESTIONNAIRE_MAX_REQUESTS,
  message: { error: 'Trop de soumissions. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
