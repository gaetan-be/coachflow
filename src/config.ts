export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://brenso:brenso@localhost:5432/brenso',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',

  coachName: process.env.COACH_NAME || 'Coach Brenso',
  coachEmail: process.env.COACH_EMAIL || 'coach@brenso.be',
  coachPassword: process.env.COACH_PASSWORD || 'changeme',

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@brenso.be',
  },
};
