import {
    GoogleGenAI,
    Session,
    Modality,
    LiveServerMessage,
    Blob,
} from '@google/genai'
import { IMeetingParticipantBot } from './IMeetingParticipantBot'
import {
    MeetingParams,
    BotConfiguration,
    AudioChunkMetadata,
    AudioResponse,
    VideoChunkMetadata,
} from '../types'

export class GeminiLiveBot implements IMeetingParticipantBot {
    private genAI: GoogleGenAI | null = null
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

            this.genAI = new GoogleGenAI({
                apiKey: apiKey,
            })
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

            this.session = await this.genAI!.live.connect({
                model: modelName,
                config: {
                    responseModalities: [Modality.AUDIO], // Only audio responses
                },
                callbacks: {
                    onopen: () => {
                        console.log(
                            'GeminiLiveBot: WebSocket connection opened',
                        )
                    },
                    onmessage: (message: LiveServerMessage) => {
                        // Handle incoming messages here
                        console.log('GeminiLiveBot: Received message', message)
                        // TODO: Parse and handle audio responses from message.content
                    },
                    onerror: (error: ErrorEvent) => {
                        console.error('GeminiLiveBot: WebSocket error', error)
                    },
                    onclose: (event: CloseEvent) => {
                        console.log(
                            'GeminiLiveBot: WebSocket connection closed',
                            event,
                        )
                    },
                },
            })

            // Audio responses will be handled in the onmessage callback above

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

            // Send audio to Gemini Live session using sendRealtimeInput
            // Convert audioBytes to base64 string for the Blob_2 format
            const audioBase64 = Buffer.from(audioBytes).toString('base64')
            const audioBlob: Blob = {
                data: audioBase64,
                mimeType: 'audio/pcm',
            }
            this.session.sendRealtimeInput({
                media: audioBlob,
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

    async sendVideoChunk(
        videoData: Buffer | Uint8Array,
        metadata?: VideoChunkMetadata,
    ): Promise<void> {
        if (!this.session) {
            console.warn(
                'GeminiLiveBot: No active session, ignoring video chunk',
            )
            return
        }

        try {
            // Convert Buffer to Uint8Array if needed
            const videoBytes =
                videoData instanceof Buffer
                    ? new Uint8Array(videoData)
                    : videoData

            // Send video to Gemini Live session using sendRealtimeInput
            // Convert videoBytes to base64 string for the Blob_2 format
            const videoBase64 = Buffer.from(videoBytes).toString('base64')
            const videoBlob: Blob = {
                data: videoBase64,
                mimeType: metadata?.format || 'video/webm', // Default to webm format
            }
            this.session.sendRealtimeInput({
                media: videoBlob,
            })

            console.log(
                `GeminiLiveBot: Sent video chunk of ${videoBytes.length} bytes`,
                {
                    metadata,
                    timestamp: metadata?.timestamp || Date.now(),
                },
            )
        } catch (error) {
            console.error('Failed to send video chunk to GeminiLiveBot:', error)
            // Don't throw - video streaming should be resilient to individual chunk failures
        }
    }

    onAudioResponse(callback: (response: AudioResponse) => void): void {
        this.audioResponseCallback = callback
        console.log('GeminiLiveBot audio response callback registered')
    }

    async endSession(): Promise<void> {
        try {
            if (this.session) {
                this.session.close()
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
        return this.initialized && this.genAI !== null
    }
}
