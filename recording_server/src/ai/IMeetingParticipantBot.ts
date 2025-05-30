import {
    MeetingParams,
    BotConfiguration,
    AudioChunkMetadata,
    AudioResponse,
} from '../types'

/**
 * Interface for AI-powered meeting participant bots that can:
 * - Receive and process audio streams from meetings
 * - Respond with audio that gets injected back into the meeting
 *
 * Note: This service is designed to only receive audio responses from the AI.
 * Video input may be processed but responses are audio-only.
 */
export interface IMeetingParticipantBot {
    /**
     * Initialize the meeting participant bot with configuration from MeetingParams
     * @param config - Meeting parameters containing bot configuration
     */
    initialize(config: MeetingParams): Promise<void>

    /**
     * Start a bot session for meeting interaction
     * @param sessionConfig - Optional session-specific configuration
     */
    startSession(sessionConfig?: BotConfiguration): Promise<void>

    /**
     * Send audio chunk to the bot for processing
     * @param audioData - Audio data chunk (Buffer or Uint8Array)
     * @param metadata - Metadata about the audio chunk (timestamp, sample rate, etc.)
     */
    sendAudioChunk(
        audioData: Buffer | Uint8Array,
        metadata?: AudioChunkMetadata,
    ): Promise<void>

    /**
     * Set up response handler for audio responses from the bot
     * Note: This service only provides audio responses for injection into meetings
     * @param callback - Function to handle audio responses from the bot
     */
    onAudioResponse(callback: (response: AudioResponse) => void): void

    /**
     * End the current bot session and clean up resources
     */
    endSession(): Promise<void>

    /**
     * Check if the bot service is initialized and ready to accept audio
     */
    isReady(): boolean
}
