import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PropertiesTab from './components/PropertiesTab';
import RatesTab from './components/RatesTab';
import PoliciesTab from './components/PoliciesTab';
import BeginnerGuideModal from './components/BeginnerGuideModal';
import { Home, Heart, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

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

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <Home className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">우리가 (우리家) - 우리 가족 보금자리 플래너</span>
            <span className="text-slate-300">|</span>
            <span>수도권 5~6억 원대 매물 · 평형 도면 CAD · 신생아 특례대출(LTV 70%) · 금리 & 정책 통합 허브</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            ※ 본 시뮬레이션은 국토교통부 실거래가, KB국민은행 시세 및 주택도시기금 지침을 토대로 작성되었습니다.
            <br />
            실제 대출 취급 및 심사는 은행 창구 및 기금e든든 심사 결과에 따라 달라질 수 있습니다.
          </div>
        </div>
      </footer>
    </div>
  );
}
