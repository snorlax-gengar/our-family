/**
 * 정적 데이터 API (서버 없이 동작)
 *
 * 예전에는 Express 서버(/api/...)가 단지 목록에 대출 계산을 붙여 내려주었지만,
 * 이제는 빌드 때 만들어진 /data/*.json 을 직접 읽고 대출 계산도 브라우저에서 한다.
 * 결과 형태는 기존 /api/properties 응답과 동일하다.
 */
import { calculateLoan, calculateAllLoans, formatKrw } from './loanCalculator.js';
import { calculateAllInCashReceipt } from './closingCostCalculator.js';

const fetchJson = async (url, { fresh = false } = {}) => {
  const res = await fetch(url, { cache: fresh ? 'reload' : 'no-cache' });
  if (!res.ok) throw new Error(`${url} 불러오기 실패 (${res.status})`);
  return res.json();
};

let propertiesPromise = null;
const loadRawProperties = () => {
  if (!propertiesPromise) {
    propertiesPromise = fetchJson('/data/properties.json').catch((err) => {
      propertiesPromise = null; // 실패 시 다음 호출에서 재시도
      throw err;
    });
  }
  return propertiesPromise;
};

/** 기존 GET /api/properties 와 같은 계산: 단지별 선택 대출 + 3대 대출 비교 + 부대비용 포함 총현금 */
export async function getProperties({
  region,
  district,
  minPrice = 0,
  maxPrice = 3000000000,
  annualIncome = 80000000,
  isFirstHome = false,
  loanTenureYears = 30,
  useMcg = true,
  preferentialDiscount = 0.2,
  loanType = 'newborn',
  repaymentMethod = 'level',
} = {}) {
  const all = await loadRawProperties();
  const income = Number(annualIncome);
  const tenure = Number(loanTenureYears);
  const discount = Number(preferentialDiscount);

  return all
    .filter((item) => {
      if (region && region !== '전체' && !item.region.includes(region)) return false;
      if (district && !item.district.includes(district)) return false;
      if (item.priceKrw < minPrice || item.priceKrw > maxPrice) return false;
      return true;
    })
    .map((item) => {
      const loanParams = {
        propertyPrice: item.priceKrw,
        kbPrice: item.kbPrice?.generalAvg,
        areaSqMeter: item.areaSqMeter,
        region: item.region,
        district: item.district,
        annualIncome: income,
        isFirstHome: Boolean(isFirstHome),
        loanTenureYears: tenure,
        useMcg: Boolean(useMcg),
        preferentialDiscount: discount,
        repaymentMethod,
      };
      const loanSimulation = calculateLoan({ loanType, ...loanParams });
      const allLoans = calculateAllLoans(loanParams);
      const defaultTaxRelief = isFirstHome
        ? 'firstHome'
        : loanType === 'newborn'
        ? 'newborn'
        : 'none';
      const closingReceipt = calculateAllInCashReceipt({
        priceKrw: item.priceKrw,
        loanAmount: loanSimulation.maxLoanAmount || 0,
        areaSqMeter: item.areaSqMeter,
        pyeong: item.pyeong,
        region: item.region,
        taxReliefType: defaultTaxRelief,
        includeBrokerVat: true,
        registrationMode: 'lawyer',
        includeMoving: false,
        interiorLevel: 'none',
      });
      return {
        ...item,
        loanSimulation: {
          ...loanSimulation,
          allInCash: closingReceipt.totalAllInCash,
          allInCashFormatted: formatKrw(closingReceipt.totalAllInCash),
          mandatoryClosingCosts: closingReceipt.mandatoryClosingCosts,
          mandatoryClosingCostsFormatted: formatKrw(closingReceipt.mandatoryClosingCosts),
        },
        closingCostSummary: closingReceipt,
        allLoans,
      };
    });
}

/** 금리 지표 + 금리 뉴스 (하루 2회 자동 갱신된 최신본) */
export const getRates = (opts) => fetchJson('/data/rates.json', opts);

/** 용어사전 + 현행 정책 + 정책 뉴스 (하루 2회 자동 갱신된 최신본) */
export const getPolicies = (opts) => fetchJson('/data/policies.json', opts);
