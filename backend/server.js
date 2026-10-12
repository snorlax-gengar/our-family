import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { calculateNewbornLoan } from './services/loanCalculator.js';
import { KOREA_INTEREST_RATES, getInterestRateData, scrapeInterestRateNews } from './services/interestRates.js';
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
 * 1. 부동산 매물 API (서울 / 경기 신생아 특례 대상 4~8억 원대)
 * 사용자 맞춤형 소득, 만기, 생애최초 여부, MCG 가입 여부 파라미터에 따라
 * 각 매물별로 신생아 특례대출 가능액과 필요 자금을 실시간 자동 계산하여 반환
 */
app.get('/api/properties', (req, res) => {
  propertiesData = loadPropertiesData();
  const {
    region, // '서울' or '경기' or '전체'
    district, // '노원구', '도봉구', '수원시' etc.
    minPrice = 300000000,
    maxPrice = 900000000,
    annualIncome = 80000000,
    isFirstHome = 'false',
    loanTenureYears = 30,
    useMcg = 'true',
    preferentialDiscount = 0.2
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

  // 각 아파트별 신생아 특례대출 실시간 계산 부착
  const results = filtered.map(item => {
    const loanCalc = calculateNewbornLoan({
      propertyPrice: item.priceKrw,
      areaSqMeter: item.areaSqMeter,
      region: item.region,
      district: item.district,
      annualIncome: parsedIncome,
      isFirstHome: parsedIsFirstHome,
      loanTenureYears: parsedTenure,
      useMcg: parsedUseMcg,
      preferentialDiscount: parsedDiscount
    });

    return {
      ...item,
      loanSimulation: loanCalc
    };
  });

  res.json({
    total: results.length,
    criteria: {
      region: region || '전체',
      annualIncome: parsedIncome,
      isFirstHome: parsedIsFirstHome,
      loanTenureYears: parsedTenure,
      useMcg: parsedUseMcg
    },
    properties: results
  });
});

app.get('/api/properties/:id', (req, res) => {
  const property = propertiesData.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: "매물을 찾을 수 없습니다." });
  }

  // 기본 시뮬레이션 첨부
  const loanCalc = calculateNewbornLoan({
    propertyPrice: property.priceKrw,
    areaSqMeter: property.areaSqMeter,
    region: property.region,
    district: property.district
  });

  res.json({
    property,
    loanSimulation: loanCalc
  });
});

/**
 * 대출 시뮬레이터 전용 커스텀 엔드포인트
 */
app.post('/api/properties/calculate', (req, res) => {
  const {
    propertyPrice,
    areaSqMeter = 84,
    region = '서울',
    district = '노원구',
    annualIncome = 80000000,
    isFirstHome = false,
    loanTenureYears = 30,
    useMcg = true,
    preferentialDiscount = 0.2
  } = req.body;

  if (!propertyPrice) {
    return res.status(400).json({ error: "propertyPrice is required" });
  }

  const result = calculateNewbornLoan({
    propertyPrice: Number(propertyPrice),
    areaSqMeter: Number(areaSqMeter),
    region,
    district,
    annualIncome: Number(annualIncome),
    isFirstHome: Boolean(isFirstHome),
    loanTenureYears: Number(loanTenureYears),
    useMcg: Boolean(useMcg),
    preferentialDiscount: Number(preferentialDiscount)
  });

  res.json(result);
});

/**
 * 2. 금리 데이터 & 데일리 금리 뉴스 API
 */
app.get('/api/rates', (req, res) => {
  const data = getInterestRateData();
  res.json(data);
});

app.post('/api/rates/news/refresh', async (req, res) => {
  try {
    const updatedNews = await scrapeInterestRateNews();
    res.json({
      success: true,
      news: updatedNews,
      refreshedAt: new Date().toISOString()
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
});

