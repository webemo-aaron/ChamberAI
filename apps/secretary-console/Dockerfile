FROM node:20-alpine

WORKDIR /app

# Copy the built console app (already in this directory)
COPY . .

# Copy serve script from project root
COPY ../../scripts/serve_console.js ./serve_console.js

ENV CONSOLE_HOST=0.0.0.0 \
    CONSOLE_PORT=5173 \
    CONSOLE_STRICT_PORT=true

EXPOSE 5173

CMD ["node", "serve_console.js"]
