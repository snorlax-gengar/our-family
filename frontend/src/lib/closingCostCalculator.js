/**
 * 대한민국 아파트 매수 부대비용 및 실제 필요 총현금(All-in Cash) 정밀 계산 엔진
 * - 2025~2026 지방세법(취득세·지방교육세·농어촌특별세) 및 지방세특례제한법 반영
 * - 생애최초 주택구입 감면(최대 200만 원) & 출산·양육 가구 취득세 감면(최대 500만 원) 지원
 * - 공인중개사법 시행규칙(서울·경기·인천 조례) 구간별 상한 중개보수율 반영
 * - 소유권이전등기 필수 비용(국민주택채권 즉시매도 할인액, 정부 수입인지세, 등기신청수수료, 법무사 보수)
 * - 이사·입주청소 및 구축 아파트 인테리어(도배/장판/부분수리/올수리) 옵션 시뮬레이션
 */

/**
 * 1. 주택 유상거래 취득세율 산출 (1주택자 기준, 지방세법 제11조)
 * - 6억 원 이하: 1.0%
 * - 6억 원 초과 ~ 9억 원 이하: ((매매가 / 1억 원) * (2 / 3) - 3)%  (소수점 넷째 자리 반올림)
 * - 9억 원 초과: 3.0%
 */
export function getAcquisitionTaxRate(priceKrw) {
  if (!priceKrw || priceKrw <= 0) return 0.01;
  if (priceKrw <= 600000000) {
    return 0.01; // 1.0%
  }
  if (priceKrw <= 900000000) {
    const eok = priceKrw / 100000000;
    const ratePercent = (eok * (2 / 3)) - 3;
    // 소수점 넷째 자리 반올림 (예: 2.1333% -> 0.021333)
    const roundedPercent = Math.round(ratePercent * 10000) / 10000;
    return roundedPercent / 100;
  }
  return 0.03; // 3.0%
}

/**
 * 2. 취득세 + 지방교육세 + 농어촌특별세 통합 산출
 * @param {number} priceKrw 실매매가
 * @param {number} areaSqMeter 전용면적(㎡)
 * @param {string} taxReliefType 'none' | 'firstHome' (생애최초 200만) | 'newborn' (출산가구 500만)
 */
export function calculateAcquisitionTaxes({
  priceKrw = 0,
  areaSqMeter = 84,
  taxReliefType = 'none',
}) {
  const baseTaxRate = getAcquisitionTaxRate(priceKrw);
  const rawAcquisitionTax = Math.round(priceKrw * baseTaxRate);

  // 감면 한도 계산 (지방세특례제한법)
  // - 생애최초 주택구입(12억 이하): 산출 취득세에서 최대 200만 원 감면
  // - 출산·양육 목적 주택취득(12억 이하, 5억 이하 100% 면제): 산출 취득세에서 최대 500만 원 감면
  let maxReliefLimit = 0;
  let reliefLabel = '감면 미적용 (일반 무주택)';
  if (priceKrw <= 1200000000) {
    if (taxReliefType === 'newborn') {
      maxReliefLimit = 5000000;
      reliefLabel = '출산·양육 가구 취득세 감면 (최대 500만 원)';
    } else if (taxReliefType === 'firstHome') {
      maxReliefLimit = 2000000;
      reliefLabel = '생애최초 주택구입 취득세 감면 (최대 200만 원)';
    }
  }

  const taxDiscount = Math.min(rawAcquisitionTax, maxReliefLimit);
  const netAcquisitionTax = Math.max(0, rawAcquisitionTax - taxDiscount);

  // 지방교육세: 납부할 취득세액의 10% (감면 시 지방교육세도 비례 감면됨)
  const rawLocalEducationTax = Math.round(rawAcquisitionTax * 0.10);
  const netLocalEducationTax = Math.round(netAcquisitionTax * 0.10);
  const educationTaxDiscount = rawLocalEducationTax - netLocalEducationTax;

  // 농어촌특별세: 전용면적 85㎡ 초과 시 매매가의 0.2% (85㎡ 이하는 비과세)
  const isOver85 = Number(areaSqMeter) > 85.0;
  const ruralSpecialTax = isOver85 ? Math.round(priceKrw * 0.002) : 0;

  const rawTotalTax = rawAcquisitionTax + rawLocalEducationTax + ruralSpecialTax;
  const finalTotalTax = netAcquisitionTax + netLocalEducationTax + ruralSpecialTax;
  const totalTaxSaved = rawTotalTax - finalTotalTax;

  return {
    baseTaxRatePercent: +(baseTaxRate * 100).toFixed(2),
    effectiveRatePercent: priceKrw > 0 ? +((finalTotalTax / priceKrw) * 100).toFixed(2) : 0,
    rawAcquisitionTax,
    taxDiscount,
    netAcquisitionTax,
    rawLocalEducationTax,
    educationTaxDiscount,
    netLocalEducationTax,
    ruralSpecialTax,
    isOver85,
    rawTotalTax,
    finalTotalTax,
    totalTaxSaved,
    taxReliefType,
    reliefLabel,
  };
}

/**
 * 3. 공인중개사 법정 상한 중개보수(복비) 산출
 * - 5천만 이상 ~ 2억 미만: 0.5% (한도 80만)
 * - 2억 이상 ~ 9억 미만: 0.4%
 * - 9억 이상 ~ 12억 미만: 0.5%
 * - 12억 이상 ~ 15억 미만: 0.6%
 * - 15억 이상: 0.7%
 */
export function calculateBrokerageFee({
  priceKrw = 0,
  includeVat = true, // 일반과세자 부가세 10% 포함 여부
}) {
  let rate = 0.004;
  let limit = null;

  if (priceKrw < 50000000) {
    rate = 0.006;
    limit = 250000;
  } else if (priceKrw < 200000000) {
    rate = 0.005;
    limit = 800000;
  } else if (priceKrw < 900000000) {
    rate = 0.004;
  } else if (priceKrw < 1200000000) {
    rate = 0.005;
  } else if (priceKrw < 1500000000) {
    rate = 0.006;
  } else {
    rate = 0.007;
  }

  let baseFee = Math.round(priceKrw * rate);
  if (limit && baseFee > limit) {
    baseFee = limit;
  }

  const vat = includeVat ? Math.round(baseFee * 0.10) : 0;
  const totalBrokerFee = baseFee + vat;

  return {
    ratePercent: +(rate * 100).toFixed(2),
    baseFee,
    vat,
    includeVat,
    totalBrokerFee,
  };
}

/**
 * 4. 소유권이전등기 필수 부대비용 산출
 * - 국민주택채권 매입 후 즉시매도 할인비용 (시가표준액 기준 서울/수도권 실무 평균)
 * - 정부 수입인지세 (1억 초과 ~ 10억 이하: 15만 원)
 * - 대법원 등기신청수수료(증지대) 및 제증명: 약 2만 원
 * - 법무사 대행 보수료 (표준 위임 vs 셀프등기/협약할인)
 */
export function calculateRegistrationCosts({
  priceKrw = 0,
  region = '서울',
  registrationMode = 'lawyer', // 'lawyer' (법무사 위임) | 'self' (셀프등기)
}) {
  // 1) 시가표준액(공시가격) 추정: 실거래가의 약 68%
  const estimatedStandardValue = Math.round(priceKrw * 0.68);

  // 2) 국민주택채권 매입률 (서울/광역시 vs 경기도)
  const isSeoulOrIncheon = region.includes('서울') || region.includes('인천');
  let bondPurchaseRate = 0.021; // 기본 2.1%
  if (estimatedStandardValue >= 600000000) {
    bondPurchaseRate = isSeoulOrIncheon ? 0.031 : 0.026;
  } else if (estimatedStandardValue >= 260000000) {
    bondPurchaseRate = isSeoulOrIncheon ? 0.026 : 0.021;
  } else if (estimatedStandardValue >= 160000000) {
    bondPurchaseRate = isSeoulOrIncheon ? 0.023 : 0.018;
  }

  // 채권 총 매입액 및 즉시매도 할인율(약 13.5% 가정) 적용 본인부담금
  const bondPurchaseAmount = Math.round(estimatedStandardValue * bondPurchaseRate);
  const bondDiscountRate = 0.135;
  const bondDiscountCost = Math.round(bondPurchaseAmount * bondDiscountRate);

  // 3) 전자수입인지세 (1억 초과 ~ 10억 이하 15만 원, 10억 초과 35만 원)
  const stampTax = priceKrw <= 100000000 ? 0 : (priceKrw <= 1000000000 ? 150000 : 350000);

  // 4) 대법원 등기신청수수료(e-Form/전자등기 기준) + 등기부/대장 발급비
  const courtFee = 20000;

  // 5) 법무사 보수료 (기본보수 + 누진 + 부가세 + 교통비/일당 실무 평균, 법무통 견적 수준)
  // 5~6억 기준 약 55만 원 ~ 65만 원 수준
  const estimatedLawyerFee = Math.round(350000 + (priceKrw / 100000000) * 45000);
  const lawyerFee = registrationMode === 'self' ? 0 : estimatedLawyerFee;

  const totalRegistrationCost = bondDiscountCost + stampTax + courtFee + lawyerFee;

  return {
    estimatedStandardValue,
    bondPurchaseAmount,
    bondDiscountCost,
    stampTax,
    courtFee,
    lawyerFee,
    estimatedLawyerFee,
    registrationMode,
    totalRegistrationCost,
  };
}

/**
 * 5. 이사 · 입주청소 · 인테리어 여유자금 계산
 */
export function calculateMovingAndInteriorCosts({
  pyeong = 25,
  includeMoving = false,
  interiorLevel = 'none', // 'none' | 'basic' (도배장판) | 'partial' (부분수리) | 'full' (올수리)
}) {
  const safePyeong = Number(pyeong) || 25;

  // 포장이사 + 사다리차 + 입주청소 (평형 비례: 20평대 약 200만, 30평대 약 260만)
  const movingCost = includeMoving
    ? Math.round((1200000 + safePyeong * 35000) / 10000) * 10000
    : 0;

  // 인테리어 단계별 비용 (평당 단가 기준)
  let interiorCost = 0;
  let interiorLabel = '미포함 (즉시 입주)';
  if (interiorLevel === 'basic') {
    // 도배 + 장판 + LED조명 기본 (평당 약 22만 원)
    interiorCost = safePyeong * 220000;
    interiorLabel = `기본 시공 (도배·장판·조명 · ${safePyeong}평 기준)`;
  } else if (interiorLevel === 'partial') {
    // 도배 + 강마루 + 싱크대 + 욕실 1칸 등 부분 리모델링 (평당 약 65만 원)
    interiorCost = safePyeong * 650000;
    interiorLabel = `부분 수리 (도배·마루·주방/욕실 · ${safePyeong}평 기준)`;
  } else if (interiorLevel === 'full') {
    // 구축 샷시(창호) 포함 전체 리모델링 (평당 약 150만 원)
    interiorCost = safePyeong * 1500000;
    interiorLabel = `전체 올수리 (샷시 포함 풀리모델링 · ${safePyeong}평 기준)`;
  }

  return {
    movingCost,
    interiorCost,
    interiorLevel,
    interiorLabel,
    totalLivingPrepCost: movingCost + interiorCost,
  };
}

/**
 * 6. 통합 '실제 필요 총현금(All-in Cash) 영수증' 계산기
 */
export function calculateAllInCashReceipt({
  priceKrw = 0,
  loanAmount = 0,
  areaSqMeter = 84,
  pyeong = 25,
  region = '서울',
  taxReliefType = 'none', // 'none' | 'firstHome' | 'newborn'
  includeBrokerVat = true,
  registrationMode = 'lawyer', // 'lawyer' | 'self'
  includeMoving = false,
  interiorLevel = 'none', // 'none' | 'basic' | 'partial' | 'full'
}) {
  // 1) 순수 매매 자기자본 (매매가 - 대출금)
  const purePropertyCash = Math.max(0, priceKrw - loanAmount);

  // 2) 계약금 10% (계약 당일 매도인에게 지급해야 하는 최소 현금)
  const contractDeposit10 = Math.round(priceKrw * 0.10);
  // 잔금일에 추가로 내야 할 순수 매매대금 잔액 (매매가 90% - 대출금)
  // 만약 대출금이 매매가의 90%보다 클 수는 없으므로(LTV 70~80%) 항상 양수
  const balanceDayPropertyCash = Math.max(0, purePropertyCash - contractDeposit10);

  // 3) 세금, 중개보수, 등기비용, 이사/인테리어
  const taxes = calculateAcquisitionTaxes({ priceKrw, areaSqMeter, taxReliefType });
  const brokerage = calculateBrokerageFee({ priceKrw, includeVat: includeBrokerVat });
  const registration = calculateRegistrationCosts({ priceKrw, region, registrationMode });
  const livingPrep = calculateMovingAndInteriorCosts({ pyeong, includeMoving, interiorLevel });

  // 필수 취득 부대비용 합계 (취득세등 + 중개보수 + 등기부대비용)
  const mandatoryClosingCosts =
    taxes.finalTotalTax + brokerage.totalBrokerFee + registration.totalRegistrationCost;

  // 선택 입주 준비비용 합계 (이사/입주청소 + 인테리어)
  const optionalPrepCosts = livingPrep.totalLivingPrepCost;

  // 총 부대비용 합계
  const totalExtraCosts = mandatoryClosingCosts + optionalPrepCosts;

  // 최종 통장에 있어야 할 총 필요 현금 (순수 자기자본 + 필수 부대비용 + 선택 입주비용)
  const totalAllInCash = purePropertyCash + totalExtraCosts;

  // 잔금일(D-Day) 당일에 실제로 지출되는 현금 총액 (매매잔금 + 필수부대비용 + 선택입주비용)
  const balanceDayTotalCash = balanceDayPropertyCash + totalExtraCosts;

  return {
    priceKrw,
    loanAmount,
    purePropertyCash,
    contractDeposit10,
    balanceDayPropertyCash,
    taxes,
    brokerage,
    registration,
    livingPrep,
    mandatoryClosingCosts,
    optionalPrepCosts,
    totalExtraCosts,
    totalAllInCash,
    balanceDayTotalCash,
    extraCostRatioPercent: priceKrw > 0 ? +((totalExtraCosts / priceKrw) * 100).toFixed(2) : 0,
  };
}
