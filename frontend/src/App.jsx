import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PropertiesTab from './components/PropertiesTab';
import RatesTab from './components/RatesTab';
import PoliciesTab from './components/PoliciesTab';
import BeginnerGuideModal from './components/BeginnerGuideModal';
import { Home, Heart, ShieldAlert, Sparkles, Building2, Percent, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('properties');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // 사용자 맞춤형 대출 조건 기본값
  const [userCriteria, setUserCriteria] = useState({
    annualIncome: 80000000, // 8,000만 원 (신생아 특례 기본 범위)
    isFirstHome: false,     // 생애최초 여부 (취득세 200만 원 감면 혜택, 대출은 정부 규제 LTV 70% 준수)
    loanTenureYears: 30,    // 30년 만기
    useMcg: true,           // MCG 모기지신용보증 가입 (방공제 면제)
    preferentialDiscount: 0.2, // 우대금리 (청약통장 + 전자계약 등 0.2%p)
  });

  const [properties, setProperties] = useState([]);
  const [ratesData, setRatesData] = useState(null);
  const [policyData, setPolicyData] = useState(null);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [policyRefreshing, setPolicyRefreshing] = useState(false);

  // 1. 매물 데이터 로드 (사용자 조건 변경 시 자동 재계산)
  const fetchProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      const params = new URLSearchParams({
        annualIncome: userCriteria.annualIncome.toString(),
        isFirstHome: userCriteria.isFirstHome.toString(),
        loanTenureYears: userCriteria.loanTenureYears.toString(),
        useMcg: userCriteria.useMcg.toString(),
        preferentialDiscount: userCriteria.preferentialDiscount.toString(),
      });
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoadingProperties(false);
    }
  }, [userCriteria]);

  // 2. 금리 데이터 로드
  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      if (res.ok) {
        const data = await res.json();
        setRatesData(data);
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
  };

  // 3. 정책 & 용어 데이터 로드
  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/policies');
      if (res.ok) {
        const data = await res.json();
        setPolicyData(data);
      }
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

    // 고화질 도면 이미지 백그라운드 프리로드 (도면 열람 시 0초 즉시 표시)
    const floorplanImages = [
      '/floorplans/floorplan_84_3bay.jpg',
      '/floorplans/floorplan_84_4bay.jpg',
      '/floorplans/floorplan_59_3bay.jpg'
    ];
    floorplanImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 뉴스 실시간 새로고침 핸들러
  const handleRefreshNews = async () => {
    try {
      setNewsRefreshing(true);
      const res = await fetch('/api/rates/news/refresh', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setRatesData(prev => ({
          ...prev,
          news: result.news || prev.news
        }));
      }
    } catch (err) {
      console.error('News refresh error:', err);
    } finally {
      setNewsRefreshing(false);
    }
  };

  // 정책 실시간 스크래핑 새로고침 핸들러
  const handleRefreshPolicies = async () => {
    try {
      setPolicyRefreshing(true);
      const res = await fetch('/api/policies/refresh', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setPolicyData(prev => ({
          ...prev,
          scrapedPolicies: result.scrapedPolicies || prev.scrapedPolicies
        }));
      }
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
      <footer className="bg-white border-t border-slate-200 mt-10 py-8 pb-36 md:pb-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800 whitespace-nowrap">우리가 (우리家) · 우리 가족 보금자리 플래너</span>
            </div>
            <p className="text-slate-400 text-[11px] break-keep leading-tight">
              수도권 5~6억 원대 매물 · 평형 도면 CAD · 신생아 특례대출(LTV 70%) · 금리 & 정책 통합 허브
            </p>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400 break-keep leading-relaxed">
            <p>※ 본 시뮬레이션은 국토교통부 실거래가, KB국민은행 시세 및 주택도시기금 지침을 토대로 작성되었습니다.</p>
            <p className="mt-0.5 text-slate-400/90">실제 대출 취급 및 심사는 은행 창구 및 기금e든든 심사 결과에 따라 달라질 수 있습니다.</p>
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
