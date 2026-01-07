import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDashboard() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
    });

    // Collect errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('[BROWSER ERROR]:', error.message);
    });

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('\nNavigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Page loaded, waiting for content...');

    // Wait for the main app container
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait a bit for the chart to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for the chart canvas element
    const hasCanvas = await page.evaluate(() => {
      return document.querySelector('canvas') !== null;
    });

    console.log('\n=== Verification Results ===');
    console.log(`Canvas element found: ${hasCanvas ? 'YES' : 'NO'}`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors detected: ${errors.length}`);

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'dashboard-screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);

    // Check for specific error patterns
    const hasLogarithmicError = errors.some(err =>
      err.includes('logarithmic') || err.includes('not a registered scale')
    );

    const hasChartError = errors.some(err =>
      err.includes('Chart') || err.includes('chart')
    );

    console.log('\n=== Error Analysis ===');
    console.log(`Logarithmic scale error: ${hasLogarithmicError ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`Chart-related errors: ${hasChartError ? 'FOUND' : 'NOT FOUND'}`);

    if (errors.length > 0) {
      console.log('\n=== All Errors ===');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    // Get page title
    const title = await page.title();
    console.log(`\nPage Title: ${title}`);

    // Summary
    console.log('\n=== SUMMARY ===');
    if (hasCanvas && errors.length === 0) {
      console.log('SUCCESS: Dashboard loaded correctly with no errors!');
      return 0;
    } else if (hasCanvas && !hasLogarithmicError && !hasChartError) {
      console.log('PARTIAL SUCCESS: Dashboard loaded with canvas, but some non-critical errors present');
      return 0;
    } else {
      console.log('FAILURE: Dashboard has critical errors or missing elements');
      return 1;
    }

  } catch (error) {
    console.error('\n=== CRITICAL ERROR ===');
    console.error(error.message);
    return 1;
  } finally {
    await browser.close();
  }
}

verifyDashboard()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
