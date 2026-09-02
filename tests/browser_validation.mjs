import puppeteer from 'puppeteer';

async function runTests() {
  console.log('🚀 Starting Puppeteer browser validation test on http://localhost:5173...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('🔴 BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('🔴 UNCAUGHT EXCEPTION:', err.message);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('✅ Page loaded successfully.');

  // 1. Check initial state
  const hasIdeaModal = await page.evaluate(() => {
    return document.body.innerText.includes('Select your startup venture');
  });
  console.log('Idea Modal visible on visit:', hasIdeaModal);

  // Click on the first company card in the modal
  console.log('Clicking the first startup idea card...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
    if (cards.length > 0) {
      cards[0].click();
    } else {
      const btns = Array.from(document.querySelectorAll('button'));
      const foundBtn = btns.find(b => b.innerText.includes('Found'));
      if (foundBtn) foundBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 600));

  // Verify dashboard metrics
  let state = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasEmployeesOne: /Employees:?\s*1/i.test(text),
      hasCash2000: text.includes('$2,000'),
      hasZeroMRR: text.includes('$0') || text.includes('$0 MRR'),
      hasZeroAgents: text.includes('0 AGENTS') || text.includes('0 Agents'),
      focusText: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('Initial startup metrics verified:', state);
  if (!state.hasEmployeesOne || !state.hasCash2000) {
    throw new Error('Initial metrics invalid: ' + JSON.stringify(state));
  }

  // 2. Click Vibe Code 3 times
  console.log('Clicking Vibe Code 3 times...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vibeBtn = btns.find(b => b.innerText.includes('Vibe Code'));
    if (vibeBtn) {
      vibeBtn.click();
      vibeBtn.click();
      vibeBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 300));
  let postVibeState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      focus: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found',
      hasBP: text.includes('75 BP') || text.includes('25 BP') || text.includes('50 BP') || text.includes('BP')
    };
  });
  console.log('Post-vibe metrics:', postVibeState);

  // 3. Test Focus Regeneration over 2 seconds
  console.log('Waiting 2 seconds for Focus regeneration (+1.5/s)...');
  await new Promise(r => setTimeout(r, 2000));

  let regeneratedFocus = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found';
  });
  console.log('Regenerated Focus after 2s:', regeneratedFocus);

  // 4. Test Page Reload Persistence (Active Game should stay active without Idea Modal)
  console.log('Reloading page to test persistence...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  let reloadState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      ideaModalShown: text.includes('Select your startup venture'),
      hasEmployeesOne: /Employees:?\s*1/i.test(text),
      hasCash: text.includes('$2,000'),
      focus: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('Reload persistence state:', reloadState);
  if (reloadState.ideaModalShown) {
    throw new Error('Idea modal should NOT be shown on reload of active game!');
  }

  // 5. Test In-App Reset
  console.log('Triggering In-App Reset...');
  await page.evaluate(() => {
    const resetBtn = document.querySelector('button[title="Reset Game"]');
    if (resetBtn) resetBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Click Confirm Reset in the Reset modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.innerText.includes('Confirm Reset'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  let resetModalState = await page.evaluate(() => {
    return document.body.innerText.includes('Select your startup venture');
  });
  console.log('Idea modal returned after Reset:', resetModalState);
  if (!resetModalState) {
    throw new Error('Idea modal MUST return after Reset!');
  }

  // 6. Select a NEW startup idea and verify fresh clean metrics
  console.log('Selecting a fresh startup idea...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
    if (cards.length > 1) {
      cards[1].click(); // Pick second card
    } else if (cards.length > 0) {
      cards[0].click();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  let newStartupState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCash2000: text.includes('$2,000'),
      hasZeroAgents: text.includes('0 AGENTS') || text.includes('0 Agents'),
      hasZeroMRR: text.includes('$0') || text.includes('$0 MRR'),
      focus: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('New Startup clean state verification:', newStartupState);
  if (!newStartupState.hasCash2000 || !newStartupState.hasZeroAgents) {
    throw new Error('New startup failed to reset cleanly: ' + JSON.stringify(newStartupState));
  }

  // 7. Verify page reload on fresh startup also stays clean
  console.log('Testing reload on new clean startup...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  let cleanReloadState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      ideaModalShown: text.includes('Select your startup venture'),
      hasCash2000: text.includes('$2,000'),
      hasZeroAgents: text.includes('0 AGENTS') || text.includes('0 Agents'),
      focus: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('Clean reload verification:', cleanReloadState);
  if (cleanReloadState.ideaModalShown) {
    throw new Error('Idea modal should not appear on reload after founding company');
  }
  if (!cleanReloadState.hasCash2000 || !cleanReloadState.hasZeroAgents) {
    throw new Error('Previous old metrics leaked into new session!');
  }

  await browser.close();
  console.log('🎉 ALL VALIDATION & SESSION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
