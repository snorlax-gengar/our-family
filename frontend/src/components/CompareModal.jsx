import React, { useState } from 'react';
import {
  X, Scale, Trophy, Sparkles, ShieldCheck, Building2, Train,
  Receipt, TrendingUp, ExternalLink, Plus, Trash2, Heart, CheckCircle2, ArrowRight, Wallet
} from 'lucide-react';
import { calculateAllInCashReceipt } from '../lib/closingCostCalculator';
import { calculatePropertyCommute } from '../lib/commuteCalculator';

export default function CompareModal({
  compareProperties = [],
  onClose,
  onRemoveProperty,
  onClearAll,
  onSelectPropertyDetail,
  onSelectPropertyFloorPlan,
  userCriteria,
  favorites = [],
  allProperties = [],
  onAddProperty,
}) {
  // 비교 모달 내 부대비용 옵션 (동일 기준으로 2~3개 단지 일괄 비교)
  const [taxReliefType, setTaxReliefType] = useState(() => {
    if (userCriteria?.isFirstHome) return 'firstHome';
    if ((userCriteria?.loanType || 'newborn') === 'newborn') return 'newborn';
    return 'none';
  });
  const [registrationMode, setRegistrationMode] = useState('lawyer'); // 'lawyer' | 'self'
  const [includeMoving, setIncludeMoving] = useState(false);
  const [interiorLevel, setInteriorLevel] = useState('none'); // 'none' | 'basic' | 'partial' | 'full'

  const formatMoney = (val) => {
    if (!val || val === 0) return '0원';
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    if (eok > 0) {
      return `${eok}억 ${man > 0 ? man.toLocaleString() + '만' : ''}원`;
    }
    return `${man.toLocaleString()}만원`;
  };

  const cleanName = (name = '') =>
    name.replace(/\s*\(\d+평형?\).*$/, '').replace(/\s*\d+평형?.*$/, '').trim();

  // 각 비교 단지에 대해 현재 옵션 기준 All-in Cash 영수증 계산 결합
  const enrichedList = compareProperties.map((prop) => {
    const sim = prop.loanSimulation || {};
    const kb = prop.kbPrice || {};
    const fp = prop.floorPlan || {};
    const maxLoan = sim.isEligible ? (sim.maxLoanAmount || 0) : 0;

    const receipt = calculateAllInCashReceipt({
      priceKrw: prop.priceKrw,
      loanAmount: maxLoan,
      areaSqMeter: prop.areaSqMeter,
      pyeong: prop.pyeong,
      region: prop.region || '서울',
      taxReliefType,
      includeBrokerVat: true,
      registrationMode,
      includeMoving,
      interiorLevel,
    });

    const latestTrade = prop.recentTrades?.[0] || null;

    return {
      ...prop,
      cleanTitle: cleanName(prop.name),
      sim,
      kb,
      fp,
      receipt,
      latestTrade,
    };
  });

  // 🏆 항목별 최적(Best) 값 계산 (2개 이상일 때만 하이라이트)
  const canHighlight = enrichedList.length >= 2;
  const minPrice = canHighlight ? Math.min(...enrichedList.map((p) => p.priceKrw)) : null;
  const minAllInCash = canHighlight ? Math.min(...enrichedList.map((p) => p.receipt.totalAllInCash)) : null;
  const maxLoanVal = canHighlight ? Math.max(...enrichedList.map((p) => p.sim.maxLoanAmount || 0)) : null;
  const eligibleMonthlyPayments = enrichedList
    .filter((p) => p.sim.isEligible && p.sim.monthlyPayment > 0)
    .map((p) => p.sim.monthlyPayment);
  const minMonthlyPay = canHighlight && eligibleMonthlyPayments.length >= 2
    ? Math.min(...eligibleMonthlyPayments)
    : null;
  const maxJeonseRate = canHighlight
    ? Math.max(...enrichedList.map((p) => p.kb.jeonseRate || 0))
    : null;
  const maxUnits = canHighlight
    ? Math.max(...enrichedList.map((p) => p.totalUnits || 0))
    : null;
  const newestYear = canHighlight
    ? Math.max(...enrichedList.map((p) => p.buildYear || 0))
    : null;
  const maxArea = canHighlight
    ? Math.max(...enrichedList.map((p) => p.areaSqMeter || 0))
    : null;

  // 의사결정 요약용 대표 단지 추출
  const bestCashProp = canHighlight
    ? enrichedList.find((p) => p.receipt.totalAllInCash === minAllInCash)
    : null;
  const bestMonthlyProp = canHighlight && minMonthlyPay
    ? enrichedList.find((p) => p.sim.monthlyPayment === minMonthlyPay)
    : null;
  const bestScaleProp = canHighlight && maxUnits
    ? enrichedList.find((p) => p.totalUnits === maxUnits)
    : null;

  // 찜한 단지 중 아직 비교함에 없는 단지 목록 (빠른 추가용)
  const favoriteCandidates = allProperties.filter(
    (p) => favorites.includes(p.id) && !compareProperties.some((c) => c.id === p.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 break-keep"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-6xl w-full max-h-[93vh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile pull handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-white truncate">
                  관심 단지 1:1 / 다중 VS 스펙 비교함
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {enrichedList.length} / 3개 단지 비교중
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
                매매가 · KB시세 · 정책대출 한도 · 부대비용 포함 총현금(All-in) · 평면 구조 · 입지를 한눈에 비교하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {enrichedList.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/15 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">전체 비우기</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* 비교함이 비어있거나 1개뿐일 때 안내 및 찜한 단지 빠른 추가 바 */}
          {enrichedList.length < 3 && favoriteCandidates.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                <span>내가 찜한 단지를 비교함에 바로 추가해 보세요 (최대 3개):</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {favoriteCandidates.slice(0, 5).map((favProp) => (
                  <button
                    key={favProp.id}
                    type="button"
                    onClick={() => onAddProperty && onAddProperty(favProp.id)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 rounded-lg font-extrabold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{cleanName(favProp.name)} ({favProp.pyeong}평)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🛠️ 부대비용 일괄 시뮬레이션 기준 컨트롤 바 */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>비교 단지 공통 부대비용·수리비 산정 기준:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 취득세 감면 */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 gap-1">
                {[
                  { id: 'newborn', label: '🐣 출산감면(-500만)' },
                  { id: 'firstHome', label: '🌱 생애최초(-200만)' },
                  { id: 'none', label: '일반(0원)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTaxReliefType(opt.id)}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      taxReliefType === opt.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 셀프등기 토글 */}
              <button
                type="button"
                onClick={() => setRegistrationMode(registrationMode === 'lawyer' ? 'self' : 'lawyer')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                  registrationMode === 'self'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {registrationMode === 'lawyer' ? '👨‍⚖️ 법무사 위임' : '🙋‍♂️ 셀프등기(보수0원)'}
              </button>

              {/* 이사 포함 토글 */}
              <button
                type="button"
                onClick={() => setIncludeMoving(!includeMoving)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                  includeMoving
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚚 포장이사·청소 {includeMoving ? '포함중' : '미포함'}
              </button>

              {/* 인테리어 단계 */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 gap-1">
                {[
                  { id: 'none', label: '수리없음' },
                  { id: 'basic', label: '도배·장판' },
                  { id: 'partial', label: '부분수리' },
                  { id: 'full', label: '올수리' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInteriorLevel(opt.id)}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      interiorLevel === opt.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 💡 AI 부부 의사결정 3줄 핵심 요약 브리핑 (2개 이상 비교 시) */}
          {canHighlight && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bestCashProp && (
                <div className="bg-gradient-to-br from-rose-50 to-amber-50/60 border border-rose-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      초기 현금 부담 최소 🏆
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-1">
                      {bestCashProp.cleanTitle} ({bestCashProp.pyeong}평)
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      부대비용 포함 총현금 <strong className="text-rose-600">{formatMoney(bestCashProp.receipt.totalAllInCash)}</strong>으로 초기 자기자본이 가장 적게 듭니다.
                    </p>
                  </div>
                </div>
              )}

              {bestMonthlyProp && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      월 고정지출(원리금) 최소 🏆
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-1">
                      {bestMonthlyProp.cleanTitle} ({bestMonthlyProp.pyeong}평)
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      월 상환액 <strong className="text-blue-700">약 {bestMonthlyProp.sim.monthlyPayment?.toLocaleString()}원</strong>(연 {bestMonthlyProp.sim.finalInterestRate}%)으로 매달 생활비 여유가 가장 큽니다.
                    </p>
                  </div>
                </div>
              )}

              {bestScaleProp && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      단지 규모(환금성) 우위 🏆
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-1">
                      {bestScaleProp.cleanTitle} ({bestScaleProp.pyeong}평)
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      총 <strong className="text-emerald-700">{bestScaleProp.totalUnits?.toLocaleString()}세대</strong>({bestScaleProp.buildYear}년식) 규모로 거래량과 관리비 측면에서 유리합니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📊 메인 VS 스펙 비교 테이블 */}
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-800">
                  <th className="py-4 px-4 w-44 bg-slate-950 font-black text-slate-300 align-middle">
                    비교 항목
                  </th>
                  {enrichedList.map((item, idx) => (
                    <th key={item.id} className="py-4 px-4 align-top border-l border-slate-800 min-w-[210px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded mb-1">
                            후보 {idx + 1} · {item.region} {item.district}
                          </span>
                          <div className="text-base font-black text-white leading-snug">
                            {item.cleanTitle}
                          </div>
                          <div className="text-xs text-amber-300 font-bold mt-0.5">
                            {item.pyeong}평형 (전용 {item.areaSqMeter}㎡)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="비교함에서 제외"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {enrichedList.length < 3 && (
                    <th className="py-4 px-4 align-middle border-l border-slate-800 bg-slate-900/50 text-center min-w-[180px]">
                      <div className="text-slate-400 font-normal space-y-1.5">
                        <div className="w-8 h-8 rounded-full border border-dashed border-slate-600 flex items-center justify-center mx-auto text-slate-400">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-bold text-slate-300">비교 슬롯 여유 ({3 - enrichedList.length}개)</div>
                        <p className="text-[10px] text-slate-400">
                          매물 카드에서 [⚖️ 비교] 버튼을 눌러 추가할 수 있습니다.
                        </p>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-700">
                {/* ================= [섹션 1] 가격 & KB시세 비교 ================= */}
                <tr className="bg-slate-100/90">
                  <td colSpan={enrichedList.length + (enrichedList.length < 3 ? 2 : 1)} className="py-2 px-4 font-black text-slate-800 text-xs">
                    💰 1. 매매가 · KB시세 · 전세가율(하방 안전성) 비교
                  </td>
                </tr>

                {/* 매매 기준가 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">매매 기준가</td>
                  {enrichedList.map((item) => {
                    const isBest = canHighlight && item.priceKrw === minPrice;
                    return (
                      <td key={item.id} className={`py-3 px-4 border-l border-slate-100 ${isBest ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-black text-blue-700">{formatMoney(item.priceKrw)}</span>
                          {isBest && (
                            <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                              🏆 최저 매매가
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">호가 밴드: {item.priceRange || '-'}</span>
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* KB 일반평균가 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">KB부동산 일반평균가</td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatMoney(item.kb.generalAvg)}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        하위 {formatMoney(item.kb.lowAvg)} ~ 상위 {formatMoney(item.kb.highAvg)}
                      </span>
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 전세 평균가 및 전세가율 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">KB 전세가 / 전세가율</td>
                  {enrichedList.map((item) => {
                    const isBest = canHighlight && item.kb.jeonseRate && item.kb.jeonseRate === maxJeonseRate;
                    return (
                      <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-800">
                            {item.kb.jeonseAvg ? formatMoney(item.kb.jeonseAvg) : '시세 미제공'}
                          </span>
                          {item.kb.jeonseRate && (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold text-[11px]">
                              전세가율 {item.kb.jeonseRate}%
                            </span>
                          )}
                          {isBest && (
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                              🏆 탄탄한 전세받침
                            </span>
                          )}
                        </div>
                        {item.kb.jeonseAvg && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            매매-전세 갭차이: {formatMoney(Math.max(0, item.priceKrw - item.kb.jeonseAvg))}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 최근 국토부 실거래가 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">최근 실거래가 (국토부)</td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                      {item.latestTrade ? (
                        <>
                          <span className="font-extrabold text-slate-900">
                            {formatMoney(item.latestTrade.price)}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {item.latestTrade.date} 계약 · {item.latestTrade.floor}층 (외 {Math.max(0, (item.recentTrades?.length || 1) - 1)}건)
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">최근 거래내역 없음</span>
                      )}
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* ================= [섹션 2] 정책대출 & 실제 필요 총현금(All-in) 영수증 비교 ================= */}
                <tr className="bg-indigo-50/90">
                  <td colSpan={enrichedList.length + (enrichedList.length < 3 ? 2 : 1)} className="py-2 px-4 font-black text-indigo-950 text-xs">
                    🧾 2. 정책대출 한도 · 월 원리금 · 부대비용 포함 '실제 필요 총현금(All-in)' 비교
                  </td>
                </tr>

                {/* 정책대출 가능액 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">
                    정책대출 최대 한도
                  </td>
                  {enrichedList.map((item) => {
                    const isBest = canHighlight && item.sim.maxLoanAmount > 0 && item.sim.maxLoanAmount === maxLoanVal;
                    return (
                      <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                        {item.sim.isEligible ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-base font-black text-blue-800">{item.sim.maxLoanFormatted}</span>
                              {isBest && (
                                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                                  🏆 최대 대출
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                              {item.sim.loanName} · LTV {item.sim.ltvRatio}% ({item.sim.valuationBasis})
                            </span>
                          </>
                        ) : (
                          <div>
                            <span className="text-rose-600 font-extrabold">선택 대출 대상 제외</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {item.allLoans?.newborn?.isEligible
                                ? `💡 신생아특례 전환 시 ${item.allLoans.newborn.maxLoanFormatted} 가능`
                                : item.sim.ineligibilityReasons?.[0]}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 순수 매매 필요 현금 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">
                    [A] 순수 매매 자기자본<br />
                    <span className="text-[10px] text-slate-400 font-normal">(실매매가 - 대출금)</span>
                  </td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100 font-bold text-slate-800 text-sm">
                      {formatMoney(item.receipt.purePropertyCash)}
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 필수 부대비용 + 선택 입주비용 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">
                    [B] 세금·복비·등기·수리비<br />
                    <span className="text-[10px] text-slate-400 font-normal">(취득세+중개보수+채권/법무사 등)</span>
                  </td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                      <span className="font-extrabold text-indigo-700">
                        +{formatMoney(item.receipt.totalExtraCosts)}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                        <div>· 취득세등: {item.receipt.taxes.finalTotalTax.toLocaleString()}원</div>
                        <div>· 중개보수: {item.receipt.brokerage.totalBrokerFee.toLocaleString()}원</div>
                        <div>· 등기비용: {item.receipt.registration.totalRegistrationCost.toLocaleString()}원</div>
                        {item.receipt.optionalPrepCosts > 0 && (
                          <div className="text-amber-700 font-semibold">
                            · 이사/수리: +{item.receipt.optionalPrepCosts.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 💸 실제 필요 총현금 (All-in Cash) 하이라이트 행 */}
                <tr className="bg-rose-50/60">
                  <td className="py-3.5 px-4 font-black text-rose-950 bg-rose-100/70 whitespace-nowrap">
                    🔥 실제 필요 총현금 (All-in)<br />
                    <span className="text-[10px] text-rose-700 font-bold">([A] 순수매수금 + [B] 부대비용)</span>
                  </td>
                  {enrichedList.map((item) => {
                    const isBest = canHighlight && item.receipt.totalAllInCash === minAllInCash;
                    return (
                      <td
                        key={item.id}
                        className={`py-3.5 px-4 border-l border-rose-200/60 ${
                          isBest ? 'bg-rose-100/50 ring-2 ring-inset ring-rose-400' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-lg font-black text-rose-600">
                            {formatMoney(item.receipt.totalAllInCash)}
                          </span>
                          {isBest && (
                            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              🏆 최소 현금 필요
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                          <div>· 계약일(10%): <strong>{formatMoney(item.receipt.contractDeposit10)}</strong></div>
                          <div>· 잔금일(D-Day): <strong>{formatMoney(item.receipt.balanceDayTotalCash)}</strong></div>
                        </div>
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 월 원리금 상환액 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">
                    월 원리금 상환액 ({userCriteria?.loanTenureYears || 30}년)<br />
                    <span className="text-[10px] text-indigo-600 font-bold">
                      ({userCriteria?.repaymentMethod === 'graduated' ? '체증식 1년차' : userCriteria?.repaymentMethod === 'principal' ? '원금균등 1회차' : '원리금균등'})
                    </span>
                  </td>
                  {enrichedList.map((item) => {
                    const isBest = canHighlight && minMonthlyPay && item.sim.monthlyPayment === minMonthlyPay;
                    const repSummary = item.sim.repaymentSummary;
                    return (
                      <td key={item.id} className={`py-3 px-4 border-l border-slate-100 ${isBest ? 'bg-emerald-50/40' : ''}`}>
                        {item.sim.isEligible ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-base font-black text-slate-900">
                                월 {item.sim.monthlyPayment?.toLocaleString()}원
                              </span>
                              {isBest && (
                                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                                  🏆 최저 월부담
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                              적용금리 연 {item.sim.finalInterestRate}% (시중은행 대비 월 {item.sim.comparison?.monthlySavings?.toLocaleString()}원 절약)
                            </span>
                            {repSummary && (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-200/70 text-[10px] text-slate-600 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>· 체증식(1년차):</span>
                                  <strong className="text-indigo-700">월 {repSummary.graduatedFirstMonth?.toLocaleString()}원</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>· 원리금균등:</span>
                                  <strong className="text-slate-800">월 {repSummary.levelMonthly?.toLocaleString()}원</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>· 원금균등(1회차):</span>
                                  <strong className="text-emerald-700">월 {repSummary.principalFirstMonth?.toLocaleString()}원</strong>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* ================= [섹션 3] 입지 · 단지 스펙 · 평면 구조 비교 ================= */}
                <tr className="bg-emerald-50/90">
                  <td colSpan={enrichedList.length + (enrichedList.length < 3 ? 2 : 1)} className="py-2 px-4 font-black text-emerald-950 text-xs">
                    🏛️ 3. 역세권 입지 · 단지 규모 · 평면도(Bay) 구조 비교
                  </td>
                </tr>

                {/* 인근 지하철역 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">인근 지하철역 / 교통</td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Train className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.subwayStation}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{item.subwayDistance}</span>
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 🚇 5대 주요 업무지구 통근시간 비교 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">
                    5대 주요 업무지구 통근<br />
                    <span className="text-[10px] text-emerald-700 font-semibold">(도보+전철 실소요)</span>
                  </td>
                  {enrichedList.map((item) => {
                    const commute = item.commuteInfo || calculatePropertyCommute(item);
                    const hubs = [
                      { id: 'GBD', label: '강남·역삼 (GBD)' },
                      { id: 'CBD', label: '광화문·종로 (CBD)' },
                      { id: 'YBD', label: '여의도·공덕 (YBD)' },
                      { id: 'MAGOK_DMC', label: '마곡·DMC·가산' },
                      { id: 'PANGYO', label: '판교·분당 (IT)' },
                    ];
                    return (
                      <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                        <div className="space-y-1 text-[11px]">
                          {hubs.map((h) => {
                            const info = commute?.byHub?.[h.id];
                            if (!info) return null;
                            const isBestHub = commute.bestHubId === h.id;
                            return (
                              <div key={h.id} className="flex items-center justify-between">
                                <span className="text-slate-600">{h.label}</span>
                                <span className={`font-extrabold ${isBestHub ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200' : 'text-slate-800'}`}>
                                  약 {info.totalMinutes}분
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 준공년도 및 총세대수 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">준공년도 / 총세대수</td>
                  {enrichedList.map((item) => {
                    const isBestScale = canHighlight && item.totalUnits === maxUnits;
                    const isNewest = canHighlight && item.buildYear === newestYear;
                    return (
                      <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                        <div className="font-bold text-slate-800">
                          {item.buildYear}년 준공 · 총 {item.totalUnits?.toLocaleString()}세대
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {isBestScale && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                              🏆 최대 단지규모
                            </span>
                          )}
                          {isNewest && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                              🏆 가장 젊은 연식
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 전용면적 및 평면 구조 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">전용면적 / 평면 구조</td>
                  {enrichedList.map((item) => {
                    const isLargest = canHighlight && item.areaSqMeter === maxArea;
                    return (
                      <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900">
                            {item.pyeong}평형 (전용 {item.areaSqMeter}㎡)
                          </span>
                          {isLargest && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                              🏆 실사용 면적 우위
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          {item.fp.bay || '3-Bay'} · {item.fp.structure || '판상형'} · {item.rooms}
                        </span>
                      </td>
                    );
                  })}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 단지 핵심 특징 */}
                <tr>
                  <td className="py-3 px-4 font-bold bg-slate-50 whitespace-nowrap">핵심 강점 (Highlights)</td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3 px-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {item.highlights?.map((h, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            ★ {h}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-100 bg-slate-50/30" />}
                </tr>

                {/* 바로가기 액션 버튼 행 */}
                <tr className="bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">상세 분석 & 외부 링크</td>
                  {enrichedList.map((item) => (
                    <td key={item.id} className="py-3.5 px-4 border-l border-slate-200 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPropertyDetail(item)}
                          className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors whitespace-nowrap"
                        >
                          🧾 상세 영수증·시세
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPropertyFloorPlan(item)}
                          className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors whitespace-nowrap"
                        >
                          🏛️ 도면 보기
                        </button>
                      </div>
                      {(item.naverMobileUrl || item.naverLandUrl) && (
                        <a
                          href={item.naverMobileUrl || item.naverLandUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>N 네이버부동산 실시간 매물</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  ))}
                  {enrichedList.length < 3 && <td className="border-l border-slate-200 bg-slate-50/30" />}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            ※ 위 비교표의 대출한도 및 취득세·부대비용은 상단 시뮬레이터 설정 조건과 동일하게 실시간 연동됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            비교함 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
