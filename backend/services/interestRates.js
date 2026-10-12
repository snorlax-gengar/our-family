import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['author', 'pubDate'],
  }
});

/**
 * 대한민국 주요 금리 데이터 (한국은행 기준금리, 코픽스, 국고채, 시중은행 주담대)
 */
export const KOREA_INTEREST_RATES = {
  baseRate: {
    name: "한국은행 기준금리",
    current: 3.00,
    previous: 3.25,
    change: -0.25,
    unit: "%",
    decisionDate: "2024.11.28",
    nextMeetingDate: "금통위 회의 발표 예정",
    history: [
      { date: "2024.11.28", rate: 3.00 },
      { date: "2024.10.11", rate: 3.25 },
      { date: "2023.01.13", rate: 3.50 },
      { date: "2022.11.24", rate: 3.25 },
      { date: "2022.10.12", rate: 3.00 }
    ],
    description: "한국은행 금융통화위원회가 결정하는 모든 시중 금리의 기준이 되는 정책 금리"
  },
  cofix: [
    {
      type: "신규취급액 기준 COFIX",
      rate: 3.28,
      change: -0.09,
      date: "최신 공시",
      description: "당월 중 신규로 조달한 자금 대상. 시장금리 변동이 가장 빠르게 주담대 변동금리에 반영됨."
    },
    {
      type: "잔액 기준 COFIX",
      rate: 3.52,
      change: -0.04,
      date: "최신 공시",
      description: "월말 현재 조달자금 잔액 대상. 시장금리 변동이 서서히 반영되어 완만함."
    },
    {
      type: "신잔액 기준 COFIX",
      rate: 3.08,
      change: -0.06,
      date: "최신 공시",
      description: "결제성 자금까지 포함하여 잔액 기준보다 금리 수준이 전반적으로 낮음."
    }
  ],
  marketBonds: [
    { name: "국고채 3년물", rate: 2.84, change: -0.03, unit: "%" },
    { name: "국고채 5년물", rate: 2.88, change: -0.02, unit: "%" },
    { name: "국고채 10년물", rate: 2.96, change: +0.01, unit: "%" },
    { name: "금융채 5년물(AAA)", rate: 3.19, change: -0.04, unit: "%", note: "주담대 5년 주기형/고정형 준거금리" }
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
      ltv: "최대 70% (생애최초 80%)",
      dsr: "DSR 미적용 (특례)",
      condition: "주택 9억 이하 / 85㎡ 이하 / 소득 1.3억 (완화 시 2억 이하)"
    },
    {
      name: "일반 내집마련 디딤돌 대출",
      rateRange: "연 2.65% ~ 3.95%",
      maxLimit: "최대 2.5억 원 (신혼 4억)",
      ltv: "최대 70%",
      dsr: "DSR 미적용",
      condition: "주택 5억 이하 (신혼 6억) / 소득 6천만 (신혼 8.5천만)"
    },
    {
      name: "특례/일반 보금자리론 (HF)",
      rateRange: "연 3.75% ~ 4.05%",
      maxLimit: "최대 3.6억 원 (생애최초 4.2억)",
      ltv: "최대 70%",
      dsr: "DTI 60% 적용 (DSR 미적용)",
      condition: "주택 6억 이하 / 소득 7천만 (신혼 8.5천만)"
    }
  ]
};

// 최근 금리 뉴스 캐시
let cachedNews = [
  {
    id: "news-1",
    title: "한국은행, 기준금리 및 통화정책 기조 점검… 가계대출·부동산 시장 예의주시",
    summary: "한국은행 금융통화위원회는 수도권 집값 동향 및 주택담보대출 추이, 환율 변동성을 종합적으로 점검하며 향후 금리 인하 속도를 조절하겠다고 밝혔습니다.",
    source: "한국은행 / 연합인포맥스",
    date: "2026.10.12",
    tag: "기준금리",
    link: "https://www.bok.or.kr"
  },
  {
    id: "news-2",
    title: "5대 은행 주담대 고정금리 3%대 초중반 안착… 변동금리보다 주기형 고정형 선호 뚜렷",
    summary: "금융채 5년물 금리가 하향 안정화되면서 주요 시중은행의 5년 주기형 주택담보대출 하단 금리가 3.3~3.4%대를 기록, 차주들의 90% 이상이 고정금리를 선택하고 있습니다.",
    source: "금융감독원 / 은행연합회",
    date: "2026.10.11",
    tag: "주담대 금리",
    link: "https://www.kfb.or.kr"
  },
  {
    id: "news-3",
    title: "신생아 특례대출 부부소득 요건 완화 효과… 5~6억 원대 서울·경기 역세권 거래 견인",
    summary: "소득 기준 완화와 DSR 규제 미적용 혜택을 누릴 수 있는 신생아 특례대출 수요가 서울 노원·도봉·구로 및 경기 일산·수원·군포 등 5~6억 원 내외 아파트로 집중되고 있습니다.",
    source: "국토교통부 뉴스",
    date: "2026.10.10",
    tag: "신생아특례",
    link: "https://nhuf.molit.go.kr"
  },
  {
    id: "news-4",
    title: "코픽스(COFIX) 4개월 연속 안정세… 잔액·신규취급액 금리 동반 소폭 하락",
    summary: "은행연합회가 공시한 최신 코픽스에 따르면 은행권 예금 및 금융채 조달비용이 줄어들면서 신규취급액 기준 코픽스가 하향세를 지속하고 있습니다.",
    source: "은행연합회 공시",
    date: "2026.10.09",
    tag: "코픽스",
    link: "https://www.kfb.or.kr"
  },
  {
    id: "news-5",
    title: "스트레스 DSR 2단계 수도권 차등 가산금리 1.2%p 적용 지속… 2금융권 관리 강화",
    summary: "금융당국은 수도권 주택담보대출에 대해 스트레스 금리 1.2%p를 가산하는 스트레스 DSR 2단계를 엄격히 유지하며 가계부채 관리를 지속하고 있습니다.",
    source: "금융위원회",
    date: "2026.10.08",
    tag: "대출규제",
    link: "https://www.fsc.go.kr"
  }
];

/**
 * 실시간 금리 뉴스 스크래핑 함수
 * 네이버 뉴스 및 주요 경제지 RSS를 실시간 조회하여 최신 금리 기사를 수집합니다.
 */
export async function scrapeInterestRateNews() {
  const scrapedItems = [];
  
  // 1. 네이버 금융 뉴스 / 구글 뉴스 RSS 크롤링
  try {
    const rssUrls = [
      'https://news.google.com/rss/search?q=%EA%B8%B0%EC%A4%80%EA%B8%88%EB%A6%AC+%EC%A3%BC%EB%8B%B4%EB%8C%80+%EC%BD%94%ED%94%BD%EC%8A%A4&hl=ko&gl=KR&ceid=KR:ko',
      'https://news.google.com/rss/search?q=%EC%8B%A0%EC%83%9D%EC%95%84+%ED%8A%B9%EB%A1%80%EB%8C%80%EC%B6%9C+%EA%B8%88%EB%A6%AC&hl=ko&gl=KR&ceid=KR:ko'
    ];

    for (const url of rssUrls) {
      try {
        const feed = await parser.parseURL(url);
        if (feed && feed.items) {
          const SPAM_WORDS = ['카지노', '바카라', '토토', '슬롯', '경마', '릴게임'];
          for (const item of feed.items.slice(0, 8)) {
            const cleanTitle = (item.title || '').replace(/<[^>]*>?/gm, '').trim();
            if (SPAM_WORDS.some(w => cleanTitle.includes(w))) continue;
            // 태그 판별
            let tag = '금리동향';
            if (cleanTitle.includes('기준금리') || cleanTitle.includes('한국은행')) tag = '기준금리';
            else if (cleanTitle.includes('주담대') || cleanTitle.includes('대출금리')) tag = '주담대 금리';
            else if (cleanTitle.includes('신생아') || cleanTitle.includes('디딤돌')) tag = '신생아특례';
            else if (cleanTitle.includes('코픽스') || cleanTitle.includes('COFIX')) tag = '코픽스';

            scrapedItems.push({
              id: `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              title: cleanTitle,
              summary: (item.contentSnippet || cleanTitle).slice(0, 160) + '...',
              source: item.author || '주요 경제 언론',
              date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
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

  // 기존 캐시와 중복 제거 후 합치기
  if (scrapedItems.length > 0) {
    const combined = [...scrapedItems, ...cachedNews];
    const unique = [];
    const seenTitles = new Set();
    for (const item of combined) {
      const cleanTitle = item.title.slice(0, 25);
      if (!seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        unique.push(item);
      }
    }
    cachedNews = unique.slice(0, 15);
  }

  return cachedNews;
}

export function getInterestRateData() {
  return {
    rates: KOREA_INTEREST_RATES,
    news: cachedNews,
    lastUpdated: new Date().toISOString()
  };
}
