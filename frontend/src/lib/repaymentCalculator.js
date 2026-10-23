/**
 * 대한민국 주택담보대출 3대 상환방식 정밀 시뮬레이터
 * 1. 원리금균등 분할상환 (level) : 매월 (원금+이자) 동일
 * 2. 원금균등 분할상환 (principal) : 매월 원금 동일, 이자 체감 (만기 총이자 최소)
 * 3. 체증식 분할상환 (graduated) : 만 40세 미만 청년·신혼 특례, 초기 원금 최소화 후 매년 점진 증가 (초기 1~10년 현금흐름 극대화)
 * + 거치기간(0년 비거치 vs 1년 이자만 납부 거치) 및 보유기간(3년/5년/7년/10년 후 갈아타기) 정밀 분석
 */

/**
 * 단일 상환방식에 대한 전체 월별 스케줄(1 ~ totalMonths) 생성
 * @param {number} loanAmount 대출 원금 (원)
 * @param {number} annualRate 연 이자율 (%, 예: 2.85)
 * @param {number} tenureYears 대출 만기 (년, 예: 30)
 * @param {string} method 'level' | 'principal' | 'graduated'
 * @param {number} graceYears 거치기간 (년, 0 또는 1)
 */
export function generateAmortizationSchedule({
  loanAmount = 0,
  annualRate = 3.0,
  tenureYears = 30,
  method = 'level',
  graceYears = 0,
}) {
  const totalMonths = Math.max(12, Math.round(tenureYears * 12));
  const graceMonths = Math.min(totalMonths - 12, Math.max(0, Math.round(graceYears * 12)));
  const repayMonths = totalMonths - graceMonths;
  const monthlyRate = (annualRate / 100) / 12;

  if (!loanAmount || loanAmount <= 0 || annualRate <= 0) {
    return {
      method,
      loanAmount: 0,
      annualRate,
      tenureYears,
      graceYears,
      firstMonthPayment: 0,
      afterGraceFirstPayment: 0,
      year1AvgPayment: 0,
      year3Payment: 0,
      year5Payment: 0,
      year7Payment: 0,
      year10Payment: 0,
      finalMonthPayment: 0,
      totalInterest: 0,
      totalPayment: 0,
      milestones: [],
      scheduleByYear: [],
    };
  }

  const monthlyRecords = [];
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalPayment = 0;

  // 1) 원리금균등 상환 기간 중 고정 월 납입액
  const levelPaymentDuringRepay =
    monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) /
        (Math.pow(1 + monthlyRate, repayMonths) - 1)
      : loanAmount / repayMonths;

  // 2) 체증식(Graduated) 상환 시 월별 원금 상환 가중치 계산
  // 기금/HF 체증식 실무: 초기에는 사실상 이자 위주로 납부하고 회차가 지날수록 원금 상환액이 선형(또는 연차별) 증가
  // k = 1 .. repayMonths 에 대해 원금 상환액 P_k = loanAmount * (2 * k) / (repayMonths * (repayMonths + 1))
  // 이 방식은 1회차 원금이 거의 0원에 가까워 첫 달 납입액 ≈ 순수 이자 수준이며, 회차에 비례해 원금 상환액이 정확히 증가하여 만기에 100% 상환됨.
  const graduatedDenominator = (repayMonths * (repayMonths + 1)) / 2;

  for (let m = 1; m <= totalMonths; m++) {
    const interestForMonth = remainingBalance * monthlyRate;
    let principalForMonth = 0;

    if (m <= graceMonths) {
      // 거치기간: 이자만 납부
      principalForMonth = 0;
    } else {
      const k = m - graceMonths; // 상환 회차 (1 ~ repayMonths)
      if (method === 'principal') {
        // 원금균등: 매월 동일한 원금 상환
        principalForMonth = loanAmount / repayMonths;
      } else if (method === 'graduated') {
        // 체증식: 상환 회차 k에 비례하여 원금 상환액 증가
        principalForMonth = (loanAmount * k) / graduatedDenominator;
      } else {
        // 원리금균등: 고정 원리금 - 당월 이자
        principalForMonth = levelPaymentDuringRepay - interestForMonth;
      }
    }

    // 마지막 달 잔액 오차 보정
    if (m === totalMonths || principalForMonth > remainingBalance) {
      principalForMonth = remainingBalance;
    }

    const paymentForMonth = principalForMonth + interestForMonth;
    remainingBalance = Math.max(0, remainingBalance - principalForMonth);

    totalInterest += interestForMonth;
    totalPayment += paymentForMonth;

    monthlyRecords.push({
      month: m,
      year: Math.ceil(m / 12),
      payment: Math.round(paymentForMonth),
      principal: Math.round(principalForMonth),
      interest: Math.round(interestForMonth),
      balance: Math.round(remainingBalance),
    });
  }

  // 연차별 요약 데이터 생성 (1년차 ~ 만기년차)
  const scheduleByYear = [];
  for (let y = 1; y <= tenureYears; y++) {
    const slice = monthlyRecords.slice((y - 1) * 12, y * 12);
    if (slice.length === 0) continue;
    const avgMonthlyPayment = Math.round(
      slice.reduce((acc, cur) => acc + cur.payment, 0) / slice.length
    );
    const avgMonthlyPrincipal = Math.round(
      slice.reduce((acc, cur) => acc + cur.principal, 0) / slice.length
    );
    const avgMonthlyInterest = Math.round(
      slice.reduce((acc, cur) => acc + cur.interest, 0) / slice.length
    );
    const endOfYearBalance = slice[slice.length - 1].balance;

    // 1년차부터 y년차까지 누적 납부 원리금 및 누적 납부 이자
    const cumulativeSlice = monthlyRecords.slice(0, y * 12);
    const cumulativePayment = cumulativeSlice.reduce((acc, cur) => acc + cur.payment, 0);
    const cumulativeInterest = cumulativeSlice.reduce((acc, cur) => acc + cur.interest, 0);
    const cumulativePrincipalPaid = loanAmount - endOfYearBalance;

    scheduleByYear.push({
      year: y,
      avgMonthlyPayment,
      avgMonthlyPrincipal,
      avgMonthlyInterest,
      endOfYearBalance,
      cumulativePayment,
      cumulativeInterest,
      cumulativePrincipalPaid,
    });
  }

  const getYearPayment = (yr) => {
    const found = scheduleByYear.find((s) => s.year === yr);
    return found ? found.avgMonthlyPayment : 0;
  };

  // 주요 연차 마일스톤 추출 (1년, 3년, 5년, 7년, 10년, 20년, 만기)
  const milestoneYears = Array.from(
    new Set([1, 3, 5, 7, 10, 15, 20, tenureYears].filter((y) => y <= tenureYears))
  ).sort((a, b) => a - b);

  const milestones = milestoneYears.map((yr) => {
    const yData = scheduleByYear.find((s) => s.year === yr);
    return yData;
  }).filter(Boolean);

  const firstMonthPayment = monthlyRecords[0]?.payment || 0;
  const afterGraceFirstPayment = monthlyRecords[graceMonths]?.payment || firstMonthPayment;

  return {
    method,
    loanAmount,
    annualRate,
    tenureYears,
    graceYears,
    firstMonthPayment,
    afterGraceFirstPayment,
    year1AvgPayment: getYearPayment(1),
    year3Payment: getYearPayment(3),
    year5Payment: getYearPayment(5),
    year7Payment: getYearPayment(7),
    year10Payment: getYearPayment(10),
    finalMonthPayment: monthlyRecords[monthlyRecords.length - 1]?.payment || 0,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    milestones,
    scheduleByYear,
  };
}

/**
 * 3대 상환방식(원리금균등 / 원금균등 / 체증식) 동시 비교 및 보유기간(holdingYears)별 유불리 분석
 */
export function compareAllRepaymentMethods({
  loanAmount = 0,
  annualRate = 3.0,
  tenureYears = 30,
  graceYears = 0,
  holdingYears = 5, // 기본 5년 거주 후 갈아타기/중도상환 시나리오
}) {
  const level = generateAmortizationSchedule({
    loanAmount,
    annualRate,
    tenureYears,
    method: 'level',
    graceYears,
  });
  const principal = generateAmortizationSchedule({
    loanAmount,
    annualRate,
    tenureYears,
    method: 'principal',
    graceYears,
  });
  const graduated = generateAmortizationSchedule({
    loanAmount,
    annualRate,
    tenureYears,
    method: 'graduated',
    graceYears,
  });

  const safeHoldingYear = Math.min(tenureYears, Math.max(1, holdingYears));
  const getHoldingStats = (sched) => {
    const found =
      sched.scheduleByYear.find((s) => s.year === safeHoldingYear) ||
      sched.scheduleByYear[sched.scheduleByYear.length - 1];
    if (!found) {
      return {
        holdingYears: safeHoldingYear,
        cumulativePayment: 0,
        cumulativeInterest: 0,
        CumulativePrincipalPaid: 0,
        remainingBalance: 0,
        avgMonthlyDuringHolding: 0,
      };
    }
    const slice = sched.scheduleByYear.filter((s) => s.year <= safeHoldingYear);
    const avgMonthlyDuringHolding = Math.round(
      slice.reduce((acc, cur) => acc + cur.avgMonthlyPayment, 0) / slice.length
    );
    return {
      holdingYears: safeHoldingYear,
      cumulativePayment: found.cumulativePayment,
      cumulativeInterest: found.cumulativeInterest,
      cumulativePrincipalPaid: found.cumulativePrincipalPaid,
      remainingBalance: found.endOfYearBalance,
      avgMonthlyDuringHolding,
    };
  };

  const levelHolding = getHoldingStats(level);
  const principalHolding = getHoldingStats(principal);
  const graduatedHolding = getHoldingStats(graduated);

  // 체증식 선택 시 1년차 월 상환액 절감액 (원리금균등 대비)
  const firstYearMonthlyDiffGraduatedVsLevel = Math.max(
    0,
    level.afterGraceFirstPayment - graduated.afterGraceFirstPayment
  );

  // 보유기간(예: 5년) 동안 체증식이 원리금균등 대비 아껴주는 누적 현금흐름 총액
  const holdingCashFlowSavedGraduatedVsLevel = Math.max(
    0,
    levelHolding.cumulativePayment - graduatedHolding.cumulativePayment
  );

  // 만기까지 유지 시 원금균등이 원리금균등 대비 아끼는 총이자 절감액
  const totalInterestSavedPrincipalVsLevel = Math.max(
    0,
    level.totalInterest - principal.totalInterest
  );

  return {
    level,
    principal,
    graduated,
    holdingAnalysis: {
      holdingYears: safeHoldingYear,
      level: levelHolding,
      principal: principalHolding,
      graduated: graduatedHolding,
      firstYearMonthlyDiffGraduatedVsLevel,
      holdingCashFlowSavedGraduatedVsLevel,
      totalInterestSavedPrincipalVsLevel,
    },
  };
}
