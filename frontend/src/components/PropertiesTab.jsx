import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, SlidersHorizontal, Train, ArrowUpDown, 
  ChevronRight, Sparkles, ShieldCheck, DollarSign, ExternalLink,
  Info, Check, RefreshCw, LayoutGrid, Eye, ArrowDownAZ, ArrowUpZA, Maximize2, Calendar
} from 'lucide-react';
import PropertyDetailModal from './PropertyDetailModal';

export default function PropertiesTab({ 
  properties, 
  userCriteria, 
  setUserCriteria, 
  loading,
  onRefresh,
  onOpenGuide
}) {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  const [priceBand, setPriceBand] = useState('all'); // 'all', '400M', '500M_low', '500M_high', '600M'
  const [sizeFilter, setSizeFilter] = useState('전체');
  const [sortOption, setSortOption] = useState('priceLow'); // Default: 가격 낮은순으로 보기!
  const [searchTerm, setSearchTerm] = useState('');
  const [myCash, setMyCash] = useState(0); // 0: 미설정, 예: 150000000 (1.5억)
  
  // Modal state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState('all');
  
  // Mobile simulator collapse state (모바일 화면에서 깔끔한 접기/펼치기)
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);

  // Income direct input state
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [rawIncomeInput, setRawIncomeInput] = useState('');

  // 구/시 목록 동적 추출
  const districts = useMemo(() => {
    const list = properties
      .filter(p => selectedRegion === '전체' || p.region === selectedRegion)
      .map(p => p.district);
    return ['전체', ...Array.from(new Set(list))];
  }, [properties, selectedRegion]);

  // 가격대별 카운트 계산
  const priceBandCounts = useMemo(() => {
    const counts = { all: properties.length, '400M': 0, '500M_low': 0, '500M_high': 0, '600M': 0 };
    properties.forEach(p => {
      if (p.priceKrw < 500000000) counts['400M']++;
      else if (p.priceKrw < 550000000) counts['500M_low']++;
      else if (p.priceKrw < 600000000) counts['500M_high']++;
      else counts['600M']++;
    });
    return counts;
  }, [properties]);

  // 필터링 및 정렬
  const filteredProperties = useMemo(() => {
    return properties.filter(item => {
      // 지역 필터
      if (selectedRegion !== '전체' && item.region !== selectedRegion) return false;
      // 구/시 필터
      if (selectedDistrict !== '전체' && item.district !== selectedDistrict) return false;
      
      // 가격대 밴드 필터
      if (priceBand === '400M' && item.priceKrw >= 500000000) return false;
      if (priceBand === '500M_low' && (item.priceKrw < 500000000 || item.priceKrw >= 550000000)) return false;
      if (priceBand === '500M_high' && (item.priceKrw < 550000000 || item.priceKrw >= 600000000)) return false;
      if (priceBand === '600M' && item.priceKrw < 600000000) return false;

      // 평형 필터
      if (sizeFilter === '20평대' && (item.pyeong < 20 || item.pyeong >= 30)) return false;
      if (sizeFilter === '30평대' && item.pyeong < 30) return false;

      // 검색어 필터
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(term);
        const matchDong = item.dong.toLowerCase().includes(term);
        const matchSubway = item.subwayStation.toLowerCase().includes(term);
        const matchBay = item.floorPlan?.bay?.toLowerCase().includes(term);
        if (!matchName && !matchDong && !matchSubway && !matchBay) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'priceLow') return a.priceKrw - b.priceKrw; // 가격 낮은순
      if (sortOption === 'priceHigh') return b.priceKrw - a.priceKrw; // 가격 높은순
      if (sortOption === 'jeonseHigh') return (b.kbPrice?.jeonseRate || 0) - (a.kbPrice?.jeonseRate || 0);
      if (sortOption === 'yearNew') return b.buildYear - a.buildYear;
      if (sortOption === 'unitsHigh') return (b.totalUnits || 0) - (a.totalUnits || 0);
      return a.priceKrw - b.priceKrw; // default: 가격 낮은순
    });
  }, [properties, selectedRegion, selectedDistrict, priceBand, sizeFilter, sortOption, searchTerm]);

  // 도면 모달 바로 열기 핸들러
  const handleOpenFloorPlan = (e, prop) => {
    e.stopPropagation();
    setModalInitialTab('floorPlan');
    setSelectedProperty(prop);
  };

  // 상세 견적 모달 열기 핸들러
  const handleOpenDetail = (prop) => {
    setModalInitialTab('all');
    setSelectedProperty(prop);
  };

  return (
    <div className="space-y-6">
      {/* 1. 신생아 특례대출 실시간 조건 설정 패널 (Interactive Simulator Controller) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/30 text-blue-300 border border-blue-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                실시간 연동 시뮬레이터
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                나만의 신생아 특례대출 조건 설정
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              소득과 조건을 변경하면 모든 5~6억 아파트 매물의 대출가능액, 필요 현금, 월 납입액이 실시간으로 재계산됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DSR 스트레스 규제 미적용</span>
            </span>
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1 rounded-md font-black transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>🐣 왕초보 3분 Q&A 가이드</span>
              </button>
            )}
          </div>
        </div>

        {/* 📱 Mobile Quick Condition Summary & Toggle Pill (모바일 화면 전용 빠른 조건 확인 및 접기/펼치기) */}
        <div className="sm:hidden mb-4">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-white/15 flex items-center justify-between gap-2 shadow-inner">
            <div className="text-[11px] leading-tight">
              <div className="text-amber-300 font-black flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{(Math.round(userCriteria.annualIncome / 10000)).toLocaleString()}만 원</span>
                <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/20 px-1 rounded ml-1">LTV 70%</span>
              </div>
              <div className="text-slate-300 text-[10px] mt-0.5">
                {userCriteria.isFirstHome ? '생애최초(취득세 감면)' : '일반 무주택'} · {userCriteria.loanTenureYears}년 만기 {userCriteria.useMcg && '· MCG'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSimulatorOpen(!isMobileSimulatorOpen)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>{isMobileSimulatorOpen ? '조건 접기 ▴' : '조건 변경 ▾'}</span>
            </button>
          </div>
        </div>

        {/* Simulator Controls Grid: 4 Harmonized, Balanced Cards (모바일에서는 접기/펼치기 제어, 태블릿/데스크톱에서는 상시 표시) */}
        <div className={`${isMobileSimulatorOpen ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs transition-all`}>
          {/* Card 1: 부부합산 연소득 (정밀 슬라이더 + 직접 입력 + 미세 조정) */}
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between shadow-lg hover:border-white/25 transition-all">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                  <span>부부합산 연소득</span>
                </label>
                <span className="text-[10px] text-amber-300 font-extrabold bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {userCriteria.annualIncome <= 20000000 ? '연 1.6% 최저' :
                   userCriteria.annualIncome <= 40000000 ? '연 2.1%대 구간' :
                   userCriteria.annualIncome <= 60000000 ? '연 2.5%대 구간' :
                   userCriteria.annualIncome <= 85000000 ? '연 2.7%대 (기본)' :
                   userCriteria.annualIncome <= 130000000 ? '연 3.1%대 (신혼)' : '연 3.3%대 (2억)'}
                </span>
              </div>

              {/* Amount Display & Direct Typing */}
              <div className="bg-slate-950/70 border border-white/15 rounded-xl px-3 py-1.5 flex items-center justify-between focus-within:border-amber-400/80 transition-all shadow-inner my-1.5">
                <span className="text-[11px] text-slate-400 font-medium">직접 입력</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={isEditingIncome ? rawIncomeInput : (Math.round(userCriteria.annualIncome / 10000)).toLocaleString()}
                    onFocus={() => {
                      setIsEditingIncome(true);
                      setRawIncomeInput(String(Math.round(userCriteria.annualIncome / 10000)));
                    }}
                    onBlur={() => {
                      setIsEditingIncome(false);
                      const num = parseInt(rawIncomeInput.replace(/[^0-9]/g, ''), 10);
                      if (!isNaN(num) && num > 0) {
                        const clamped = Math.min(20000, Math.max(1000, num));
                        setUserCriteria(prev => ({ ...prev, annualIncome: clamped * 10000 }));
                      }
                    }}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setRawIncomeInput(clean);
                      const num = parseInt(clean, 10);
                      if (!isNaN(num) && num > 0) {
                        const clamped = Math.min(20000, Math.max(1000, num));
                        setUserCriteria(prev => ({ ...prev, annualIncome: clamped * 10000 }));
                      }
                    }}
                    className="w-24 bg-transparent text-right font-black text-amber-300 text-lg focus:outline-none tracking-tight cursor-text"
                    placeholder="8,000"
                  />
                  <span className="text-amber-300 font-bold text-xs">만 원</span>
                </div>
              </div>

              {/* Sleek FinTech Custom Range Slider (부드러운 좌우 스크러빙 슬라이더) */}
              <div className="my-2">
                <input
                  type="range"
                  min="20000000"
                  max="200000000"
                  step="1000000"
                  value={userCriteria.annualIncome}
                  onChange={(e) => setUserCriteria({ ...userCriteria, annualIncome: Number(e.target.value) })}
                  className="custom-slider w-full cursor-pointer"
                  title="좌우로 부드럽게 드래그하여 소득 설정"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>2,000만</span>
                  <span>8,500만</span>
                  <span>1.3억</span>
                  <span>최대 2억</span>
                </div>
              </div>
            </div>

            {/* Stepper Buttons & Quick Preset Chips */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setUserCriteria(prev => ({ ...prev, annualIncome: Math.max(20000000, prev.annualIncome - 1000000) }))}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-slate-300 cursor-pointer transition-colors"
                >
                  -100만
                </button>
                <button
                  type="button"
                  onClick={() => setUserCriteria(prev => ({ ...prev, annualIncome: Math.min(200000000, prev.annualIncome + 1000000) }))}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-slate-300 cursor-pointer transition-colors"
                >
                  +100만
                </button>
              </div>
              <div className="flex gap-1">
                {[
                  { label: '8.5천', val: 85000000 },
                  { label: '1.3억', val: 130000000 },
                  { label: '2억', val: 200000000 }
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setUserCriteria(prev => ({ ...prev, annualIncome: chip.val }))}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      userCriteria.annualIncome === chip.val
                        ? 'bg-amber-400 text-slate-900 shadow-xs'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: 생애최초 주택구입 (여백 보강 & 세제 혜택 가이드) */}
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between shadow-lg hover:border-white/25 transition-all">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>생애최초 주택구입</span>
                </label>
                <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${userCriteria.isFirstHome ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : 'bg-slate-700/60 text-slate-300'}`}>
                  {userCriteria.isFirstHome ? '취득세 200만 감면' : '일반 무주택'}
                </span>
              </div>

              {/* Toggle Buttons */}
              <div className="flex gap-2 my-2">
                <button
                  type="button"
                  onClick={() => setUserCriteria({ ...userCriteria, isFirstHome: false })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    !userCriteria.isFirstHome 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  일반 무주택
                </button>
                <button
                  type="button"
                  onClick={() => setUserCriteria({ ...userCriteria, isFirstHome: true })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    userCriteria.isFirstHome 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  생애최초 감면
                </button>
              </div>
            </div>

            {/* Informative Insight Box to Fill Space Evenly */}
            <div className="bg-black/25 p-2.5 rounded-xl border border-white/10 space-y-1 mt-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                <Sparkles className="w-3 h-3" />
                <span>{userCriteria.isFirstHome ? '취득세 최대 200만 원 즉시 비과세' : '일반 취득세율 1.1% 정상 적용'}</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                {userCriteria.isFirstHome 
                  ? '지방세특례제한법에 따라 12억 이하 첫 주택 매수 시 취득세 전액 감면' 
                  : '정부 가계대출 관리 기준 안전 LTV 70% 동일 적용'}
              </p>
              <div className="text-[9px] text-amber-300/80 pt-0.5 border-t border-white/5">
                ※ 대출 한도는 안전 LTV 70% 상한 준수
              </div>
            </div>
          </div>

          {/* Card 3: 대출 만기 (원리금균등 분할상환 특징 가이드) */}
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between shadow-lg hover:border-white/25 transition-all">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>대출 만기 (상환기간)</span>
                </label>
                <span className="font-extrabold text-sky-300 text-xs bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
                  {userCriteria.loanTenureYears}년 만기
                </span>
              </div>

              {/* 4-way Tenure Buttons */}
              <div className="grid grid-cols-4 gap-1.5 my-2">
                {[10, 20, 30, 40].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setUserCriteria({ ...userCriteria, loanTenureYears: yr })}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      userCriteria.loanTenureYears === yr 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {yr}년
                  </button>
                ))}
              </div>
            </div>

            {/* Informative Insight Box to Fill Space Evenly */}
            <div className="bg-black/25 p-2.5 rounded-xl border border-white/10 space-y-1 mt-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-300">
                <Calendar className="w-3 h-3" />
                <span>{userCriteria.loanTenureYears}년 상환 플랜 특징</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                {userCriteria.loanTenureYears === 40 
                  ? '만 39세 이하 청년·신혼가구 추천: 매달 나가는 원리금 납부액 최소화' 
                  : userCriteria.loanTenureYears === 30 
                  ? '가장 보편적인 표준 만기: 월 원리금과 30년 총이자 균형 최적' 
                  : '단기 상환 집중: 대출 총 이자를 최소화하고 빠른 자산 형성'}
              </p>
              <div className="text-[9px] text-slate-400 pt-0.5 border-t border-white/5">
                원리금균등분할상환 방식 적용
              </div>
            </div>
          </div>

          {/* Card 4: MCG 모기지신용보증 (방공제 면제 상세 가이드) */}
          <div className="bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md flex flex-col justify-between shadow-lg hover:border-white/25 transition-all">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MCG 모기지신용보증</span>
                </label>
                <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${userCriteria.useMcg ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'}`}>
                  {userCriteria.useMcg ? '방공제 면제' : '방공제 차감'}
                </span>
              </div>

              {/* Main Toggle Button */}
              <button
                type="button"
                onClick={() => setUserCriteria({ ...userCriteria, useMcg: !userCriteria.useMcg })}
                className={`w-full py-2.5 rounded-xl text-xs font-bold my-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  userCriteria.useMcg 
                    ? 'bg-blue-600 text-white shadow-md border border-blue-400/40' 
                    : 'bg-rose-600/30 text-rose-200 border border-rose-400/50 hover:bg-rose-600/40'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{userCriteria.useMcg ? 'MCG 가입 (LTV 70% 전액 대출)' : 'MCG 미가입 (방공제 차감)'}</span>
              </button>
            </div>

            {/* Informative Insight Box to Fill Space Evenly */}
            <div className="bg-black/25 p-2.5 rounded-xl border border-white/10 space-y-1 mt-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-300">
                <ShieldCheck className="w-3 h-3" />
                <span>{userCriteria.useMcg ? '방공제 5,500만 원 차감 면제 성공' : '방공제로 한도 최대 5,500만 원 차감'}</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                {userCriteria.useMcg 
                  ? '보증 가입으로 서울 5,500만 / 경기 4,800만 원 공제 없이 LTV 70% 전액 수령' 
                  : '미가입 시 최우선변제금만큼 대출금이 깎여 내야 할 현금이 늘어납니다'}
              </p>
              <div className="text-[9px] text-emerald-300/90 pt-0.5 border-t border-white/5">
                연간 수만 원대 보증료로 대출한도 극대화 필수
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 필터 및 정렬 컨트롤 (가격별 정렬 & 가격대 밴드 & 도면 안내) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        {/* 상단 검색 & 지역 대분류 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 지역 대분류 탭 */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['전체', '서울', '경기'].map((reg) => (
              <button
                key={reg}
                onClick={() => {
                  setSelectedRegion(reg);
                  setSelectedDistrict('전체');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* 검색창 */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="아파트명, 동(상계동 등), 역세권, 평면구조(3-Bay) 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 🌟 가격별 정렬 바로가기 버튼 바 (요청사항 반영: 가격별 정렬, 모바일 가로 스크롤 최적화) */}
        <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>정렬:</span>
            </span>

            <button
              type="button"
              onClick={() => setSortOption('priceLow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                sortOption === 'priceLow'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>💰 가격 낮은순 (4억대~)</span>
              <span className="text-[10px]">▼</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOption('priceHigh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                sortOption === 'priceHigh'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>💰 가격 높은순 (~6억대)</span>
              <span className="text-[10px]">▲</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOption('jeonseHigh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortOption === 'jeonseHigh'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              전세가율순 (안전갭)
            </button>

            <button
              type="button"
              onClick={() => setSortOption('yearNew')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortOption === 'yearNew'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              신축·준신축순
            </button>

            <button
              type="button"
              onClick={() => setSortOption('unitsHigh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortOption === 'unitsHigh'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              대단지순
            </button>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 shrink-0">
            현재 정렬: <strong className="text-blue-600 font-extrabold">{sortOption === 'priceLow' ? '가격 낮은순' : sortOption === 'priceHigh' ? '가격 높은순' : sortOption === 'jeonseHigh' ? '전세가율순' : '추천순'}</strong>
          </div>
        </div>

        {/* 🌟 가격대별 구간 빠른 필터 (4억대, 5억초반, 5억후반, 6억대) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-semibold shrink-0 mr-1">가격대 구간:</span>
          {[
            { id: 'all', label: '전체 가격대', count: priceBandCounts.all },
            { id: '400M', label: '4억 원대 (실속)', count: priceBandCounts['400M'] },
            { id: '500M_low', label: '5억 초반 (5.0~5.4억)', count: priceBandCounts['500M_low'] },
            { id: '500M_high', label: '5억 후반 (5.5~5.9억)', count: priceBandCounts['500M_high'] },
            { id: '600M', label: '6억 원대 (~6.3억)', count: priceBandCounts['600M'] },
          ].map((band) => (
            <button
              key={band.id}
              onClick={() => setPriceBand(band.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                priceBand === band.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
              }`}
            >
              {band.label} <span className="opacity-70 text-[10px]">({band.count})</span>
            </button>
          ))}
        </div>

        {/* 구 / 시 세부 필터 버튼 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-semibold shrink-0 mr-1">세부지역:</span>
          {districts.map((dist) => (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                selectedDistrict === dist
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>

        {/* 평형 필터 버튼 */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-semibold">평형대:</span>
          {['전체', '20평대', '30평대'].map((size) => (
            <button
              key={size}
              onClick={() => setSizeFilter(size)}
              className={`px-3 py-0.5 rounded-md cursor-pointer transition-colors ${
                sizeFilter === size
                  ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {size === '20평대' ? '20평대 (59㎡ 소형)' : size === '30평대' ? '30평대 (84㎡ 국민평형)' : '전체 평형'}
            </button>
          ))}
          <span className="text-slate-400 ml-auto">
            총 <strong className="text-blue-600">{filteredProperties.length}</strong>개 단지 조회됨
          </span>
        </div>
      </div>

      {/* 3. 매물 카드 리스트 그리드 */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">검색 조건에 맞는 매물이 없습니다</h3>
          <p className="text-xs text-slate-400 mt-1">가격대나 지역 필터를 재설정해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property) => {
            const sim = property.loanSimulation || {};
            const kb = property.kbPrice || {};
            const fp = property.floorPlan || {};

            return (
              <div
                key={property.id}
                onClick={() => handleOpenDetail(property)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group active:scale-[0.99]"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded">
                          {property.region} {property.district}
                        </span>
                        <span className="text-slate-400 text-xs">{property.dong}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {property.buildYear}년 · {property.totalUnits?.toLocaleString()}세대
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {property.name}
                      </h3>
                      <span className="text-sm font-bold text-slate-600">
                        {property.pyeong}평 <span className="text-xs font-normal text-slate-400">({property.areaSqMeter}㎡)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Train className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{property.subwayStation} {property.subwayDistance}</span>
                    </div>
                  </div>

                  {/* 🌟 평형 도면 스펙 바 & 도면 바로보기 버튼 */}
                  <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded">
                        {fp.bay || '3-Bay'}
                      </span>
                      <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
                        {fp.roomsCount ? `${fp.roomsCount}룸 ${fp.bathroomsCount}욕실` : property.rooms}
                      </span>
                      <span className="text-slate-400 text-[11px] hidden sm:inline">
                        · {fp.structure || '판상형'}
                      </span>
                    </div>

                    {/* 도면 원클릭 보기 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenFloorPlan(e, property)}
                      className="bg-slate-800 hover:bg-blue-600 text-blue-300 hover:text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>도면 보기</span>
                    </button>
                  </div>

                  {/* Price & KB Price Block */}
                  <div className="p-4 sm:p-5 py-3 sm:py-3.5 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-medium text-slate-500">매매 기준가</span>
                      <span className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
                        {property.priceDisplay}원
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[11px] text-slate-400 block">KB 일반평균가</span>
                        <span className="font-extrabold text-slate-800">
                          {sim.propertyPrice ? (kb.generalAvg / 100000000).toFixed(2) + '억' : '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">전세평균 (전세가율)</span>
                        <span className="font-bold text-slate-700">
                          {(kb.jeonseAvg / 100000000).toFixed(1)}억 <span className="text-emerald-600 font-extrabold">({kb.jeonseRate}%)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 신생아 특례대출 계산 결과 하이라이트 */}
                  <div className="p-4 sm:p-5 py-3 sm:py-3.5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>신생아 특례 대출 가능액</span>
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        DSR 규제 제외
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-blue-800">
                        {sim.maxLoanFormatted}
                      </span>
                      <span className="text-xs text-slate-500">
                        LTV {sim.ltvRatio}% {sim.useMcg && '(MCG적용)'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-blue-100/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">최소 필요 현금</span>
                        <span className="font-bold text-rose-600 text-sm">
                          {sim.requiredCashFormatted}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">월 상환액 (원리금)</span>
                        <span className="font-bold text-slate-900 text-sm">
                          약 {sim.monthlyPayment?.toLocaleString()}원
                        </span>
                        <span className="text-[10px] text-emerald-600 block">
                          연 {sim.finalInterestRate}% ({sim.loanTenureYears}년)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3.5 sm:p-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                    일반대출 대비 월 {sim.comparison?.monthlySavings?.toLocaleString()}원 절약
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>상세 견적 & 도면</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          userCriteria={userCriteria}
          initialTab={modalInitialTab}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
