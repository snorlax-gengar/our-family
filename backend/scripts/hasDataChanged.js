/**
 * 금리·뉴스·정책 캐시가 "내용상" 바뀌었는지 판정 (GitHub Actions 전용)
 *
 * 수집할 때마다 바뀌는 값(lastUpdated 시각, 뉴스 id 의 랜덤 꼬리표)은 무시하고 비교한다.
 * 내용이 같으면 커밋하지 않으므로, Cloudflare 무료 빌드 시간(월 3,000분)을 아낄 수 있다.
 *
 * 종료 코드: 0 = 변경 있음(커밋 필요), 1 = 변경 없음
 */
import fs from 'fs';
import { execSync } from 'child_process';

const FILES = ['backend/data/rates_cache.json', 'backend/data/policies_cache.json'];
const IGNORE_KEYS = new Set(['lastUpdated', 'id']);

const normalize = (v) => {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) if (!IGNORE_KEYS.has(k)) out[k] = normalize(v[k]);
    return out;
  }
  return v;
};

let changed = false;
for (const f of FILES) {
  let before = '{}';
  try {
    before = execSync(`git show HEAD:${f}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {}
  const after = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '{}';
  const same = JSON.stringify(normalize(JSON.parse(before))) === JSON.stringify(normalize(JSON.parse(after)));
  console.log(`[hasDataChanged] ${f}: ${same ? '변경 없음' : '변경 있음'}`);
  if (!same) changed = true;
}
process.exit(changed ? 0 : 1);
