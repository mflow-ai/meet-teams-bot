# Meet Teams Bot - Recording Server

The core TypeScript application that handles automated meeting recording across Google Meet, Microsoft Teams, and Zoom platforms.

## Architecture

This application is built with:

- **TypeScript 5.4+** - Type-safe development
- **Playwright** - Browser automation and testing
- **Express.js** - Web server for API endpoints
- **Winston** - Structured logging
- **State Machine** - Manages bot lifecycle during meetings
- **Chrome Extension** - Enhanced browser integration
- **FFmpeg** - Media processing and transcoding

## Project Structure

```
src/
├── api/               # API endpoints and methods
├── browser/           # Browser automation and extension management
├── meeting/           # Meeting platform specific implementations
│   ├── meet.ts       # Google Meet integration
│   ├── teams.ts      # Microsoft Teams integration
│   └── zoom.ts       # Zoom integration
├── recording/         # Media recording and processing
├── state-machine/     # Bot state management
├── utils/             # Utility functions and helpers
├── main.ts           # Application entry point
└── types.ts          # TypeScript type definitions
```

## Key Features

### Multi-Platform Support
- **Google Meet**: Full browser automation with speaker detection
- **Microsoft Teams**: Complete meeting integration
- **Zoom**: Native SDK integration for Linux

### Recording Capabilities
- **Speaker View**: Records active speaker with automatic switching
- **Audio Transcription**: Real-time speech-to-text conversion
- **Custom Branding**: Overlay custom logos and bot names
- **Multiple Formats**: MP4 output with configurable quality

### State Management
The bot uses a sophisticated state machine with these states:
- `Initialization` - Setting up browser and environment
- `Joining` - Connecting to the meeting
- `InCall` - Active recording and monitoring
- `Paused` - Temporary recording suspension
- `Resuming` - Returning from pause
- `Cleanup` - Post-meeting cleanup and upload
- `Error` - Error handling and recovery

## Development Setup

### Prerequisites

- Node.js 18.12 or higher (recommended: 18.x)
- Chrome/Chromium browser
- FFmpeg installed on system
- Docker and Docker Compose (for debugging)
- Redis (for queue management, optional in serverless mode)
- RabbitMQ (for message queuing, optional in serverless mode)

### Installation

```bash
# Install dependencies
pnpm install

# Generate browser extension key
pnpm run generate_extension_key

# Build the application
pnpm run build
```

### Configuration

Create environment variables or modify the configuration:

```bash
# Development mode
export PROFILE=DEV
export ENVIRON=local

# Production settings
export SERVERLESS=true  # For containerized deployment
```

### Running

```bash
# Development with hot reload
pnpm run watch-dev

# Build and start
pnpm run build
pnpm start

# Serverless mode (reads from stdin)
pnpm run start-serverless

# Debug mode (with inspector)
pnpm run start:debug
pnpm run start-serverless:debug
```

### 🐛 **Container Debugging**

The project uses a single Dockerfile with build arguments for different modes:

```bash
# Start debug container (with VS Code integration)
docker-compose up app

# Start without debugging
docker-compose up app-no-debug

# Production mode
docker-compose up app-prod
```

**Build Modes:**
- **Development + Debug**: `BUILD_MODE=development ENABLE_DEBUG=true`
- **Development**: `BUILD_MODE=development ENABLE_DEBUG=false`
- **Production**: `BUILD_MODE=production ENABLE_DEBUG=false`

**VS Code Integration:**
1. Open project root in VS Code
2. Set breakpoints in TypeScript source files
3. Use "Debug Meet Teams Bot (Docker Compose)" configuration
4. Select your configuration file (params.json or params2.json) when prompted
5. Container automatically starts with `--inspect=0.0.0.0:9229` and loads your config
6. Source maps provide direct TypeScript debugging

**Manual Docker Build:**
```bash
# Development with debugging
docker build --build-arg BUILD_MODE=development --build-arg ENABLE_DEBUG=true -t meet-teams-bot:debug .

# Production
docker build --build-arg BUILD_MODE=production --build-arg ENABLE_DEBUG=false -t meet-teams-bot:prod .
```

## Available Scripts

- `start` - Run the built application
- `start-serverless` - Run in serverless mode (reads JSON from stdin)
- `start:debug` - Run with debugger enabled on port 9229
- `start-serverless:debug` - Serverless mode with debugging
- `build` - Compile TypeScript with tsup (outputs to `dist/`)
- `watch` - Watch mode with tsup for development
- `watch-dev` - Development mode with ts-node hot reload
- `format` - Format code with Prettier
- `test` - Run Jest tests
- `test:watch` - Run tests in watch mode
- `test:coverage` - Generate test coverage report
- `generate_extension_key` - Generate Chrome extension key
- `clean` - Remove build artifacts and temporary files

## API Endpoints

The server exposes several endpoints for monitoring and control:

- `GET /health` - Health check endpoint
- `POST /webhook` - Webhook receiver for external notifications
- `GET /status` - Current bot status and metrics
- `POST /control` - Bot control commands (pause, resume, stop)

## Chrome Extension

The recording server includes a Chrome extension for enhanced meeting integration:

```
chrome_extension/
├── manifest.json     # Extension manifest
├── src/
│   ├── background.ts # Background script
│   ├── content.ts    # Content script for page interaction
│   └── observeSpeakers/ # Speaker detection logic
```

## Media Processing

The application handles various media operations:

- **Screen Recording**: Captures meeting video using Playwright
- **Audio Processing**: Records and processes audio streams
- **Transcoding**: Converts recordings to MP4 format
- **Branding**: Overlays custom branding elements
- **Upload**: Automatic S3 upload of processed files

## State Machine Details

The bot's behavior is controlled by a state machine that ensures reliable operation:

```typescript
// State transitions
Initialization → Joining → InCall → Cleanup
                    ↓         ↓
                 Error ←→ Paused ↔ Resuming
```

Each state handles specific responsibilities and error conditions, ensuring the bot can recover from various failure scenarios.

## Build System

The project uses **tsup** for fast TypeScript compilation:

- **Output Directory**: `dist/` (instead of `build/`)
- **Source Maps**: Enabled for debugging
- **Target**: Node.js 18
- **Format**: CommonJS for compatibility
- **Watch Mode**: Fast incremental builds

Configuration in `tsup.config.ts`:
```typescript
export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  outDir: 'dist',
  sourcemap: true,
  target: 'node18'
})
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
```

## Logging

The application uses Winston for structured logging:

- Logs are written to both console and files
- Different log levels for development and production
- Automatic log rotation and S3 upload
- Bot-specific log files for troubleshooting

## Deployment

### Docker

The application is designed to run in Docker containers:

```bash
# Build image
docker build -t meet-teams-bot .

# Run with parameters
echo '{"meeting_url": "...", ...}' | docker run -i meet-teams-bot
```

### Environment Variables

Key environment variables:

- `SERVERLESS` - Enable serverless mode
- `PROFILE` - Development/production profile
- `ENVIRON` - Environment identifier
- `REDIS_URL` - Redis connection string
- `RABBITMQ_URL` - RabbitMQ connection string

## Troubleshooting

### Common Issues

1. **Chrome Extension Not Loading**
   - Ensure extension is built and key is generated
   - Check extension permissions in browser

2. **Meeting Join Failures**
   - Verify meeting URL format
   - Check authentication tokens
   - Review browser automation selectors

3. **Recording Issues**
   - Confirm FFmpeg installation
   - Check audio/video device permissions
   - Review media codec settings

### Debug Mode

Enable debug logging:

```bash
export DEBUG=true
export LOG_LEVEL=debug
pnpm run watch-dev
```

### Container Debugging

For debugging in Docker containers:

```bash
# Use VS Code debugger (recommended)
# 1. Set breakpoints in TypeScript files
# 2. Press F5 or use "Debug Meet Teams Bot" configuration
# 3. Container starts automatically with debugging enabled

# Manual debugging connection
# 1. Start container: docker-compose up app
# 2. Connect debugger to localhost:9229
# 3. Source maps automatically map to ./recording_server/src
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update type definitions in `types.ts`
4. Use Prettier for code formatting
5. Write meaningful commit messages

## License

Licensed under the Elastic License 2.0 (ELv2) - see the [LICENSE](../LICENSE.md) file for details.
