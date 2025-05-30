import { Live, Session } from '@google/genai'
import { IMeetingParticipantBot } from './IMeetingParticipantBot'
import {
    MeetingParams,
    BotConfiguration,
    AudioChunkMetadata,
    AudioResponse,
} from '../types'

export class GeminiLiveBot implements IMeetingParticipantBot {
    private liveApi: Live | null = null
    private session: Session | null = null
    private initialized = false
    private audioResponseCallback: ((response: AudioResponse) => void) | null =
        null

    async initialize(config: MeetingParams): Promise<void> {
        try {
            // Get API key from environment variable
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) {
                throw new Error(
                    'GEMINI_API_KEY environment variable is required',
                )
            }

            this.liveApi = new Live(apiKey)
            this.initialized = true
            console.log('GeminiLiveBot initialized successfully')
        } catch (error) {
            console.error('Failed to initialize GeminiLiveBot:', error)
            throw new Error(
                `GeminiLiveBot initialization failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    async startSession(sessionConfig?: BotConfiguration): Promise<void> {
        if (!this.isReady()) {
            throw new Error(
                'GeminiLiveBot not initialized. Call initialize() first.',
            )
        }

        try {
            // Default to gemini-2.0-flash-exp for live sessions
            const modelName = sessionConfig?.modelName || 'gemini-2.0-flash-exp'

            this.session = await this.liveApi!.connect({
                model: modelName,
                generationConfig: {
                    responseModalities: ['AUDIO'], // Only audio responses
                },
            })

            // Set up session event handlers
            this.session.on('audio', (audioData: Uint8Array) => {
                if (this.audioResponseCallback) {
                    const response: AudioResponse = {
                        audioData: audioData,
                        metadata: {
                            timestamp: Date.now(),
                        },
                    }
                    this.audioResponseCallback(response)
                }
            })

            console.log(
                `GeminiLiveBot session started with model: ${modelName}`,
            )
        } catch (error) {
            console.error('Failed to start GeminiLiveBot session:', error)
            throw new Error(
                `Failed to start Gemini Live session: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    async sendAudioChunk(
        audioData: Buffer | Uint8Array,
        metadata?: AudioChunkMetadata,
    ): Promise<void> {
        if (!this.session) {
            console.warn(
                'GeminiLiveBot: No active session, ignoring audio chunk',
            )
            return
        }

        try {
            // Convert Buffer to Uint8Array if needed
            const audioBytes =
                audioData instanceof Buffer
                    ? new Uint8Array(audioData)
                    : audioData

            // Send audio to Gemini Live session
            await this.session.send({
                mimeType: 'audio/pcm',
                data: audioBytes,
            })

            console.log(
                `GeminiLiveBot: Sent audio chunk of ${audioBytes.length} bytes`,
                {
                    metadata,
                    timestamp: metadata?.timestamp || Date.now(),
                },
            )
        } catch (error) {
            console.error('Failed to send audio chunk to GeminiLiveBot:', error)
            // Don't throw - audio streaming should be resilient to individual chunk failures
        }
    }

    onAudioResponse(callback: (response: AudioResponse) => void): void {
        this.audioResponseCallback = callback
        console.log('GeminiLiveBot audio response callback registered')
    }

    async endSession(): Promise<void> {
        try {
            if (this.session) {
                await this.session.disconnect()
                this.session = null
            }
            this.audioResponseCallback = null
            console.log('GeminiLiveBot session ended')
        } catch (error) {
            console.error('Error ending GeminiLiveBot session:', error)
            // Ensure cleanup even if disconnect fails
            this.session = null
            this.audioResponseCallback = null
        }
    }

    isReady(): boolean {
        return this.initialized && this.liveApi !== null
    }
}
