# Website image: builds the React app, then serves it with Caddy (automatic HTTPS),
# which also forwards /api to the backend. Used by doctor-backend/deploy/docker-compose.yml.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CLINIC_NAME=Clinic
ARG VITE_MAX_UPLOAD_MB=20
ARG VITE_API_URL=
ARG VITE_PUBLIC_URL=
ENV VITE_CLINIC_NAME=$VITE_CLINIC_NAME \
    VITE_MAX_UPLOAD_MB=$VITE_MAX_UPLOAD_MB \
    VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL
RUN npm run build

FROM caddy:2.10-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
