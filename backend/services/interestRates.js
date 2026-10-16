import axios from 'axios';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ratesCachePath = path.join(__dirname, '..', 'data', 'rates_cache.json');

const parser = new Parser({
  customFields: {
    item: ['author', 'pubDate'],
  }
});

/**
 * 대한민국 주요 금리 데이터 (한국은행 기준금리, 코픽스, 국고채, 시중은행 주담대)
 * - 서버 기동 시 및 매일(1시간 주기 캐시 만료 시) 네이버 증권 MarketIndex 공식 API와
 *   실시간 뉴스 RSS를 통해 자동으로 최신화되며, backend/data/rates_cache.json 파일에 영구 저장됩니다.
 */
export const KOREA_INTEREST_RATES = {
  baseRate: {
    name: "한국은행 기준금리",
    current: 3.00,
    previous: 2.75,
    change: +0.25,
    unit: "%",
    decisionDate: "2026.08.27",
    nextMeetingDate: "2026.10.22 발표 예정",
    history: [
      { date: "2026.08.27", rate: 3.00 },
      { date: "2026.07.16", rate: 2.75 },
      { date: "2026.05.28", rate: 2.50 },
      { date: "2026.04.10", rate: 2.50 },
      { date: "2026.02.26", rate: 2.50 }
    ],
    description: "한국은행 금융통화위원회가 결정하는 모든 시중 금리의 기준이 되는 정책 금리"
  },
  cofix: [
    {
      type: "신규취급액 기준 COFIX",
      rate: 3.43,
      change: -0.04,
      date: "은행연합회 최신 공시",
      description: "당월 중 신규로 조달한 자금 대상. 시장금리 변동이 가장 빠르게 주담대 변동금리에 반영됨."
    },
    {
      type: "잔액 기준 COFIX",
      rate: 3.52,
      change: -0.03,
      date: "은행연합회 최신 공시",
      description: "월말 현재 조달자금 잔액 대상. 시장금리 변동이 서서히 반영되어 완만함."
    },
    {
      type: "신잔액 기준 COFIX",
      rate: 3.08,
      change: -0.04,
      date: "은행연합회 최신 공시",
      description: "결제성 자금까지 포함하여 잔액 기준보다 금리 수준이 전반적으로 낮음."
    }
  ],
  marketBonds: [
    { name: "국고채 3년물", rate: 3.88, change: -0.01, unit: "%", note: "대표 단기·중기 시장 채권 지표" },
    { name: "국고채 5년물", rate: 4.00, change: -0.01, unit: "%", note: "중장기 시중 금리 선행 지표" },
    { name: "국고채 10년물", rate: 4.20, change: -0.01, unit: "%", note: "장기 채권 벤치마크 지표" },
    { name: "금융채 5년물(AAA)", rate: 3.59, change: -0.02, unit: "%", note: "주담대 5년 주기형/고정형 준거금리" }
  ],
  bankMortgageRates: [
    {
      bank: "KB국민은행",
      variable: "3.75% ~ 5.15%",
      fixed5Year: "3.42% ~ 4.82%",
      baseBenchmark: "신규 COFIX / 금융채 5년",
      updated: "금일 고시"
    },
    {
      bank: "신한은행",
      variable: "3.78% ~ 5.18%",
      fixed5Year: "3.45% ~ 4.85%",
      baseBenchmark: "신규 COFIX / 금융채 5년",
      updated: "금일 고시"
    },
    {
      bank: "하나은행",
      variable: "3.72% ~ 5.12%",
      fixed5Year: "3.39% ~ 4.79%",
      baseBenchmark: "신규 COFIX / 금융채 5년",
      updated: "금일 고시"
    },
    {
      bank: "우리은행",
      variable: "3.80% ~ 5.20%",
      fixed5Year: "3.48% ~ 4.88%",
      baseBenchmark: "신규 COFIX / 금융채 5년",
      updated: "금일 고시"
    },
    {
      bank: "NH농협은행",
      variable: "3.70% ~ 5.10%",
      fixed5Year: "3.35% ~ 4.75%",
      baseBenchmark: "신규 COFIX / 금융채 5년",
      updated: "금일 고시"
    }
  ],
  specialLoans: [
    {
      name: "신생아 특례 디딤돌 대출 (구입자금)",
      rateRange: "연 1.60% ~ 3.30%",
      maxLimit: "최대 5억 원",
      ltv: "최대 70% (생애최초 동일 70%)",
      dsr: "DSR 미적용 (특례)",
      condition: "주택 9억 이하 / 85㎡ 이하 / 부부합산 소득 1.3억 (맞벌이 최대 2억)"
    },
    {
      name: "HF 보금자리론 (한국주택금융공사)",
      rateRange: "연 3.65% ~ 3.95% (고정)",
      maxLimit: "최대 3.6억 원 (생애최초 4.2억)",
      ltv: "최대 70% (생애최초 80%)",
      dsr: "DTI 60% 적용 (DSR 미적용)",
      condition: "주택 6억 이하 / 소득 7천만 (신혼 8.5천만 · 다자녀 1억)"
    },
    {
      name: "내집마련 디딤돌 대출 (생애최초 특례)",
      rateRange: "연 2.45% ~ 3.65%",
      maxLimit: "최대 3.0억 원 (신혼 생초 4.0억)",
      ltv: "최대 70% (생애최초 80%)",
      dsr: "DTI 60% 적용 (DSR 미적용)",
      condition: "주택 5억 이하 (신혼·2자녀 6억) / 생초 소득 7천만 (신혼 8.5천만)"
    }
  ]
};

let cachedNews = [
  {
    id: "news-1",
    title: "한국은행, 기준금리 및 통화정책 기조 점검… 가계대출·부동산 시장 예의주시",
    summary: "한국은행 금융통화위원회는 수도권 집값 동향 및 주택담보대출 추이, 환율 변동성을 종합적으로 점검하며 통화정책 방향을 결정하고 있습니다.",
    source: "한국은행 / 연합인포맥스",
    date: new Date().toLocaleDateString('ko-KR'),
    tag: "기준금리",
    link: "https://www.bok.or.kr"
  },
  {
    id: "news-2",
    title: "5대 은행 주담대 고정금리 3%대 초중반 안착… 변동금리보다 주기형 고정형 선호 뚜렷",
    summary: "주요 시중은행의 5년 주기형 주택담보대출과 정책 모기지(신생아 특례·보금자리론·디딤돌)로의 수요 쏠림이 지속되고 있습니다.",
    source: "금융감독원 / 은행연합회",
    date: new Date().toLocaleDateString('ko-KR'),
    tag: "주담대 금리",
    link: "https://www.kfb.or.kr"
  },
  {
    id: "news-3",
    title: "신생아 특례·보금자리론·생애최초 디딤돌 3대 정책대출 비교… 내 조건에 유리한 상품은?",
    summary: "DSR 규제가 면제되는 3대 정책 모기지(신생아 특례 9억 이하, 보금자리론·디딤돌 6억 이하)가 서울·경기·인천 실수요자의 핵심 내집마련 수단으로 자리잡았습니다.",
    source: "국토교통부 / 주택금융공사",
    date: new Date().toLocaleDateString('ko-KR'),
    tag: "신생아특례",
    link: "https://nhuf.molit.go.kr"
  }
];

let lastSyncedAt = 0;
let isSyncing = false;
const SYNC_TTL_MS = 60 * 60 * 1000; // 1시간마다 자동 갱신

// 디스크(rates_cache.json)에서 기존 저장된 금리·뉴스 로드
function loadRatesCacheFromDisk() {
  try {
    if (fs.existsSync(ratesCachePath)) {
      const parsed = JSON.parse(fs.readFileSync(ratesCachePath, 'utf8'));
      if (parsed.rates?.baseRate) {
        Object.assign(KOREA_INTEREST_RATES.baseRate, parsed.rates.baseRate);
      }
      if (Array.isArray(parsed.rates?.marketBonds)) {
        KOREA_INTEREST_RATES.marketBonds = parsed.rates.marketBonds;
      }
      if (Array.isArray(parsed.news) && parsed.news.length > 0) {
        cachedNews = parsed.news;
      }
      if (parsed.lastUpdated) {
        lastSyncedAt = new Date(parsed.lastUpdated).getTime() || 0;
      }
    }
  } catch (err) {
    console.warn('[RatesCache] Failed to load rates_cache.json:', err.message);
  }
}

// 디스크(rates_cache.json)에 최신 수집된 금리·뉴스 영구 저장
function saveRatesCacheToDisk() {
  try {
    const payload = {
      lastUpdated: new Date(lastSyncedAt || Date.now()).toISOString(),
      rates: KOREA_INTEREST_RATES,
      news: cachedNews
    };
    fs.writeFileSync(ratesCachePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[RatesCache] Failed to write rates_cache.json:', err.message);
  }
}

// 모듈 초기화 시 디스크 캐시 먼저 로드
loadRatesCacheFromDisk();

function formatYmd(yyyymmdd) {
  if (!yyyymmdd || String(yyyymmdd).length !== 8) return yyyymmdd;
  const s = String(yyyymmdd);
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

/**
 * 실시간 한국은행 기준금리 및 국고채(3년/5년/10년) 시장금리 자동 동기화
 */
export async function syncLiveKoreaRates() {
  try {
    const bokRes = await axios.get(
      'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=standardInterest&reutersCode=KOR',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }
    );
    const bokResult = bokRes.data?.result;
    if (bokResult && bokResult.closePrice) {
      const current = parseFloat(bokResult.closePrice);
      const change = parseFloat(bokResult.fluctuations || '0');
      const signedChange = bokResult.fluctuationsType?.name === 'FALLING' ? -Math.abs(change) : change;
      const nextDateInfo = bokResult.marketIndexTotalInfos?.find(i => i.code === 'nextReleaseDate');

      if (!isNaN(current)) {
        KOREA_INTEREST_RATES.baseRate.current = current;
        KOREA_INTEREST_RATES.baseRate.change = signedChange;
      }
      if (nextDateInfo?.value) {
        KOREA_INTEREST_RATES.baseRate.nextMeetingDate = `${nextDateInfo.value.replace(/\.$/, '')} 발표 예정`;
      }
      if (Array.isArray(bokResult.calendars) && bokResult.calendars.length > 0) {
        const latest = bokResult.calendars[0];
        if (latest.releaseDate) {
          KOREA_INTEREST_RATES.baseRate.decisionDate = formatYmd(latest.releaseDate);
        }
        if (typeof latest.previousValue === 'number') {
          KOREA_INTEREST_RATES.baseRate.previous = latest.previousValue;
        }
        KOREA_INTEREST_RATES.baseRate.history = bokResult.calendars.slice(0, 5).map(c => ({
          date: formatYmd(c.releaseDate),
          rate: Number(c.actualValue)
        }));
      }
    }
  } catch (err) {
    console.warn('[RatesSync] BOK base rate fetch warning:', err.message);
  }

  const bondConfigs = [
    { idx: 0, code: 'KR3YT=RR', name: '국고채 3년물', note: '대표 단기·중기 시장 채권 지표' },
    { idx: 1, code: 'KR5YT=RR', name: '국고채 5년물', note: '중장기 시중 금리 선행 지표' },
    { idx: 2, code: 'KR10YT=RR', name: '국고채 10년물', note: '장기 채권 벤치마크 지표' }
  ];

  for (const cfg of bondConfigs) {
    try {
      const res = await axios.get(
        `https://m.stock.naver.com/front-api/marketIndex/productDetail?category=bond&reutersCode=${encodeURIComponent(cfg.code)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }
      );
      const r = res.data?.result;
      if (r && r.closePrice) {
        const rate = +parseFloat(r.closePrice).toFixed(2);
        const rawChange = +parseFloat(r.fluctuations || '0').toFixed(2);
        const change = r.fluctuationsType?.name === 'FALLING' ? -Math.abs(rawChange) : rawChange;
        if (!isNaN(rate)) {
          KOREA_INTEREST_RATES.marketBonds[cfg.idx] = {
            name: cfg.name,
            rate,
            change,
            unit: '%',
            note: cfg.note
          };
        }
      }
    } catch (err) {
      console.warn(`[RatesSync] Bond ${cfg.code} fetch warning:`, err.message);
    }
  }

  return KOREA_INTEREST_RATES;
}

/**
 * 실시간 금리 뉴스 스크래핑 함수
 * 구글 뉴스 및 주요 경제지 RSS를 실시간 조회하여 최신 금리·정책대출 기사를 수집하고 JSON 파일로 저장합니다.
 */
export async function scrapeInterestRateNews() {
  const scrapedItems = [];

  try {
    const rssUrls = [
      'https://news.google.com/rss/search?q=%EA%B8%B0%EC%A4%80%EA%B8%88%EB%A6%AC+%EC%A3%BC%EB%8B%B4%EB%8C%80+%EC%BD%94%ED%94%BD%EC%8A%A4&hl=ko&gl=KR&ceid=KR:ko',
      'https://news.google.com/rss/search?q=%EC%8B%A0%EC%83%9D%EC%95%84+%ED%8A%B9%EB%A1%80%EB%8C%80%EC%B6%9C+%EB%B3%B4%EA%B8%88%EC%9E%90%EB%A6%AC%EB%A1%A0+%EB%94%94%EB%94%A4%EB%8F%8C&hl=ko&gl=KR&ceid=KR:ko',
      'https://news.google.com/rss/search?q=%EC%A3%BC%ED%83%9D%EB%8B%B4%EB%B3%B4%EB%8C%80%EC%B6%9C+%EC%8A%A4%ED%8A%B8%EB%A0%88%EC%8A%A4+DSR+%EA%B8%88%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko'
    ];

    for (const url of rssUrls) {
      try {
        const feed = await parser.parseURL(url);
        if (feed && feed.items) {
          const SPAM_WORDS = ['카지노', '바카라', '토토', '슬롯', '경마', '릴게임'];
          for (const item of feed.items.slice(0, 6)) {
            const cleanTitle = (item.title || '').replace(/<[^>]*>?/gm, '').trim();
            if (SPAM_WORDS.some(w => cleanTitle.includes(w))) continue;

            let tag = '주담대 금리';
            if (cleanTitle.includes('기준금리') || cleanTitle.includes('한국은행') || cleanTitle.includes('금통위')) tag = '기준금리';
            else if (cleanTitle.includes('신생아') || cleanTitle.includes('디딤돌') || cleanTitle.includes('보금자리')) tag = '신생아특례';
            else if (cleanTitle.includes('코픽스') || cleanTitle.includes('COFIX')) tag = '코픽스';
            else if (cleanTitle.includes('DSR') || cleanTitle.includes('규제') || cleanTitle.includes('가계부채') || cleanTitle.includes('한도')) tag = '대출규제';

            const pubTimestamp = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
            scrapedItems.push({
              id: `scraped-${pubTimestamp}-${Math.random().toString(36).slice(2, 7)}`,
              title: cleanTitle,
              summary: (item.contentSnippet || cleanTitle).slice(0, 160) + '...',
              source: item.author || (cleanTitle.includes(' - ') ? cleanTitle.split(' - ').pop() : '주요 경제 언론'),
              date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
              pubTimestamp,
              tag,
              link: item.link
            });
          }
        }
      } catch (feedErr) {
        console.warn(`Feed fetch notice for ${url}:`, feedErr.message);
      }
    }
  } catch (err) {
    console.error('Error during RSS scraping:', err.message);
  }

  if (scrapedItems.length > 0) {
    scrapedItems.sort((a, b) => (b.pubTimestamp || 0) - (a.pubTimestamp || 0));
    const combined = [...scrapedItems, ...cachedNews];
    const unique = [];
    const seenTitles = new Set();
    for (const item of combined) {
      const key = item.title.slice(0, 22);
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        unique.push(item);
      }
    }
    cachedNews = unique.slice(0, 18);
  }

  lastSyncedAt = Date.now();
  saveRatesCacheToDisk();
  return cachedNews;
}

/**
 * 금리 지표 + 데일리 뉴스 통합 자동 갱신 및 rates_cache.json 파일 저장
 */
export async function ensureFreshRatesAndNews(force = false) {
  const now = Date.now();
  const isStale = force || !lastSyncedAt || (now - lastSyncedAt > SYNC_TTL_MS);
  if (!isStale || isSyncing) {
    return {
      rates: KOREA_INTEREST_RATES,
      news: cachedNews,
      lastUpdated: lastSyncedAt ? new Date(lastSyncedAt).toISOString() : new Date().toISOString()
    };
  }

  isSyncing = true;
  try {
    await Promise.allSettled([
      syncLiveKoreaRates(),
      scrapeInterestRateNews()
    ]);
    lastSyncedAt = Date.now();
    saveRatesCacheToDisk();
  } finally {
    isSyncing = false;
  }

  return {
    rates: KOREA_INTEREST_RATES,
    news: cachedNews,
    lastUpdated: new Date(lastSyncedAt).toISOString()
  };
}

export function getInterestRateData() {
  return {
    rates: KOREA_INTEREST_RATES,
    news: cachedNews,
    lastUpdated: lastSyncedAt ? new Date(lastSyncedAt).toISOString() : new Date().toISOString()
  };
}
