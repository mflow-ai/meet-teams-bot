import { GeminiLiveBot } from './GeminiLiveBot'
import { MeetingParams, AudioChunkMetadata, AudioResponse } from '../types'

// Mock the Google GenAI module
jest.mock('@google/genai', () => {
    const mockSession = {
        on: jest.fn(),
        send: jest.fn(),
        disconnect: jest.fn(),
    }

    return {
        Live: jest.fn().mockImplementation((apiKey: string) => {
            if (apiKey === 'invalid-key') {
                throw new Error('Invalid API key')
            }
            return {
                connect: jest.fn().mockResolvedValue(mockSession),
            }
        }),
    }
})

describe('GeminiLiveBot', () => {
    let geminiLiveBot: GeminiLiveBot
    let mockParams: MeetingParams

    beforeEach(() => {
        geminiLiveBot = new GeminiLiveBot()
        mockParams = {
            id: 'test-id',
            meeting_url: 'https://meet.google.com/test',
            user_token: 'test-token',
            bot_name: 'Test Bot',
            bots_api_key: 'test-api-key',
            recording_mode: 'speaker_view',
            bot_uuid: 'test-uuid',
            secret: 'test-secret',
            mp4_s3_path: 'test-path',
            automatic_leave: {
                waiting_room_timeout: 60,
                noone_joined_timeout: 60,
            },
        } as MeetingParams
        
        jest.clearAllMocks()
        
        // Set up environment variable
        process.env.GEMINI_API_KEY = 'valid-api-key'
    })

    afterEach(() => {
        delete process.env.GEMINI_API_KEY
    })

    describe('initialize', () => {
        it('should initialize successfully with valid API key from environment', async () => {
            await expect(geminiLiveBot.initialize(mockParams)).resolves.toBeUndefined()
            expect(geminiLiveBot.isReady()).toBe(true)
        })

        it('should throw error when GEMINI_API_KEY environment variable is missing', async () => {
            delete process.env.GEMINI_API_KEY
            
            await expect(geminiLiveBot.initialize(mockParams)).rejects.toThrow(
                'GeminiLiveBot initialization failed: GEMINI_API_KEY environment variable is required'
            )
            expect(geminiLiveBot.isReady()).toBe(false)
        })

        it('should handle initialization errors gracefully', async () => {
            process.env.GEMINI_API_KEY = 'invalid-key'
            
            await expect(geminiLiveBot.initialize(mockParams)).rejects.toThrow(
                'GeminiLiveBot initialization failed: Invalid API key'
            )
            expect(geminiLiveBot.isReady()).toBe(false)
        })
    })

    describe('startSession', () => {
        beforeEach(async () => {
            await geminiLiveBot.initialize(mockParams)
        })

        it('should start session with default model', async () => {
            await expect(geminiLiveBot.startSession()).resolves.toBeUndefined()
        })

        it('should start session with custom model', async () => {
            const sessionConfig = { type: 'gemini', modelName: 'gemini-2.0-flash-exp' }
            
            await expect(geminiLiveBot.startSession(sessionConfig)).resolves.toBeUndefined()
        })

        it('should throw error if not initialized', async () => {
            const uninitializedBot = new GeminiLiveBot()
            
            await expect(uninitializedBot.startSession()).rejects.toThrow(
                'GeminiLiveBot not initialized. Call initialize() first.'
            )
        })
    })

    describe('sendAudioChunk', () => {
        beforeEach(async () => {
            await geminiLiveBot.initialize(mockParams)
            await geminiLiveBot.startSession()
        })

        it('should handle audio chunk without errors', async () => {
            const audioData = Buffer.from('fake-audio-data')
            const metadata: AudioChunkMetadata = { 
                timestamp: Date.now(),
                sampleRate: 16000,
                channels: 1
            }
            
            await expect(geminiLiveBot.sendAudioChunk(audioData, metadata)).resolves.toBeUndefined()
        })

        it('should handle Uint8Array audio data', async () => {
            const audioData = new Uint8Array([1, 2, 3, 4])
            
            await expect(geminiLiveBot.sendAudioChunk(audioData)).resolves.toBeUndefined()
        })

        it('should handle missing session gracefully', async () => {
            const botWithoutSession = new GeminiLiveBot()
            await botWithoutSession.initialize(mockParams)
            
            const audioData = Buffer.from('fake-audio-data')
            
            // Should not throw, just log warning
            await expect(botWithoutSession.sendAudioChunk(audioData)).resolves.toBeUndefined()
        })
    })

    describe('onAudioResponse', () => {
        beforeEach(async () => {
            await geminiLiveBot.initialize(mockParams)
        })

        it('should register audio response callback', () => {
            const callback = jest.fn()
            
            expect(() => geminiLiveBot.onAudioResponse(callback)).not.toThrow()
        })

        it('should call callback when audio response is received', async () => {
            const callback = jest.fn()
            geminiLiveBot.onAudioResponse(callback)
            
            await geminiLiveBot.startSession()
            
            // Get the mocked session and trigger audio event
            const { Live } = require('@google/genai')
            const mockLive = Live.mock.results[0].value
            const mockSession = await mockLive.connect.mock.results[0].value
            
            // Simulate audio response
            const audioData = new Uint8Array([1, 2, 3, 4])
            const audioHandler = mockSession.on.mock.calls.find(call => call[0] === 'audio')[1]
            audioHandler(audioData)
            
            expect(callback).toHaveBeenCalledWith({
                audioData: audioData,
                metadata: expect.objectContaining({
                    timestamp: expect.any(Number)
                })
            })
        })
    })

    describe('endSession', () => {
        beforeEach(async () => {
            await geminiLiveBot.initialize(mockParams)
            await geminiLiveBot.startSession()
        })

        it('should end session successfully', async () => {
            await expect(geminiLiveBot.endSession()).resolves.toBeUndefined()
        })

        it('should handle session disconnect errors gracefully', async () => {
            // Mock disconnect to throw error
            const { Live } = require('@google/genai')
            const mockLive = Live.mock.results[0].value
            const mockSession = await mockLive.connect.mock.results[0].value
            mockSession.disconnect.mockRejectedValueOnce(new Error('Disconnect error'))
            
            await expect(geminiLiveBot.endSession()).resolves.toBeUndefined()
        })
    })

    describe('isReady', () => {
        it('should return false when not initialized', () => {
            expect(geminiLiveBot.isReady()).toBe(false)
        })

        it('should return true when initialized', async () => {
            await geminiLiveBot.initialize(mockParams)
            expect(geminiLiveBot.isReady()).toBe(true)
        })
    })
})