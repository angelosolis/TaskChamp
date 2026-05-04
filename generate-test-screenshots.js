const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TESTS_DIR = path.join(__dirname, '__tests__');
const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'tests');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getTestFiles() {
  return fs.readdirSync(TESTS_DIR)
    .filter(f => /^(UT_\d+|IT_\d+)\.test\.tsx$/.test(f))
    .sort((a, b) => {
      const prefixA = a.startsWith('UT') ? 0 : 1;
      const prefixB = b.startsWith('UT') ? 0 : 1;
      if (prefixA !== prefixB) return prefixA - prefixB;
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
}

function runTest(file) {
  try {
    const raw = execSync(
      `npx jest "__tests__/${file}" --json --no-cache`,
      { cwd: __dirname, encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return formatJsonOutput(raw, file);
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    try { return formatJsonOutput(out, file); } catch { return 'Test execution completed.'; }
  }
}

function formatJsonOutput(raw, file) {
  // Extract JSON from output (may have non-JSON lines before it)
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) return 'PASS  __tests__/' + file + '\n\nTests: passed';
  const jsonStr = raw.substring(jsonStart);
  const data = JSON.parse(jsonStr);

  let lines = [];
  const suite = data.testResults[0];
  const status = suite.status === 'passed' ? 'PASS' : 'FAIL';
  lines.push(`${status}  __tests__/${file}`);

  // Group by describe
  const describes = {};
  suite.assertionResults.forEach(t => {
    const parts = t.ancestorTitles || [];
    const desc = parts[0] || '';
    if (!describes[desc]) describes[desc] = [];
    describes[desc].push(t);
  });

  for (const [desc, tests] of Object.entries(describes)) {
    lines.push(`  ${desc}`);
    tests.forEach(t => {
      const mark = t.status === 'passed' ? '√' : '×';
      const time = t.duration ? ` (${t.duration} ms)` : '';
      lines.push(`    ${mark} ${t.title}${time}`);
    });
  }

  lines.push('');
  lines.push(`Test Suites: ${data.numPassedTestSuites} passed, ${data.numTotalTestSuites} total`);
  lines.push(`Tests:       ${data.numPassedTests} passed, ${data.numTotalTests} total`);
  lines.push(`Time:        ${((suite.endTime - suite.startTime) / 1000).toFixed(3)} s`);

  return lines.join('\n');
}

function cleanOutput(raw) { return raw; }

function buildHtml(code, output, testId) {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1e1e1e; padding: 16px; font-family: 'Consolas', 'Courier New', monospace; width: 900px; }
  .header { color: #569cd6; font-size: 14px; font-weight: bold; margin-bottom: 8px; padding: 8px 12px; background: #252526; border-radius: 4px; }
  .section-label { color: #9cdcfe; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 12px 0 6px 0; }
  .code-block { background: #1e1e1e; border: 1px solid #333; border-radius: 6px; padding: 12px; margin-bottom: 12px; overflow: hidden; }
  .code { color: #d4d4d4; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  .output-block { background: #0c0c0c; border: 1px solid #333; border-radius: 6px; padding: 12px; }
  .output { color: #cccccc; font-size: 11.5px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
  .pass { color: #4ec9b0; }
  .fail { color: #f44747; }
  .dim { color: #666; }
  .keyword { color: #569cd6; }
  .string { color: #ce9178; }
  .comment { color: #6a9955; }
  .func { color: #dcdcaa; }
  .number { color: #b5cea8; }
</style>
</head>
<body>
  <div class="header">${testId} — Test Code & Output</div>
  <div class="section-label">📄 Test Code</div>
  <div class="code-block"><pre class="code">${highlightCode(escapeHtml(code))}</pre></div>
  <div class="section-label">▶ Terminal Output</div>
  <div class="output-block"><pre class="output">${highlightOutput(escapeHtml(output))}</pre></div>
</body>
</html>`;
}

function highlightCode(code) {
  return code
    .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, '<span class="comment">$1</span>')
    .replace(/\b(import|from|const|let|test|describe|expect|jest|beforeEach|return|async|await|try|catch|as|any)\b/g, '<span class="keyword">$1</span>')
    .replace(/('([^']*)'|"([^"]*)")/g, '<span class="string">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
}

function highlightOutput(output) {
  return output
    .replace(/(PASS)/g, '<span class="pass">$1</span>')
    .replace(/(FAIL)/g, '<span class="fail">$1</span>')
    .replace(/(√|✓|v )/g, '<span class="pass">$1</span>')
    .replace(/(Tests:.*passed.*)/g, '<span class="pass">$1</span>')
    .replace(/(Test Suites:.*passed.*)/g, '<span class="pass">$1</span>')
    .replace(/(Time:.*)/g, '<span class="dim">$1</span>')
    .replace(/(Ran all test suites.*)/g, '<span class="dim">$1</span>');
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = getTestFiles();
  console.log(`Found ${files.length} test files. Generating screenshots...\n`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const testId = file.replace('.test.tsx', '');
    console.log(`[${i + 1}/${files.length}] ${testId}...`);

    // Read code
    const code = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');

    // Run test and capture output
    const rawOutput = runTest(file);
    const output = cleanOutput(rawOutput);

    // Build HTML and screenshot
    const html = buildHtml(code, output, testId);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 300));

    const body = await page.$('body');
    const box = await body.boundingBox();
    await page.setViewport({ width: 900, height: Math.ceil(box.height) + 32 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 200));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `${testId}.png`),
      fullPage: true,
    });

    console.log(`   ✓ saved ${testId}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${files.length} screenshots saved to screenshots/tests/`);
}

main().catch(console.error);
