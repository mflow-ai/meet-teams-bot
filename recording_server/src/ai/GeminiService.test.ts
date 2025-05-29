import { GeminiService } from './GeminiService'

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation((apiKey: string) => {
            if (apiKey === 'invalid-key') {
                throw new Error('Invalid API key')
            }
            return {
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn(),
                }),
            }
        }),
    }
})

describe('GeminiService', () => {
    let geminiService: GeminiService

    beforeEach(() => {
        geminiService = new GeminiService()
        jest.clearAllMocks()
    })

    describe('initialize', () => {
        it('should initialize successfully with valid API key', async () => {
            const apiKey = 'valid-api-key'
            
            await expect(geminiService.initialize(apiKey)).resolves.toBeUndefined()
            expect(geminiService.isReady()).toBe(true)
        })

        it('should throw error with invalid API key', async () => {
            const apiKey = 'invalid-key'
            
            await expect(geminiService.initialize(apiKey)).rejects.toThrow(
                'GeminiService initialization failed: Invalid API key'
            )
            expect(geminiService.isReady()).toBe(false)
        })

        it('should handle initialization errors gracefully', async () => {
            const apiKey = 'test-key'
            
            // Mock GoogleGenerativeAI constructor to throw
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            GoogleGenerativeAI.mockImplementationOnce(() => {
                throw new Error('Network error')
            })

            await expect(geminiService.initialize(apiKey)).rejects.toThrow(
                'GeminiService initialization failed: Network error'
            )
            expect(geminiService.isReady()).toBe(false)
        })
    })

    describe('startSession', () => {
        beforeEach(async () => {
            await geminiService.initialize('valid-api-key')
        })

        it('should start session with default model', async () => {
            await expect(geminiService.startSession()).resolves.toBeUndefined()
        })

        it('should start session with custom model', async () => {
            const sessionConfig = { modelName: 'gemini-1.5-pro' }
            
            await expect(geminiService.startSession(sessionConfig)).resolves.toBeUndefined()
        })

        it('should throw error if not initialized', async () => {
            const uninitializedService = new GeminiService()
            
            await expect(uninitializedService.startSession()).rejects.toThrow(
                'GeminiService not initialized. Call initialize() first.'
            )
        })
    })

    describe('sendAudioChunk', () => {
        beforeEach(async () => {
            await geminiService.initialize('valid-api-key')
        })

        it('should handle audio chunk without errors', async () => {
            const audioData = Buffer.from('fake-audio-data')
            const metadata = { timestamp: Date.now() }
            
            // Should not throw
            await expect(geminiService.sendAudioChunk(audioData, metadata)).resolves.toBeUndefined()
        })

        it('should handle Uint8Array audio data', async () => {
            const audioData = new Uint8Array([1, 2, 3, 4])
            
            await expect(geminiService.sendAudioChunk(audioData)).resolves.toBeUndefined()
        })
    })

    describe('sendVideoChunk', () => {
        beforeEach(async () => {
            await geminiService.initialize('valid-api-key')
        })

        it('should handle video chunk without errors', async () => {
            const videoData = Buffer.from('fake-video-data')
            const metadata = { timestamp: Date.now(), frameRate: 30 }
            
            await expect(geminiService.sendVideoChunk(videoData, metadata)).resolves.toBeUndefined()
        })

        it('should handle Uint8Array video data', async () => {
            const videoData = new Uint8Array([5, 6, 7, 8])
            
            await expect(geminiService.sendVideoChunk(videoData)).resolves.toBeUndefined()
        })
    })

    describe('onResponse', () => {
        beforeEach(async () => {
            await geminiService.initialize('valid-api-key')
        })

        it('should register response callback', () => {
            const callback = jest.fn()
            
            // Should not throw
            expect(() => geminiService.onResponse(callback)).not.toThrow()
        })
    })

    describe('endSession', () => {
        beforeEach(async () => {
            await geminiService.initialize('valid-api-key')
            await geminiService.startSession()
        })

        it('should end session successfully', async () => {
            await expect(geminiService.endSession()).resolves.toBeUndefined()
        })
    })

    describe('isReady', () => {
        it('should return false when not initialized', () => {
            expect(geminiService.isReady()).toBe(false)
        })

        it('should return true when initialized', async () => {
            await geminiService.initialize('valid-api-key')
            expect(geminiService.isReady()).toBe(true)
        })
    })
})