import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PropertiesTab from './components/PropertiesTab';
import RatesTab from './components/RatesTab';
import PoliciesTab from './components/PoliciesTab';
import BeginnerGuideModal from './components/BeginnerGuideModal';
import { getProperties, getRates, getPolicies } from './lib/dataApi';
import { Heart, ShieldAlert, Sparkles, Building2, Percent, BookOpen, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('properties');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // 사용자 맞춤형 대출 조건 기본값 (신생아 특례 / HF 보금자리론 / 생애최초 디딤돌)
  const [userCriteria, setUserCriteria] = useState({
    annualIncome: 80000000, // 8,000만 원 (신생아 특례 기본 범위)
    isFirstHome: false,     // 생애최초 여부 (취득세 200만 원 감면 혜택, 대출은 정부 규제 LTV 70% 준수)
    loanTenureYears: 30,    // 30년 만기
    useMcg: true,           // MCG 모기지신용보증 가입 (방공제 면제)
    preferentialDiscount: 0.2, // 우대금리 (청약통장 + 전자계약 등 0.2%p)
    loanType: 'newborn',    // 'newborn' | 'bogeumjari' | 'didimdol'
  });

  const [properties, setProperties] = useState([]);
  const [ratesData, setRatesData] = useState(null);
  const [policyData, setPolicyData] = useState(null);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [policyRefreshing, setPolicyRefreshing] = useState(false);

  // 1. 매물 데이터 로드 (사용자 조건 및 선택 대출상품 변경 시 자동 재계산)
  const fetchProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      // 정적 데이터(/data/properties.json) + 브라우저 대출 계산 (서버 불필요)
      const list = await getProperties({
        ...userCriteria,
        loanType: userCriteria.loanType || 'newborn',
      });
      setProperties(list);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoadingProperties(false);
    }
  }, [userCriteria]);

  // 2. 금리 데이터 로드
  const fetchRates = async () => {
    try {
      setRatesData(await getRates());
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
  };

  // 3. 정책 & 용어 데이터 로드
  const fetchPolicies = async () => {
    try {
      setPolicyData(await getPolicies());
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchRates();
    fetchPolicies();
  }, []);

  // 뉴스 새로고침 핸들러: 하루 2회 자동 수집(GitHub Actions)된 최신본을 다시 불러온다
  const handleRefreshNews = async () => {
    try {
      setNewsRefreshing(true);
      setRatesData(await getRates({ fresh: true }));
    } catch (err) {
      console.error('News refresh error:', err);
    } finally {
      setNewsRefreshing(false);
    }
  };

  // 정책 새로고침 핸들러: 하루 2회 자동 수집(GitHub Actions)된 최신본을 다시 불러온다
  const handleRefreshPolicies = async () => {
    try {
      setPolicyRefreshing(true);
      setPolicyData(await getPolicies({ fresh: true }));
    } catch (err) {
      console.error('Policy refresh error:', err);
    } finally {
      setPolicyRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        ratesData={ratesData}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Beginner Guide Modal */}
      {isGuideOpen && (
        <BeginnerGuideModal onClose={() => setIsGuideOpen(false)} />
      )}

      {/* Main Content Body (Mobile-first responsive container) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3.5 sm:py-8 pb-32 md:pb-8">
        {activeTab === 'properties' && (
          <PropertiesTab
            properties={properties}
            userCriteria={userCriteria}
            setUserCriteria={setUserCriteria}
            loading={loadingProperties}
            onRefresh={fetchProperties}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {activeTab === 'rates' && (
          <RatesTab
            ratesData={ratesData}
            onRefreshNews={handleRefreshNews}
            newsRefreshing={newsRefreshing}
          />
        )}

        {activeTab === 'policies' && (
          <PoliciesTab
            policyData={policyData}
            onRefreshPolicies={handleRefreshPolicies}
            policyRefreshing={policyRefreshing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-14 pt-10 pb-36 md:pb-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 상단: 브랜드 및 서비스 안내 / 관련 공공기관 바로가기 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
            {/* 좌측 7열: 서비스 설명 */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/favicon.svg"
                  alt="우리家 로고"
                  className="w-7 h-7 rounded-lg shadow-sm shadow-rose-500/20 shrink-0 object-contain"
                />
                <div>
                  <span className="font-bold text-white text-base tracking-tight">우리家</span>
                  <span className="text-slate-400 text-xs ml-1.5 font-medium">우리 가족 보금자리 플래너</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed break-keep max-w-xl">
                수도권 5~6억 원대 실수요 아파트 매물 탐색 · 평형별 도면 CAD 구조 분석 · 신생아 특례대출(LTV 70%) & HF 보금자리론 & 생애최초 디딤돌 맞춤형 시뮬레이션 및 실시간 대한민국 금리·정책 통합 분석 서비스입니다.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-400">
                <span>데이터 출처 : 국토교통부 실거래가 · KB국민은행 시세 · 주택도시기금 · 한국주택금융공사(HF) · 한국은행</span>
              </div>
            </div>

            {/* 우측 5열: 공식 포털 바로가기 링크 */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">공식 대출 & 시세 포털 바로가기</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <a
                    href="https://enhf.molit.go.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>주택도시기금 (기금e든든)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://www.hf.go.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>한국주택금융공사 (HF)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="https://kbland.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>KB부동산 (KB시세)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href="http://rt.molit.go.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                  >
                    <span>국토부 실거래가 공개시스템</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 중단: 법적 고지 / 유의사항 */}
          <div className="py-4 text-[11px] text-slate-400 leading-relaxed break-keep">
            <p>※ 본 시뮬레이션 결과는 국토교통부 실거래가, KB국민은행 시세 및 주택도시기금/HF 업무처리기준을 바탕으로 산출된 모의 계산 결과이며 법적 효력이 없습니다.</p>
            <p className="mt-0.5">※ 실제 대출 취급 및 최종 승인 여부, 적용 금리 및 한도는 개인의 신용점수, 세대 합산 주택 보유수, 담보물 감정평가 및 은행 창구/기금e든든 정밀 심사 결과에 따라 달라질 수 있습니다.</p>
          </div>

          {/* 하단: Copyright, 개발자, GitHub 링크 및 버전 정보 */}
          <div className="pt-4 border-t border-slate-800/70 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
              <span>© 2026 우리家 · Developed by <strong className="font-semibold text-slate-200">gengarileo</strong>. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://github.com/snorlax-gengar/our-family"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 font-medium"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub Repository</span>
              </a>

              <span className="text-slate-600">|</span>

              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Daily Live Sync Active
              </span>

              <span className="text-slate-600">|</span>

              <span className="text-slate-400 font-medium">v1.2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 📱 Mobile Fixed Bottom Navigation Bar (화면 하단 여백 보강 & 넉넉한 터치 영역 확보) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pt-2 pb-6 px-3 flex items-center justify-around md:hidden shadow-xl shadow-slate-900/10">
        <button
          type="button"
          onClick={() => {
            setActiveTab('properties');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] transition-all cursor-pointer active:scale-95 ${
            activeTab === 'properties' ? 'text-blue-600 font-black bg-blue-50/80 shadow-xs' : 'text-slate-400 font-semibold hover:text-slate-600'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-0.5 ${activeTab === 'properties' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[10px] whitespace-nowrap">매물 & 대출</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('rates');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] transition-all cursor-pointer active:scale-95 ${
            activeTab === 'rates' ? 'text-blue-600 font-black bg-blue-50/80 shadow-xs' : 'text-slate-400 font-semibold hover:text-slate-600'
          }`}
        >
          <Percent className={`w-5 h-5 mb-0.5 ${activeTab === 'rates' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[10px] whitespace-nowrap">금리 & 뉴스</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('policies');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] transition-all cursor-pointer active:scale-95 ${
            activeTab === 'policies' ? 'text-blue-600 font-black bg-blue-50/80 shadow-xs' : 'text-slate-400 font-semibold hover:text-slate-600'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-0.5 ${activeTab === 'policies' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[10px] whitespace-nowrap">정책 & 용어</span>
        </button>

        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[64px] min-h-[48px] transition-all cursor-pointer text-amber-600 hover:text-amber-700 font-black active:scale-95"
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-amber-500 fill-amber-400/30 animate-pulse" />
          <span className="text-[10px] whitespace-nowrap">3분 가이드</span>
        </button>
      </nav>
    </div>
  );
}
