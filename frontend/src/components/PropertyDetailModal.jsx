import React, { useState, useEffect } from 'react';
import { 
  X, Building2, MapPin, Train, Calendar, TrendingUp, DollarSign, 
  ShieldCheck, Calculator, Sparkles, ExternalLink, CheckCircle2, ArrowRight, Heart
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

  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab, property]);

  if (!property) return null;

  const sim = property.loanSimulation || {};
  const kb = property.kbPrice || {};

  // 부대비용 계산: 취득세 (6억 이하 1.1%), 생애최초 시 최대 200만 원 감면
  const rawAcquisitionTax = Math.round(property.priceKrw * 0.011);
  const acquisitionDiscount = sim.isFirstHome ? Math.min(2000000, rawAcquisitionTax) : 0;
  const finalAcquisitionTax = rawAcquisitionTax - acquisitionDiscount;

  // 부동산 중개보수 (매매 2억~9억 이하 상한요율 0.4%)
  const maxBrokerFee = Math.round(property.priceKrw * 0.004);

  // 총 필요 현금 = 매수 자기자본 + 취득세 + 중개수수료
  const totalCashNeeded = (sim.requiredCash || 0) + finalAcquisitionTax + maxBrokerFee;

  const formatMoney = (val) => {
    if (!val) return '0원';
    const eok = Math.floor(val / 100000000);
    const man = Math.floor((val % 100000000) / 10000);
    if (eok > 0) {
      return `${eok}억 ${man > 0 ? man.toLocaleString() + '만' : ''}원`;
    }
    return `${man.toLocaleString()}만원`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile pull handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shrink-0">
              {property.region} {property.district}
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {property.name.replace(/\s*\(\d+평형?\)/g, '')}
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 shrink-0">
              {property.pyeong}평 ({property.areaSqMeter}㎡)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
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
              <span className="text-slate-400 block mb-1">매매 호가 / 기준가</span>
              <span className="text-lg font-black text-blue-700">{property.priceDisplay}원</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">인근 지하철역</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Train className="w-4 h-4 text-emerald-600 shrink-0" />
                {property.subwayStation}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">준공년도 / 총세대수</span>
              <span className="font-bold text-slate-800">
                {property.buildYear}년 ({property.totalUnits?.toLocaleString()}세대)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">구조 / 방수</span>
              <span className="font-bold text-slate-800">{property.rooms}</span>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2">
            {property.highlights?.map((h, idx) => (
              <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full font-medium">
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
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>📐 평형 도면 & 구조 분석</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                {property.floorPlan?.bay || '3-Bay'}
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

          {/* Section: 평형 도면 (Floor Plan CAD Blueprint) */}
          {(modalTab === 'all' || modalTab === 'floorPlan') && property.floorPlan && (
            <div className="space-y-3">
              <FloorPlanViewer
                floorPlan={property.floorPlan}
                propertyName={property.name}
                areaSqMeter={property.areaSqMeter}
                pyeong={property.pyeong}
                naverLandUrl={property.naverLandUrl}
                naverMobileUrl={property.naverMobileUrl}
                naverComplexNo={property.naverComplexNo}
              />
            </div>
          )}

          {/* Section 1: KB 부동산 시세 분석 */}
          {(modalTab === 'all' || modalTab === 'financial') && (
            <>
              <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/70">
            <div className="flex items-center justify-between mb-4">
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
                href={property.kbLandUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
              >
                <span>KB부동산 단지 바로가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                <span className="text-xs text-slate-400 block">KB 일반평균가 (기준)</span>
                <span className="text-base font-extrabold text-slate-900">{formatMoney(kb.generalAvg)}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">※ 주담대 한도 산정 기준</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                <span className="text-xs text-slate-400 block">KB 상위평균가</span>
                <span className="text-base font-bold text-slate-700">{formatMoney(kb.highAvg)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">로얄층/선호동 기준</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                <span className="text-xs text-slate-400 block">KB 하위평균가</span>
                <span className="text-base font-bold text-slate-700">{formatMoney(kb.lowAvg)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">1층 및 저층 기준</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                <span className="text-xs text-slate-400 block">전세평균가 / 전세가율</span>
                <span className="text-base font-extrabold text-blue-600">{formatMoney(kb.jeonseAvg)}</span>
                <span className="text-xs font-bold text-emerald-600 block mt-0.5">전세가율 {kb.jeonseRate}%</span>
              </div>
            </div>
          </div>

          {/* Section 2: 신생아 특례대출 정밀 시뮬레이션 */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>신생아 특례 디딤돌 대출 맞춤 시뮬레이션</span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      DSR 미적용
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    담보평가 기준: Min(매매가 {property.priceDisplay}, KB시세 {formatMoney(kb.generalAvg)}) → <strong className="text-blue-700 font-bold">{sim.appraisalPriceFormatted || property.priceDisplay}</strong> ({sim.valuationBasis === 'KB시세' ? 'KB시세' : '실매매가'} LTV {sim.ltvRatio}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">최대 대출 가능 금액</span>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {sim.maxLoanFormatted}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                  <span>LTV {sim.ltvRatio}% ({sim.valuationBasis === 'KB시세' ? 'KB시세' : '매매가'} {sim.appraisalPriceFormatted})</span>
                  {sim.useMcg && <span className="text-blue-600 font-semibold">(MCG 방공제면제)</span>}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">필요 자기자본 (순수 매수금)</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {sim.requiredCashFormatted}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  실매매가 {property.priceDisplay} - 대출금
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">월 예상 상환액 (원리금균등)</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  약 {sim.monthlyPayment?.toLocaleString()}원
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-1">
                  적용 금리: 연 {sim.finalInterestRate}% (우대 -{sim.preferentialDiscount}%p)
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
                  <span className="text-slate-400 block">시중은행 예상 금리</span>
                  <span className="font-bold text-slate-800">연 {sim.comparison?.marketRate}% 수준</span>
                </div>
                <div>
                  <span className="text-slate-400 block">시중은행 월 상환액</span>
                  <span className="font-bold text-slate-800">월 {sim.comparison?.marketMonthlyPayment?.toLocaleString()}원</span>
                </div>
                <div>
                  <span className="text-slate-400 block">매월 이자 절약액</span>
                  <span className="font-extrabold text-blue-600">매월 +{sim.comparison?.monthlySavings?.toLocaleString()}원 절약!</span>
                </div>
                <div>
                  <span className="text-slate-400 block">30년 총 절감액</span>
                  <span className="font-extrabold text-emerald-600">총 {sim.comparison?.totalSavingsFormatted} 절약!</span>
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
                <span className="text-slate-600">① 아파트 매매 잔금 (매매가 - 대출금)</span>
                <span className="font-bold text-slate-900">{formatMoney(sim.requiredCash)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">② 취득세 및 지방교육세 (1.1%)</span>
                  {sim.isFirstHome && (
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                      생애최초 200만 원 감면 적용
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{finalAcquisitionTax.toLocaleString()}원</span>
                  {sim.isFirstHome && (
                    <span className="text-xs text-slate-400 block line-through">
                      정상세액: {rawAcquisitionTax.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">③ 공인중개사 중개보수 (법정상한 0.4% 기준)</span>
                <span className="font-bold text-slate-900">약 {maxBrokerFee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between py-2 pt-3 font-bold text-base bg-blue-50/60 px-3 rounded-lg text-blue-900">
                <span>총 준비 필요 자금 (① + ② + ③)</span>
                <span className="text-lg font-black text-blue-700">{formatMoney(totalCashNeeded)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: 최근 실거래가 내역 */}
          {property.recentTrades && property.recentTrades.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>국토교통부 최근 실거래가 신고 내역</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">계약년월</th>
                      <th className="py-2.5 px-3">층수</th>
                      <th className="py-2.5 px-3">실거래 금액</th>
                      <th className="py-2.5 px-3">현재 매매가와의 차이</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {property.recentTrades.map((trade, idx) => {
                      const diff = property.priceKrw - trade.price;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-medium">{trade.date}</td>
                          <td className="py-2.5 px-3">{trade.floor}층</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatMoney(trade.price)}</td>
                          <td className="py-2.5 px-3 text-slate-500">
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
          <div className="text-xs text-slate-500">
            주소: {property.address}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={property.naverMobileUrl || property.naverLandUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 text-white border border-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>N {property.name} 네이버부동산 매물·정보</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              확인 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
