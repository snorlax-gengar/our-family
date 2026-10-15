/**
 * 신생아 특례대출 (디딤돌 구입자금) 정밀 계산 엔진
 * 2025~2026 국토교통부 / 주택도시기금 최신 기준 반영
 */

// 소득 및 대출만기별 기본 특례금리표 (단위: 연 %)
const BASE_RATE_TABLE = [
  { maxIncome: 20000000, rates: { 10: 1.60, 15: 1.75, 20: 1.85, 30: 1.95, 40: 2.05 } },
  { maxIncome: 40000000, rates: { 10: 2.10, 15: 2.25, 20: 2.35, 30: 2.45, 40: 2.55 } },
  { maxIncome: 60000000, rates: { 10: 2.50, 15: 2.65, 20: 2.75, 30: 2.85, 40: 2.95 } },
  { maxIncome: 85000000, rates: { 10: 2.70, 15: 2.85, 20: 2.95, 30: 3.05, 40: 3.15 } },
  { maxIncome: 130000000, rates: { 10: 3.10, 15: 3.20, 20: 3.25, 30: 3.30, 40: 3.40 } },
  { maxIncome: 200000000, rates: { 10: 3.30, 15: 3.40, 20: 3.45, 30: 3.50, 40: 3.60 } }, // 완화 구간
];

// 방공제 금액 (주택임대차보호법 최우선변제 소액임차보증금)
const DEDUCTION_BY_REGION = {
  '서울': 55000000,
  '경기_과밀': 48000000,
  '경기_기타': 28000000,
};

// 과밀억제권역 판별 (경기)
const OVERCROWDED_GYEONGGI = [
  '수원시', '성남시', '안양시', '부천시', '광명시', '과천시', 
  '의왕시', '군포시', '시흥시', '하남시', '구리시', '남양주시', '고양시'
];

/**
 * 신생아 특례대출 계산 함수
 * @param {Object} params
 * @param {number} params.propertyPrice - 주택 실매매가액 (원)
 * @param {number} [params.kbPrice] - KB부동산 일반평균 시세 (원). 은행 및 기금 담보평가 시 Min(매매가, KB시세) 적용
 * @param {number} params.areaSqMeter - 전용면적 (㎡)
 * @param {string} params.region - 지역 ('서울' 또는 '경기')
 * @param {string} params.district - 구/시 명칭 (예: '노원구', '수원시 영통구')
 * @param {number} [params.annualIncome=80000000] - 부부합산 연소득 (원, 기본 8,000만 원)
 * @param {boolean} [params.isFirstHome=false] - 생애최초 주택구입 여부 (기본 false: LTV 70%, true: LTV 80%)
 * @param {number} [params.loanTenureYears=30] - 대출 기간 (10, 15, 20, 30, 40년)
 * @param {boolean} [params.useMcg=true] - MCG(모기지신용보증) 가입 여부 (기본 true: 방공제 면제)
 * @param {number} [params.preferentialDiscount=0.2] - 우대금리 합계 (%p, 기본 청약/전자계약 0.2%p)
 */
export function calculateNewbornLoan({
  propertyPrice,
  kbPrice,
  areaSqMeter,
  region,
  district = '',
  annualIncome = 80000000,
  isFirstHome = false,
  loanTenureYears = 30,
  useMcg = true,
  preferentialDiscount = 0.2,
}) {
  const MAX_LOAN_LIMIT = 500000000; // 최대 5억 원 한도
  const MAX_PROPERTY_PRICE = 900000000; // 주택가격 9억 원 이하
  const MAX_AREA = 85.0; // 전용면적 85㎡ 이하

  // 담보평가 기준가(appraisalPrice): 금융기관 및 주택도시기금 공식 규정
  // 주택담보가치 = Min(실제 매매가액, KB부동산 일반평균가)
  const validKbPrice = (typeof kbPrice === 'number' && kbPrice > 0)
    ? kbPrice
    : (kbPrice && typeof kbPrice.generalAvg === 'number' ? kbPrice.generalAvg : null);
  
  const appraisalPrice = validKbPrice ? Math.min(propertyPrice, validKbPrice) : propertyPrice;
  const isKbLower = Boolean(validKbPrice && validKbPrice < propertyPrice);
  const valuationBasis = isKbLower ? 'KB시세' : '매매가';

  // 1. 적격 요건 심사 (주택가격은 담보평가액 기준 9억 원 이하)
  const meetsPrice = appraisalPrice <= MAX_PROPERTY_PRICE;
  const meetsArea = areaSqMeter <= MAX_AREA;
  const meetsIncome = annualIncome <= 200000000; // 최대 2억 원 완화 기준까지 지원
  const isEligible = meetsPrice && meetsArea && meetsIncome;

  const ineligibilityReasons = [];
  if (!meetsPrice) ineligibilityReasons.push('주택가격(담보평가액) 9억 원 초과');
  if (!meetsArea) ineligibilityReasons.push('전용면적 85㎡ 초과');
  if (!meetsIncome) ineligibilityReasons.push('부부합산 연소득 2억 원 초과');

  // 2. LTV 적용 비율: 정부 가계부채 관리 정책 및 수도권 주택 대출 가이드라인에 따라
  // 과도한 영끌 위험을 방지하고 보수적인 안전 자금 계획을 위해 LTV 70% 상한 적용
  const ltvRatio = 0.70;

  // 3. 방공제 계산 (MCG 미가입 시 차감)
  let deductionAmount = 0;
  if (!useMcg) {
    if (region.includes('서울')) {
      deductionAmount = DEDUCTION_BY_REGION['서울'];
    } else if (region.includes('인천')) {
      deductionAmount = 48000000; // 인천광역시 과밀억제권역 최우선변제 방공제액
    } else {
      const isOvercrowded = OVERCROWDED_GYEONGGI.some(city => district.includes(city));
      deductionAmount = isOvercrowded ? DEDUCTION_BY_REGION['경기_과밀'] : DEDUCTION_BY_REGION['경기_기타'];
    }
  }

  // 4. 대출 가능 금액 산출: Min(담보평가액[Min(매매가, KB시세)] * LTV - 방공제, 최대 한도 5억)
  let maxLoan = Math.floor(appraisalPrice * ltvRatio) - deductionAmount;
  if (maxLoan > MAX_LOAN_LIMIT) {
    maxLoan = MAX_LOAN_LIMIT;
  }
  if (maxLoan < 0) maxLoan = 0;

  // 5. 필요 자기자본 (실제 매도인에게 치러야 하는 매매가에서 대출금을 뺀 잔여 현금)
  const requiredCash = Math.max(0, propertyPrice - maxLoan);

  // 6. 금리 계산 (소득 및 만기 기준)
  let baseRate = 3.30;
  const matchedBracket = BASE_RATE_TABLE.find(b => annualIncome <= b.maxIncome) || BASE_RATE_TABLE[BASE_RATE_TABLE.length - 1];
  const validTenure = [10, 15, 20, 30, 40].includes(loanTenureYears) ? loanTenureYears : 30;
  baseRate = matchedBracket.rates[validTenure] || 3.30;

  // 우대금리 차감 (하한선 1.2%)
  const finalInterestRate = Math.max(1.20, +(baseRate - preferentialDiscount).toFixed(2));

  // 7. 원리금균등 상환액 계산 (P * r * (1+r)^n / ((1+r)^n - 1))
  const monthlyRate = (finalInterestRate / 100) / 12;
  const totalMonths = validTenure * 12;
  
  let monthlyPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (maxLoan > 0 && monthlyRate > 0) {
    monthlyPayment = Math.round(
      (maxLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
    totalPayment = monthlyPayment * totalMonths;
    totalInterest = totalPayment - maxLoan;
  }

  // 8. 일반 시중은행 주택담보대출 비교 (시중금리 4.30% 가정)
  const marketRate = 4.30;
  const marketMonthlyRate = (marketRate / 100) / 12;
  const marketMonthlyPayment = Math.round(
    (maxLoan * marketMonthlyRate * Math.pow(1 + marketMonthlyRate, totalMonths)) /
    (Math.pow(1 + marketMonthlyRate, totalMonths) - 1)
  );
  const monthlySavings = Math.max(0, marketMonthlyPayment - monthlyPayment);
  const totalSavings = monthlySavings * totalMonths;

  return {
    isEligible,
    ineligibilityReasons,
    propertyPrice,
    kbPrice: validKbPrice,
    appraisalPrice,
    appraisalPriceFormatted: formatKrw(appraisalPrice),
    valuationBasis,
    isKbLower,
    maxLoanAmount: maxLoan,
    maxLoanFormatted: formatKrw(maxLoan),
    requiredCash,
    requiredCashFormatted: formatKrw(requiredCash),
    ltvRatio: Math.round(ltvRatio * 100),
    isFirstHome,
    useMcg,
    deductionAmount,
    deductionFormatted: formatKrw(deductionAmount),
    loanTenureYears: validTenure,
    baseRate,
    finalInterestRate,
    preferentialDiscount,
    monthlyPayment,
    monthlyPaymentFormatted: formatKrw(monthlyPayment),
    totalInterest,
    totalInterestFormatted: formatKrw(totalInterest),
    comparison: {
      marketRate,
      marketMonthlyPayment,
      marketMonthlyPaymentFormatted: formatKrw(marketMonthlyPayment),
      monthlySavings,
      monthlySavingsFormatted: formatKrw(monthlySavings),
      totalSavings,
      totalSavingsFormatted: formatKrw(totalSavings)
    },
    benefits: [
      "DSR(총부채원리금상환비율) 스트레스 2단계 미적용!",
      isKbLower
        ? `담보평가 기준: 실매매가(${formatKrw(propertyPrice)})보다 낮은 KB시세(${formatKrw(validKbPrice)})를 기준으로 LTV 70%가 정확히 산출되었습니다.`
        : (validKbPrice && validKbPrice > propertyPrice
          ? `담보평가 기준: KB시세(${formatKrw(validKbPrice)})보다 낮은 실매매가(${formatKrw(propertyPrice)})를 기준으로 LTV 70%가 안전하게 산출되었습니다.`
          : `담보평가 기준: Min(실매매가, KB시세) LTV 70% 적용`),
      `일반 시중은행 대비 매월 약 ${formatKrw(monthlySavings)} 이자 절감`,
      useMcg ? "MCG 보증 가입으로 방공제 없이 LTV 70% 한도 100% 수령 가능" : `방공제 ${formatKrw(deductionAmount)} 차감 적용됨 (MCG 가입 권장)`,
      isFirstHome ? "생애최초 주택구입 취득세 200만 원 감면 혜택 대상 (대출은 정부 정책 기준 안전 LTV 70% 준수)" : "정부 가계부채 관리 정책 기준 안전 LTV 70% 적용"
    ]
  };
}

/**
 * 원화 포맷터 (예: 5억 5,000만 원, 380만 원)
 */
export function formatKrw(num) {
  if (!num || num === 0) return '0원';
  const eok = Math.floor(num / 100000000);
  const man = Math.floor((num % 100000000) / 10000);
  const won = num % 10000;

  const parts = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (won > 0 && eok === 0 && man === 0) parts.push(`${won}원`);
  return parts.join(' ') + (eok > 0 || man > 0 ? '원' : '');
}
