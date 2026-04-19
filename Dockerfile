FROM node:20-alpine

# bash needed for make-docx.sh, Claude CLI for report generation
RUN apk add --no-cache bash \
    && npm install -g @anthropic-ai/claude-code

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

# Include claude-tpl-maker with its own dependencies
COPY claude-tpl-maker/ ./claude-tpl-maker/
RUN cd claude-tpl-maker && npm install --production

RUN npm run build

# Claude CLI refuses --dangerously-skip-permissions as root
RUN addgroup -S brenso && adduser -S brenso -G brenso \
    && chown -R brenso:brenso /app
USER brenso

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
