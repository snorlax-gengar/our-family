import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, Train, Calendar, TrendingUp, DollarSign, 
  ShieldCheck, Calculator, Sparkles, ExternalLink, CheckCircle2, ArrowRight, Heart,
  RotateCcw, SlidersHorizontal, Search, AlertTriangle, Receipt, Truck, Hammer, Scale, Wallet
} from 'lucide-react';

import FloorPlanViewer from './FloorPlanViewer';
import { calculateAllInCashReceipt } from '../lib/closingCostCalculator';
import { compareAllRepaymentMethods } from '../lib/repaymentCalculator';
import { WORKPLACE_HUBS, calculatePropertyCommute } from '../lib/commuteCalculator';
import {
  generateSpecialClauses,
  buildFullSpecialClausesText,
  CONTRACT_TIMELINE_STEPS,
} from '../lib/contractSpecialClauses';

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  userCriteria, 
  initialTab = 'all',
  isFavorite = false,
  onToggleFavorite,
  isInCompare = false,
  onToggleCompare
}) {
  const [modalTab, setModalTab] = useState(initialTab); // 'all', 'floorPlan', 'financial'
  const [activeProperty, setActiveProperty] = useState(property);
  const [selectedLoanType, setSelectedLoanType] = useState(userCriteria?.loanType || 'newborn');

  // 사용자 직접 수정 가격 상태 (매매가, KB시세)
  const [customPrice, setCustomPrice] = useState(null);
  const [customKbPrice, setCustomKbPrice] = useState(null);

  // 💸 [All-in Cash 영수증] 부대비용 & 입주비용 상세 옵션 상태
  const [taxReliefType, setTaxReliefType] = useState(() => {
    if (userCriteria?.isFirstHome) return 'firstHome';
    if ((userCriteria?.loanType || 'newborn') === 'newborn') return 'newborn';
    return 'none';
  });
  const [includeBrokerVat, setIncludeBrokerVat] = useState(true);
  const [registrationMode, setRegistrationMode] = useState('lawyer'); // 'lawyer' | 'self'
  const [includeMoving, setIncludeMoving] = useState(false);
  const [interiorLevel, setInteriorLevel] = useState('none'); // 'none' | 'basic' | 'partial' | 'full'
  const [myBudgetKrw, setMyBudgetKrw] = useState(200000000); // 우리 부부 보유 현금 예산 (기본 2.0억)
  const [showBudgetChecker, setShowBudgetChecker] = useState(false);

  // 📊 [3대 상환방식 & 거치/갈아타기 스케줄러] 상태
  const [repaymentMethod, setRepaymentMethod] = useState(userCriteria?.repaymentMethod || 'level'); // 'level' | 'principal' | 'graduated'
  const [graceYears, setGraceYears] = useState(0); // 0 (비거치) | 1 (1년 이자만 거치)
  const [holdingYears, setHoldingYears] = useState(5); // 거주 후 매도/갈아타기 시점 (3, 5, 7, 10년 등)

  // 📝 [실전 매수 계약서 필수 특약사항 생성기 & D-Day 체크리스트] 상태
  const [selectedClauseIds, setSelectedClauseIds] = useState([
    'electronic_contract',
    'policy_loan_coop',
    'prior_mortgage_repay',
    'major_defect_leak',
    'long_term_repair_reserve',
  ]);
  const [copiedClauseId, setCopiedClauseId] = useState(null);
  const [checkedTimelineItems, setCheckedTimelineItems] = useState(() => {
    try {
      const saved = localStorage.getItem('wooriga_contract_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTimelineCheck = (itemId) => {
    setCheckedTimelineItems((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem('wooriga_contract_checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleClauseSelection = (clauseId) => {
    setSelectedClauseIds((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  };

  const copyTextToClipboard = async (text, badgeKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedClauseId(badgeKey);
      setTimeout(() => {
        setCopiedClauseId((prev) => (prev === badgeKey ? null : prev));
      }, 2200);
    } catch {}
  };

  useEffect(() => {
    if (userCriteria?.repaymentMethod) {
      setRepaymentMethod(userCriteria.repaymentMethod);
    }
  }, [userCriteria?.repaymentMethod]);

  useEffect(() => {
    setActiveProperty(property);
    setCustomPrice(null);
    setCustomKbPrice(null);
  }, [property]);

  useEffect(() => {
    if (userCriteria?.loanType) {
      setSelectedLoanType(userCriteria.loanType);
    }
  }, [userCriteria?.loanType]);

  // 상위 조건(생애최초/대출유형) 변경 시 취득세 감면 기본값 동기화
  useEffect(() => {
    if (userCriteria?.isFirstHome) {
      setTaxReliefType('firstHome');
    } else if (selectedLoanType === 'newborn') {
      setTaxReliefType('newborn');
    } else {
      setTaxReliefType('none');
    }
  }, [userCriteria?.isFirstHome, selectedLoanType]);

  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab]);

  if (!activeProperty) return null;

  const prop = activeProperty;
  const kb = prop.kbPrice || {};
  const cleanPropertyName = (prop.name || '')
    .replace(/\s*\(\d+평형?\).*$/, '')
    .replace(/\s*\d+평형?.*$/, '')
    .trim();
  const kbSearchUrl = `https://kbland.kr/search?keyword=${encodeURIComponent(cleanPropertyName)}`;

  // 사용자 직접 입력 가격 vs 기본 데이터베이스 가격
  const activePrice = customPrice !== null ? customPrice : prop.priceKrw;
  const activeKbPrice = customKbPrice !== null ? customKbPrice : (kb.generalAvg || prop.priceKrw);
  const isCustomized = customPrice !== null || customKbPrice !== null;

  // Min(실매매가, KB시세) 담보평가액 산출
  const appraisalPrice = Math.min(activePrice, activeKbPrice);
  const isKbLower = activeKbPrice < activePrice;
  const valuationBasis = isKbLower ? 'KB시세' : '실매매가';

  const tenure = userCriteria?.loanTenureYears || 30;
  const isFirstHome = userCriteria?.isFirstHome || false;
  const income = userCriteria?.annualIncome || 80000000;
  const discount = userCriteria?.preferentialDiscount || 0.2;
  const totalMonths = tenure * 12;

  const formatMoney = (val) => {
    if (!val || val === 0) return '0원';
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    if (eok > 0) {
      return `${eok}억 ${man > 0 ? man.toLocaleString() + '만' : ''}원`;
    }
    return `${man.toLocaleString()}만원`;
  };

  // 3대 정책대출 실시간 산출 함수 (사용자 직접 수정 가격 반영)
  const calcLoanDetails = (type) => {
    let meetsPrice = true;
    let meetsIncome = true;
    let limit = 500000000;
    let ltv = 0.70;
    let rate = 3.10;
    let name = '';
    let shortName = '';
    let reasons = [];

    if (type === 'newborn') {
      name = '신생아 특례 디딤돌 대출';
      shortName = '신생아 특례';
      meetsPrice = appraisalPrice <= 900000000;
      meetsIncome = income <= 200000000;
      limit = 500000000;
      ltv = 0.70;
      rate = income <= 20000000 ? 1.95 :
             income <= 40000000 ? 2.45 :
             income <= 60000000 ? 2.85 :
             income <= 85000000 ? 3.05 :
             income <= 130000000 ? 3.30 : 3.50;
      rate = Math.max(1.20, +(rate - discount).toFixed(2));
      if (!meetsPrice) reasons.push(`주택가격(${formatMoney(appraisalPrice)})이 9억 원을 초과합니다.`);
      if (!meetsIncome) reasons.push('부부합산 연소득 2억 원 초과');
    } else if (type === 'bogeumjari') {
      name = 'HF 한국주택금융공사 보금자리론';
      shortName = 'HF 보금자리론';
      meetsPrice = appraisalPrice <= 600000000;
      meetsIncome = income <= 85000000;
      limit = isFirstHome ? 420000000 : 400000000;
      ltv = isFirstHome ? 0.80 : 0.70;
      const fixedRates = { 10: 3.65, 15: 3.75, 20: 3.80, 30: 3.85, 40: 3.90, 50: 3.95 };
      const baseR = fixedRates[tenure] || 3.85;
      rate = Math.max(2.65, +(baseR - (isFirstHome ? 0.2 : 0) - 0.1).toFixed(2));
      if (!meetsPrice) reasons.push(`주택가격(${formatMoney(appraisalPrice)})이 보금자리론 상한인 6억 원을 초과합니다.`);
      if (!meetsIncome) reasons.push('소득 상한 8,500만 원 초과');
    } else {
      name = isFirstHome ? '내집마련 디딤돌 대출 (생애최초 특례)' : '내집마련 디딤돌 대출';
      shortName = '생애최초 디딤돌';
      meetsPrice = appraisalPrice <= 600000000;
      meetsIncome = income <= 85000000;
      limit = isFirstHome ? 300000000 : 250000000;
      ltv = isFirstHome ? 0.80 : 0.70;
      const baseRates = { 10: 3.65, 15: 3.75, 20: 3.85, 30: 3.95 };
      const baseR = baseRates[tenure] || 3.85;
      rate = Math.max(1.50, +(baseR - (isFirstHome ? 0.2 : 0) - discount).toFixed(2));
      if (!meetsPrice) reasons.push(`주택가격(${formatMoney(appraisalPrice)})이 디딤돌 상한(6억)을 초과합니다.`);
      if (!meetsIncome) reasons.push('소득 상한 8,500만 원 초과');
    }

    const isEligible = meetsPrice && meetsIncome;
    let maxL = isEligible ? Math.round(appraisalPrice * ltv) : 0;
    if (maxL > limit) maxL = limit;
    if (maxL < 0) maxL = 0;

    const reqCash = Math.max(0, activePrice - maxL);
    const mRate = (rate / 100) / 12;
    const mPay = (maxL > 0 && mRate > 0)
      ? Math.round((maxL * mRate * Math.pow(1 + mRate, totalMonths)) / (Math.pow(1 + mRate, totalMonths) - 1))
      : 0;

    const mktRate = 4.30;
    const mktMonthlyRate = (mktRate / 100) / 12;
    const mktMonthlyPay = (maxL > 0)
      ? Math.round((maxL * mktMonthlyRate * Math.pow(1 + mktMonthlyRate, totalMonths)) / (Math.pow(1 + mktMonthlyRate, totalMonths) - 1))
      : 0;
    const mSavings = Math.max(0, mktMonthlyPay - mPay);
    const totSavings = mSavings * totalMonths;

    // 해당 대출 적용 시 All-in Cash 영수증 계산
    const receipt = calculateAllInCashReceipt({
      priceKrw: activePrice,
      loanAmount: maxL,
      areaSqMeter: prop.areaSqMeter,
      pyeong: prop.pyeong,
      region: prop.region || '서울',
      taxReliefType: type === 'newborn' ? 'newborn' : (isFirstHome ? 'firstHome' : taxReliefType),
      includeBrokerVat,
      registrationMode,
      includeMoving,
      interiorLevel,
    });

    return {
      type,
      name,
      shortName,
      isEligible,
      reasons,
      maxLoan: maxL,
      requiredCash: reqCash,
      allInCash: receipt.totalAllInCash,
      rate,
      monthlyPayment: mPay,
      ltvRatio: Math.round(ltv * 100),
      limit,
      marketRate: mktRate,
      marketMonthlyPayment: mktMonthlyPay,
      monthlySavings: mSavings,
      totalSavings: totSavings
    };
  };

  const newbornLoan = calcLoanDetails('newborn');
  const bogeumjariLoan = calcLoanDetails('bogeumjari');
  const didimdolLoan = calcLoanDetails('didimdol');

  // 활성 선택 대출
  const activeLoan = selectedLoanType === 'bogeumjari' ? bogeumjariLoan : (selectedLoanType === 'didimdol' ? didimdolLoan : newbornLoan);

  const maxLoan = activeLoan.maxLoan;
  const requiredCash = activeLoan.requiredCash;
  const finalInterestRate = activeLoan.rate;
  const marketMonthlyPayment = activeLoan.marketMonthlyPayment;
  const totalSavings = activeLoan.totalSavings;

  // 📊 3대 상환방식(원리금균등 / 원금균등 / 체증식) & 거치·보유기간 정밀 비교
  const repaymentComparison = compareAllRepaymentMethods({
    loanAmount: maxLoan,
    annualRate: finalInterestRate,
    tenureYears: tenure,
    graceYears,
    holdingYears,
  });
  const activeRepaySchedule =
    repaymentMethod === 'graduated'
      ? repaymentComparison.graduated
      : repaymentMethod === 'principal'
      ? repaymentComparison.principal
      : repaymentComparison.level;
  const monthlyPayment = activeRepaySchedule.firstMonthPayment || activeLoan.monthlyPayment;
  const monthlySavings = Math.max(0, marketMonthlyPayment - monthlyPayment);

  // 💸 현재 선택된 옵션 기준 정밀 '실제 필요 총현금(All-in Cash) 영수증' 계산
  const allInReceipt = calculateAllInCashReceipt({
    priceKrw: activePrice,
    loanAmount: maxLoan,
    areaSqMeter: prop.areaSqMeter,
    pyeong: prop.pyeong,
    region: prop.region || '서울',
    taxReliefType,
    includeBrokerVat,
    registrationMode,
    includeMoving,
    interiorLevel,
  });

  const {
    taxes,
    brokerage,
    registration,
    livingPrep,
    contractDeposit10,
    balanceDayPropertyCash,
    mandatoryClosingCosts,
    optionalPrepCosts,
    totalExtraCosts,
    totalAllInCash,
    balanceDayTotalCash,
  } = allInReceipt;

  const budgetDiff = myBudgetKrw - totalAllInCash;

  const handleResetCustomPrices = () => {
    setCustomPrice(null);
    setCustomKbPrice(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 break-keep">
      <div 
        className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile pull handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shrink-0 whitespace-nowrap">
              {prop.region} {prop.district}
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {cleanPropertyName}
            </h2>
            {prop.variants && prop.variants.length > 1 ? (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {prop.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveProperty(v);
                      setCustomPrice(null);
                      setCustomKbPrice(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      prop.id === v.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    {v.pyeong}평 ({v.areaSqMeter}㎡)
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-semibold text-slate-500 shrink-0 whitespace-nowrap">
                {prop.pyeong}평 ({prop.areaSqMeter}㎡)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(prop.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap ${
                  isInCompare
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isInCompare ? '✓ 비교담김' : '비교담기'}</span>
              </button>
            )}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="hidden sm:inline">{isFavorite ? '찜됨' : '찜하기'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top Quick Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block mb-1 whitespace-nowrap">매매 기준가 (현재적용)</span>
              <span className="text-lg font-black text-blue-700 block whitespace-nowrap">
                {formatMoney(activePrice)}
              </span>
              {isCustomized && (
                <span className="text-[10px] text-amber-600 font-bold block whitespace-nowrap">※ 직접수정값 적용중</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block mb-1 whitespace-nowrap">인근 지하철역</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 whitespace-nowrap truncate">
                <Train className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{prop.subwayStation}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 whitespace-nowrap">준공년도 / 총세대수</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">
                {prop.buildYear}년 ({prop.totalUnits?.toLocaleString()}세대)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 whitespace-nowrap">구조 / 방수</span>
              <span className="font-bold text-slate-800 whitespace-nowrap">{prop.rooms}</span>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2">
            {prop.highlights?.map((h, idx) => (
              <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                ★ {h}
              </span>
            ))}
          </div>

          {/* Navigation Sub-Tabs in Modal */}
          <div className="flex border-b border-slate-200 text-xs font-bold gap-3 sm:gap-4 pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              onClick={() => setModalTab('all')}
              className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                modalTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              종합 정보 보기 (도면 + 시세 + 총현금 영수증)
            </button>
            <button
              onClick={() => setModalTab('floorPlan')}
              className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                modalTab === 'floorPlan'
                  ? 'border-emerald-600 text-emerald-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>🏛️ 공식 실물 도면 & 구조 안내</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                네이버 연동
              </span>
            </button>
            <button
              onClick={() => setModalTab('financial')}
              className={`pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                modalTab === 'financial'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💰 정책대출 & 실제 총현금(All-in) 영수증
            </button>
            <button
              onClick={() => setModalTab('contract')}
              className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                modalTab === 'contract'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>📝 실전 계약 특약 생성기 & 체크리스트</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                원클릭 복사
              </span>
            </button>
          </div>

          {/* Section: 공식 실물 평면도 안내 센터 */}
          {(modalTab === 'all' || modalTab === 'floorPlan') && prop.floorPlan && (
            <div className="space-y-3">
              <FloorPlanViewer
                floorPlan={prop.floorPlan}
                propertyName={cleanPropertyName}
                areaSqMeter={prop.areaSqMeter}
                pyeong={prop.pyeong}
                naverLandUrl={prop.naverLandUrl}
                naverMobileUrl={prop.naverMobileUrl}
                naverComplexNo={prop.naverComplexNo}
                kbLandUrl={kbSearchUrl}
              />
            </div>
          )}

          {/* Section: 금융/대출 탭 및 종합 탭 공통 */}
          {(modalTab === 'all' || modalTab === 'financial') && (
            <>
              {/* ⚙️ 실제 매매가 & KB 시세 직접 수정 / 입력 패널 */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 rounded-2xl p-4 sm:p-5 text-white border-2 border-indigo-400/50 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded whitespace-nowrap">
                      실시간 견적 조정
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white whitespace-nowrap">
                      실제 협의 매매가 & KB시세 직접 입력
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCustomized && (
                      <button
                        type="button"
                        onClick={handleResetCustomPrices}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-600 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="원래 등록된 기본 가격으로 초기화"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>기본값 복원</span>
                      </button>
                    )}
                    <a
                      href={kbSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-black transition-colors flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                      title="KB부동산에서 해당 단지의 실시간 공시 시세 검색"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>KB 최신시세 확인</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <p className="text-xs text-slate-300 break-keep leading-relaxed">
                  KB부동산에서 확인하신 <strong>실제 최신 시세</strong>나 <strong>부동산과 네고 중인 매매가</strong>를 직접 입력해 보세요. Min(매매가, KB시세) 원칙에 따라 대출 가능액과 부대비용 포함 총 필요 현금이 즉시 재계산됩니다.
                </p>

                {/* 2열 입력 폼: 매매가 & KB시세 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* 1. 협의 매매가 입력 */}
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">① 실제 협의 매매가</span>
                      <span className="text-sm font-black text-amber-300">
                        {formatMoney(activePrice)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000000"
                        value={activePrice}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomPrice(isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-amber-400"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">원</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => setCustomPrice(Math.max(0, activePrice - 10000000))}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        -1,000만
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPrice(Math.max(0, activePrice - 5000000))}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        -500만
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPrice(activePrice + 5000000)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        +500만
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPrice(activePrice + 10000000)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        +1,000만
                      </button>
                    </div>
                  </div>

                  {/* 2. KB부동산 일반평균가 입력 */}
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">② KB부동산 일반평균가 (담보평가)</span>
                      <span className="text-sm font-black text-emerald-400">
                        {formatMoney(activeKbPrice)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000000"
                        value={activeKbPrice}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomKbPrice(isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-emerald-400"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">원</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {kb.lowAvg && (
                        <button
                          type="button"
                          onClick={() => setCustomKbPrice(kb.lowAvg)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                          title="1층 등 저층 기준 하위평균가로 설정"
                        >
                          하위가({Math.round(kb.lowAvg / 100000000 * 10) / 10}억)
                        </button>
                      )}
                      {kb.generalAvg && (
                        <button
                          type="button"
                          onClick={() => setCustomKbPrice(kb.generalAvg)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                          title="기준 일반평균가로 설정"
                        >
                          일반가({Math.round(kb.generalAvg / 100000000 * 10) / 10}억)
                        </button>
                      )}
                      {kb.highAvg && (
                        <button
                          type="button"
                          onClick={() => setCustomKbPrice(kb.highAvg)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                          title="로얄층 기준 상위평균가로 설정"
                        >
                          상위가({Math.round(kb.highAvg / 100000000 * 10) / 10}억)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCustomKbPrice(Math.max(0, activeKbPrice - 10000000))}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        -1천만
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomKbPrice(activeKbPrice + 10000000)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                      >
                        +1천만
                      </button>
                    </div>
                  </div>
                </div>

                {/* Min 원칙 실시간 판정 상태 바 */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-slate-300">
                      담보평가 기준: Min(매매가 {formatMoney(activePrice)}, KB시세 {formatMoney(activeKbPrice)}) ➔{' '}
                      <strong className="text-amber-300 font-extrabold">{formatMoney(appraisalPrice)}</strong>
                    </span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap self-start sm:self-auto">
                    {valuationBasis} 기준 LTV 70% 적용
                  </span>
                </div>
              </div>

              {/* Section 1: KB 부동산 시세 분석 카드 */}
              <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/70">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                      KB
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">KB 부동산 공식 시세 현황</h3>
                      <p className="text-xs text-slate-500">기준월: {kb.updatedAt || '최근 공시'} · 은행 대출 심사 시 담보평가 기준</p>
                    </div>
                  </div>
                  <a
                    href={kbSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline whitespace-nowrap"
                  >
                    <span>KB부동산 단지 바로가기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                    <span className="text-xs text-slate-400 block whitespace-nowrap">KB 일반평균가 (기준)</span>
                    <span className="text-base font-extrabold text-slate-900 block whitespace-nowrap">{formatMoney(activeKbPrice)}</span>
                    <span className="text-[10px] text-amber-600 block mt-0.5 whitespace-nowrap">※ 주담대 한도 산정 기준</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                    <span className="text-xs text-slate-400 block whitespace-nowrap">KB 상위평균가</span>
                    <span className="text-base font-bold text-slate-700 block whitespace-nowrap">{formatMoney(kb.highAvg)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap">로얄층/선호동 기준</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                    <span className="text-xs text-slate-400 block whitespace-nowrap">KB 하위평균가</span>
                    <span className="text-base font-bold text-slate-700 block whitespace-nowrap">{formatMoney(kb.lowAvg)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap">1층 및 저층 기준</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                    <span className="text-xs text-slate-400 block whitespace-nowrap">전세평균가 / 전세가율</span>
                    <span className="text-base font-extrabold text-blue-600 block whitespace-nowrap">
                      {kb.jeonseAvg ? formatMoney(kb.jeonseAvg) : '시세 미제공'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 block mt-0.5 whitespace-nowrap">
                      {kb.jeonseRate ? `전세가율 ${kb.jeonseRate}%` : '전세가율 산정불가'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: 3대 정책대출 맞춤 시뮬레이터 & 종합 비교표 */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-4 sm:p-5 border border-blue-200 space-y-4">
                {/* 3대 대출 선택 탭 바 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 flex-wrap">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>정부 3대 정책대출 맞춤 견적</span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                        DSR 규제 미적용
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      담보평가 기준: Min(매매가 {formatMoney(activePrice)}, KB시세 {formatMoney(activeKbPrice)}) → <strong className="text-blue-700 font-bold">{formatMoney(appraisalPrice)}</strong> ({valuationBasis})
                    </p>
                  </div>

                  {/* 4-way Loan Selector Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-blue-200 shrink-0 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'newborn', label: '🐣 신생아 특례' },
                      { id: 'bogeumjari', label: '🏠 HF 보금자리론' },
                      { id: 'didimdol', label: '🌱 생애최초 디딤돌' },
                      { id: 'compare', label: '⚖️ 3종 종합 비교' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedLoanType(tab.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedLoanType === tab.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MODE A: 3종 대출 종합 비교표 */}
                {selectedLoanType === 'compare' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-blue-100/60 p-2.5 rounded-lg">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>우리 가족 조건(소득 {formatMoney(income)} · {isFirstHome ? '생애최초' : '무주택'}) 기준 3대 정책대출 비교</span>
                      </span>
                      <span className="text-[11px] text-blue-700 font-extrabold whitespace-nowrap">
                        {appraisalPrice <= 600000000 ? '⭐ 3대 대출 모두 심사 가능 단지' : '💡 신생아 특례대출 최적 적합 단지'}
                      </span>
                    </div>

                    <div className="overflow-x-auto -webkit-overflow-scrolling-touch bg-white rounded-xl border border-blue-200">
                      <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
                            <th className="py-2.5 px-3">비교 항목</th>
                            <th className={`py-2.5 px-3 ${newbornLoan.isEligible ? 'bg-blue-50 text-blue-900' : ''}`}>
                              🐣 신생아 특례대출
                            </th>
                            <th className={`py-2.5 px-3 ${bogeumjariLoan.isEligible ? 'bg-indigo-50 text-indigo-900' : ''}`}>
                              🏠 HF 보금자리론
                            </th>
                            <th className={`py-2.5 px-3 ${didimdolLoan.isEligible ? 'bg-emerald-50 text-emerald-900' : ''}`}>
                              🌱 생애최초 디딤돌
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {/* 1. 심사 결과 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">대출 적격 여부</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {newbornLoan.isEligible ? (
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                                  ✅ 대출 적격 (추천)
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold text-[11px]">❌ 부적격</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {bogeumjariLoan.isEligible ? (
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                                  ✅ 대출 적격 (고정금리)
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold text-[11px]">❌ 6억 초과 부적격</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {didimdolLoan.isEligible ? (
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                                  ✅ 대출 적격 (초저리)
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold text-[11px]">❌ 6억 초과 부적격</span>
                              )}
                            </td>
                          </tr>

                          {/* 2. 주택 상한 & 대상 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">주택 가격 상한</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">9억 원 이하 (85㎡ 이하)</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">6억 원 이하 (면적제한 없음)</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">5~6억 원 이하 (85㎡ 이하)</td>
                          </tr>

                          {/* 3. 최대 대출 한도 규정 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">제도 최대 한도</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">최대 5.0억 원</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">최대 3.6억 (생애최초 4.2억)</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">최대 3.0억 (신혼 4.0억)</td>
                          </tr>

                          {/* 4. 이 매물 실제 대출 가능액 */}
                          <tr className="bg-amber-50/40">
                            <td className="py-2.5 px-3 font-black text-slate-900 bg-amber-100/60 whitespace-nowrap">
                              이 단지 대출가능액
                            </td>
                            <td className="py-2.5 px-3 font-black text-blue-700 whitespace-nowrap text-sm">
                              {newbornLoan.isEligible ? formatMoney(newbornLoan.maxLoan) : '0원 (불가)'}
                            </td>
                            <td className="py-2.5 px-3 font-black text-indigo-700 whitespace-nowrap text-sm">
                              {bogeumjariLoan.isEligible ? formatMoney(bogeumjariLoan.maxLoan) : '0원 (불가)'}
                            </td>
                            <td className="py-2.5 px-3 font-black text-emerald-700 whitespace-nowrap text-sm">
                              {didimdolLoan.isEligible ? formatMoney(didimdolLoan.maxLoan) : '0원 (불가)'}
                            </td>
                          </tr>

                          {/* 5. 적용 금리 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">적용 금리</td>
                            <td className="py-2.5 px-3 font-extrabold text-blue-600 whitespace-nowrap">
                              연 {newbornLoan.rate}%
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-indigo-600 whitespace-nowrap">
                              고정 연 {bogeumjariLoan.rate}%
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-emerald-600 whitespace-nowrap">
                              연 {didimdolLoan.rate}%
                            </td>
                          </tr>

                          {/* 6. 월 예상 원리금 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">월 원리금 ({tenure}년)</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {newbornLoan.isEligible ? `약 ${newbornLoan.monthlyPayment.toLocaleString()}원` : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {bogeumjariLoan.isEligible ? `약 ${bogeumjariLoan.monthlyPayment.toLocaleString()}원` : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {didimdolLoan.isEligible ? `약 ${didimdolLoan.monthlyPayment.toLocaleString()}원` : '-'}
                            </td>
                          </tr>

                          {/* 7. 순수 매매 필요 현금 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">순수 매수 현금 (매매-대출)</td>
                            <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                              {newbornLoan.isEligible ? formatMoney(newbornLoan.requiredCash) : formatMoney(activePrice)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                              {bogeumjariLoan.isEligible ? formatMoney(bogeumjariLoan.requiredCash) : formatMoney(activePrice)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                              {didimdolLoan.isEligible ? formatMoney(didimdolLoan.requiredCash) : formatMoney(activePrice)}
                            </td>
                          </tr>

                          {/* 8. 부대비용 포함 실제 필요 총현금 (All-in) */}
                          <tr className="bg-rose-50/40">
                            <td className="py-2.5 px-3 font-black text-rose-900 bg-rose-100/60 whitespace-nowrap">
                              실제 필요 총현금 (세금·복비 포함)
                            </td>
                            <td className="py-2.5 px-3 font-black text-rose-600 whitespace-nowrap text-sm">
                              {formatMoney(newbornLoan.allInCash)}
                            </td>
                            <td className="py-2.5 px-3 font-black text-rose-600 whitespace-nowrap text-sm">
                              {formatMoney(bogeumjariLoan.allInCash)}
                            </td>
                            <td className="py-2.5 px-3 font-black text-rose-600 whitespace-nowrap text-sm">
                              {formatMoney(didimdolLoan.allInCash)}
                            </td>
                          </tr>

                          {/* 9. DSR 규제 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">DSR 규제 적용</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold whitespace-nowrap">미적용 (DTI 60%)</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold whitespace-nowrap">미적용 (DTI 60%)</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold whitespace-nowrap">미적용 (DTI 60%)</td>
                          </tr>

                          {/* 10. 바로가기 버튼 */}
                          <tr>
                            <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">견적서 보기</td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => setSelectedLoanType('newborn')}
                                className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer whitespace-nowrap shadow-2xs"
                              >
                                신생아 견적
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => setSelectedLoanType('bogeumjari')}
                                className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer whitespace-nowrap shadow-2xs"
                              >
                                보금자리 견적
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => setSelectedLoanType('didimdol')}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer whitespace-nowrap shadow-2xs"
                              >
                                디딤돌 견적
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* MODE B: 개별 대출 상세 시뮬레이션 카드 */
                  <div className="space-y-4">
                    {/* 부적격 경고 배너 */}
                    {!activeLoan.isEligible && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{activeLoan.name} 대상에서 제외되는 매물입니다.</span>
                        </div>
                        <ul className="text-xs text-rose-700 list-disc list-inside space-y-0.5">
                          {activeLoan.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                        {newbornLoan.isEligible && (
                          <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                            <span className="text-blue-900 font-bold">
                              💡 신생아 특례대출(9억 이하)로는 최대 {formatMoney(newbornLoan.maxLoan)}까지 대출 가능합니다!
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedLoanType('newborn')}
                              className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                            >
                              신생아 특례 견적으로 전환
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3대 핵심 지표 카드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">최대 대출 가능 금액</span>
                        <div className={`text-2xl font-black mt-1 whitespace-nowrap ${activeLoan.isEligible ? 'text-blue-700' : 'text-slate-400'}`}>
                          {activeLoan.isEligible ? formatMoney(maxLoan) : '대출 불가'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                          <span>LTV {activeLoan.ltvRatio}% ({valuationBasis} {formatMoney(appraisalPrice)})</span>
                          <span className="text-blue-600 font-semibold">(MCG 방공제면제)</span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">실제 필요 총현금 (All-in)</span>
                        <div className="text-2xl font-black text-rose-600 mt-1 whitespace-nowrap">
                          {formatMoney(totalAllInCash)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 whitespace-nowrap">
                          순수매수금 {formatMoney(requiredCash)} + 부대비용 {formatMoney(totalExtraCosts)}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                          1년차 월 상환액 ({repaymentMethod === 'graduated' ? '🔥체증식' : repaymentMethod === 'principal' ? '원금균등' : '원리금균등'}{graceYears === 1 ? '·1년거치' : ''})
                        </span>
                        <div className="text-2xl font-black text-slate-900 mt-1 whitespace-nowrap">
                          {activeLoan.isEligible ? `약 ${monthlyPayment.toLocaleString()}원` : '-'}
                        </div>
                        <div className="text-xs text-emerald-600 font-bold mt-1 whitespace-nowrap">
                          적용 금리: {selectedLoanType === 'bogeumjari' ? '고정 ' : ''}연 {finalInterestRate}%
                        </div>
                      </div>
                    </div>

                    {/* 일반 은행 대출과의 비교표 */}
                    {activeLoan.isEligible && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100 text-xs space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>일반 시중은행 주담대 대비 혜택 비교</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-600">
                          <div>
                            <span className="text-slate-400 block whitespace-nowrap">시중은행 예상 금리</span>
                            <span className="font-bold text-slate-800 whitespace-nowrap">연 4.30% 수준</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block whitespace-nowrap">시중은행 월 상환액</span>
                            <span className="font-bold text-slate-800 whitespace-nowrap">월 {marketMonthlyPayment.toLocaleString()}원</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block whitespace-nowrap">매월 지출 절약액</span>
                            <span className="font-extrabold text-blue-600 whitespace-nowrap">매월 +{monthlySavings.toLocaleString()}원 절약!</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block whitespace-nowrap">{tenure}년 총 절감액</span>
                            <span className="font-extrabold text-emerald-600 whitespace-nowrap">총 {formatMoney(totalSavings)} 절약!</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 📊 [3단계 핵심 기능] 상환 방식별(원리금균등 vs 원금균등 vs 체증식) & 거주기간(갈아타기) 현금흐름 비교기 */}
                    {activeLoan.isEligible && maxLoan > 0 && (
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-200/90 shadow-md space-y-4">
                        {/* 상단 타이틀 & 거치기간 토글 */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                                청년·신혼부부 필수 시뮬레이션
                              </span>
                              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                                📊 상환 방식별(원리금균등 · 원금균등 · 체증식) 현금흐름 비교기
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              만 40세 미만이라면 <strong>체증식 분할상환</strong>으로 초기 1~7년 월 납입액을 대폭 낮추고 3년 뒤 중도상환/갈아타기 전략을 세워보세요!
                            </p>
                          </div>

                          {/* 비거치 vs 1년 거치 토글 */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
                            {[
                              { val: 0, label: '비거치 (즉시상환)' },
                              { val: 1, label: '1년 거치 (첫해 이자만)' },
                            ].map((g) => (
                              <button
                                key={g.val}
                                type="button"
                                onClick={() => setGraceYears(g.val)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap ${
                                  graceYears === g.val
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 1. 3대 상환방식 원클릭 선택 카드 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          {[
                            {
                              id: 'level',
                              title: '① 원리금균등 (표준 안정형)',
                              badge: '매월 동일 금액',
                              sched: repaymentComparison.level,
                              desc: '만기까지 매월 나가는 (원금+이자)가 일정해 가계부 계획에 안정적',
                            },
                            {
                              id: 'principal',
                              title: '② 원금균등 (총이자 최소형)',
                              badge: '🏆 만기 총이자 최저',
                              sched: repaymentComparison.principal,
                              desc: '초기 부담은 가장 크지만 원금을 빠르게 줄여 만기 총이자가 가장 적음',
                            },
                            {
                              id: 'graduated',
                              title: '③ 체증식 (만 40세 미만 특권)',
                              badge: '🔥 초기 월납입 최소',
                              sched: repaymentComparison.graduated,
                              desc: '초기 1~7년 월 부담을 대폭 낮추고 3~7년 뒤 갈아타기 시 압도적 유리',
                            },
                          ].map((card) => {
                            const isSelected = repaymentMethod === card.id;
                            const diffVsLevel = repaymentComparison.level.afterGraceFirstPayment - card.sched.afterGraceFirstPayment;
                            return (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => setRepaymentMethod(card.id)}
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className={`font-black text-xs ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                      {card.title}
                                    </span>
                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded whitespace-nowrap ${
                                      card.id === 'graduated'
                                        ? 'bg-rose-100 text-rose-700'
                                        : card.id === 'principal'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {card.badge}
                                    </span>
                                  </div>
                                  <div className="text-lg font-black text-slate-900 mt-1">
                                    월 {card.sched.afterGraceFirstPayment.toLocaleString()}원
                                    <span className="text-[10px] font-semibold text-slate-500 ml-1">
                                      ({graceYears === 1 ? '거치후 첫달' : '1년차'})
                                    </span>
                                  </div>
                                  {diffVsLevel > 0 && (
                                    <span className="text-[11px] font-extrabold text-rose-600 block mt-0.5">
                                      💡 원리금균등 대비 매월 -{diffVsLevel.toLocaleString()}원 저렴!
                                    </span>
                                  )}
                                  {diffVsLevel < 0 && (
                                    <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                                      원리금균등 대비 첫달 +{Math.abs(diffVsLevel).toLocaleString()}원
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-200/70 leading-snug">
                                  {card.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {/* 2. 거주(보유) 목표 기간별 현금흐름 & 갈아타기 비교 */}
                        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-4 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-xs">
                              <span className="text-amber-300 font-extrabold block">
                                🔄 우리 가족 예상 거주(갈아타기) 목표 기간: {holdingYears}년 거주 후 매도/상환 시나리오
                              </span>
                              <span className="text-[11px] text-slate-300">
                                정책대출은 3년 이후 중도상환수수료가 면제(0원)됩니다. 실제 거주할 기간 동안의 누적 지출액을 비교해 보세요!
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {[
                                { yr: 3, label: '3년(수수료면제)' },
                                { yr: 5, label: '5년(평균거주)' },
                                { yr: 7, label: '7년' },
                                { yr: 10, label: '10년' },
                              ].map((h) => (
                                <button
                                  key={h.yr}
                                  type="button"
                                  onClick={() => setHoldingYears(h.yr)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                                    holdingYears === h.yr
                                      ? 'bg-amber-400 text-slate-950 font-black'
                                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                                  }`}
                                >
                                  {h.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 체증식 vs 원리금균등 보유기간 혜택 브리핑 */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                              <span className="text-[11px] text-slate-300 block">
                                🔥 체증식 선택 시 1년차 월 절감액
                              </span>
                              <span className="text-base font-black text-amber-300 block mt-0.5">
                                매월 -{repaymentComparison.holdingAnalysis.firstYearMonthlyDiffGraduatedVsLevel.toLocaleString()}원 부담 감소
                              </span>
                              <span className="text-[10px] text-slate-400">
                                육아·출산 초기 가계 현금흐름 방어
                              </span>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                              <span className="text-[11px] text-slate-300 block">
                                💰 {holdingYears}년간 체증식 누적 지출 절감액
                              </span>
                              <span className="text-base font-black text-emerald-300 block mt-0.5">
                                총 {formatMoney(repaymentComparison.holdingAnalysis.holdingCashFlowSavedGraduatedVsLevel)} 여유자금 확보
                              </span>
                              <span className="text-[10px] text-slate-400">
                                원리금균등 대비 {holdingYears}년간 덜 내는 총 원리금
                              </span>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                              <span className="text-[11px] text-slate-300 block">
                                🏆 만기({tenure}년) 유지 시 원금균등 이자절약
                              </span>
                              <span className="text-base font-black text-sky-300 block mt-0.5">
                                총 {formatMoney(repaymentComparison.holdingAnalysis.totalInterestSavedPrincipalVsLevel)} 이자 절감
                              </span>
                              <span className="text-[10px] text-slate-400">
                                갈아타기 없이 {tenure}년 만기 보유 시 유리
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. 3대 상환방식 연차별 월 납입액 & 잔액 상세 비교표 */}
                        <div className="overflow-x-auto -webkit-overflow-scrolling-touch rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs border-collapse min-w-[540px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 whitespace-nowrap">
                                <th className="py-2.5 px-3">연차별 시점</th>
                                <th className={`py-2.5 px-3 ${repaymentMethod === 'level' ? 'bg-blue-50 text-blue-900' : ''}`}>
                                  ① 원리금균등 (매월동일)
                                </th>
                                <th className={`py-2.5 px-3 ${repaymentMethod === 'principal' ? 'bg-emerald-50 text-emerald-900' : ''}`}>
                                  ② 원금균등 (이자최소)
                                </th>
                                <th className={`py-2.5 px-3 ${repaymentMethod === 'graduated' ? 'bg-rose-50 text-rose-900' : ''}`}>
                                  ③ 🔥 체증식 (초기최소)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {graceYears === 1 && (
                                <tr className="bg-amber-50/40">
                                  <td className="py-2 px-3 font-bold text-amber-900 whitespace-nowrap">1년차 (거치기간·이자만)</td>
                                  <td className="py-2 px-3 font-bold">월 {repaymentComparison.level.firstMonthPayment.toLocaleString()}원</td>
                                  <td className="py-2 px-3 font-bold">월 {repaymentComparison.principal.firstMonthPayment.toLocaleString()}원</td>
                                  <td className="py-2 px-3 font-bold">월 {repaymentComparison.graduated.firstMonthPayment.toLocaleString()}원</td>
                                </tr>
                              )}
                              {[1, 3, 5, 7, 10, 20, tenure]
                                .filter((yr, idx, arr) => yr <= tenure && arr.indexOf(yr) === idx && !(graceYears === 1 && yr === 1))
                                .map((yr) => {
                                  const lRow = repaymentComparison.level.scheduleByYear.find((s) => s.year === yr);
                                  const pRow = repaymentComparison.principal.scheduleByYear.find((s) => s.year === yr);
                                  const gRow = repaymentComparison.graduated.scheduleByYear.find((s) => s.year === yr);
                                  if (!lRow || !pRow || !gRow) return null;
                                  const minPayForYr = Math.min(lRow.avgMonthlyPayment, pRow.avgMonthlyPayment, gRow.avgMonthlyPayment);
                                  return (
                                    <tr key={yr} className={yr === holdingYears ? 'bg-indigo-50/50 font-semibold' : ''}>
                                      <td className="py-2 px-3 font-bold bg-slate-50 whitespace-nowrap">
                                        {yr}년차 월평균
                                        {yr === 3 && <span className="ml-1 text-[10px] text-blue-600 font-extrabold">(수수료면제)</span>}
                                        {yr === holdingYears && <span className="ml-1 text-[10px] text-indigo-700 font-extrabold">(목표시점)</span>}
                                      </td>
                                      <td className={`py-2 px-3 whitespace-nowrap ${lRow.avgMonthlyPayment === minPayForYr ? 'font-black text-blue-700' : ''}`}>
                                        월 {lRow.avgMonthlyPayment.toLocaleString()}원
                                      </td>
                                      <td className={`py-2 px-3 whitespace-nowrap ${pRow.avgMonthlyPayment === minPayForYr ? 'font-black text-emerald-700' : ''}`}>
                                        월 {pRow.avgMonthlyPayment.toLocaleString()}원
                                      </td>
                                      <td className={`py-2 px-3 whitespace-nowrap ${gRow.avgMonthlyPayment === minPayForYr ? 'font-black text-rose-600' : ''}`}>
                                        월 {gRow.avgMonthlyPayment.toLocaleString()}원
                                        {gRow.avgMonthlyPayment === minPayForYr && yr <= 7 && (
                                          <span className="ml-1 text-[10px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-extrabold">최저</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              {/* 보유기간 누적 납부 원리금 및 남은 대출잔액 */}
                              <tr className="bg-slate-50 border-t-2 border-slate-200">
                                <td className="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap">
                                  {holdingYears}년 거주 시 누적 납부액<br />
                                  <span className="text-[10px] text-slate-500 font-normal">(남은 대출 원금 잔액)</span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="font-bold text-slate-900">{formatMoney(repaymentComparison.holdingAnalysis.level.cumulativePayment)}</div>
                                  <div className="text-[11px] text-slate-500">잔액 {formatMoney(repaymentComparison.holdingAnalysis.level.remainingBalance)}</div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="font-bold text-slate-900">{formatMoney(repaymentComparison.holdingAnalysis.principal.cumulativePayment)}</div>
                                  <div className="text-[11px] text-emerald-700 font-semibold">잔액 {formatMoney(repaymentComparison.holdingAnalysis.principal.remainingBalance)}</div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap bg-rose-50/40">
                                  <div className="font-black text-rose-600">{formatMoney(repaymentComparison.holdingAnalysis.graduated.cumulativePayment)}</div>
                                  <div className="text-[11px] text-slate-500">잔액 {formatMoney(repaymentComparison.holdingAnalysis.graduated.remainingBalance)}</div>
                                </td>
                              </tr>
                              {/* 만기 총이자 비교 */}
                              <tr>
                                <td className="py-2.5 px-3 font-bold bg-slate-50 whitespace-nowrap">
                                  {tenure}년 만기 총이자 합계
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                                  {formatMoney(repaymentComparison.level.totalInterest)}
                                </td>
                                <td className="py-2.5 px-3 font-black text-emerald-700 whitespace-nowrap">
                                  {formatMoney(repaymentComparison.principal.totalInterest)} 🏆
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-600 whitespace-nowrap">
                                  {formatMoney(repaymentComparison.graduated.totalInterest)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 4. 선택된 상환방식의 연차별(원금 vs 이자) 구성비 시각화 바 */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                            <span className="font-extrabold text-slate-800">
                              📈 [{repaymentMethod === 'graduated' ? '체증식 분할상환' : repaymentMethod === 'principal' ? '원금균등 분할상환' : '원리금균등 분할상환'}] 연차별 원금 vs 이자 비중 추이
                            </span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 font-bold text-blue-700">
                                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> 원금 상환액
                              </span>
                              <span className="flex items-center gap-1 font-bold text-amber-600">
                                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> 이자 납부액
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            {activeRepaySchedule.milestones.map((ms) => {
                              const maxMilestonePay = Math.max(
                                ...activeRepaySchedule.milestones.map((m) => m.avgMonthlyPayment),
                                1
                              );
                              const principalWidth = Math.round((ms.avgMonthlyPrincipal / maxMilestonePay) * 100);
                              const interestWidth = Math.round((ms.avgMonthlyInterest / maxMilestonePay) * 100);
                              return (
                                <div key={ms.year} className="grid grid-cols-12 items-center gap-2">
                                  <div className="col-span-2 sm:col-span-2 font-bold text-slate-700 whitespace-nowrap">
                                    {ms.year}년차
                                  </div>
                                  <div className="col-span-6 sm:col-span-7 bg-slate-200/70 h-4 rounded-full overflow-hidden flex">
                                    <div
                                      style={{ width: `${principalWidth}%` }}
                                      className="bg-blue-600 h-full transition-all duration-300"
                                      title={`원금: 월 ${ms.avgMonthlyPrincipal.toLocaleString()}원`}
                                    />
                                    <div
                                      style={{ width: `${interestWidth}%` }}
                                      className="bg-amber-400 h-full transition-all duration-300"
                                      title={`이자: 월 ${ms.avgMonthlyInterest.toLocaleString()}원`}
                                    />
                                  </div>
                                  <div className="col-span-4 sm:col-span-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                    월 {ms.avgMonthlyPayment.toLocaleString()}원
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: 💸 부대비용 포함 '실제 필요 총현금(All-in Cash) 영수증' & D-Day 자금 스케줄러 */}
              <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
                {/* 영수증 헤더 */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                      <Receipt className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                          부대비용 포함 '실제 필요 총현금(All-in Cash)' 영수증
                        </h3>
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                          2026 지방세법·중개보수율 반영
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        순수 매매대금 외에 취득세·복비·채권할인·법무사·이사/인테리어까지 합산한 실전 자금표입니다.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBudgetChecker(!showBudgetChecker)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto border ${
                      showBudgetChecker
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{showBudgetChecker ? '내 예산 비교 닫기' : '내 보유현금 예산 비교'}</span>
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  {/* [선택형] 우리 부부 보유 현금(가용 예산) 비교 바 */}
                  {showBudgetChecker && (
                    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold">우리 부부 가용 현금(예산) 설정:</span>
                          <span className="text-base font-black text-amber-300">{formatMoney(myBudgetKrw)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[150000000, 200000000, 250000000, 300000000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setMyBudgetKrw(preset)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                                myBudgetKrw === preset
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {preset / 100000000}억
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="50000000"
                        max="500000000"
                        step="5000000"
                        value={myBudgetKrw}
                        onChange={(e) => setMyBudgetKrw(Number(e.target.value))}
                        className="custom-slider w-full cursor-pointer"
                      />
                      <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        budgetDiff >= 0
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                      }`}>
                        <span className="font-bold">
                          {budgetDiff >= 0
                            ? `✅ 보유 현금(${formatMoney(myBudgetKrw)})으로 세금·부대비용까지 모두 내고도 여유가 있습니다!`
                            : `⚠️ 보유 현금(${formatMoney(myBudgetKrw)}) 대비 부대비용 포함 시 자금이 부족합니다.`}
                        </span>
                        <span className={`font-black text-sm whitespace-nowrap ${
                          budgetDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {budgetDiff >= 0 ? `+${formatMoney(budgetDiff)} 여유` : `-${formatMoney(Math.abs(budgetDiff))} 부족`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 🛠️ 4대 절세 & 부대비용 옵션 컨트롤 패널 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 text-xs">
                    {/* 옵션 1: 취득세 감면 특례 선택 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>① 취득세 감면 특례 적용</span>
                        </span>
                        {taxes.totalTaxSaved > 0 && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            -{taxes.totalTaxSaved.toLocaleString()}원 절세
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'newborn', label: '🐣 출산가구 (-500만)' },
                          { id: 'firstHome', label: '🌱 생애최초 (-200만)' },
                          { id: 'none', label: '일반 무주택 (0원)' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTaxReliefType(opt.id)}
                            className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                              taxReliefType === opt.id
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {taxReliefType === 'newborn'
                          ? '출산·양육 목적 주택 취득 시 취득세 최대 500만 원(지방교육세 포함 최대 550만 원) 감면'
                          : taxReliefType === 'firstHome'
                          ? '생애최초 주택 구입 시 소득 무관 취득세 최대 200만 원(지방교육세 포함 최대 220만 원) 감면'
                          : '감면 특례 미적용 시 6억 이하 1.1%, 6~9억 구간별(1.1%~3.3%) 세율 적용'}
                      </p>
                    </div>

                    {/* 옵션 2: 등기 방식 (법무사 vs 셀프등기) & 중개보수 부가세 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-blue-600" />
                          <span>② 등기 방식 & 복비 부가세</span>
                        </span>
                        {registrationMode === 'self' && (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            법무사 보수 {registration.estimatedLawyerFee.toLocaleString()}원 절약
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRegistrationMode(registrationMode === 'lawyer' ? 'self' : 'lawyer')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            registrationMode === 'self'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {registrationMode === 'lawyer' ? '👨‍⚖️ 법무사 위임 (표준)' : '🙋‍♂️ 셀프등기 (보수 0원)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncludeBrokerVat(!includeBrokerVat)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            !includeBrokerVat
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {includeBrokerVat ? '🏢 일반과세 복비 (+10%)' : '🤝 부가세 면제/포함협의'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        채권할인({registration.bondDiscountCost.toLocaleString()}원)과 인지·증지세(17만 원)는 셀프등기 시에도 필수 납부 항목입니다.
                      </p>
                    </div>

                    {/* 옵션 3: 포장이사 + 사다리차 + 입주청소 */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span>③ 포장이사 · 사다리차 · 입주청소</span>
                        </span>
                        <span className="font-extrabold text-slate-800">
                          {includeMoving ? `+${livingPrep.movingCost.toLocaleString()}원` : '미포함 (0원)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIncludeMoving(false)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            !includeMoving
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          미포함 (별도 예산)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncludeMoving(true)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            includeMoving
                              ? 'bg-amber-500 text-slate-950 shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          🚚 이사·입주청소 포함 ({prop.pyeong}평)
                        </button>
                      </div>
                    </div>

                    {/* 옵션 4: 인테리어 여유자금 (도배장판 ~ 올수리) */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Hammer className="w-3.5 h-3.5 text-indigo-600" />
                          <span>④ 인테리어 수리 예산 ({prop.pyeong}평 기준)</span>
                        </span>
                        <span className="font-extrabold text-indigo-700">
                          {livingPrep.interiorCost > 0 ? `+${formatMoney(livingPrep.interiorCost)}` : '미포함 (0원)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'none', label: '즉시입주' },
                          { id: 'basic', label: '도배·장판' },
                          { id: 'partial', label: '부분수리' },
                          { id: 'full', label: '전체올수리' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setInteriorLevel(item.id)}
                            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all truncate ${
                              interiorLevel === item.id
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 🧾 영수증 상세 항목 Breakdown */}
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/90 space-y-3 text-xs sm:text-sm">
                    {/* 1. 순수 매매 자기자본 */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                      <div>
                        <span className="font-extrabold text-slate-900 block">
                          [A] 순수 매매 필요 자기자본 (매매가 - 대출금)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          실매매가 {formatMoney(activePrice)} - {activeLoan.shortName} {formatMoney(maxLoan)}
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(requiredCash)}
                      </span>
                    </div>

                    {/* 2. 필수 세금 및 등기·중개 부대비용 */}
                    <div className="space-y-2 pb-2.5 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">
                          [B] 필수 취득 부대비용 합계 (세금 + 복비 + 등기)
                        </span>
                        <span className="font-extrabold text-indigo-700 whitespace-nowrap">
                          +{ mandatoryClosingCosts.toLocaleString() }원 ({formatMoney(mandatoryClosingCosts)})
                        </span>
                      </div>

                      <div className="pl-3 border-l-2 border-indigo-200 space-y-2 text-xs">
                        {/* 취득세 + 지방교육세 + 농특세 */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700">
                                ① 취득세({taxes.baseTaxRatePercent}%) + 지방교육세 + 농특세
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                {taxes.reliefLabel}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              실효세율 {taxes.effectiveRatePercent}% · {taxes.isOver85 ? '전용 85㎡ 초과 농특세 0.2% 포함' : '전용 85㎡ 이하 농특세 비과세'}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-900">{taxes.finalTotalTax.toLocaleString()}원</span>
                            {taxes.totalTaxSaved > 0 && (
                              <span className="text-[10px] text-slate-400 block line-through">
                                감면전 {taxes.rawTotalTax.toLocaleString()}원
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 공인중개사 중개보수 */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-700">
                              ② 공인중개사 중개보수 (법정 상한 {brokerage.ratePercent}%)
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              중개보수 {brokerage.baseFee.toLocaleString()}원 {brokerage.includeVat ? `+ 부가세(10%) ${brokerage.vat.toLocaleString()}원` : '(부가세 면제/포함)'}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">
                            {brokerage.totalBrokerFee.toLocaleString()}원
                          </span>
                        </div>

                        {/* 소유권이전등기 부대비용 */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-700">
                              ③ 소유권이전등기 필수 비용 ({registrationMode === 'self' ? '셀프등기 기준' : '법무사 위임 기준'})
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              국민주택채권 할인 {registration.bondDiscountCost.toLocaleString()}원 + 인지·증지세 {(registration.stampTax + registration.courtFee).toLocaleString()}원 + 법무사보수 {registration.lawyerFee.toLocaleString()}원
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">
                            {registration.totalRegistrationCost.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. 선택 입주 준비비용 (이사/청소/인테리어) */}
                    {(includeMoving || interiorLevel !== 'none') && (
                      <div className="space-y-1.5 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800">
                            [C] 선택 입주 준비비용 (이사·청소·인테리어)
                          </span>
                          <span className="font-extrabold text-amber-700 whitespace-nowrap">
                            +{optionalPrepCosts.toLocaleString()}원 ({formatMoney(optionalPrepCosts)})
                          </span>
                        </div>
                        <div className="pl-3 border-l-2 border-amber-300 space-y-1 text-xs text-slate-600">
                          {includeMoving && (
                            <div className="flex justify-between">
                              <span>· 포장이사 + 사다리차 + 입주청소 ({prop.pyeong}평 기준)</span>
                              <span className="font-bold text-slate-800">{livingPrep.movingCost.toLocaleString()}원</span>
                            </div>
                          )}
                          {interiorLevel !== 'none' && (
                            <div className="flex justify-between">
                              <span>· {livingPrep.interiorLabel}</span>
                              <span className="font-bold text-slate-800">{livingPrep.interiorCost.toLocaleString()}원</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 최종 총 필요 현금 합계 박스 */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-blue-100 font-bold block">
                          최종 통장에 준비해야 할 총 필요 현금 ([A] + [B]{optionalPrepCosts > 0 ? ' + [C]' : ''})
                        </span>
                        <span className="text-[11px] text-blue-200">
                          순수 매수금 외 총 부대비용 {formatMoney(totalExtraCosts)} (매매가의 {allInReceipt.extraCostRatioPercent}%) 포함
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight block whitespace-nowrap">
                          {formatMoney(totalAllInCash)}
                        </span>
                        <span className="text-[11px] text-blue-100 font-mono">
                          정확히 {totalAllInCash.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 📅 계약일(10%) ➔ 잔금일(D-Day) 시기별 필요 현금 스케줄러 */}
                  <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>언제 얼마가 필요한가요? (계약일 vs 잔금일 현금 흐름표)</span>
                      </h4>
                      <span className="text-[11px] text-indigo-700 font-bold">
                        ※ 정책대출금은 잔금일(D-Day) 당일에만 실행됩니다
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Step 1: 본계약일 */}
                      <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                              STEP 1 · 본계약일 (통상 매매가의 10%)
                            </span>
                            <span className="text-[11px] text-rose-600 font-bold">대출불가 · 순수현금</span>
                          </div>
                          <div className="text-lg font-black text-slate-900 mt-1">
                            {formatMoney(contractDeposit10)}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 leading-relaxed">
                          가계약금(통상 300~500만 원)을 포함하여 본계약 당일 매도인 계좌로 이체하는 계약금입니다.
                        </p>
                      </div>

                      {/* Step 2: 잔금일 D-Day */}
                      <div className="bg-white p-3.5 rounded-xl border border-blue-300 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded text-[11px]">
                              STEP 2 · 잔금일 D-Day (입주 & 등기일)
                            </span>
                            <span className="text-[11px] text-blue-700 font-bold">나머지 내 현금 + 부대비용</span>
                          </div>
                          <div className="text-lg font-black text-blue-700 mt-1">
                            {formatMoney(balanceDayTotalCash)}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100 leading-relaxed">
                          남은 매매잔금({formatMoney(balanceDayPropertyCash)}) + 세금·복비·등기({formatMoney(mandatoryClosingCosts)})
                          {optionalPrepCosts > 0 ? ` + 이사·수리(${formatMoney(optionalPrepCosts)})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3.8: 🚇 5대 주요 업무지구(강남·광화문·여의도·마곡·판교) 맞벌이 통근 리포트 */}
              {(() => {
                const commute = prop.commuteInfo || calculatePropertyCommute(prop);
                if (!commute?.byHub) return null;
                const hubs = WORKPLACE_HUBS.filter((h) => h.id !== 'NONE');
                return (
                  <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h3 className="font-black text-slate-900 text-sm sm:text-base">
                          🚇 맞벌이 부부 5대 주요 업무지구 통근 리포트
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 w-fit">
                        인근역: {prop.subwayStation} ({prop.subwayDistance} · 접근 약 {commute.walkMinutes}분 반영)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {hubs.map((hub) => {
                        const info = commute.byHub[hub.id];
                        if (!info) return null;
                        const isBest = commute.bestHubId === hub.id;
                        return (
                          <div
                            key={hub.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                              isBest
                                ? 'bg-emerald-900 text-white border-emerald-800 shadow-sm'
                                : 'bg-white text-slate-800 border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[11px] font-extrabold ${isBest ? 'text-emerald-200' : 'text-slate-600'}`}>
                                  {hub.shortName}
                                </span>
                                {isBest && (
                                  <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                                    최단권역
                                  </span>
                                )}
                              </div>
                              <div className={`text-lg font-black mt-1 ${isBest ? 'text-white' : 'text-slate-900'}`}>
                                약 {info.totalMinutes}분
                              </div>
                              <div className={`text-[10px] mt-0.5 ${isBest ? 'text-emerald-300' : 'text-emerald-700 font-bold'}`}>
                                (도보 {info.walkMinutes}분 + 전철 {info.transitMinutes}분)
                              </div>
                            </div>
                            <div className={`text-[10px] mt-2 pt-1.5 border-t leading-snug ${isBest ? 'border-emerald-700 text-emerald-100' : 'border-slate-100 text-slate-500'}`}>
                              {info.routeSummary}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Section 4: 최근 실거래가 내역 */}
              {prop.recentTrades && prop.recentTrades.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>국토교통부 최근 실거래가 신고 내역</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3 whitespace-nowrap">계약년월</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">층수</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">실거래 금액</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">현재 매매가와의 차이</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {prop.recentTrades.map((trade, idx) => {
                          const diff = activePrice - trade.price;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-medium whitespace-nowrap">{trade.date}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">{trade.floor}층</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{formatMoney(trade.price)}</td>
                              <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                {diff === 0 ? '동일' : diff > 0 ? `+${formatMoney(diff)} 호가` : `-${formatMoney(Math.abs(diff))} 낮음`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Section 5: 📝 실전 매수 계약서 필수 특약사항 생성기 & 계약~잔금 D-Day 체크리스트 */}
          {(modalTab === 'all' || modalTab === 'contract') && (() => {
            const allClauses = generateSpecialClauses({
              propertyName: cleanPropertyName,
              priceKrw: activePrice,
              loanType: selectedLoanType,
              loanAmount: maxLoan,
            });
            const chosenClauses = allClauses.filter((c) => selectedClauseIds.includes(c.id));
            const mergedClausesText = buildFullSpecialClausesText({
              propertyName: cleanPropertyName,
              priceKrw: activePrice,
              loanType: selectedLoanType,
              loanAmount: maxLoan,
              selectedClauses: chosenClauses,
            });

            const totalChecklistCount = CONTRACT_TIMELINE_STEPS.reduce(
              (acc, step) => acc + step.items.length,
              0
            );
            const doneChecklistCount = CONTRACT_TIMELINE_STEPS.reduce(
              (acc, step) =>
                acc + step.items.filter((it) => checkedTimelineItems[it.id]).length,
              0
            );

            return (
              <div className="space-y-5 pt-2">
                {/* 5-1. 맞춤형 계약서 필수 특약사항 원클릭 생성기 */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-6 text-white border border-indigo-400/40 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                          중개사 카톡·문자 전송용
                        </span>
                        <h3 className="font-black text-base sm:text-lg text-white">
                          📝 {cleanPropertyName} 매매계약서 필수 특약사항 생성기
                        </h3>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1">
                        선택하신 <strong className="text-amber-300">{selectedLoanType === 'newborn' ? '신생아 특례 디딤돌' : selectedLoanType === 'bogeumjari' ? 'HF 보금자리론' : '생애최초 디딤돌'}</strong> 및 매매가(<strong className="text-white">{formatMoney(activePrice)}</strong>)에 맞춘 표준 보호 특약입니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyTextToClipboard(mergedClausesText, 'ALL_CLAUSES')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md ${
                        copiedClauseId === 'ALL_CLAUSES'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {copiedClauseId === 'ALL_CLAUSES'
                          ? '✓ 선택 특약 전체 복사 완료! (카톡에 붙여넣으세요)'
                          : `선택된 특약 ${chosenClauses.length}개 한 번에 복사하기`}
                      </span>
                    </button>
                  </div>

                  {/* 특약 카드 리스트 */}
                  <div className="grid grid-cols-1 gap-3">
                    {allClauses.map((clause) => {
                      const isChecked = selectedClauseIds.includes(clause.id);
                      const isCopied = copiedClauseId === clause.id;
                      return (
                        <div
                          key={clause.id}
                          className={`rounded-xl p-3.5 sm:p-4 border transition-all ${
                            isChecked
                              ? 'bg-white/10 border-indigo-400/60'
                              : 'bg-white/5 border-white/10 opacity-65'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClauseSelection(clause.id)}
                                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                              />
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/40 text-amber-300 border border-indigo-400/40">
                                {clause.badge}
                              </span>
                              <span className="font-extrabold text-xs sm:text-sm text-white">
                                {clause.title}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => copyTextToClipboard(clause.clauseText, clause.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 self-end sm:self-auto ${
                                isCopied
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/15 hover:bg-white/25 text-indigo-100'
                              }`}
                            >
                              {isCopied ? '✓ 문구 복사됨' : '이 조항만 복사'}
                            </button>
                          </div>

                          <div className="mt-2.5 p-3 rounded-lg bg-black/35 border border-white/10 text-xs text-amber-100 font-medium leading-relaxed select-all">
                            "{clause.clauseText}"
                          </div>

                          <div className="mt-2 text-[11px] text-slate-300 leading-normal flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold shrink-0">💡 이유:</span>
                            <span>{clause.whyNeeded}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5-2. 가계약 ~ 본계약 ~ 대출심사 ~ 잔금 D-Day 실전 타임라인 체크리스트 */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>✅ 가계약부터 잔금 D-Day까지 내집마련 실전 체크리스트</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        체크한 항목은 브라우저에 자동 저장되어 부부가 함께 단계별 진행 상황을 점검할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                        진행률 {doneChecklistCount} / {totalChecklistCount} 완료 ({Math.round((doneChecklistCount / totalChecklistCount) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {CONTRACT_TIMELINE_STEPS.map((stepGroup) => (
                      <div
                        key={stepGroup.step}
                        className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/90 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                            {stepGroup.step}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {stepGroup.badge}
                          </span>
                        </div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {stepGroup.title}
                        </div>
                        <div className="space-y-1.5 pt-1">
                          {stepGroup.items.map((item) => {
                            const isDone = !!checkedTimelineItems[item.id];
                            return (
                              <label
                                key={item.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isDone
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through opacity-75'
                                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-indigo-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => toggleTimelineCheck(item.id)}
                                  className="mt-0.5 w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                                />
                                <span className="leading-snug">{item.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 truncate min-w-0">
            주소: {prop.address}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={prop.naverMobileUrl || prop.naverLandUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 text-white border border-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <span>N {cleanPropertyName} 네이버부동산 매물·정보</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              확인 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
