# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Meet Teams Bot

## Project Overview

Meet Teams Bot is a TypeScript/Node.js application for automated meeting recording on Google Meet, Microsoft Teams, and Zoom. It's a self-hostable, privacy-first alternative that can run in both normal mode (with Redis/RabbitMQ) and serverless mode (reading from stdin).

**✅ GEMINI AI INTEGRATION - FOUNDATION IMPLEMENTED:**
The project includes foundation for Google's Gemini AI integration for live meeting understanding:
- `IMeetingParticipantBot` interface for AI-powered meeting bots
- `GeminiLiveBot` implementation using `@google/genai` SDK
- Audio/video streaming capability to Gemini Live API
- Audio-only response handling for meeting injection
- Environment-based configuration with `GEMINI_API_KEY`

## Architecture

The system consists of two main components:

### 1. Recording Server (`recording_server/`)
- **Main Application**: Node.js/TypeScript server that orchestrates bot lifecycle
- **Browser Automation**: Uses Playwright for Chrome automation
- **State Machine**: Manages bot states (Initialization → Joining → InCall → Cleanup → Error)
- **Media Processing**: Handles audio/video recording and transcoding with FFmpeg
- **Multi-Platform Support**: Dedicated implementations for Meet, Teams, and Zoom

**✅ IMPLEMENTED GEMINI FOUNDATION:**
- **Real-time Media Handling**: `IMeetingParticipantBot` interface for audio/video streaming
- **AI Service Integration**: `GeminiLiveBot` using `@google/genai` Live and Session classes
- **Audio Response Handling**: `onAudioResponse()` callback for receiving Gemini audio
- **Modular Architecture**: Interface-based design supporting multiple AI providers

**🚧 FUTURE ENHANCEMENTS:**
- **Audio Injection**: Virtual microphone setup for playing Gemini responses in meetings
- **Cloud Storage**: Direct GCS upload for chunked recordings

### 2. Chrome Extension (`recording_server/chrome_extension/`)
- **Media Capture**: Records tab audio/video and sends chunks to server
- **Speaker Detection**: Observes DOM changes to identify active speakers
- **Platform Integration**: Specific logic for Meet and Teams DOM manipulation
- **Manifest V3**: Modern Chrome extension format with service worker background

**✅ GEMINI INTEGRATION READY:**
- Extension captures media and sends to server via existing WebSocket
- Server can relay audio/video streams to `GeminiLiveBot` for real-time processing
- `IMeetingParticipantBot` interface supports both audio and video chunk processing

**✅ V3 COMPATIBILITY:**
- Service worker background (replaces persistent background pages)
- `chrome.scripting.executeScript` API for content injection
- Modern permissions model with host_permissions separation

## Key Technologies

- **TypeScript 5.4+** with Node.js 22.0+
- **Playwright** for browser automation
- **Express.js** for API endpoints
- **Winston** for structured logging
- **WebSockets** (`ws`) for real-time communication
- **FFmpeg** for media processing
- **Redis** + **RabbitMQ** (normal mode) or **stdin** (serverless mode)
- **tsup** for fast TypeScript compilation
- **Docker Compose** for debugging support

**✅ GEMINI DEPENDENCIES:**
- **`@google/genai`**: For Gemini Live API interaction with Session/Live classes

**🚧 PLANNED DEPENDENCIES:**
- **`@google-cloud/storage`**: For future GCS integration

## Development Commands

```bash
# Package management
pnpm install                # Install dependencies

# Build and development
pnpm run build              # Compile TypeScript with tsup
pnpm run watch              # Watch mode with tsup
pnpm run watch-dev          # Development with hot reload
pnpm run start              # Run compiled application
pnpm run start-serverless   # Serverless mode (reads JSON from stdin)
pnpm run start:debug        # Run with debugger on port 9229
pnpm run start-serverless:debug  # Serverless debug mode

# Chrome extension
pnpm run generate_extension_key  # Generate extension key (required once)
pnpm run debug-extension         # Launch Chrome with extension for testing

# Testing and quality
pnpm run test               # Run Jest tests
pnpm run test:watch         # Watch mode testing
pnpm run test:coverage      # Generate coverage report
pnpm run format             # Format with Prettier
pnpm run format:check       # Check formatting without fixing

# Docker usage
./run_bot.sh build          # Build Docker image
./run_bot.sh run params.json    # Run with config file
./run_bot.sh run-json '{...}'   # Run with inline JSON

# Container debugging
docker-compose up app       # Start with debugging (port 9229)
docker-compose up app-no-debug  # Start without debugging
```

## Core File Structure

```
recording_server/
├── src/
│   ├── main.ts             # Entry point, handles both normal and serverless modes
│   ├── meeting.ts          # MeetingHandle class - main meeting orchestrator
│   ├── server.ts           # Express server setup
│   ├── types.ts            # TypeScript definitions for MeetingParams and core types
│   ├── meeting/
│   │   ├── meet.ts        # Google Meet platform implementation
│   │   ├── teams.ts       # Microsoft Teams platform implementation
│   │   └── {meet,teams}/closeMeeting.ts  # Platform-specific cleanup
│   ├── state-machine/
│   │   ├── machine.ts     # State machine implementation
│   │   ├── types.ts       # State machine types and enums
│   │   └── states/        # Individual state implementations
│   ├── recording/
│   │   ├── Transcoder.ts  # FFmpeg-based video processing
│   │   ├── AudioExtractor.ts  # Audio stream handling
│   │   └── VideoChunkProcessor.ts  # Chunk processing
│   ├── browser/
│   │   ├── browser.ts     # Playwright browser setup
│   │   └── page-logger.ts # Browser page logging
│   ├── utils/
│   │   ├── Logger.ts      # Winston logging setup
│   │   ├── S3Uploader.ts  # S3 upload functionality
│   │   └── PathManager.ts # File path management
│   └── api/
│       ├── methods.ts     # API client methods
│       └── types.ts       # API type definitions
├── dist/                   # Compiled output (tsup)
├── tsup.config.ts         # Build configuration
├── tsconfig.json          # TypeScript configuration
└── docker-compose.yml     # Debugging setup

✅ IMPLEMENTED AI INTEGRATION:
├── ai/
│   ├── IMeetingParticipantBot.ts  # Interface for AI-powered meeting bots
│   ├── GeminiLiveBot.ts           # Gemini Live API implementation
│   └── GeminiLiveBot.test.ts      # Comprehensive unit tests

🚧 FUTURE ENHANCEMENTS:
├── audio/
│   └── OutputAudioService.ts # Audio playback into meetings
└── storage/
    ├── IStorageService.ts # Abstraction for storage services
    └── GCSService.ts      # Google Cloud Storage implementation
```

## Meeting Flow & State Machine

The bot follows this lifecycle:
1. **Initialization**: Setup browser, extension, and environment
2. **Joining**: Navigate to meeting URL and handle authentication/waiting rooms
3. **InCall**: Active recording with speaker detection and media capture
4. **Paused/Resuming**: Handle temporary interruptions
5. **Cleanup**: Process recordings, upload to S3, send webhooks
6. **Error**: Handle failures and recovery

**✅ GEMINI WORKFLOW - FOUNDATION READY:**
1. **Bot Initialization**: `GeminiLiveBot` initialized during state machine setup
2. **Live Session**: Gemini Live session started with audio-only response modality
3. **Real-time Streaming**: Audio/video chunks sent via `sendAudioChunk()`/`sendVideoChunk()`
4. **Response Handling**: Audio responses received via `onAudioResponse()` callback

**🚧 FUTURE WORKFLOW:**
1. **Audio Injection**: Virtual microphone setup for playing responses in meetings
2. **GCS Integration**: Direct recording upload for cloud assembly

## Configuration

The bot is configured via `params.json` or JSON passed to stdin (serverless mode):

```json
{
  "meeting_url": "https://meet.google.com/xxx-xxx-xxx",
  "bot_name": "Recording Bot",
  "user_token": "jwt-token",
  "bots_api_key": "api-key",
  "recording_mode": "SpeakerView",
  "speech_to_text_provider": "Default",
  "bots_webhook_url": "https://webhook-url.com/endpoint",
  "automatic_leave": {
    "waiting_room_timeout": 60,
    "noone_joined_timeout": 60
  }
}
```

**✅ GEMINI CONFIGURATION:**
Environment variable:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Optional bot configuration in `MeetingParams`:
```json
{
  "botConfig": {
    "enabled": true,
    "provider": "gemini",
    "modelName": "gemini-2.0-flash-exp"
  }
}
```

**🚧 PLANNED CONFIGURATION:**
```json
{
  "gcsBucketName": "string", 
  "gcsCredentialsJsonPath": "string",
  "googleCloudProjectId": "string"
}
```

## Platform Support

- **Google Meet**: `https://meet.google.com/xxx-xxx-xxx`
- **Microsoft Teams**: `https://teams.microsoft.com/l/meetup-join/...`
- **Zoom**: Native Linux SDK integration (separate binary)

## Mode Detection

The application automatically detects its mode:
- **Normal Mode**: Uses Redis + RabbitMQ for job queuing
- **Serverless Mode**: Set `SERVERLESS=true`, reads JSON from stdin
- **Zoom Mode**: Detected by meeting URL, uses separate Rust binary

## Testing & CI/CD

### Testing Framework
- **Jest Framework**: Comprehensive test suite with coverage reporting
- **Unit Tests**: State machine, AI services, and core components
- **Integration Tests**: Meeting platform implementations

### GitHub Actions CI/CD
- **Automated Testing**: Runs on all PRs and main branch pushes
- **Multi-Component Testing**: Recording server and Chrome extension tests
- **Build Validation**: TypeScript compilation and Docker image builds
- **Code Quality**: Formatting checks with Prettier
- **Coverage Reporting**: Codecov integration for test coverage

**✅ IMPLEMENTED GEMINI TESTING:**
- Unit tests for `GeminiLiveBot` with SDK mocking
- Initialization, session management, and streaming tests
- Error handling and cleanup validation

**🚧 FUTURE TESTING:**
- Integration tests for audio injection pipeline
- End-to-end tests for Gemini response → meeting audio output

## Deployment

- **Docker**: Primary deployment method with `./run_bot.sh`
- **Serverless**: Designed for AWS Lambda, Google Cloud Run, Azure Functions
- **Environment Variables**: `SERVERLESS`, `PROFILE`, `ENVIRON`, `GEMINI_API_KEY`, Redis/RabbitMQ URLs
- **CI/CD**: GitHub Actions for automated testing, building, and validation

**✅ GEMINI DEPLOYMENT:**
- **API Key**: Set `GEMINI_API_KEY` environment variable
- **Docker Support**: Gemini integration works in containerized environments
- **Rate Limiting**: Built-in error handling for API failures

**🚧 FUTURE DEPLOYMENT:**
- **Virtual Microphone Setup**: Required for audio injection (PulseAudio on Linux, VB-Cable on Windows/macOS)
- **GCS Credentials**: Service account setup for Google Cloud Storage

## Chrome Extension Development

Located in `chrome_extension/`:
- Uses Webpack for building (`webpack.{common,dev,prod}.js`)
- TypeScript source in `src/` with platform-specific modules
- **Manifest V3** configuration in `public/manifest.json`

**✅ V3 FEATURES:**
- **Service Worker Background**: Replaces persistent background pages for better performance
- **chrome.scripting API**: Modern content script injection with `executeScript()`
- **Separated Permissions**: `permissions` for APIs, `host_permissions` for web access
- **Message-Based Architecture**: All extension functions accessible via `chrome.runtime.sendMessage`

**🧪 TESTING:**
- Use `pnpm run debug-extension` to launch Chrome with extension loaded
- Verify extension in DevTools console: `testExtension()`
- Check `chrome://extensions/` for extension status and errors

## Logging & Debugging

- Winston-based structured logging with bot-specific log files
- Debug mode: `export DEBUG=true LOG_LEVEL=debug`
- Automatic S3 log upload after meeting completion
- Console and file output with rotation

## Build System & Debugging

**✅ TSUP BUILD SYSTEM:**
- **Fast Compilation**: tsup provides faster builds than tsc
- **Source Maps**: Enabled for debugging support
- **Output Directory**: `dist/` (migrated from `build/`)
- **Watch Mode**: `pnpm run watch` for development
- **Node.js Target**: Optimized for Node.js 18

**✅ CONTAINER DEBUGGING:**
- **VS Code Integration**: `.vscode/launch.json` with container attach
- **Docker Compose**: Separate services for debug/non-debug modes
- **Inspector Port**: 9229 exposed for external debuggers
- **Source Mapping**: Container paths mapped to local workspace

**✅ DEVELOPMENT WORKFLOW:**
- **Hot Reload**: `pnpm run watch-dev` with ts-node
- **Container Debug**: F5 in VS Code auto-starts container with debugging
- **Path Mapping**: `/app/recording_server/src` ↔ `./recording_server/src`

## Common Patterns

- **Platform Detection**: URL-based detection in `main.ts:detectMeetingProvider()`
- **Error Handling**: JoinError class with specific error codes
- **State Management**: Event-driven state machine with context preservation
- **Media Processing**: Chunk-based processing with FFmpeg transcoding
- **Extension Communication**: HTTP POST + WebSocket communication between extension and server

**✅ IMPLEMENTED GEMINI PATTERNS:**
- **Service Abstraction**: `IMeetingParticipantBot` interface for AI service modularity
- **Configuration-Driven Setup**: Bot instantiation based on environment and config
- **Real-time Streaming**: Audio/video pipeline ready for extension → server → Gemini
- **Error Resilience**: Graceful handling of streaming failures without stopping recording

**🚧 FUTURE PATTERNS:**
- **Audio Injection Pipeline**: Gemini native audio response → Virtual microphone → Meeting
- **Storage Abstraction**: `IStorageService` for swappable storage backends

## Important Implementation Notes

- The bot requires Chrome extension to be loaded and configured
- Meeting URLs must be exactly formatted for platform detection
- State machine context preserves error information across transitions
- Serverless mode skips Redis/RabbitMQ and webhook integrations
- Force termination timer (5 hours) prevents runaway processes

**✅ GEMINI IMPLEMENTATION NOTES:**
- `IMeetingParticipantBot` interface enables swapping Gemini for other AI providers
- `GeminiLiveBot` uses `@google/genai` SDK with Live/Session classes for real-time interaction
- Environment variable configuration (`GEMINI_API_KEY`) for secure API access
- Audio-only response modality configured for meeting injection readiness
- Comprehensive error handling ensures recording continues if AI service fails

**🚧 FUTURE IMPLEMENTATION:**
- Virtual microphone setup for audio injection
- `Transcoder.ts` enhancement for GCS chunk upload
- `streaming.ts` integration with AI service pipeline

**✅ BUILD & DEBUG NOTES:**
- tsup outputs to `dist/` directory (not `build/`)
- VS Code debugger requires Docker Compose to be running
- Source maps enable TypeScript debugging in container
- Inspector port 9229 must be available for debugging
- Container debugging works with both local and remote development

**✅ EXTENSION DEBUG NOTES:**
- Extension uses Manifest V3 with service worker (no background page)
- Use `pnpm run debug-extension` to test extension functionality
- Service workers start on-demand and may restart automatically
- Check `chrome://extensions/` for extension errors and status