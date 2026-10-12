import React, { useState } from 'react';
import { 
  Percent, TrendingDown, TrendingUp, RefreshCw, Newspaper, 
  Building2, ShieldCheck, ExternalLink, Calendar, Info, Sparkles, Filter
} from 'lucide-react';

export default function RatesTab({ ratesData, onRefreshNews, newsRefreshing }) {
  const [selectedTag, setSelectedTag] = useState('전체');

  const rates = ratesData?.rates || {};
  const newsList = ratesData?.news || [];
  const baseRate = rates.baseRate || {};
  const cofix = rates.cofix || [];
  const bonds = rates.marketBonds || [];
  const bankMortgages = rates.bankMortgageRates || [];
  const specialLoans = rates.specialLoans || [];

  const tags = ['전체', '기준금리', '주담대 금리', '신생아특례', '코픽스', '대출규제'];

  const filteredNews = newsList.filter(item => {
    if (selectedTag === '전체') return true;
    return item.tag === selectedTag;
  });

  return (
    <div className="space-y-8">
      {/* 1. 상단 인트로 & 요약 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                <span>종합 금리 모니터링</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                대한민국 핵심 금리 종합 취합
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              한국은행 기준금리부터 COFIX(코픽스), 채권시장 금리, 5대 시중은행 주담대, 정부 정책대출 금리를 매일 취합하고 최신 뉴스를 전달합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshNews}
              disabled={newsRefreshing}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${newsRefreshing ? 'animate-spin' : ''}`} />
              <span>{newsRefreshing ? '뉴스 수집 중...' : '매일 최신 뉴스 새로고침'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 주요 금리 지표 핵심 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 한국은행 기준금리 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">한국은행 기준금리</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              BOK 정책금리
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{baseRate.current}%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              -0.25%p 인하
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            최근 의결: {baseRate.decisionDate} (인하 기조 진입)
          </p>
        </div>

        {/* 신규 COFIX */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">신규취급액 기준 COFIX</span>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              변동 주담대 기준
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{cofix[0]?.rate}%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              -0.09%p 하락
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            은행연합회 공시 (주담대 변동금리 직결)
          </p>
        </div>

        {/* 금융채 5년물 AAA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500">금융채 5년물 (AAA)</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
              주기형 고정 기준
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">3.19%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              -0.04%p 안정
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            5년 주기형 혼합형 주담대 준거금리
          </p>
        </div>

        {/* 신생아 특례대출 금리 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-blue-900">신생아 특례 디딤돌</span>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded">
              최저 1%대
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-800">연 1.6~3.3%</span>
          </div>
          <p className="text-xs text-blue-700 font-semibold mt-2">
            DSR 스트레스 규제 미적용 / 최대 5억
          </p>
        </div>
      </div>

      {/* 3. 코픽스 3종 & 채권시장 세부 표 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COFIX 세부 테이블 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
            <span>COFIX (자금조달비용지수) 3대 지표 비교</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            전국 8개 은행의 조달 자금 가중평균금리로 주택담보대출 변동금리의 기준이 됩니다.
          </p>

          <div className="space-y-3">
            {cofix.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-blue-700">{item.rate}%</span>
                    <span className="text-xs text-emerald-600 font-semibold">({item.change}%p)</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 채권시장 금리 테이블 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
            <span>국고채 및 금융채 시장 금리</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            채권 수익률은 은행의 고정금리형 대출 및 시장 금리 전망의 선행지표입니다.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">채권 종류</th>
                  <th className="py-2.5 px-3">현재 수익률</th>
                  <th className="py-2.5 px-3">전일 대비</th>
                  <th className="py-2.5 px-3">특징</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bonds.map((bond, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{bond.name}</td>
                    <td className="py-3 px-3 font-extrabold text-blue-700">{bond.rate}%</td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${bond.change < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bond.change > 0 ? `+${bond.change}` : bond.change}%p
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{bond.note || '대표 시장 채권'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. 5대 시중은행 주담대 금리 현황표 */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>5대 시중은행 주택담보대출 최신 금리 비교 (KB·신한·하나·우리·농협)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ※ 스트레스 DSR 2단계 수도권 가산금리(1.2%p) 반영 전 실제 고시 금리 구간입니다.
            </p>
          </div>
          <span className="text-xs text-slate-400">은행연합회 소비자포털 취합</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">은행명</th>
                <th className="py-3 px-4">변동금리 (6개월 COFIX)</th>
                <th className="py-3 px-4">5년 주기형 혼합형 (고정)</th>
                <th className="py-3 px-4">준거 기준</th>
                <th className="py-3 px-4">금리 추천</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {bankMortgages.map((b, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {b.bank}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{b.variable}</td>
                  <td className="py-3.5 px-4 font-black text-blue-700">{b.fixed5Year}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{b.baseBenchmark}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold">
                      고정형 유리 (하단 3.3%대)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. 매일 금리 뉴스 섹션 */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-indigo-600" />
              <span>매일 금리 동향 & 대출 시장 뉴스 피드</span>
            </h3>
            <p className="text-xs text-slate-500">
              한국은행, 금융위원회, 시중은행 및 주요 언론사의 금리·대출 관련 보도를 매일 스크래핑합니다.
            </p>
          </div>

          {/* 뉴스 태그 필터 */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 뉴스 카드 목록 */}
        <div className="space-y-3.5">
          {filteredNews.map((news) => (
            <div
              key={news.id}
              className="p-4 sm:p-5 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
                    {news.tag}
                  </span>
                  <span className="text-slate-400 font-medium">{news.source}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {news.date}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {news.title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {news.summary}
                </p>
              </div>

              {news.link && (
                <a
                  href={news.link}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 self-end sm:self-center px-3.5 py-1.5 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>원문 기사</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
