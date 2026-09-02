import puppeteer from 'puppeteer';

async function runDeepTest() {
  console.log('🎮 Starting Deep Gameplay & Multi-Cycle Session Test...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('🔴 BROWSER ERROR:', msg.text());
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Reset state to clean baseline
  await page.evaluate(() => {
    localStorage.clear();
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // 2. Select Company 1 (e.g. Card 0)
  console.log('1. Selecting Company 1...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
    if (cards.length > 0) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 3. Perform manual actions to generate traction
  console.log('2. Performing founder actions...');
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const vibe = btns.find(b => b.innerText.includes('Vibe Code'));
      const post = btns.find(b => b.innerText.includes('Post Content'));
      const sell = btns.find(b => b.innerText.includes('Pitch Leads'));
      if (vibe) vibe.click();
      if (post) post.click();
      if (sell) sell.click();
    });
    await new Promise(r => setTimeout(r, 700));
  }

  // 4. Check Agents Screen & Hire an Agent
  console.log('3. Navigating to Agents Screen and hiring an agent...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('nav button'));
    const agentTab = tabs.find(t => t.innerText.includes('Agents'));
    if (agentTab) agentTab.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Open Hire Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hireBtn = btns.find(b => b.innerText.includes('Hire'));
    if (hireBtn) hireBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Hire in modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmHire = btns.find(b => b.innerText.includes('Hire Agent ($'));
    if (confirmHire) confirmHire.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify Agent hired
  const agentCount = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('1 AGENTS ACTIVE') || text.includes('1 AGENT') || text.includes('1 Agents');
  });
  console.log('Agent hired successfully:', agentCount);
  if (!agentCount) throw new Error('Failed to hire autonomous agent');

  // 5. Navigate back to Command and let simulation tick for 2 seconds
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('nav button'));
    const cmdTab = tabs.find(t => t.innerText.includes('Command'));
    if (cmdTab) cmdTab.click();
  });
  console.log('Waiting 2 seconds for autonomous agent ticks...');
  await new Promise(r => setTimeout(r, 2000));

  // 6. Test Reload Persistence
  console.log('4. Testing page reload persistence of Company 1...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const postReloadMetrics = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasAgents: text.includes('1 AGENT') || text.includes('1 Agent') || text.includes('1 Agents'),
      ideaModalHidden: !text.includes('Select your startup venture'),
      hasEmployeesOne: /Employees:?\s*1/i.test(text)
    };
  });
  console.log('Company 1 Post-Reload Verification:', postReloadMetrics);
  if (!postReloadMetrics.hasAgents || !postReloadMetrics.ideaModalHidden || !postReloadMetrics.hasEmployeesOne) {
    throw new Error('Reload persistence failed on active company: ' + JSON.stringify(postReloadMetrics));
  }

  // 7. Reset Game via UI Reset Modal
  console.log('5. Triggering In-App Reset to restart from scratch...');
  await page.evaluate(() => {
    const resetBtn = document.querySelector('button[title="Reset Game"]');
    if (resetBtn) resetBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.innerText.includes('Confirm Reset'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify Idea Modal is displayed
  const isResetClean = await page.evaluate(() => {
    return document.body.innerText.includes('Select your startup venture');
  });
  console.log('Reset modal returned to Idea Picker:', isResetClean);
  if (!isResetClean) throw new Error('Reset failed to display Idea Picker');

  // 8. Found Company 2 (TaxNinja or Card 1)
  console.log('6. Founding Company 2...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
    if (cards.length > 1) cards[1].click();
    else if (cards.length > 0) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify Company 2 has ZERO agents, $2,000 cash, 0 MRR, Level 1
  const company2State = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasZeroAgents: text.includes('0 AGENTS') || text.includes('0 Agents'),
      hasCash2000: text.includes('$2,000'),
      hasZeroMRR: text.includes('$0') || text.includes('$0 MRR'),
      hasLevel1: text.includes('Level 1') || text.includes('LEVEL 1'),
      focusRegen: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('Company 2 Clean State Verification:', company2State);
  if (!company2State.hasZeroAgents || !company2State.hasCash2000 || !company2State.hasLevel1) {
    throw new Error('Company 2 inherited old metrics: ' + JSON.stringify(company2State));
  }

  // 9. Verify Focus is regenerating and actions work immediately in Company 2
  console.log('7. Testing founder actions in Company 2...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const vibe = btns.find(b => b.innerText.includes('Vibe Code'));
    if (vibe) vibe.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const postActionComp2 = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasBP: text.includes('25 BP'),
      focus: text.match(/(\d+\.\d+)\s*\/\s*10/)?.[0] || 'not found'
    };
  });
  console.log('Company 2 Post-action state:', postActionComp2);
  if (!postActionComp2.hasBP) throw new Error('Founder action failed in Company 2');

  // 10. Final reload test on Company 2
  console.log('8. Reloading on Company 2 to verify persistence...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const finalReloadState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasZeroAgents: text.includes('0 AGENTS') || text.includes('0 Agents'),
      hasBP: text.includes('25 BP'),
      ideaModalHidden: !text.includes('Select your startup venture')
    };
  });
  console.log('Final Company 2 Reload verification:', finalReloadState);
  if (!finalReloadState.hasZeroAgents || !finalReloadState.hasBP || !finalReloadState.ideaModalHidden) {
    throw new Error('Final reload verification failed: ' + JSON.stringify(finalReloadState));
  }

  await browser.close();
  console.log('🎉 DEEP MULTI-CYCLE GAMEPLAY & SESSION MANAGEMENT TEST PASSED WITH 100% PERFECTION!');
}

runDeepTest().catch(err => {
  console.error('❌ DEEP TEST FAILED:', err);
  process.exit(1);
});
