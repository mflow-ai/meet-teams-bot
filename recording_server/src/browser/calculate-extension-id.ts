#!/usr/bin/env node

import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Calculate Chrome extension ID from the public key in manifest.json
 * Chrome extension IDs are derived from the first 16 bytes of the SHA256 hash
 * of the public key, converted to lowercase letters a-p
 */
function calculateExtensionId(publicKey: string): string {
    // Decode the base64 public key
    const keyBuffer = Buffer.from(publicKey, 'base64')

    // Create SHA256 hash - get buffer directly
    const hash = crypto
        .createHash('sha256')
        .update(keyBuffer as any)
        .digest()

    // Take first 16 bytes and convert to extension ID format
    // Each byte is mapped to letters a-p (a=0, b=1, ..., p=15)
    const id = Array.from(hash.subarray(0, 16))
        .map((byte) => String.fromCharCode(97 + (byte % 26)))
        .join('')

    return id
}

function main() {
    const manifestPath = path.join(
        __dirname,
        '..',
        '..',
        'chrome_extension',
        'dist',
        'manifest.json',
    )

    if (!fs.existsSync(manifestPath)) {
        console.error('❌ manifest.json not found at:', manifestPath)
        console.error('   Make sure the chrome extension is built first')
        process.exit(1)
    }

    try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8')
        const manifest = JSON.parse(manifestContent)

        if (!manifest.key) {
            console.error('❌ No "key" field found in manifest.json')
            console.error('   Extension must have a public key to calculate ID')
            process.exit(1)
        }

        const calculatedId = calculateExtensionId(manifest.key)

        console.log('🔍 Chrome Extension ID Calculator')
        console.log('================================')
        console.log('📁 Manifest path:', manifestPath)
        console.log('🔑 Public key:', manifest.key.substring(0, 50) + '...')
        console.log('🆔 Calculated Extension ID:', calculatedId)
        console.log('')

        // Check against hardcoded value in browser.ts
        const browserTsPath = path.join(__dirname, '..', 'browser.ts')
        if (fs.existsSync(browserTsPath)) {
            const browserContent = fs.readFileSync(browserTsPath, 'utf8')
            const idMatch = browserContent.match(
                /const EXTENSION_ID = '([^']+)'/,
            )

            if (idMatch) {
                const hardcodedId = idMatch[1]
                console.log('🔧 Current ID in browser.ts:', hardcodedId)

                if (calculatedId === hardcodedId) {
                    console.log('✅ Extension IDs match!')
                } else {
                    console.log('❌ Extension ID mismatch!')
                    console.log(
                        '   Update browser.ts with the calculated ID above',
                    )
                }
            }
        }

        return calculatedId
    } catch (error) {
        console.error('❌ Error reading or parsing manifest.json:', error)
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

export { calculateExtensionId }
