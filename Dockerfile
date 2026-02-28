FROM node:20-alpine AS ui-build
WORKDIR /app/ui
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE=/api
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_API_BASE=${VITE_API_BASE}
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app/ui/server
COPY ui/server/package*.json ./
RUN npm ci --omit=dev
COPY ui/server/ ./
COPY --from=ui-build /app/ui/dist /app/ui/dist
ENV NODE_ENV=production
ENV PORT=5175
EXPOSE 5175
CMD ["node", "server.js"]
