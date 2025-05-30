FROM node:18-bullseye

# Build arguments for different modes
ARG BUILD_MODE=production
ARG ENABLE_DEBUG=false

# Install system dependencies required for Playwright, Chrome extensions, Xvfb, FFmpeg and AWS CLI
RUN apt-get update \
    && apt-get install -y \
        wget \
        gnupg \
        libnss3 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libxss1 \
        libasound2 \
        libxshmfence1 \
        xvfb \
        x11vnc \
        fluxbox \
        x11-utils \
        ffmpeg \
        curl \
        unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Optimize FFmpeg performance settings
ENV FFMPEG_THREAD_COUNT=0
ENV FFMPEG_PRESET=ultrafast

# Set CPU optimization flags
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws/

# Create app directory
WORKDIR /app

# Copy dependency descriptors first for caching
COPY recording_server/package.json recording_server/pnpm-lock.yaml ./recording_server/
COPY recording_server/chrome_extension/package.json recording_server/chrome_extension/pnpm-lock.yaml ./recording_server/chrome_extension/

# Install dependencies for the server and the extension
RUN cd recording_server && pnpm install --frozen-lockfile \
    && cd chrome_extension && pnpm install --frozen-lockfile

# Install Playwright browsers using the local version
RUN cd recording_server && pnpm exec playwright install --with-deps chromium

# Copy the rest of the application code
COPY recording_server ./recording_server

# Build the server and the Chrome extension
RUN cd recording_server && pnpm run build \
    && cd chrome_extension && pnpm run build

# Verify extension build
RUN ls -la /app/recording_server/chrome_extension/dist/ \
    && ls -la /app/recording_server/chrome_extension/dist/js/

# Create startup script that handles both production and debug modes
RUN echo '#!/bin/bash\n\
echo "🖥️ Starting virtual display..."\n\
export DISPLAY=:99\n\
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &\n\
XVFB_PID=$!\n\
echo "✅ Virtual display started (PID: $XVFB_PID)"\n\
\n\
# Wait for display to be ready\n\
sleep 2\n\
\n\
echo "🚀 Starting application..."\n\
cd /app/recording_server\n\
\n\
# Check if we should run in debug mode\n\
if [ "$ENABLE_DEBUG" = "true" ]; then\n\
    echo "🐛 Starting in debug mode on port 9229"\n\
    exec "$@"\n\
else\n\
    echo "🚀 Starting in production mode"\n\
    node dist/main.js\n\
fi\n\
\n\
# Cleanup\n\
kill $XVFB_PID 2>/dev/null || true\n\
' > /start.sh && chmod +x /start.sh

WORKDIR /app/recording_server

# Set environment variables based on build mode
ENV SERVERLESS=true
ENV NODE_ENV=${BUILD_MODE}
ENV DISPLAY=:99
ENV ENABLE_DEBUG=${ENABLE_DEBUG}

ENTRYPOINT ["/start.sh"]
CMD ["node", "dist/main.js"]
