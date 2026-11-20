/**
 * Automated Pixabay Sound Effects Downloader for "Bad on Paper" Productions
 *
 * Uses Playwright to search Pixabay Sound Effects, stream the audio preview,
 * and download high-quality MP3 sound effects directly to ./assets/audio/sfx.
 *
 * Includes:
 * 1. Master Historical & Comic SFX (from True CNB / Dante production)
 * 2. Specific Cloth-Native Sound Cues for The Dancing Plague of 1518 (Image Prompt Pack p. 19):
 *    - Ink stamp thud (T-A)
 *    - Thread zip / stitch (T-C, T-H)
 *    - Cloth rip / tear (T-D)
 *    - Wood clunk (T-G)
 *    - Fire crackle (T-F)
 *    - Wagon wheel creak (Saverne road)
 *    - Medieval pipe / shawm & side drum roll
 *    - Rhythmic footsteps on cobblestones & accelerating heartbeat
 */

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const sfxList = [
  // --- The Dancing Plague of 1518: Specific Production SFX ---
  { name: 'plague_heartbeat_slow_60bpm', query: 'slow human heartbeat pulse' },
  { name: 'plague_heartbeat_fast_140bpm', query: 'fast racing heartbeat' },
  { name: 'plague_stamp_thud_heavy', query: 'heavy ink stamp thud' },
  { name: 'plague_thread_zip_pull', query: 'thread zip needle pull' },
  { name: 'plague_cloth_tear_ragged', query: 'cloth rip tear fabric' },
  { name: 'plague_wood_plank_clunk', query: 'wood plank impact clunk' },
  { name: 'plague_fire_burn_crackle', query: 'fire crackle burn flame' },
  { name: 'plague_wagon_wheel_creak', query: 'wooden wagon wheel creak' },
  { name: 'plague_footsteps_cobblestones', query: 'leather shoe footsteps on cobblestone' },
  { name: 'plague_medieval_drum_roll', query: 'snare drum roll medieval march' },
  { name: 'plague_shawm_pipe_trill', query: 'wooden flute pipe medieval whistle' },
  { name: 'plague_church_bell_solemn', query: 'cathedral church bell distant toll' },
  { name: 'plague_incense_censer_chain', query: 'metal chain rattle censer' },
  { name: 'plague_body_exhaustion_collapse', query: 'heavy body collapse thud ground' },
  { name: 'plague_crowd_murmur_fear', query: 'medieval crowd panic murmur' },

  // --- General Historical / Cartoon FX ---
  { name: 'fx_bubble_pop', query: 'cartoon bubble pop' },
  { name: 'fx_whip_whoosh', query: 'fast whoosh transition' },
  { name: 'fx_page_flip', query: 'fast page flip paper' },
  { name: 'fx_record_scratch', query: 'vinyl record scratch' },
  { name: 'fx_error_buzzer', query: 'wrong answer buzzer' },
  { name: 'fx_clock_ticking', query: 'fast clock ticking antique' },
  { name: 'fx_ice_crack', query: 'ice crack shatter impact' },
  { name: 'fx_thunder_strike', query: 'deep thunder strike crack' },
  { name: 'fx_stone_gate_slam', query: 'heavy massive stone door slam shut' }
];

const outputDir = path.resolve(__dirname, '../assets/audio/sfx');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  console.log('🚀 Starting Pixabay SFX Downloader for "Bad on Paper"...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (err) {
    console.log('Chrome channel not available, launching default chromium...');
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (let i = 0; i < sfxList.length; i++) {
    const item = sfxList[i];
    const filePath = path.join(outputDir, `${item.name}.mp3`);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 2000) {
      console.log(`[${i + 1}/${sfxList.length}] ⏩ Skipping (already exists): ${item.name}.mp3`);
      continue;
    }

    console.log(`[${i + 1}/${sfxList.length}] 🔍 Searching Pixabay for: "${item.query}"...`);
    let capturedMp3Url = null;

    const responseHandler = (response) => {
      const url = response.url();
      if (url.includes('cdn.pixabay.com/audio/') && url.includes('.mp3')) {
        capturedMp3Url = url;
      }
    };
    page.on('response', responseHandler);

    try {
      const searchUrl = `https://pixabay.com/sound-effects/search/${encodeURIComponent(item.query)}/`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const playButton = page.locator('button[class*="playOverlay"], button[class*="play"], button[aria-label*="Play" i]').first();
      if (await playButton.count() > 0) {
        await playButton.click({ timeout: 5000 });
        
        const startTime = Date.now();
        while (!capturedMp3Url && Date.now() - startTime < 5000) {
          await page.waitForTimeout(250);
        }
      }

      if (capturedMp3Url) {
        console.log(`   Captured audio stream: ${capturedMp3Url}`);
        const writer = fs.createWriteStream(filePath);
        const audioRes = await axios({
          url: capturedMp3Url,
          method: 'GET',
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        audioRes.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        console.log(`✅ [${i + 1}/${sfxList.length}] Downloaded: ${item.name}.mp3`);
      } else {
        console.log(`⚠️ Could not grab stream for "${item.query}"`);
      }
    } catch (err) {
      console.log(`❌ Error on "${item.query}": ${err.message}`);
    }

    page.off('response', responseHandler);
    await page.waitForTimeout(1000);
  }

  await browser.close();
  console.log('\n🎉 Finished! Downloaded SFX are in:', outputDir);
})();
