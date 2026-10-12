import React, { useState } from 'react';
import { 
  BookOpen, Search, ShieldCheck, Sparkles, RefreshCw, 
  ExternalLink, Calendar, CheckCircle2, AlertCircle, FileText,
  ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';

export default function PoliciesTab({ 
  policyData, 
  onRefreshPolicies, 
  policyRefreshing 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedPolicyId, setExpandedPolicyId] = useState('policy-stress-dsr-stage2');
  const [expandedTermId, setExpandedTermId] = useState(null);

  const terms = policyData?.terms || [];
  const currentPolicies = policyData?.currentPolicies || [];
  const scrapedPolicies = policyData?.scrapedPolicies || [];

  const categories = ['전체', '대출/금융', '정책대출', '세금/비용', '시세/청약'];

  // 용어 필터링
  const filteredTerms = terms.filter(t => {
    if (selectedCategory !== '전체' && t.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTerm = t.term.toLowerCase().includes(q);
      const matchEng = t.english?.toLowerCase().includes(q);
      const matchDef = t.fullDef?.toLowerCase().includes(q);
      if (!matchTerm && !matchEng && !matchDef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 상단 인트로 배너 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
                <BookOpen className="w-3.5 h-3.5" />
                <span>지식 & 정책 센터</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight break-keep">
              부동산 필수 용어사전 & 정부 정책 요약집
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl break-keep leading-relaxed">
              LTV·DSR 등 필수 금융 용어 해설과 함께,<br className="hidden sm:inline" /> 현재 시행 중인 핵심 부동산 정책 및 최신 보도자료를 제공합니다.
            </p>
          </div>

          <button
            onClick={onRefreshPolicies}
            disabled={policyRefreshing}
            className="w-full md:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0 self-start md:self-center whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${policyRefreshing ? 'animate-spin' : ''}`} />
            <span>{policyRefreshing ? '정책 스크래핑 중...' : '최신 정책 실시간 새로고침'}</span>
          </button>
        </div>
      </div>

      {/* 2. 미래 & 최신 정부 정책 실시간 알리미 (Scraper Feed) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg break-keep">
              실시간 정부 정책 보도자료 & 미래 정책 알리미
            </h3>
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap self-start sm:self-center">
            국토교통부 · 금융위원회 · 기획재정부 연계
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scrapedPolicies.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
                  <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                    {item.ministry}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-2 break-keep leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed break-keep">
                  {item.summary}
                </p>
              </div>

              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap"
                >
                  <span>정부 공식 보도자료 보기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. 대한민국 현재 시행 중인 핵심 부동산 정책 총정리 (Detailed Policy Guide) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap shrink-0">
              2025~2026 현행
            </span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg break-keep">
              현재 대한민국에서 시행 중인 핵심 부동산 정책 요약집
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 break-keep">
            내집마련 시 반드시 숙지해야 하는 최신 대출 규제, 세금 혜택, 청약 개편안 요약
          </p>
        </div>

        <div className="space-y-3">
          {currentPolicies.map((pol) => {
            const isExpanded = expandedPolicyId === pol.id;
            return (
              <div
                key={pol.id}
                className="rounded-xl border border-slate-200 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedPolicyId(isExpanded ? null : pol.id)}
                  className="w-full text-left p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded whitespace-nowrap">
                        {pol.status}
                      </span>
                      <span className="text-slate-500 font-medium whitespace-nowrap">{pol.ministry}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-400 whitespace-nowrap">대상: {pol.target}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 break-keep leading-snug">
                      {pol.title}
                    </h4>
                  </div>
                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 space-y-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">■ 정책 개요</span>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 break-keep">
                        {pol.summary}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-2">■ 핵심 시행 내용</span>
                      <ul className="space-y-2 text-slate-700">
                        {pol.keyPoints.map((kp, idx) => (
                          <li key={idx} className="flex items-start gap-2 break-keep leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 text-blue-900">
                      <span className="font-extrabold flex items-center gap-1.5 text-blue-950 mb-1 break-keep">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        5~6억 아파트 매수자 관점 영향 & 행동 요령
                      </span>
                      <p className="text-xs text-blue-800 leading-relaxed break-keep">
                        {pol.buyerImpact}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 부동산 용어 사전 (Real Estate Terms Dictionary) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2 break-keep">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <span>부동산 필수 용어 사전 (LTV, DSR, 방공제 등)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 break-keep">
                내집마련에 필수적인 금융, 대출, 세금, 청약 전문 용어를 알기 쉽게 설명합니다.
              </p>
            </div>

            {/* 검색창 */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="용어 검색 (예: DSR, 방공제, 취득세)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 카테고리 필터 버튼 */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs mt-3 no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 용어 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map((t) => {
            const isExpanded = expandedTermId === t.id;
            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all bg-white flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                      {t.category} · {t.difficulty}
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
                      {t.tag}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900 break-keep">
                      {t.term}
                    </h4>
                    <span className="text-[11px] text-slate-400 block font-medium break-keep">
                      {t.english}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-blue-900 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 break-keep leading-relaxed">
                    💡 {t.shortDef}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line break-keep">
                    {isExpanded ? t.fullDef : (t.fullDef?.slice(0, 110) + '...')}
                  </p>

                  {t.formula && isExpanded && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 break-keep">
                      <span className="font-bold text-slate-900 block mb-0.5">계산 공식:</span>
                      <code className="break-all">{t.formula}</code>
                    </div>
                  )}

                  {t.example && (
                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 break-keep">
                      <span className="font-extrabold text-emerald-950 block mb-0.5">실전 5~6억 적용 예시:</span>
                      <p className="leading-relaxed">{t.example}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setExpandedTermId(isExpanded ? null : t.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap py-1"
                  >
                    {isExpanded ? '간략히 보기 ▲' : '자세한 해설 펼치기 ▼'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
