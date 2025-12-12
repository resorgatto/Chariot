FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install including dev deps (vite is devDependency). Render sets NODE_ENV=production by default,
# so we override to ensure build tools are available.
ENV NODE_ENV=development
RUN npm install

COPY . .

RUN npm run build

# Serve the built app
ENV NODE_ENV=production
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "$PORT"]
