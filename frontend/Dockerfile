FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Render injects $PORT; preview serves the built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "$PORT"]
