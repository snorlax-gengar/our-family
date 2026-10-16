import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  calculateNewbornLoan, 
  calculateBogeumjariLoan, 
  calculateDidimdolLoan, 
  calculateAllLoans, 
  calculateLoan 
} from './services/loanCalculator.js';
import { KOREA_INTEREST_RATES, getInterestRateData, scrapeInterestRateNews, ensureFreshRatesAndNews } from './services/interestRates.js';
import { getPolicyData, scrapeGovernmentPolicies } from './services/policyService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Load properties dataset helper
const propertiesFilePath = path.join(__dirname, 'data', 'properties.json');
function loadPropertiesData() {
  try {
    return JSON.parse(fs.readFileSync(propertiesFilePath, 'utf8'));
  } catch (err) {
    console.error("Failed to read properties.json:", err.message);
    return [];
  }
}
let propertiesData = loadPropertiesData();

/**
 * 1. 부동산 매물 API (신생아 특례, HF 보금자리론, 생애최초 디딤돌 지원)
 * 사용자 맞춤형 소득, 만기, 생애최초 여부, MCG 가입 여부, 대출 상품(loanType)에 따라
 * 각 매물별로 대출 가능액과 필요 자금 및 3대 대출 비교를 실시간 자동 계산하여 반환
 */
app.get('/api/properties', (req, res) => {
  propertiesData = loadPropertiesData();
  const {
    region, // '서울' or '경기' or '인천' or '전체'
    district, // '노원구', '도봉구', '부천시' etc.
    minPrice = 300000000,
    maxPrice = 900000000,
    annualIncome = 80000000,
    isFirstHome = 'false',
    loanTenureYears = 30,
    useMcg = 'true',
    preferentialDiscount = 0.2,
    loanType = 'newborn'
  } = req.query;

  const parsedMinPrice = parseInt(minPrice, 10);
  const parsedMaxPrice = parseInt(maxPrice, 10);
  const parsedIncome = parseInt(annualIncome, 10);
  const parsedIsFirstHome = isFirstHome === 'true';
  const parsedTenure = parseInt(loanTenureYears, 10);
  const parsedUseMcg = useMcg === 'true';
  const parsedDiscount = parseFloat(preferentialDiscount);

  let filtered = propertiesData.filter(item => {
    if (region && region !== '전체' && !item.region.includes(region)) return false;
    if (district && !item.district.includes(district)) return false;
    if (item.priceKrw < parsedMinPrice || item.priceKrw > parsedMaxPrice) return false;
    return true;
  });

  // 각 아파트별 대출 실시간 계산 및 3종 정책대출 비교 데이터 부착
  const results = filtered.map(item => {
    const loanParams = {
      propertyPrice: item.priceKrw,
      kbPrice: item.kbPrice?.generalAvg,
      areaSqMeter: item.areaSqMeter,
      region: item.region,
      district: item.district,
      annualIncome: parsedIncome,
      isFirstHome: parsedIsFirstHome,
      loanTenureYears: parsedTenure,
      useMcg: parsedUseMcg,
      preferentialDiscount: parsedDiscount
    };

    const loanCalc = calculateLoan({ loanType, ...loanParams });
    const allLoans = calculateAllLoans(loanParams);

    return {
      ...item,
      loanSimulation: loanCalc,
      allLoans
    };
  });

  res.json({
    total: results.length,
    criteria: {
      region: region || '전체',
      annualIncome: parsedIncome,
      isFirstHome: parsedIsFirstHome,
      loanTenureYears: parsedTenure,
      useMcg: parsedUseMcg,
      loanType
    },
    properties: results
  });
});

app.get('/api/properties/:id', (req, res) => {
  const property = propertiesData.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: "매물을 찾을 수 없습니다." });
  }

  const {
    loanType = 'newborn',
    annualIncome = 80000000,
    isFirstHome = 'false',
    loanTenureYears = 30,
    useMcg = 'true'
  } = req.query;

  const loanParams = {
    propertyPrice: property.priceKrw,
    kbPrice: property.kbPrice?.generalAvg,
    areaSqMeter: property.areaSqMeter,
    region: property.region,
    district: property.district,
    annualIncome: parseInt(annualIncome, 10),
    isFirstHome: isFirstHome === 'true',
    loanTenureYears: parseInt(loanTenureYears, 10),
    useMcg: useMcg === 'true',
    preferentialDiscount: 0.2
  };

  const loanCalc = calculateLoan({ loanType, ...loanParams });
  const allLoans = calculateAllLoans(loanParams);

  res.json({
    property,
    loanSimulation: loanCalc,
    allLoans
  });
});

/**
 * 대출 시뮬레이터 전용 커스텀 엔드포인트
 */
app.post('/api/properties/calculate', (req, res) => {
  const {
    propertyPrice,
    kbPrice,
    areaSqMeter = 84,
    region = '서울',
    district = '노원구',
    annualIncome = 80000000,
    isFirstHome = false,
    loanTenureYears = 30,
    useMcg = true,
    preferentialDiscount = 0.2,
    loanType = 'newborn'
  } = req.body;

  if (!propertyPrice) {
    return res.status(400).json({ error: "propertyPrice is required" });
  }

  const loanParams = {
    propertyPrice: Number(propertyPrice),
    kbPrice: kbPrice ? Number(kbPrice) : undefined,
    areaSqMeter: Number(areaSqMeter),
    region,
    district,
    annualIncome: Number(annualIncome),
    isFirstHome: Boolean(isFirstHome),
    loanTenureYears: Number(loanTenureYears),
    useMcg: Boolean(useMcg),
    preferentialDiscount: Number(preferentialDiscount)
  };

  const result = calculateLoan({ loanType, ...loanParams });
  const allLoans = calculateAllLoans(loanParams);

  res.json({
    ...result,
    allLoans
  });
});

/**
 * 2. 금리 데이터 & 데일리 금리 뉴스 API (1시간 주기 및 일자 변경 시 자동 최신화)
 */
app.get('/api/rates', async (req, res) => {
  try {
    const data = await ensureFreshRatesAndNews(false);
    res.json(data);
  } catch (err) {
    res.json(getInterestRateData());
  }
});

app.post('/api/rates/news/refresh', async (req, res) => {
  try {
    const data = await ensureFreshRatesAndNews(true);
    res.json({
      success: true,
      rates: data.rates,
      news: data.news,
      refreshedAt: data.lastUpdated
    });
  } catch (err) {
    res.status(500).json({ error: "뉴스 수집 실패", details: err.message });
  }
});

/**
 * 3. 부동산 용어집 & 정책 요약집 & 정책 스크래퍼 API
 */
app.get('/api/policies', (req, res) => {
  const data = getPolicyData();
  res.json(data);
});

app.post('/api/policies/refresh', async (req, res) => {
  try {
    const updatedPolicies = await scrapeGovernmentPolicies();
    res.json({
      success: true,
      scrapedPolicies: updatedPolicies,
      refreshedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "정책 스크래핑 실패", details: err.message });
  }
});

// ❤️ 4. 관심 단지 즐겨찾기 영구 저장 API (서버 파일 DB + 기기 간 공유 동기화)
const favoritesFilePath = path.join(__dirname, 'data', 'favorites.json');
function loadFavorites() {
  try {
    if (!fs.existsSync(favoritesFilePath)) {
      fs.writeFileSync(favoritesFilePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    return JSON.parse(fs.readFileSync(favoritesFilePath, 'utf8'));
  } catch (err) {
    console.error("Failed to read favorites.json:", err.message);
    return [];
  }
}

function saveFavorites(list) {
  try {
    fs.writeFileSync(favoritesFilePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to write favorites.json:", err.message);
  }
}

app.get('/api/favorites', (req, res) => {
  res.json({ favorites: loadFavorites() });
});

app.post('/api/favorites/toggle', (req, res) => {
  const { propertyId } = req.body;
  if (!propertyId) {
    return res.status(400).json({ error: "propertyId is required" });
  }
  const current = loadFavorites();
  const next = current.includes(propertyId)
    ? current.filter(id => id !== propertyId)
    : [...current, propertyId];
  saveFavorites(next);
  res.json({ favorites: next });
});

// 🚫 5. 필요 없는 단지 숨기기(제외) 영구 저장 API (서버 파일 DB + 기기 간 동기화)
const hiddenFilePath = path.join(__dirname, 'data', 'hidden.json');
function loadHidden() {
  try {
    if (!fs.existsSync(hiddenFilePath)) {
      fs.writeFileSync(hiddenFilePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    return JSON.parse(fs.readFileSync(hiddenFilePath, 'utf8'));
  } catch (err) {
    console.error("Failed to read hidden.json:", err.message);
    return [];
  }
}

function saveHidden(list) {
  try {
    fs.writeFileSync(hiddenFilePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to write hidden.json:", err.message);
  }
}

app.get('/api/hidden', (req, res) => {
  res.json({ hidden: loadHidden() });
});

app.post('/api/hidden/toggle', (req, res) => {
  const { propertyId } = req.body;
  if (!propertyId) {
    return res.status(400).json({ error: "propertyId is required" });
  }
  const current = loadHidden();
  const next = current.includes(propertyId)
    ? current.filter(id => id !== propertyId)
    : [...current, propertyId];
  saveHidden(next);
  res.json({ hidden: next });
});

app.post('/api/hidden/reset', (req, res) => {
  saveHidden([]);
  res.json({ hidden: [] });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static frontend files if built
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Backend] Real Estate Hub server listening on http://localhost:${PORT}`);
  // 서버 시작 시 실시간 한국은행 기준금리·국고채·데일리 금리 뉴스 초기 수집
  ensureFreshRatesAndNews(true).catch(() => {});
  // 6시간 주기로 백그라운드 자동 갱신
  setInterval(() => {
    ensureFreshRatesAndNews(true).catch(() => {});
  }, 6 * 60 * 60 * 1000);
});

