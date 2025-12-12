### Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
ENV NODE_ENV=development
RUN npm install

COPY . .
RUN npm run build

### Runtime stage: serve static build
FROM node:20-alpine AS runtime
WORKDIR /app

# Lightweight static server; avoids Vite preview port detection issues on Render
RUN npm install -g serve

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4173
CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
