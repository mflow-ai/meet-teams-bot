export interface IAiService {
    /**
     * Initialize the AI service with API key and configuration
     * @param apiKey - API key for the service
     * @param config - Additional configuration options
     */
    initialize(apiKey: string, config?: any): Promise<void>

    /**
     * Start an AI session for meeting interaction
     * @param sessionConfig - Configuration for the session
     */
    startSession(sessionConfig?: any): Promise<void>

    /**
     * Send audio chunk to the AI service
     * @param audioData - Audio data chunk (Buffer or Uint8Array)
     * @param metadata - Optional metadata about the audio chunk
     */
    sendAudioChunk(audioData: Buffer | Uint8Array, metadata?: any): Promise<void>

    /**
     * Send video chunk to the AI service
     * @param videoData - Video data chunk (Buffer or Uint8Array)
     * @param metadata - Optional metadata about the video chunk
     */
    sendVideoChunk(videoData: Buffer | Uint8Array, metadata?: any): Promise<void>

    /**
     * Set up response handler for AI responses
     * @param callback - Function to handle responses from the AI
     */
    onResponse(callback: (response: any) => void): void

    /**
     * End the current AI session
     */
    endSession(): Promise<void>

    /**
     * Check if the service is initialized and ready
     */
    isReady(): boolean
}