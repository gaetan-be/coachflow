FROM node:20-alpine

# Python for report generation (docxtpl)
RUN apk add --no-cache python3 py3-pip py3-lxml \
    && pip3 install --break-system-packages docxtpl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY templates/ ./templates/
COPY scripts/ ./scripts/

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
