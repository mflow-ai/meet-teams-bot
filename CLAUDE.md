# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Meet Teams Bot

## Project Overview

Meet Teams Bot is a TypeScript/Node.js application for automated meeting recording on Google Meet, Microsoft Teams, and Zoom. It's a self-hostable, privacy-first alternative that can run in both normal mode (with Redis/RabbitMQ) and serverless mode (reading from stdin).

**🚧 FUTURE ENHANCEMENT - GEMINI AI INTEGRATION (NOT YET IMPLEMENTED):**
The project is planned to be enhanced with Google's Gemini AI for live meeting understanding, allowing the bot to:
- Stream meeting audio and video to Gemini in real-time
- Allow Gemini to respond verbally in meetings using native audio output
- Implement chunked recording directly to Google Cloud Storage (GCS)
- Provide AI-powered meeting assistance and interaction

## Architecture

The system consists of two main components:

### 1. Recording Server (`recording_server/`)
- **Main Application**: Node.js/TypeScript server that orchestrates bot lifecycle
- **Browser Automation**: Uses Playwright for Chrome automation
- **State Machine**: Manages bot states (Initialization → Joining → InCall → Cleanup → Error)
- **Media Processing**: Handles audio/video recording and transcoding with FFmpeg
- **Multi-Platform Support**: Dedicated implementations for Meet, Teams, and Zoom

**🚧 PLANNED GEMINI ENHANCEMENTS (NOT YET IMPLEMENTED):**
- **Real-time Media Handling**: Will receive audio/video from extension and stream to Gemini API
- **AI Service Interaction**: New `IAiService` interface with `GeminiService` implementation
- **Audio Injection**: `OutputAudioService` to play Gemini's native audio output back into meetings
- **Cloud Storage**: `IStorageService` interface with `GCSService` for chunked recording upload

### 2. Chrome Extension (`recording_server/chrome_extension/`)
- **Media Capture**: Records tab audio/video and sends chunks to server
- **Speaker Detection**: Observes DOM changes to identify active speakers
- **Platform Integration**: Specific logic for Meet and Teams DOM manipulation

**🚧 PLANNED GEMINI ENHANCEMENTS (NOT YET IMPLEMENTED):**
- Extension will continue capturing media but output will be directed to GCS and Gemini
- Server will relay audio streams to Gemini for real-time processing
- Video chunks may be processed for frame extraction if needed for Gemini

## Key Technologies

- **TypeScript 5.4+** with Node.js 14.16-18
- **Playwright** for browser automation
- **Express.js** for API endpoints
- **Winston** for structured logging
- **WebSockets** (`ws`) for real-time communication
- **FFmpeg** for media processing
- **Redis** + **RabbitMQ** (normal mode) or **stdin** (serverless mode)

**🚧 PLANNED GEMINI DEPENDENCIES (NOT YET IMPLEMENTED):**
- **`@google/generative-ai`**: For Gemini API interaction
- **`@google-cloud/storage`**: For GCS interaction

## Development Commands

```bash
# Build and development
npm run build                # Compile TypeScript
npm run watch-dev           # Development with hot reload
npm run start               # Run compiled application
npm run start-serverless    # Serverless mode (reads JSON from stdin)

# Chrome extension
npm run generate_extension_key  # Generate extension key (required once)

# Testing and quality
npm run test                # Run Jest tests
npm run test:watch          # Watch mode testing
npm run test:coverage       # Generate coverage report
npm run format              # Format with Prettier

# Docker usage
./run_bot.sh build          # Build Docker image
./run_bot.sh run params.json    # Run with config file
./run_bot.sh run-json '{...}'   # Run with inline JSON
```

## Core File Structure

```
recording_server/src/
├── main.ts                 # Entry point, handles both normal and serverless modes
├── meeting.ts              # MeetingHandle class - main meeting orchestrator
├── server.ts               # Express server setup
├── types.ts                # TypeScript definitions for MeetingParams and core types
├── meeting/
│   ├── meet.ts            # Google Meet platform implementation
│   ├── teams.ts           # Microsoft Teams platform implementation
│   └── {meet,teams}/closeMeeting.ts  # Platform-specific cleanup
├── state-machine/
│   ├── machine.ts         # State machine implementation
│   ├── types.ts           # State machine types and enums
│   └── states/            # Individual state implementations
├── recording/
│   ├── Transcoder.ts      # FFmpeg-based video processing
│   ├── AudioExtractor.ts  # Audio stream handling
│   └── VideoChunkProcessor.ts  # Chunk processing
├── browser/
│   ├── browser.ts         # Playwright browser setup
│   └── page-logger.ts     # Browser page logging
├── utils/
│   ├── Logger.ts          # Winston logging setup
│   ├── S3Uploader.ts      # S3 upload functionality
│   └── PathManager.ts     # File path management
└── api/
    ├── methods.ts         # API client methods
    └── types.ts           # API type definitions

🚧 PLANNED GEMINI FILE STRUCTURE (NOT YET IMPLEMENTED):
├── ai/
│   ├── IAiService.ts      # Abstraction for AI services
│   └── GeminiService.ts   # Gemini API implementation
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

**🚧 PLANNED GEMINI WORKFLOW (NOT YET IMPLEMENTED):**
1. **Live Streaming to Gemini**: Audio/video streams sent to Gemini API during InCall state
2. **Gemini Interaction**: Receive native audio responses and inject into meeting
3. **Chunked Recording to GCS**: Direct upload of recording chunks to Google Cloud Storage
4. **Post-Meeting Assembly**: Optional cloud function to assemble GCS chunks into final recording

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

**🚧 PLANNED GEMINI CONFIGURATION (NOT YET IMPLEMENTED):**
```json
{
  "geminiApiKey": "string",
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

## Testing

- Jest-based test suite with coverage reporting
- State machine unit tests in `state-machine/` directory
- Integration tests for meeting platform implementations

**🚧 PLANNED GEMINI TESTING (NOT YET IMPLEMENTED):**
- Unit tests for new services (`GeminiService`, `GCSService`, `OutputAudioService`) with mocking
- Integration tests for audio/video paths to Gemini
- End-to-end tests for Gemini response → meeting audio output

## Deployment

- **Docker**: Primary deployment method with `./run_bot.sh`
- **Serverless**: Designed for AWS Lambda, Google Cloud Run, Azure Functions
- **Environment Variables**: `SERVERLESS`, `PROFILE`, `ENVIRON`, Redis/RabbitMQ URLs

**🚧 PLANNED GEMINI DEPLOYMENT (NOT YET IMPLEMENTED):**
- **Virtual Microphone Setup**: Required for audio injection (PulseAudio on Linux, VB-Cable on Windows/macOS)
- **GCS Credentials**: Service account setup for Google Cloud Storage
- **Gemini API Access**: API key configuration and rate limiting considerations

## Chrome Extension Development

Located in `chrome_extension/`:
- Uses Webpack for building (`webpack.{common,dev,prod}.js`)
- TypeScript source in `src/` with platform-specific modules
- Manifest v3 configuration in `public/manifest.json`

## Logging & Debugging

- Winston-based structured logging with bot-specific log files
- Debug mode: `export DEBUG=true LOG_LEVEL=debug`
- Automatic S3 log upload after meeting completion
- Console and file output with rotation

## Common Patterns

- **Platform Detection**: URL-based detection in `main.ts:detectMeetingProvider()`
- **Error Handling**: JoinError class with specific error codes
- **State Management**: Event-driven state machine with context preservation
- **Media Processing**: Chunk-based processing with FFmpeg transcoding
- **Extension Communication**: HTTP POST + WebSocket communication between extension and server

**🚧 PLANNED GEMINI PATTERNS (NOT YET IMPLEMENTED):**
- **Service Abstraction**: Interfaces (`IAiService`, `IStorageService`) for modularity
- **Configuration-Driven Instantiation**: Services instantiated based on config (e.g., `aiProvider: 'gemini'`)
- **Real-time Streaming**: Audio/video pipeline from extension → server → Gemini
- **Audio Injection Pipeline**: Gemini native audio response → Virtual microphone → Meeting

## Important Implementation Notes

- The bot requires Chrome extension to be loaded and configured
- Meeting URLs must be exactly formatted for platform detection
- State machine context preserves error information across transitions
- Serverless mode skips Redis/RabbitMQ and webhook integrations
- Force termination timer (5 hours) prevents runaway processes

**🚧 GEMINI IMPLEMENTATION NOTES (PLANNED, NOT YET IMPLEMENTED):**
- Virtual microphone setup is critical for audio injection
- Service interfaces allow swapping Gemini for other AI providers (OpenAI, Anthropic)
- `Transcoder.ts` role will evolve from creating final files to handling chunks for GCS upload
- Existing `streaming.ts` service will be enhanced to forward audio to `IAiService`
- Modular architecture enables future swapping of GCS for S3 or other storage backends
- Gemini will provide native audio output, eliminating need for separate TTS services