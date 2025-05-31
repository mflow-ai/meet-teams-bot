import * as record from './record'
import { SoundStreamer } from './soundStreamer'

import { MeetingProvider, RecordingMode } from './api'

import { ApiService } from './api'

export async function startRecording(
    local_recording_server_location: string,
    chunkDuration: number,
    streaming_output?: string,
    streaming_audio_frequency?: number,
): Promise<number> {
    try {
        ApiService.init(local_recording_server_location)

        await ApiService.sendMessageToRecordingServer(
            'LOG',
            'FROM_EXTENSION: ************ Start recording launched. ************',
        )

        await record.initMediaRecorder(
            streaming_output,
            streaming_audio_frequency,
        )
        return await record.startRecording(chunkDuration)
    } catch (e) {
        console.log('ERROR while start recording', JSON.stringify(e))
        throw e
    }
}

// Launch observeSpeakers.js() script inside web page DOM (Meet, teams ...)
export async function start_speakers_observer(
    recording_mode: RecordingMode,
    bot_name: string,
    meetingProvider: MeetingProvider,
) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
        await (chrome as any).scripting.executeScript({
            target: { tabId: tab.id },
            code: `
                window.RECORDING_MODE = ${JSON.stringify(recording_mode)};
                window.BOT_NAME = ${JSON.stringify(bot_name)};
                window.MEETING_PROVIDER = ${JSON.stringify(meetingProvider)};
            `
        });
        
        await (chrome as any).scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/observeSpeakers.js']
        });
    }
}

// Launch shittyHtml.js() script inside web page DOM (Meet, teams ...)
export async function remove_shitty_html(
    recording_mode: RecordingMode,
    meetingProvider: MeetingProvider,
) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
        await (chrome as any).scripting.executeScript({
            target: { tabId: tab.id },
            code: `
                window.RECORDING_MODE = ${JSON.stringify(recording_mode)};
                window.MEETING_PROVIDER = ${JSON.stringify(meetingProvider)};
            `
        });
        
        await (chrome as any).scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/shittyHtml.js']
        });
    }
}

export async function stopMediaRecorder(): Promise<void> {
    return await record.stop()
}

// Stop the Audio Recording
export async function stopAudioStreaming() {
    SoundStreamer.instance?.stop()
}

// Message handling for V3 service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            switch (message.action) {
                case 'startRecording':
                    const recordingId = await startRecording(
                        message.local_recording_server_location,
                        message.chunkDuration,
                        message.streaming_output,
                        message.streaming_audio_frequency
                    );
                    sendResponse({ success: true, recordingId });
                    break;
                
                case 'stopMediaRecorder':
                    await stopMediaRecorder();
                    sendResponse({ success: true });
                    break;
                
                case 'stopAudioStreaming':
                    await stopAudioStreaming();
                    sendResponse({ success: true });
                    break;
                
                case 'start_speakers_observer':
                    await start_speakers_observer(
                        message.recording_mode,
                        message.bot_name,
                        message.meetingProvider
                    );
                    sendResponse({ success: true });
                    break;
                
                case 'remove_shitty_html':
                    await remove_shitty_html(
                        message.recording_mode,
                        message.meetingProvider
                    );
                    sendResponse({ success: true });
                    break;
                
                case 'test':
                    sendResponse({ 
                        success: true, 
                        message: 'Extension is working!', 
                        extensionId: chrome.runtime.id,
                        manifest: chrome.runtime.getManifest()?.name 
                    });
                    break;
                
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
    })();
    
    return true; // Keep the message channel open for async response
});
