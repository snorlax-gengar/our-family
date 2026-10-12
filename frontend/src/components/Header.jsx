import React from 'react';
import { Home, Percent, BookOpen, TrendingDown, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, ratesData, onOpenGuide }) {
  const baseRate = ratesData?.rates?.baseRate?.current || 3.00;
  const cofixRate = ratesData?.rates?.cofix?.[0]?.rate || 3.28;

  const tabs = [
    { id: 'properties', label: '5~6억 매물 & 신생아 특례 계산기', icon: Building2, desc: '서울·경기 역세권 아파트 & 대출 한도 조회' },
    { id: 'rates', label: '대한민국 금리 & 데일리 뉴스', icon: Percent, desc: '기준금리, COFIX, 시중은행 주담대, 매일 뉴스' },
    { id: 'policies', label: '부동산 용어 & 정책 요약집', icon: BookOpen, desc: 'LTV/DSR 용어사전 & 2025~2026 정부 정책 스크래퍼' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner / Tickers */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>실시간 시장 지표</span>
            </span>
            <span className="text-slate-300">내집마련 핵심 금리 현황</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">한국은행 기준금리:</span>
              <span className="font-bold text-amber-300">{baseRate}%</span>
              <span className="text-[10px] text-emerald-400">(-0.25%p)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-slate-400">신규 COFIX:</span>
              <span className="font-bold text-sky-300">{cofixRate}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">신생아 특례금리:</span>
              <span className="font-bold text-emerald-400">최저 연 1.6%</span>
              <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">DSR 미적용</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="bg-blue-500/30 text-blue-200 text-[10px] px-2 py-0.5 rounded font-semibold border border-blue-400/30">
                정부 대출규제 기준 LTV 70% 안전 준수
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  우리가 <span className="text-blue-600">(우리家)</span>
                </h1>
                <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                  가족 보금자리 플래너
                </span>
                {/* 🐣 왕초보 3분 가이드 버튼 */}
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <span>🐣 부린이 3분 가이드</span>
                  <span className="text-[10px] bg-amber-500 text-white rounded-full px-1">Q&A</span>
                </button>
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                <p className="text-slate-700 font-bold">"우리가 함께 짓는, 우리 가족의 첫 보금자리"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">서울·경기 5~6억 아파트 & 신생아 특례대출(LTV 70%) 통합 허브</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
