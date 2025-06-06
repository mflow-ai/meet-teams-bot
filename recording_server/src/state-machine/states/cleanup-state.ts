import { delSessionInRedis } from '../../instance'
import { SoundContext, VideoContext } from '../../media_context'
import { TRANSCODER } from '../../recording/Transcoder'
import { MEETING_CONSTANTS } from '../constants'

import { MeetingStateType, StateExecuteResult } from '../types'
import { BaseState } from './base-state'

export class CleanupState extends BaseState {
    async execute(): StateExecuteResult {
        try {
            console.info('Starting cleanup sequence')

            // Use Promise.race to implement the timeout
            const cleanupPromise = this.performCleanup()
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error('Cleanup timeout')),
                    MEETING_CONSTANTS.CLEANUP_TIMEOUT,
                )
            })

            try {
                await Promise.race([cleanupPromise, timeoutPromise])
            } catch (error) {
                console.error('Cleanup failed or timed out:', error)
            }
            return this.transition(MeetingStateType.Terminated) // État final
        } catch (error) {
            console.error('Error during cleanup:', error)
            // Even in case of error, we stay in Cleanup state
            return this.transition(MeetingStateType.Cleanup)
        }
    }

    private async performCleanup(): Promise<void> {
        try {
            // 1. Arrêter le Transcoder et la transcription
            await this.stopTranscoderAndTranscription()

            // 2.Arrêter le streaming
            if (this.context.streamingService) {
                this.context.streamingService.stop()
            }

            // 3. Clean up extension resources and browser
            await this.cleanupBrowserResources()

            // 4. Upload the video to S3 before removing local files
            await this.uploadVideoToS3()

            // 5. Final Redis cleanup
            await this.cleanupRedisSession()
        } catch (error) {
            console.error('Cleanup error:', error)
            // Continue even if an error occurs
        }
    }

    private async stopTranscoderAndTranscription(): Promise<void> {
        try {
            await Promise.all([TRANSCODER.stop()])
        } catch (error) {
            console.error('Error stopping processes:', error)
            throw error
        }
    }
    private async cleanupBrowserResources(): Promise<void> {
        try {
            // 1. Stop branding
            if (this.context.brandingProcess) {
                this.context.brandingProcess.kill()
            }

            // 2. Stop media contexts
            VideoContext.instance?.stop()
            SoundContext.instance?.stop()

            // 3. Close pages and clean the browser
            await Promise.all([
                this.context.playwrightPage?.close().catch(() => {}),
                this.context.backgroundPage?.close().catch(() => {}),
                this.context.browserContext?.close().catch(() => {}),
            ])

            // 4. Clear timeouts
            if (this.context.meetingTimeoutInterval) {
                clearTimeout(this.context.meetingTimeoutInterval)
            }
        } catch (error) {
            console.error('Failed to cleanup browser resources:', error)
        }
    }

    private async uploadVideoToS3(): Promise<void> {
        if (!TRANSCODER) return

        try {
            // Only upload if not already done in the stop() method
            if (!TRANSCODER.getFilesUploaded()) {
                console.log('Uploading video to S3')
                await TRANSCODER.uploadToS3()
            } else {
                console.log(
                    'Files already uploaded to S3 in stop() method, skipping',
                )
            }
        } catch (error) {
            console.error('Failed to upload video to S3:', error)
        }
    }

    private async cleanupRedisSession(): Promise<void> {
        if (!this.context.params.session_id) return

        try {
            await delSessionInRedis(this.context.params.session_id)
        } catch (error) {
            console.error('Failed to cleanup Redis session:', error)
        }
    }
}
