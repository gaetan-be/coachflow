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

# Copy React client and install its dependencies before build
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --production=false
COPY client/ ./client/

# Include claude-tpl-maker with its own dependencies
COPY claude-tpl-maker/ ./claude-tpl-maker/
RUN cd claude-tpl-maker && npm install --production

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown

RUN npm run build \
    && printf 'commit=%s\nbuilt_at=%s\n' "$GIT_COMMIT" "$BUILD_TIME" \
        > public/dist/version.txt

# Claude CLI refuses --dangerously-skip-permissions as root
RUN addgroup -S brenso && adduser -S brenso -G brenso \
    && chown -R brenso:brenso /app
USER brenso

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
