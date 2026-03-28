FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:25-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY scripts ./scripts
EXPOSE 4000
CMD ["npm", "run", "docker:start"]
