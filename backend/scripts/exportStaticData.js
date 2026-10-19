/**
 * 정적 사이트용 데이터 내보내기 (빌드 단계에서 실행)
 *
 * 서버 없이 운영하기 위해, 백엔드가 API로 내려주던 데이터를 JSON 파일로 만들어
 * frontend/public/data/ 에 둔다. 프론트엔드는 이 파일을 직접 읽는다.
 *   - properties.json : 단지 데이터 (backend/data/properties.json 그대로)
 *   - rates.json      : 금리 지표 + 금리 뉴스 (rates_cache.json + 기본 금리표)
 *   - policies.json   : 용어사전 + 현행 정책 + 정책 뉴스 (policies_cache.json + 정책 상수)
 *
 * 금리·뉴스·정책 캐시는 GitHub Actions(daily-data-sync.yml)가 하루 2회 갱신해 커밋하고,
 * 커밋이 들어오면 호스팅(Cloudflare Pages)이 다시 빌드하면서 이 스크립트가 최신 값을 내보낸다.
 * 이 스크립트는 네트워크 요청을 하지 않는다(캐시 파일만 읽음).
 *
 * 실행: node backend/scripts/exportStaticData.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getInterestRateData } from '../services/interestRates.js';
import { getPolicyData } from '../services/policyService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const outDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'data');

fs.mkdirSync(outDir, { recursive: true });

const write = (name, obj) => {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(obj));
  return name;
};

const properties = JSON.parse(fs.readFileSync(path.join(dataDir, 'properties.json'), 'utf8'));
const files = [
  write('properties.json', properties),
  write('rates.json', getInterestRateData()),
  write('policies.json', getPolicyData()),
];

console.log(`[exportStaticData] ${files.join(', ')} → frontend/public/data (단지 ${properties.length}개)`);
