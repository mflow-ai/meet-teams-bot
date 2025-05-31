import { BrowserContext, chromium, Page } from '@playwright/test'
import { join } from 'path'

// const EXTENSION_NAME = 'spoke'
const EXTENSION_ID = 'mqiyqdtvgvspzjub'
const USER_DATA_DIR = '/tmp/test-user-data-dir'

type Resolution = {
    width: number
    height: number
}

const P480: Resolution = {
    width: 854,
    height: 480,
}

const P720: Resolution = {
    width: 1280,
    height: 720,
}

var RESOLUTION: Resolution = P720

export async function openBrowser(
    // useChromium: boolean,
    lowResolution: boolean,
    slowMo: boolean = false,
): Promise<{ browser: BrowserContext; backgroundPage: Page }> {
    if (lowResolution) {
        RESOLUTION = P480
    }

    const pathToExtension = join(
        __dirname,
        '..',
        'chrome_extension',
        'dist',
    )
    console.log('Path to Extension : ', pathToExtension)

    const width = RESOLUTION.width
    const height = RESOLUTION.height

    try {
        console.log('Launching persistent context...')

        // Check that extension path exists and validate contents
        const fs = require('fs')
        if (!fs.existsSync(pathToExtension)) {
            console.error(`Extension path does not exist: ${pathToExtension}`)
            throw new Error('Extension path not found')
        }

        // Validate critical extension files
        const manifestPath = join(pathToExtension, 'manifest.json')
        const backgroundPath = join(pathToExtension, 'js', 'background.js')
        
        if (!fs.existsSync(manifestPath)) {
            console.error(`Manifest not found: ${manifestPath}`)
            throw new Error('Extension manifest missing')
        }
        
        if (!fs.existsSync(backgroundPath)) {
            console.error(`Background script not found: ${backgroundPath}`)
            throw new Error('Extension background script missing')
        }

        console.log('Extension files validated successfully')
        
        // Log manifest details for debugging
        try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf8')
            const manifest = JSON.parse(manifestContent)
            console.log(`Extension name: ${manifest.name}`)
            console.log(`Manifest version: ${manifest.manifest_version}`)
            console.log(`Extension version: ${manifest.version}`)
            console.log(`Background scripts: ${manifest.background?.scripts || 'none'}`)
        } catch (err) {
            console.error('Error reading manifest:', err)
        }

        const context = await chromium.launchPersistentContext('', {
            headless: false,
            viewport: { width, height },
            args: [
                '--no-sandbox',
                '--disable-rtc-smoothness-algorithm',
                '--disable-webrtc-hw-decoding',
                '--disable-webrtc-hw-encoding',
                '--disable-blink-features=AutomationControlled',
                '--disable-setuid-sandbox',
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
                '--autoplay-policy=no-user-gesture-required',
                '--disable-background-timer-throttling',
                '--enable-features=SharedArrayBuffer',
                `--allowlisted-extension-id=${EXTENSION_ID}`,
                // `--whitelisted-extension-id=${EXTENSION_ID}`,
                '--ignore-certificate-errors',
                '--allow-insecure-localhost',
                '--disable-blink-features=TrustedDOMTypes',
                '--disable-features=TrustedScriptTypes',
                '--disable-features=TrustedHTML',
                '--enable-logging=stderr',
                '--log-level=0',
                '--v=1',
                '--vmodule=*/browser/extensions/*=1',
                '--enable-extension-activity-logging',
                '--dump-dom',
            ],
            slowMo: slowMo ? 100 : undefined,
            permissions: ['microphone', 'camera'],
            ignoreHTTPSErrors: true,
            acceptDownloads: true,
            bypassCSP: true,
            timeout: 120000, // 2 minutes
        })

        // Add comprehensive logging to capture Chrome errors
        context.on('page', (page) => {
            page.on('console', (msg) => {
                console.log(`Chrome Console [${msg.type()}]:`, msg.text())
            })
            page.on('pageerror', (err) => {
                console.error('Chrome Page Error:', err)
            })
            page.on('crash', () => {
                console.error('Chrome Page Crashed')
            })
            page.on('response', (response) => {
                if (response.status() >= 400) {
                    console.error(`Chrome HTTP Error: ${response.status()} ${response.url()}`)
                }
            })
        })

        // Log extension loading errors
        context.on('weberror', (webError) => {
            console.error('Chrome Web Error:', webError)
        })

        console.log('Setting up V3 extension with service worker...')
        
        // Create a temporary page to trigger extension loading
        const tempPage = await context.newPage()
        await tempPage.close()
        
        // Give the service worker a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('✅ Extension service worker should be running')
        return { browser: context, backgroundPage: null }
    } catch (error) {
        console.error('Failed to open browser:', error)
        throw error
    }
}
