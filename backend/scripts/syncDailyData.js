/**
 * 데일리 금리 지표 · 금리 뉴스 · 정부 부동산 정책 자동 수집 및 JSON 파일 저장 스크립트
 * 실행 방법: node backend/scripts/syncDailyData.js
 *
 * 1) 네이버 증권 MarketIndex API에서 한국은행 기준금리, 국고채(3년/5년/10년) 실시간 수집
 * 2) 구글 뉴스 RSS에서 최신 대한민국 금리/주담대 데일리 뉴스 수집
 * 3) 국토교통부/금융위원회/정책브리핑 뉴스 RSS에서 최신 부동산 대책·정책 수집
 * 4) backend/data/rates_cache.json 및 backend/data/policies_cache.json 파일로 영구 저장
 */

import { ensureFreshRatesAndNews, getInterestRateData } from '../services/interestRates.js';
import { ensureFreshPolicies, getPolicyData } from '../services/policyService.js';

async function main() {
  console.log('====================================================');
  console.log('[DailySync] 대한민국 금리 & 뉴스 & 정책 데이터 수집 시작...');
  console.log('====================================================');

  await ensureFreshRatesAndNews(true);
  await ensureFreshPolicies(true);

  const ratesData = getInterestRateData();
  const policiesData = getPolicyData();

  console.log('[DailySync] 금리 및 뉴스 데이터 저장 완료 -> backend/data/rates_cache.json');
  console.log(`  - 기준금리: ${ratesData.rates.baseRate.current}% (${ratesData.rates.baseRate.decisionDate} 결정, 차기: ${ratesData.rates.baseRate.nextMeetingDate})`);
  const bondsStr = (ratesData.rates.marketBonds || []).map(b => `${b.name}: ${b.rate}%`).join(' / ');
  console.log(`  - 시장 채권 금리: ${bondsStr}`);
  console.log(`  - 데일리 금리 뉴스: ${ratesData.news.length}건`);
  console.log('[DailySync] 정부 정책 데이터 저장 완료 -> backend/data/policies_cache.json');
  console.log(`  - 실시간 부동산 정책/보도자료: ${policiesData.scrapedPolicies.length}건`);
  console.log(`  - 최종 갱신 시각: ${ratesData.lastUpdated}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('[DailySync] 오류 발생:', err);
  process.exit(1);
});
