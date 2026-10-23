/**
 * 대한민국 정부 3대 정책 주택담보대출 정밀 계산 엔진
 * 1. 신생아 특례 디딤돌 대출 (국토교통부 / 주택도시기금)
 * 2. HF 보금자리론 (한국주택금융공사)
 * 3. 생애최초 / 일반 내집마련 디딤돌 대출 (주택도시기금)
 * 2025~2026 최신 정책 기준 반영
 */

// 1. 방공제 금액 (주택임대차보호법 최우선변제 소액임차보증금)
const DEDUCTION_BY_REGION = {
  '서울': 55000000,
  '인천': 48000000,
  '경기_과밀': 48000000,
  '경기_기타': 28000000,
};

// 과밀억제권역 판별 (경기)
const OVERCROWDED_GYEONGGI = [
  '수원시', '성남시', '안양시', '부천시', '광명시', '과천시', 
  '의왕시', '군포시', '시흥시', '하남시', '구리시', '남양주시', '고양시'
];

/**
 * 지역별 방공제액 계산
 */
function getDeductionAmount(region = '', district = '', useMcg = true) {
  if (useMcg) return 0;
  if (region.includes('서울')) return DEDUCTION_BY_REGION['서울'];
  if (region.includes('인천')) return DEDUCTION_BY_REGION['인천'];
  const isOvercrowded = OVERCROWDED_GYEONGGI.some(city => district.includes(city));
  return isOvercrowded ? DEDUCTION_BY_REGION['경기_과밀'] : DEDUCTION_BY_REGION['경기_기타'];
}

/**
 * 담보평가액(Appraisal Price) 결정
 * 금융기관 공식 기준: Min(실거래 매매가, KB부동산 일반평균가)
 */
function getAppraisalData(propertyPrice, kbPrice) {
  const validKbPrice = (typeof kbPrice === 'number' && kbPrice > 0)
    ? kbPrice
    : (kbPrice && typeof kbPrice.generalAvg === 'number' ? kbPrice.generalAvg : null);

  const appraisalPrice = validKbPrice ? Math.min(propertyPrice, validKbPrice) : propertyPrice;
  const isKbLower = Boolean(validKbPrice && validKbPrice < propertyPrice);
  const valuationBasis = isKbLower ? 'KB시세' : '매매가';

  return { validKbPrice, appraisalPrice, isKbLower, valuationBasis };
}

/**
 * 상환방식별(원리금균등 / 원금균등 / 체증식) 상환액 계산
 */
function calculateAmortization(loanAmount, annualInterestRate, tenureYears, repaymentMethod = 'level') {
  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalMonths = tenureYears * 12;
  
  let levelMonthlyPayment = 0;
  let principalFirstPayment = 0;
  let graduatedFirstPayment = 0;
  let monthlyPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (loanAmount > 0 && monthlyRate > 0) {
    // 1. 원리금균등 월 납입액
    levelMonthlyPayment = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );

    // 2. 원금균등 1회차(초기) 월 납입액 = (원금/개월수) + 첫달 이자
    principalFirstPayment = Math.round((loanAmount / totalMonths) + (loanAmount * monthlyRate));

    // 3. 체증식 1년차 평균 월 납입액 (초기 원금 최소화 + 이자 중심)
    const gradDenom = (totalMonths * (totalMonths + 1)) / 2;
    const firstYearAvgPrincipal = (loanAmount * 6.5) / gradDenom;
    graduatedFirstPayment = Math.round(firstYearAvgPrincipal + (loanAmount * monthlyRate));

    if (repaymentMethod === 'principal') {
      monthlyPayment = principalFirstPayment;
      totalInterest = Math.round((loanAmount * monthlyRate * (totalMonths + 1)) / 2);
      totalPayment = loanAmount + totalInterest;
    } else if (repaymentMethod === 'graduated') {
      monthlyPayment = graduatedFirstPayment;
      // 체증식 만기 총이자는 원리금균등 대비 약 1.24배 수준
      const levelTotalInterest = (levelMonthlyPayment * totalMonths) - loanAmount;
      totalInterest = Math.round(levelTotalInterest * 1.24);
      totalPayment = loanAmount + totalInterest;
    } else {
      monthlyPayment = levelMonthlyPayment;
      totalPayment = levelMonthlyPayment * totalMonths;
      totalInterest = totalPayment - loanAmount;
    }
  }

  // 시중은행(4.30% 원리금균등 가정) 대비 절감액
  const marketRate = 4.30;
  const marketMonthlyRate = (marketRate / 100) / 12;
  const marketMonthlyPayment = (loanAmount > 0) ? Math.round(
    (loanAmount * marketMonthlyRate * Math.pow(1 + marketMonthlyRate, totalMonths)) /
    (Math.pow(1 + marketMonthlyRate, totalMonths) - 1)
  ) : 0;
  const monthlySavings = Math.max(0, marketMonthlyPayment - monthlyPayment);
  const totalSavings = Math.max(0, (marketMonthlyPayment * totalMonths) - (levelMonthlyPayment * totalMonths));

  const repaymentMethodLabel =
    repaymentMethod === 'graduated'
      ? '체증식(초기최소)'
      : repaymentMethod === 'principal'
      ? '원금균등(총이자최소)'
      : '원리금균등';

  return {
    repaymentMethod,
    repaymentMethodLabel,
    monthlyPayment,
    levelMonthlyPayment,
    principalFirstPayment,
    graduatedFirstPayment,
    totalPayment,
    totalInterest,
    marketRate,
    marketMonthlyPayment,
    monthlySavings,
    totalSavings,
  };
}

// =========================================================================
// [대출 1] 신생아 특례 디딤돌 대출 (국토교통부 / 주택도시기금)
// =========================================================================
const NEWBORN_RATE_TABLE = [
  { maxIncome: 20000000, rates: { 10: 1.60, 15: 1.75, 20: 1.85, 30: 1.95, 40: 2.05 } },
  { maxIncome: 40000000, rates: { 10: 2.10, 15: 2.25, 20: 2.35, 30: 2.45, 40: 2.55 } },
  { maxIncome: 60000000, rates: { 10: 2.50, 15: 2.65, 20: 2.75, 30: 2.85, 40: 2.95 } },
  { maxIncome: 85000000, rates: { 10: 2.70, 15: 2.85, 20: 2.95, 30: 3.05, 40: 3.15 } },
  { maxIncome: 130000000, rates: { 10: 3.10, 15: 3.20, 20: 3.25, 30: 3.30, 40: 3.40 } },
  { maxIncome: 200000000, rates: { 10: 3.30, 15: 3.40, 20: 3.45, 30: 3.50, 40: 3.60 } },
];

export function calculateNewbornLoan({
  propertyPrice,
  kbPrice,
  areaSqMeter = 84,
  region = '서울',
  district = '',
  annualIncome = 80000000,
  isFirstHome = false,
  loanTenureYears = 30,
  useMcg = true,
  preferentialDiscount = 0.2,
  repaymentMethod = 'level',
}) {
  const loanId = 'newborn';
  const loanName = '신생아 특례 디딤돌 대출';
  const MAX_LOAN_LIMIT = 500000000; // 5억 원
  const MAX_PROPERTY_PRICE = 900000000; // 9억 원
  const MAX_AREA = 85.0; // 85㎡

  const { validKbPrice, appraisalPrice, isKbLower, valuationBasis } = getAppraisalData(propertyPrice, kbPrice);

  const meetsPrice = appraisalPrice <= MAX_PROPERTY_PRICE;
  const meetsArea = areaSqMeter <= MAX_AREA;
  const meetsIncome = annualIncome <= 200000000;
  const isEligible = meetsPrice && meetsArea && meetsIncome;

  const ineligibilityReasons = [];
  if (!meetsPrice) ineligibilityReasons.push(`주택가격(${formatKrw(appraisalPrice)})이 9억 원을 초과합니다.`);
  if (!meetsArea) ineligibilityReasons.push(`전용면적(${areaSqMeter}㎡)이 85㎡를 초과합니다.`);
  if (!meetsIncome) ineligibilityReasons.push(`부부합산 연소득(${formatKrw(annualIncome)})이 2억 원을 초과합니다.`);

  const ltvRatio = 0.70; // 안전 LTV 70% 준수
  const deductionAmount = getDeductionAmount(region, district, useMcg);

  let maxLoan = isEligible ? Math.round(appraisalPrice * ltvRatio) - deductionAmount : 0;
  if (maxLoan > MAX_LOAN_LIMIT) maxLoan = MAX_LOAN_LIMIT;
  if (maxLoan < 0) maxLoan = 0;

  const requiredCash = Math.max(0, propertyPrice - maxLoan);

  const matchedBracket = NEWBORN_RATE_TABLE.find(b => annualIncome <= b.maxIncome) || NEWBORN_RATE_TABLE[NEWBORN_RATE_TABLE.length - 1];
  const validTenure = [10, 15, 20, 30, 40].includes(loanTenureYears) ? loanTenureYears : 30;
  const baseRate = matchedBracket.rates[validTenure] || 3.30;
  const finalInterestRate = Math.max(1.20, +(baseRate - preferentialDiscount).toFixed(2));

  const amort = calculateAmortization(maxLoan, finalInterestRate, validTenure, repaymentMethod);

  return {
    loanId,
    loanName,
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
    repaymentMethod: amort.repaymentMethod,
    repaymentMethodLabel: amort.repaymentMethodLabel,
    monthlyPayment: amort.monthlyPayment,
    monthlyPaymentFormatted: formatKrw(amort.monthlyPayment),
    levelMonthlyPayment: amort.levelMonthlyPayment,
    principalFirstPayment: amort.principalFirstPayment,
    graduatedFirstPayment: amort.graduatedFirstPayment,
    totalInterest: amort.totalInterest,
    totalInterestFormatted: formatKrw(amort.totalInterest),
    comparison: {
      marketRate: amort.marketRate,
      marketMonthlyPayment: amort.marketMonthlyPayment,
      marketMonthlyPaymentFormatted: formatKrw(amort.marketMonthlyPayment),
      monthlySavings: amort.monthlySavings,
      monthlySavingsFormatted: formatKrw(amort.monthlySavings),
      totalSavings: amort.totalSavings,
      totalSavingsFormatted: formatKrw(amort.totalSavings)
    },
    productHighlights: [
      "2년 내 출산(입양) 무주택 가구 전용",
      "주택가격 9억 원 이하, 전용 85㎡ 이하",
      "최대 5.0억 원 한도 (DSR 규제 미적용)",
      "최저 연 1.6%대 초저금리 정책금융"
    ],
    benefits: [
      "DSR(총부채원리금상환비율) 스트레스 2단계 미적용!",
      isKbLower
        ? `담보평가 기준: 실매매가(${formatKrw(propertyPrice)})보다 낮은 KB시세(${formatKrw(validKbPrice)})를 기준으로 LTV 70%가 정확히 산출되었습니다.`
        : (validKbPrice && validKbPrice > propertyPrice
          ? `담보평가 기준: KB시세(${formatKrw(validKbPrice)})보다 낮은 실매매가(${formatKrw(propertyPrice)})를 기준으로 LTV 70%가 안전하게 산출되었습니다.`
          : `담보평가 기준: Min(실매매가, KB시세) LTV 70% 적용`),
      `일반 시중은행 대비 매월 약 ${formatKrw(amort.monthlySavings)} 이자 절감`,
      useMcg ? "MCG 보증 가입으로 방공제 없이 LTV 70% 한도 100% 수령 가능" : `방공제 ${formatKrw(deductionAmount)} 차감 적용됨 (MCG 가입 권장)`,
      isFirstHome ? "생애최초 주택구입 취득세 200만 원 감면 혜택 대상 (대출은 정부 정책 기준 안전 LTV 70% 준수)" : "정부 가계부채 관리 정책 기준 안전 LTV 70% 적용"
    ]
  };
}

// =========================================================================
// [대출 2] HF 보금자리론 (한국주택금융공사)
// =========================================================================
// 아낌e-보금자리론 기준 만기별 순수 고정금리
const BOGEUMJARI_RATES = {
  10: 3.65,
  15: 3.75,
  20: 3.80,
  30: 3.85,
  40: 3.90,
  50: 3.95,
};

export function calculateBogeumjariLoan({
  propertyPrice,
  kbPrice,
  areaSqMeter = 84,
  region = '서울',
  district = '',
  annualIncome = 80000000,
  isFirstHome = false,
  loanTenureYears = 30,
  useMcg = true,
  preferentialDiscount = 0.1, // 기본 아낌e 전자약정 0.1%p 할인
  isNewlywed = true, // 신혼부부/다자녀 기본 고려
  repaymentMethod = 'level',
}) {
  const loanId = 'bogeumjari';
  const loanName = 'HF 한국주택금융공사 보금자리론';
  const MAX_PROPERTY_PRICE = 600000000; // 6억 원 이하 주택만 가능
  
  // 소득 요건: 기본 7,000만, 신혼부부 8,500만, 다자녀 최대 1억 원
  const maxIncomeAllowed = isNewlywed ? 85000000 : 70000000;
  
  // 대출 한도: 기본 3.6억, 신혼 4.0억, 생애최초 4.2억 원
  const maxLoanLimit = isFirstHome ? 420000000 : (isNewlywed ? 400000000 : 360000000);

  const { validKbPrice, appraisalPrice, isKbLower, valuationBasis } = getAppraisalData(propertyPrice, kbPrice);

  const meetsPrice = appraisalPrice <= MAX_PROPERTY_PRICE;
  const meetsIncome = annualIncome <= maxIncomeAllowed;
  const meetsArea = true; // HF 보금자리론은 전용면적 제한 없음 (6억 이하 주택이면 대형 평형도 가능)
  const isEligible = meetsPrice && meetsIncome;

  const ineligibilityReasons = [];
  if (!meetsPrice) ineligibilityReasons.push(`주택가격(${formatKrw(appraisalPrice)})이 보금자리론 상한인 6억 원을 초과합니다.`);
  if (!meetsIncome) ineligibilityReasons.push(`부부합산 연소득(${formatKrw(annualIncome)})이 소득 상한(${formatKrw(maxIncomeAllowed)})을 초과합니다.`);

  // LTV: 일반 70%, 생애최초 80% (안전 LTV 70% 기본 또는 생애최초 시 최대 80% 지원)
  const ltvRatio = isFirstHome ? 0.80 : 0.70;
  const deductionAmount = getDeductionAmount(region, district, useMcg);

  let maxLoan = isEligible ? Math.round(appraisalPrice * ltvRatio) - deductionAmount : 0;
  if (maxLoan > maxLoanLimit) maxLoan = maxLoanLimit;
  if (maxLoan < 0) maxLoan = 0;

  const requiredCash = Math.max(0, propertyPrice - maxLoan);

  const validTenure = [10, 15, 20, 30, 40, 50].includes(loanTenureYears) ? loanTenureYears : 30;
  const baseRate = BOGEUMJARI_RATES[validTenure] || 3.85;
  // 우대금리: 생애최초 0.2%p, 저소득청년 0.1%p 등 반영 (하한선 2.65%)
  const totalDiscount = preferentialDiscount + (isFirstHome ? 0.2 : 0);
  const finalInterestRate = Math.max(2.65, +(baseRate - totalDiscount).toFixed(2));

  const amort = calculateAmortization(maxLoan, finalInterestRate, validTenure, repaymentMethod);

  return {
    loanId,
    loanName,
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
    preferentialDiscount: totalDiscount,
    repaymentMethod: amort.repaymentMethod,
    repaymentMethodLabel: amort.repaymentMethodLabel,
    monthlyPayment: amort.monthlyPayment,
    monthlyPaymentFormatted: formatKrw(amort.monthlyPayment),
    levelMonthlyPayment: amort.levelMonthlyPayment,
    principalFirstPayment: amort.principalFirstPayment,
    graduatedFirstPayment: amort.graduatedFirstPayment,
    totalInterest: amort.totalInterest,
    totalInterestFormatted: formatKrw(amort.totalInterest),
    comparison: {
      marketRate: amort.marketRate,
      marketMonthlyPayment: amort.marketMonthlyPayment,
      marketMonthlyPaymentFormatted: formatKrw(amort.marketMonthlyPayment),
      monthlySavings: amort.monthlySavings,
      monthlySavingsFormatted: formatKrw(amort.monthlySavings),
      totalSavings: amort.totalSavings,
      totalSavingsFormatted: formatKrw(amort.totalSavings)
    },
    productHighlights: [
      "한국주택금융공사(HF) 대표 100% 고정금리 상품",
      "주택가격 6억 원 이하 (전용면적 제한 없음)",
      "최대 3.6억 원 (생애최초 4.2억 / 신혼 4.0억)",
      "은행권 스트레스 DSR 규제 미적용 (DTI 60% 적용)"
    ],
    benefits: [
      "만기까지 금리가 단 0.01%도 오르지 않는 100% 순수 고정금리 안심 대출",
      "전용면적 85㎡ 초과 대형 평형도 매매가 6억 이하이면 이용 가능",
      isFirstHome ? "생애최초 주택구입 시 LTV 80% 및 최대 4억 2,000만 원까지 한도 확대" : "일반 무주택자 LTV 70% 최대 3억 6,000만 원 한도",
      "1금융권 은행 주담대와 달리 DSR 규제가 적용되지 않아 한도 산출에 유리"
    ]
  };
}

// =========================================================================
// [대출 3] 생애최초 / 일반 내집마련 디딤돌 대출 (주택도시기금)
// =========================================================================
const DIDIMDOL_RATE_TABLE = [
  { maxIncome: 20000000, rates: { 10: 2.65, 15: 2.75, 20: 2.85, 30: 2.95 } },
  { maxIncome: 40000000, rates: { 10: 3.00, 15: 3.10, 20: 3.20, 30: 3.30 } },
  { maxIncome: 60000000, rates: { 10: 3.35, 15: 3.45, 20: 3.55, 30: 3.65 } },
  { maxIncome: 85000000, rates: { 10: 3.65, 15: 3.75, 20: 3.85, 30: 3.95 } }, // 생애최초/신혼 구간
];

export function calculateDidimdolLoan({
  propertyPrice,
  kbPrice,
  areaSqMeter = 84,
  region = '서울',
  district = '',
  annualIncome = 80000000,
  isFirstHome = true, // 디딤돌 생애최초 기본
  loanTenureYears = 30,
  useMcg = true,
  preferentialDiscount = 0.2, // 청약/전자계약 우대
  isNewlywed = true,
  repaymentMethod = 'level',
}) {
  const loanId = 'didimdol';
  const loanName = isFirstHome ? '내집마련 디딤돌 대출 (생애최초 특례)' : '내집마련 디딤돌 대출 (일반)';
  
  // 주택가격 요건: 기본 5억 원 이하 (신혼부부 또는 2자녀 이상 6억 원 이하)
  const MAX_PROPERTY_PRICE = isNewlywed ? 600000000 : 500000000;
  const MAX_AREA = 85.0; // 85㎡ 이하

  // 소득 요건: 기본 6천만, 생애최초 7천만, 신혼부부 8.5천만 원 이하
  const maxIncomeAllowed = isNewlywed ? 85000000 : (isFirstHome ? 70000000 : 60000000);

  // 한도: 기본 2.5억, 생애최초 3.0억, 신혼부부 4.0억 원
  const maxLoanLimit = (isNewlywed && isFirstHome) ? 400000000 : (isFirstHome ? 300000000 : (isNewlywed ? 400000000 : 250000000));

  const { validKbPrice, appraisalPrice, isKbLower, valuationBasis } = getAppraisalData(propertyPrice, kbPrice);

  const meetsPrice = appraisalPrice <= MAX_PROPERTY_PRICE;
  const meetsArea = areaSqMeter <= MAX_AREA;
  const meetsIncome = annualIncome <= maxIncomeAllowed;
  const isEligible = meetsPrice && meetsArea && meetsIncome;

  const ineligibilityReasons = [];
  if (!meetsPrice) ineligibilityReasons.push(`주택가격(${formatKrw(appraisalPrice)})이 디딤돌 상한(${formatKrw(MAX_PROPERTY_PRICE)})을 초과합니다.`);
  if (!meetsArea) ineligibilityReasons.push(`전용면적(${areaSqMeter}㎡)이 85㎡를 초과합니다.`);
  if (!meetsIncome) ineligibilityReasons.push(`부부합산 연소득(${formatKrw(annualIncome)})이 소득 상한(${formatKrw(maxIncomeAllowed)})을 초과합니다.`);

  // LTV: 기본 70%, 생애최초 80%
  const ltvRatio = isFirstHome ? 0.80 : 0.70;
  const deductionAmount = getDeductionAmount(region, district, useMcg);

  let maxLoan = isEligible ? Math.round(appraisalPrice * ltvRatio) - deductionAmount : 0;
  if (maxLoan > maxLoanLimit) maxLoan = maxLoanLimit;
  if (maxLoan < 0) maxLoan = 0;

  const requiredCash = Math.max(0, propertyPrice - maxLoan);

  const validTenure = [10, 15, 20, 30].includes(loanTenureYears) ? loanTenureYears : 30;
  const matchedBracket = DIDIMDOL_RATE_TABLE.find(b => annualIncome <= b.maxIncome) || DIDIMDOL_RATE_TABLE[DIDIMDOL_RATE_TABLE.length - 1];
  const baseRate = matchedBracket.rates[validTenure] || 3.65;

  // 생애최초 우대금리 0.2%p 추가 차감 (하한선 1.50%)
  const totalDiscount = preferentialDiscount + (isFirstHome ? 0.2 : 0);
  const finalInterestRate = Math.max(1.50, +(baseRate - totalDiscount).toFixed(2));

  const amort = calculateAmortization(maxLoan, finalInterestRate, validTenure, repaymentMethod);

  return {
    loanId,
    loanName,
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
    preferentialDiscount: totalDiscount,
    repaymentMethod: amort.repaymentMethod,
    repaymentMethodLabel: amort.repaymentMethodLabel,
    monthlyPayment: amort.monthlyPayment,
    monthlyPaymentFormatted: formatKrw(amort.monthlyPayment),
    levelMonthlyPayment: amort.levelMonthlyPayment,
    principalFirstPayment: amort.principalFirstPayment,
    graduatedFirstPayment: amort.graduatedFirstPayment,
    totalInterest: amort.totalInterest,
    totalInterestFormatted: formatKrw(amort.totalInterest),
    comparison: {
      marketRate: amort.marketRate,
      marketMonthlyPayment: amort.marketMonthlyPayment,
      marketMonthlyPaymentFormatted: formatKrw(amort.marketMonthlyPayment),
      monthlySavings: amort.monthlySavings,
      monthlySavingsFormatted: formatKrw(amort.monthlySavings),
      totalSavings: amort.totalSavings,
      totalSavingsFormatted: formatKrw(amort.totalSavings)
    },
    productHighlights: [
      "국토교통부·주택도시기금 무주택 서민 내집마련 대출",
      isNewlywed ? "신혼가구 특례: 주택 6억 이하, 소득 8.5천만 이하" : "일반: 주택 5억 이하, 생애최초 3.0억 한도",
      "생애최초 주택구입 시 LTV 80% 및 우대금리 -0.2%p",
      "DSR 규제 미적용으로 안정적 대출 승인"
    ],
    benefits: [
      "디딤돌 생애최초 우대금리 0.2%p 차감 적용",
      "정부 기금 재원으로 시중은행 대비 파격적인 2%대 저금리 실현",
      "생애최초 주택구입 취득세 200만 원 감면과 동시 적용 가능",
      "체증식 상환(만 40세 미만) 선택 가능하여 초기 원리금 부담 최소화"
    ]
  };
}

// =========================================================================
// [통합 시뮬레이션 및 최적 상품 추천]
// =========================================================================
export function calculateAllLoans(params) {
  const newborn = calculateNewbornLoan(params);
  const bogeumjari = calculateBogeumjariLoan(params);
  const didimdol = calculateDidimdolLoan(params);

  // 최적 추천 대출 결정 알고리즘
  // 1순위: 적격 대출 중 금리가 가장 낮고 한도가 충분한 상품
  const eligibleLoans = [newborn, bogeumjari, didimdol].filter(l => l.isEligible);
  
  let recommended = null;
  if (eligibleLoans.length > 0) {
    // 적격 상품 중 금리가 가장 낮은 순 정렬, 금리 같으면 한도 높은 순
    const sorted = [...eligibleLoans].sort((a, b) => {
      if (a.finalInterestRate !== b.finalInterestRate) {
        return a.finalInterestRate - b.finalInterestRate;
      }
      return b.maxLoanAmount - a.maxLoanAmount;
    });
    const best = sorted[0];
    let reason = '';
    if (best.loanId === 'newborn') {
      reason = '2년 내 출산 가구 특례로 연 1~2%대 최저금리와 최대 5억 원의 가장 높은 한도를 제공합니다.';
    } else if (best.loanId === 'didimdol') {
      reason = '기금 저금리 혜택과 생애최초 우대금리(-0.2%p)가 적용되어 이자 부담이 가장 적습니다.';
    } else {
      reason = '100% 장기 고정금리로 향후 금리 인상 위험이 전혀 없으며 전용면적 제한이 없습니다.';
    }
    recommended = {
      bestLoanId: best.loanId,
      bestLoanName: best.loanName,
      rate: best.finalInterestRate,
      maxLoan: best.maxLoanAmount,
      maxLoanFormatted: best.maxLoanFormatted,
      reason,
    };
  } else {
    recommended = {
      bestLoanId: 'none',
      bestLoanName: '적격 정책대출 없음',
      reason: '주택 가격 또는 소득 기준을 초과하여 정책대출 이용이 어려우며, 일반 시중은행 주택담보대출 검토가 필요합니다.',
    };
  }

  return {
    newborn,
    bogeumjari,
    didimdol,
    recommended,
  };
}

/**
 * 대출 계산 메인 통합 라우터
 */
export function calculateLoan({
  loanType = 'newborn',
  ...params
}) {
  if (loanType === 'bogeumjari') {
    return calculateBogeumjariLoan(params);
  }
  if (loanType === 'didimdol') {
    return calculateDidimdolLoan(params);
  }
  if (loanType === 'all') {
    return calculateAllLoans(params);
  }
  return calculateNewbornLoan(params);
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
