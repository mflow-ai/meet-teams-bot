#!/usr/bin/env ts-node

import { openBrowser } from './src/browser';

async function debugExtension() {
    console.log('🚀 Starting Chrome with extension...');
    
    try {
        const { browser } = await openBrowser(false, false);
        
        console.log('✅ Browser launched successfully with extension!');
        console.log('🔧 Extension service worker: Running in background');
        
        // Create a new page for testing
        const page = await browser.newPage();
        
        // Navigate to Google Meet
        console.log('🔗 Navigating to Google Meet...');
        await page.goto('https://meet.google.com', { waitUntil: 'networkidle' });
        
        // Wait a moment for extension to load
        await page.waitForTimeout(2000);
        
        console.log('\n📋 EXTENSION VERIFICATION STEPS:');
        console.log('1. ✅ Extension loaded (Chrome is running with --load-extension)');
        console.log('2. 🔍 Check if extension is visible:');
        console.log('   - Look for the extension icon in the toolbar (puzzle piece icon)');
        console.log('   - Click the puzzle piece and you should see "meeting-baas"');
        console.log('3. 🛠️ Open Chrome DevTools (F12) and check:');
        console.log('   - Console tab for any extension errors');
        console.log('   - Extensions tab in DevTools to see loaded extensions');
        console.log('4. 🧪 Test extension functionality:');
        console.log('   - Open DevTools Console');
        console.log('   - Type: chrome.runtime.sendMessage({action: "test"})');
        console.log('   - Should return a response (even if error - means service worker is running)');
        
        console.log('\n🎯 MANUAL TESTING OPTIONS:');
        console.log('• Navigate to chrome://extensions/ to see extension details');
        console.log('• Join a test meeting to see if extension captures media');
        console.log('• Check the extension popup (click on extension icon)');
        
        console.log('\n💻 Current page URL:', page.url());
        console.log('🚫 Press Ctrl+C to close the browser when done.');
        
        // Add a test function to the page
        await page.addScriptTag({
            content: `
                window.testExtension = async () => {
                    try {
                        console.log('🧪 Testing extension communication...');
                        const response = await chrome.runtime.sendMessage({action: 'test'});
                        console.log('✅ Extension responded:', response);
                        return response;
                    } catch (error) {
                        console.log('❌ Extension test failed:', error);
                        return { error: error.message };
                    }
                };
                console.log('🔧 Extension test function added. Run: testExtension()');
            `
        });
        
        // Keep the script running until user terminates
        process.on('SIGINT', async () => {
            console.log('\n🛑 Closing browser...');
            await browser.close();
            process.exit(0);
        });
        
        // Keep alive
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Error launching browser:', error instanceof Error ? error.message : String(error));
        console.error(error);
        process.exit(1);
    }
}

debugExtension().catch(console.error);