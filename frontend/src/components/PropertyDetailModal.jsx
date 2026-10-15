import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, Train, Calendar, TrendingUp, DollarSign, 
  ShieldCheck, Calculator, Sparkles, ExternalLink, CheckCircle2, ArrowRight, Heart,
  RotateCcw, SlidersHorizontal, Search
} from 'lucide-react';

import FloorPlanViewer from './FloorPlanViewer';

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  userCriteria, 
  initialTab = 'all',
  isFavorite = false,
  onToggleFavorite
}) {
  const [modalTab, setModalTab] = useState(initialTab); // 'all', 'floorPlan', 'financial'
  const [activeProperty, setActiveProperty] = useState(property);

  // 사용자 직접 수정 가격 상태 (매매가, KB시세)
  const [customPrice, setCustomPrice] = useState(null);
  const [customKbPrice, setCustomKbPrice] = useState(null);

  useEffect(() => {
    setActiveProperty(property);
    setCustomPrice(null);
    setCustomKbPrice(null);
  }, [property]);

  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab]);

  if (!activeProperty) return null;

  const prop = activeProperty;
  const sim = prop.loanSimulation || {};
  const kb = prop.kbPrice || {};
  const cleanPropertyName = (prop.name || '').replace(/\s*\(\d+평형?\)/g, '');
  const kbSearchUrl = prop.kbLandUrl || `https://kbland.kr/search?keyword=${encodeURIComponent(cleanPropertyName)}`;

  // 사용자 직접 입력 가격 vs 기본 데이터베이스 가격
  const activePrice = customPrice !== null ? customPrice : prop.priceKrw;
  const activeKbPrice = customKbPrice !== null ? customKbPrice : (kb.generalAvg || prop.priceKrw);
  const isCustomized = customPrice !== null || customKbPrice !== null;

  // Min(실매매가, KB시세) 담보평가액 산출
  const appraisalPrice = Math.min(activePrice, activeKbPrice);
  const isKbLower = activeKbPrice < activePrice;
  const valuationBasis = isKbLower ? 'KB시세' : '실매매가';

  // LTV 70% 대출 가능 금액 (MCG 방공제면제 기본, 최대 5억 원 한도)
  const ltvRatio = 0.70;
  const maxLoan = Math.min(500000000, Math.max(0, Math.floor(appraisalPrice * ltvRatio)));
  const requiredCash = Math.max(0, activePrice - maxLoan);

  // 금리 및 월상환액 실시간 계산 (원리금균등)
  const finalInterestRate = sim.finalInterestRate || 3.10;
  const monthlyRate = (finalInterestRate / 100) / 12;
  const totalMonths = (userCriteria?.loanTenureYears || 30) * 12;
  const monthlyPayment = (maxLoan > 0 && monthlyRate > 0)
    ? Math.round((maxLoan * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
    : 0;

  // 일반 시중은행 비교 (4.30% 기준)
  const marketRate = 4.30;
  const marketMonthlyRate = (marketRate / 100) / 12;
  const marketMonthlyPayment = (maxLoan > 0 && marketMonthlyRate > 0)
    ? Math.round((maxLoan * marketMonthlyRate * Math.pow(1 + marketMonthlyRate, totalMonths)) / (Math.pow(1 + marketMonthlyRate, totalMonths) - 1))
    : 0;
  const monthlySavings = Math.max(0, marketMonthlyPayment - monthlyPayment);
  const totalSavings = monthlySavings * totalMonths;

  // 부대비용 계산: 취득세 (6억 이하 1.1%), 생애최초 시 최대 200만 원 감면
  const rawAcquisitionTax = Math.round(activePrice * 0.011);
  const isFirstHome = userCriteria?.isFirstHome || sim.isFirstHome;
  const acquisitionDiscount = isFirstHome ? Math.min(2000000, rawAcquisitionTax) : 0;
  const finalAcquisitionTax = rawAcquisitionTax - acquisitionDiscount;

  // 부동산 중개보수 (매매 2억~9억 이하 상한요율 0.4%)
  const maxBrokerFee = Math.round(activePrice * 0.004);

  // 총 필요 현금 = 매수 잔금 + 취득세 + 중개수수료
  const totalCashNeeded = requiredCash + finalAcquisitionTax + maxBrokerFee;

  const formatMoney = (val) => {
    if (!val || val === 0) return '0원';
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    if (eok > 0) {
      return `${eok}억 ${man > 0 ? man.toLocaleString() + '만' : ''}원`;
    }
    return `${man.toLocaleString()}만원`;
  };

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
              종합 정보 보기 (도면 + 시세 + 대출)
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
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💰 KB시세 & 신생아 특례 자금 견적서
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
              {/* ⚙️ [강력 추천 기능] 실제 매매가 & KB 시세 직접 수정 / 입력 패널 */}
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
                  KB부동산에서 확인하신 <strong>실제 최신 시세</strong>나 <strong>부동산과 네고 중인 매매가</strong>를 직접 입력해 보세요. Min(매매가, KB시세) 원칙에 따라 대출 가능액과 총 필요 현금이 즉시 실시간 재계산됩니다.
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
                    <span className="text-base font-extrabold text-blue-600 block whitespace-nowrap">{formatMoney(kb.jeonseAvg)}</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-0.5 whitespace-nowrap">전세가율 {kb.jeonseRate}%</span>
                  </div>
                </div>
              </div>

              {/* Section 2: 신생아 특례대출 정밀 시뮬레이션 */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 flex-wrap">
                        <span>신생아 특례 디딤돌 대출 맞춤 시뮬레이션</span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          DSR 미적용
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        담보평가 기준: Min(매매가 {formatMoney(activePrice)}, KB시세 {formatMoney(activeKbPrice)}) → <strong className="text-blue-700 font-bold">{formatMoney(appraisalPrice)}</strong> ({valuationBasis} LTV 70%)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">최대 대출 가능 금액</span>
                    <div className="text-2xl font-black text-blue-700 mt-1 whitespace-nowrap">
                      {formatMoney(maxLoan)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                      <span>LTV 70% ({valuationBasis} {formatMoney(appraisalPrice)})</span>
                      <span className="text-blue-600 font-semibold">(MCG 방공제면제)</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">필요 자기자본 (순수 매수금)</span>
                    <div className="text-2xl font-black text-rose-600 mt-1 whitespace-nowrap">
                      {formatMoney(requiredCash)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                      실매매가 {formatMoney(activePrice)} - 대출금
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">월 예상 상환액 (원리금균등)</span>
                    <div className="text-2xl font-black text-slate-900 mt-1 whitespace-nowrap">
                      약 {monthlyPayment.toLocaleString()}원
                    </div>
                    <div className="text-xs text-emerald-600 font-bold mt-1 whitespace-nowrap">
                      적용 금리: 연 {finalInterestRate}% (우대 -{sim.preferentialDiscount || 0.2}%p)
                    </div>
                  </div>
                </div>

                {/* 일반 은행 대출과의 비교표 */}
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
                      <span className="text-slate-400 block whitespace-nowrap">매월 이자 절약액</span>
                      <span className="font-extrabold text-blue-600 whitespace-nowrap">매월 +{monthlySavings.toLocaleString()}원 절약!</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block whitespace-nowrap">30년 총 절감액</span>
                      <span className="font-extrabold text-emerald-600 whitespace-nowrap">총 {formatMoney(totalSavings)} 절약!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: 최종 매수 필요 현금 & 부대비용 견적서 */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span>실제 취득 시 최종 필요 현금 총액 (견적서)</span>
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600 whitespace-nowrap">① 아파트 매매 잔금 (매매가 - 대출금)</span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">{formatMoney(requiredCash)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-600 whitespace-nowrap">② 취득세 및 지방교육세 (1.1%)</span>
                      {isFirstHome && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                          생애최초 200만 원 감면 적용
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 whitespace-nowrap">{finalAcquisitionTax.toLocaleString()}원</span>
                      {isFirstHome && (
                        <span className="text-xs text-slate-400 block line-through whitespace-nowrap">
                          정상세액: {rawAcquisitionTax.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600 whitespace-nowrap">③ 공인중개사 중개보수 (법정상한 0.4% 기준)</span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">약 {maxBrokerFee.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between py-2 pt-3 font-bold text-base bg-blue-50/60 px-3 rounded-lg text-blue-900">
                    <span className="whitespace-nowrap">총 준비 필요 자금 (① + ② + ③)</span>
                    <span className="text-lg font-black text-blue-700 whitespace-nowrap">{formatMoney(totalCashNeeded)}</span>
                  </div>
                </div>
              </div>

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
