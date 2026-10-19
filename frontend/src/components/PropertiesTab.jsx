import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, Search, SlidersHorizontal, Train, ArrowUpDown, 
  ChevronRight, Sparkles, ShieldCheck, DollarSign, ExternalLink,
  Info, Check, RefreshCw, LayoutGrid, Eye, EyeOff, ArrowDownAZ, ArrowUpZA, Maximize2, Calendar, Heart, AlertTriangle, MapPin
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
  const [selectedRegion, setSelectedRegion] = useState('서울');
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  const [priceBand, setPriceBand] = useState('all'); // 'all', '400M', '500M_low', '500M_high', '600M'
  const [sizeFilter, setSizeFilter] = useState('전체');
  const [sortOption, setSortOption] = useState('regionPrice'); // Default: 지역 > 금액순 (서울->경기->인천 & 가나다 & 가격순)
  const [searchTerm, setSearchTerm] = useState('');
  const [myCash, setMyCash] = useState(0); // 0: 미설정, 예: 150000000 (1.5억)
  // 🌟 6억 초과 매물 포함 토글 (기본값: false - 6억 초과 아파트는 숨김 상태이며 토글 클릭 시 표시)
  const [includeOver600M, setIncludeOver600M] = useState(false);
  
  // ❤️ 즐겨찾기 (브라우저 localStorage + 백엔드 서버 파일 이중 영구 저장 & 부부 기기 간 공유)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('wooriga_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 🚫 관심없는 단지 숨기기/제외 (localStorage + 백엔드 서버 동기화)
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const saved = localStorage.getItem('wooriga_hidden');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = async (e, propId) => {
    if (e) e.stopPropagation();
    // 1. UI & localStorage 즉시 반영
    setFavorites((prev) => {
      const next = prev.includes(propId)
        ? prev.filter((id) => id !== propId)
        : [...prev, propId];
      try {
        localStorage.setItem('wooriga_favorites', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
      return next;
    });

  };

  const toggleHideProperty = async (e, propId) => {
    if (e) e.stopPropagation();
    setHiddenIds((prev) => {
      const next = prev.includes(propId)
        ? prev.filter((id) => id !== propId)
        : [...prev, propId];
      try {
        localStorage.setItem('wooriga_hidden', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetHiddenProperties = async () => {
    setHiddenIds([]);
    try {
      localStorage.setItem('wooriga_hidden', JSON.stringify([]));
    } catch {}
  };

  // Modal state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState('all');
  
  // Mobile simulator collapse state (모바일 화면에서 깔끔한 접기/펼치기)
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);

  // Income direct input state
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [rawIncomeInput, setRawIncomeInput] = useState('');

  // 단지별 선택된 활성 평형 ID 관리 { [complexKey]: variantId }
  const [selectedVariants, setSelectedVariants] = useState({});

  const handleSelectVariant = (complexKey, variantId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [complexKey]: variantId,
    }));
  };

  // 단지(Complex) 단위 그룹화: 같은 아파트의 다른 평형들을 1개 카드로 통합
  const groupedComplexes = useMemo(() => {
    const complexMap = new Map();

    properties.forEach((prop) => {
      const cleanName = prop.name.replace(/\s*\(\d+평형?\)/g, '');
      const key = prop.naverComplexNo
        ? `cx_${prop.naverComplexNo}`
        : `${prop.region}_${prop.district}_${cleanName}`;

      if (!complexMap.has(key)) {
        complexMap.set(key, {
          complexKey: key,
          name: cleanName,
          region: prop.region,
          district: prop.district,
          dong: prop.dong,
          address: prop.address,
          buildYear: prop.buildYear,
          totalUnits: prop.totalUnits,
          totalFloors: prop.totalFloors,
          subwayStation: prop.subwayStation,
          subwayDistance: prop.subwayDistance,
          naverComplexNo: prop.naverComplexNo,
          naverLandUrl: prop.naverLandUrl,
          naverMobileUrl: prop.naverMobileUrl,
          kbLandUrl: prop.kbLandUrl,
          variants: [],
        });
      }

      const complex = complexMap.get(key);
      complex.variants.push(prop);
    });

    complexMap.forEach((complex) => {
      complex.variants.sort((a, b) => a.pyeong - b.pyeong);
      // 각 variant에 siblings 주입 (모달에서 평형 전환에 활용)
      complex.variants.forEach((v) => {
        v.variants = complex.variants;
      });
    });

    return Array.from(complexMap.values());
  }, [properties]);

  // 숨기지 않은 활성 단지 목록 (6억 초과 숨김 모드 연동)
  const visibleComplexes = useMemo(() => {
    return groupedComplexes.filter((complex) => {
      const allHidden = complex.variants.every((v) => hiddenIds.includes(v.id));
      if (allHidden) return false;
      // 6억 초과 숨김 모드(includeOver600M === false)일 때: 단지 내 6억 이하(<= 6억) 유효 평형이 1개라도 있어야 노출
      if (!includeOver600M) {
        const hasUnder600M = complex.variants.some(
          (v) => v.priceKrw <= 600000000 && !hiddenIds.includes(v.id)
        );
        if (!hasUnder600M) return false;
      }
      return true;
    });
  }, [groupedComplexes, hiddenIds, includeOver600M]);

  // 전체 단지 중 6억 초과 평형을 보유한 단지 수 집계
  const over600MComplexCount = useMemo(() => {
    return groupedComplexes.filter((c) =>
      c.variants.some((v) => v.priceKrw > 600000000 && !hiddenIds.includes(v.id))
    ).length;
  }, [groupedComplexes, hiddenIds]);

  // 시/도 목록 및 단지 수 계산 (서울 -> 경기 -> 인천 -> 수도권 전체)
  const regionsWithCounts = useMemo(() => {
    const counts = { '전체': visibleComplexes.length, '서울': 0, '경기': 0, '인천': 0 };
    visibleComplexes.forEach((c) => {
      if (counts[c.region] !== undefined) counts[c.region]++;
    });
    return [
      { id: '서울', label: '📍 서울', fullName: '서울특별시', count: counts['서울'] },
      { id: '경기', label: '📍 경기', fullName: '경기도', count: counts['경기'] },
      { id: '인천', label: '📍 인천', fullName: '인천광역시', count: counts['인천'] },
      { id: '전체', label: '🌐 전체보기', fullName: '수도권 전체', count: counts['전체'] },
    ];
  }, [visibleComplexes]);

  // 시/군/구 목록 및 단지 수 동적 집계 (선택된 시/도에 따라 정렬 및 필터링)
  const districtsWithCounts = useMemo(() => {
    const inRegion = visibleComplexes.filter(
      (c) => selectedRegion === '전체' || c.region === selectedRegion
    );

    const countMap = {};
    const regionMap = {};
    inRegion.forEach((c) => {
      countMap[c.district] = (countMap[c.district] || 0) + 1;
      regionMap[c.district] = c.region;
    });

    const sortedDistricts = Object.keys(countMap).sort((a, b) => {
      if (countMap[b] !== countMap[a]) return countMap[b] - countMap[a];
      return a.localeCompare(b);
    });

    return [
      { id: '전체', label: '전체', count: inRegion.length },
      ...sortedDistricts.map((d) => ({
        id: d,
        label: d,
        region: regionMap[d],
        count: countMap[d],
      })),
    ];
  }, [visibleComplexes, selectedRegion]);

  // 가격대별 카운트 계산
  const priceBandCounts = useMemo(() => {
    const counts = { all: visibleComplexes.length, '400M': 0, '500M_low': 0, '500M_high': 0, '600M': 0 };
    visibleComplexes.forEach((c) => {
      if (c.variants.some((v) => v.priceKrw < 500000000)) counts['400M']++;
      if (c.variants.some((v) => v.priceKrw >= 500000000 && v.priceKrw < 550000000)) counts['500M_low']++;
      if (c.variants.some((v) => v.priceKrw >= 550000000 && v.priceKrw < 600000000)) counts['500M_high']++;
      if (c.variants.some((v) => v.priceKrw >= 600000000)) counts['600M']++;
    });
    return counts;
  }, [visibleComplexes]);

  // 필터링 및 정렬
  const filteredComplexes = useMemo(() => {
    return visibleComplexes
      .map((complex) => {
        // 단지 내에서 조건에 부합하는 variants 필터링
        const matchingVariants = complex.variants.filter((item) => {
          // 🌟 6억 초과 숨김 모드: 토글이 꺼져있는 경우 6억 초과(> 6억) 매물 숨김
          if (!includeOver600M && item.priceKrw > 600000000) return false;

          // 가격대 밴드 필터
          if (priceBand === '400M' && item.priceKrw >= 500000000) return false;
          if (priceBand === '500M_low' && (item.priceKrw < 500000000 || item.priceKrw >= 550000000)) return false;
          if (priceBand === '500M_high' && (item.priceKrw < 550000000 || item.priceKrw >= 600000000)) return false;
          if (priceBand === '600M' && item.priceKrw < 600000000) return false;

          // 평형 필터
          if (sizeFilter === '20평대' && (item.pyeong < 20 || item.pyeong >= 30)) return false;
          if (sizeFilter === '30평대' && item.pyeong < 30) return false;

          return true;
        });

        // 매칭되는 variant가 없으면 해당 단지는 목록에서 제외
        if (matchingVariants.length === 0) return null;

        // 즐겨찾기 필터
        if (showFavoritesOnly) {
          const hasFav = matchingVariants.some((v) => favorites.includes(v.id));
          if (!hasFav) return null;
        }

        // 지역 필터
        if (selectedRegion !== '전체' && complex.region !== selectedRegion) return null;
        // 구/시 필터
        if (selectedDistrict !== '전체' && complex.district !== selectedDistrict) return null;

        // 검색어 필터
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = complex.name.toLowerCase().includes(term);
          const matchDong = complex.dong.toLowerCase().includes(term);
          const matchSubway = complex.subwayStation.toLowerCase().includes(term);
          const matchAddress = complex.address?.toLowerCase().includes(term);
          const matchVariants = complex.variants.some((v) =>
            v.floorPlan?.bay?.toLowerCase().includes(term) ||
            v.highlights?.some((h) => h.toLowerCase().includes(term))
          );
          if (!matchName && !matchDong && !matchSubway && !matchAddress && !matchVariants) return null;
        }

        // 현재 활성 variant 결정
        const userSelectedId = selectedVariants[complex.complexKey];
        const activeVariant =
          matchingVariants.find((v) => v.id === userSelectedId) || matchingVariants[0];

        return {
          ...complex,
          availableVariants: matchingVariants,
          activeVariant,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const vA = a.activeVariant;
        const vB = b.activeVariant;
        if (sortOption === 'regionPrice') {
          // 1순위: 지역 (서울 -> 경기 -> 인천)
          const regionOrder = { '서울': 1, '경기': 2, '인천': 3 };
          const regA = regionOrder[a.region] || 99;
          const regB = regionOrder[b.region] || 99;
          if (regA !== regB) return regA - regB;
          // 2순위: 시/군/구 (가나다순)
          const distCompare = (a.district || '').localeCompare(b.district || '', 'ko');
          if (distCompare !== 0) return distCompare;
          // 3순위: 금액 (가격 낮은순)
          return vA.priceKrw - vB.priceKrw;
        }
        if (sortOption === 'priceLow') return vA.priceKrw - vB.priceKrw; // 가격 낮은순
        if (sortOption === 'priceHigh') return vB.priceKrw - vA.priceKrw; // 가격 높은순
        if (sortOption === 'jeonseHigh') return (vB.kbPrice?.jeonseRate || 0) - (vA.kbPrice?.jeonseRate || 0);
        if (sortOption === 'yearNew') return b.buildYear - a.buildYear;
        if (sortOption === 'unitsHigh') return (b.totalUnits || 0) - (a.totalUnits || 0);
        return vA.priceKrw - vB.priceKrw; // default: 가격 낮은순
      });
  }, [visibleComplexes, selectedVariants, showFavoritesOnly, favorites, selectedRegion, selectedDistrict, priceBand, sizeFilter, sortOption, searchTerm, includeOver600M]);

  // 단지 전체 숨기기/제외 핸들러
  const toggleHideComplex = async (e, complex) => {
    if (e) e.stopPropagation();
    const idsToToggle = complex.variants.map((v) => v.id);
    const isAlreadyHidden = idsToToggle.every((id) => hiddenIds.includes(id));

    setHiddenIds((prev) => {
      const next = isAlreadyHidden
        ? prev.filter((id) => !idsToToggle.includes(id))
        : Array.from(new Set([...prev, ...idsToToggle]));
      try {
        localStorage.setItem('wooriga_hidden', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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

  // ── 단지별 고유 URL(/apt/:id/) 연동 ───────────────────────────
  // 검색엔진에서 /apt/<id>/ 로 들어오면 해당 단지 상세창을 바로 열고,
  // 상세창을 열고 닫을 때 주소와 문서 제목을 함께 바꿔 공유·뒤로가기를 지원한다.
  const deepLinkHandled = useRef(false);
  const findPropertyByPath = (pathname) => {
    const m = pathname.match(/^\/apt\/([^/]+)\/?$/);
    if (!m) return null;
    const id = decodeURIComponent(m[1]);
    return properties.find((p) => p.id === id) || null;
  };

  useEffect(() => {
    if (deepLinkHandled.current || properties.length === 0) return;
    deepLinkHandled.current = true;
    const prop = findPropertyByPath(window.location.pathname);
    if (prop) {
      setModalInitialTab('all');
      setSelectedProperty(prop);
    } else if (window.location.pathname.startsWith('/apt/')) {
      window.history.replaceState({}, '', '/');
    }
  }, [properties]);

  useEffect(() => {
    if (!deepLinkHandled.current) return;
    const onAptPath = window.location.pathname.startsWith('/apt/');
    if (selectedProperty) {
      const target = `/apt/${encodeURIComponent(selectedProperty.id)}/`;
      if (window.location.pathname !== target) window.history.pushState({}, '', target);
      document.title = `${selectedProperty.name} 실거래가·시세 | 우리家`;
    } else {
      if (onAptPath) window.history.pushState({}, '', '/');
      document.title = '우리家 - 우리 가족 보금자리 플래너';
    }
  }, [selectedProperty]);

  useEffect(() => {
    const onPopState = () => setSelectedProperty(findPropertyByPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [properties]);

  // 선택된 대출 상품 메타데이터
  const currentLoanType = userCriteria.loanType || 'newborn';
  const loanProductInfo = useMemo(() => {
    switch (currentLoanType) {
      case 'bogeumjari':
        return {
          id: 'bogeumjari',
          name: 'HF 보금자리론 (한국주택금융공사)',
          shortName: 'HF 보금자리론',
          badge: '6억 이하 · 최대 3.6억(생초 4.2억)',
          rate: '고정 연 3.65% ~ 3.95%',
          desc: '100% 장기 고정금리로 향후 금리 인상 위험이 전혀 없는 한국주택금융공사 대표 안심 대출',
          incomeTag: userCriteria.annualIncome <= 70000000 ? '기본 소득 적격 (~7천만)' :
                     userCriteria.annualIncome <= 85000000 ? '신혼/1자녀 적격 (~8.5천만)' :
                     userCriteria.annualIncome <= 100000000 ? '다자녀 적격 (~1억)' : '소득 초과 유의',
          tenures: [10, 20, 30, 40],
          firstHomeLimit: 'LTV 80% 확대 및 최대 4.2억 원 지원',
        };
      case 'didimdol':
        return {
          id: 'didimdol',
          name: '내집마련 디딤돌 대출 (생애최초 특례)',
          shortName: '생애최초 디딤돌',
          badge: '5~6억 이하 · 최대 3.0억(신혼 4.0억)',
          rate: '연 2.65% ~ 3.65%',
          desc: '생애 첫 주택 구매 무주택 서민을 위한 주택도시기금 초저리 기금 대출 (생애최초 0.2%p 우대)',
          incomeTag: userCriteria.annualIncome <= 20000000 ? '연 2.45% (생초 우대)' :
                     userCriteria.annualIncome <= 40000000 ? '연 2.80% (생초 우대)' :
                     userCriteria.annualIncome <= 70000000 ? '연 3.15% (생초 우대)' :
                     userCriteria.annualIncome <= 85000000 ? '연 3.45% (신혼 생초)' : '소득 초과 유의',
          tenures: [10, 15, 20, 30],
          firstHomeLimit: 'LTV 80% 확대 및 최대 3.0억(신혼 4.0억) 지원',
        };
      default:
        return {
          id: 'newborn',
          name: '신생아 특례 디딤돌 대출',
          shortName: '신생아 특례대출',
          badge: '9억 이하 · 최대 5.0억',
          rate: '연 1.60% ~ 3.30%',
          desc: '2년 내 출산(입양) 무주택 가구 전용 파격적인 최저 1%대 초저금리 정책 대출',
          incomeTag: userCriteria.annualIncome <= 20000000 ? '연 1.6% 최저' :
                     userCriteria.annualIncome <= 40000000 ? '연 2.1%대 구간' :
                     userCriteria.annualIncome <= 60000000 ? '연 2.5%대 구간' :
                     userCriteria.annualIncome <= 85000000 ? '연 2.7%대 (기본)' :
                     userCriteria.annualIncome <= 130000000 ? '연 3.1%대 (신혼)' : '연 3.3%대 (2억)',
          tenures: [10, 20, 30, 40],
          firstHomeLimit: '취득세 200만 감면 (대출은 안전 LTV 70% 준수)',
        };
    }
  }, [currentLoanType, userCriteria.annualIncome]);

  return (
    <div className="space-y-6">
      {/* 1. 정책 대출 실시간 조건 설정 패널 (Interactive Simulator Controller) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        {/* 상단 타이틀 & 3대 대출 상품 선택 탭 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 sm:mb-5 border-b border-white/10 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-blue-500/30 text-blue-300 border border-blue-400/40 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                실시간 연동 시뮬레이터
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3" />
                <span>DSR 규제 미적용</span>
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
              나만의 {loanProductInfo.name} 조건 설정
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 break-keep leading-tight">
              {loanProductInfo.desc}
            </p>
          </div>

          {/* 데스크톱 전용 가이드 버튼 */}
          {onOpenGuide && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={onOpenGuide}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 rounded-lg font-black transition-colors flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>🐣 왕초보 3분 Q&A 가이드</span>
              </button>
            </div>
          )}
        </div>

        {/* 🌟 3대 정책대출 원클릭 선택 버튼 바 (신생아대출 / HF 보금자리론 / 생애최초 디딤돌) */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-400">⚡ 정책 대출 상품 선택:</span>
            <span className="text-[11px] text-slate-300">클릭 즉시 모든 매물의 대출한도와 월 상환액이 자동 계산됩니다.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'newborn',
                icon: '🐣',
                name: '신생아 특례대출',
                tag: '9억 이하 · 한도 5.0억',
                rate: '연 1.60% ~ 3.30%',
                highlight: 'DSR 미적용 · 최저 1%대'
              },
              {
                id: 'bogeumjari',
                icon: '🏠',
                name: 'HF 보금자리론',
                tag: '6억 이하 · 한도 3.6~4.2억',
                rate: '고정 연 3.65% ~ 3.95%',
                highlight: '100% 고정금리 · 면적제한 없음'
              },
              {
                id: 'didimdol',
                icon: '🌱',
                name: '생애최초 디딤돌',
                tag: '5~6억 이하 · 한도 3~4억',
                rate: '연 2.65% ~ 3.65%',
                highlight: '기금 저리 · 생초 -0.2%p 우대'
              }
            ].map((prod) => {
              const isSelected = currentLoanType === prod.id;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => setUserCriteria(prev => ({ ...prev, loanType: prod.id }))}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white text-slate-900 border-amber-400 shadow-lg ring-2 ring-amber-400/60 scale-[1.01]'
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-black text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap">
                      <span>{prod.icon}</span>
                      <span>{prod.name}</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'bg-white/20 text-slate-200'
                    }`}>
                      {prod.highlight}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-black/10 mt-1">
                    <span className={`font-semibold ${isSelected ? 'text-slate-600' : 'text-slate-300'}`}>
                      {prod.tag}
                    </span>
                    <span className={`font-black ${isSelected ? 'text-blue-700' : 'text-amber-300'}`}>
                      {prod.rate}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📱 Mobile Quick Condition Summary & Toggle Pill (모바일 화면 전용 빠른 조건 확인 및 접기/펼치기) */}
        <div className="sm:hidden mb-2">
          <div className="bg-slate-950/70 rounded-xl p-3 border border-white/15 flex items-center justify-between gap-2 shadow-inner">
            <div className="text-[11px] leading-tight">
              <div className="text-amber-300 font-black flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{(Math.round(userCriteria.annualIncome / 10000)).toLocaleString()}만 원</span>
                <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/20 px-1.5 py-0.2 rounded ml-1 whitespace-nowrap">
                  {loanProductInfo.shortName}
                </span>
              </div>
              <div className="text-slate-300 text-[10px] mt-1 whitespace-nowrap">
                {userCriteria.isFirstHome ? '생애최초' : '일반 무주택'} · {userCriteria.loanTenureYears}년 {userCriteria.useMcg && '· MCG'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSimulatorOpen(!isMobileSimulatorOpen)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
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
                  {loanProductInfo.incomeTag}
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
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{userCriteria.isFirstHome ? '취득세 최대 200만 감면 + 생초 특례' : '일반 취득세율 1.1% 정상 적용'}</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight break-keep">
                {userCriteria.isFirstHome 
                  ? loanProductInfo.firstHomeLimit
                  : '정부 가계대출 관리 기준 기본 LTV 70% 동일 적용'}
              </p>
              <div className="text-[9px] text-amber-300/80 pt-0.5 border-t border-white/5 whitespace-nowrap">
                {currentLoanType === 'bogeumjari' ? '보금자리론 생초 최대 4.2억 (LTV 80%)' : currentLoanType === 'didimdol' ? '디딤돌 생초 0.2%p 우대금리 (LTV 80%)' : '신생아 특례 최대 5.0억 한도 지원'}
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
                <span className="font-extrabold text-sky-300 text-xs bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30 whitespace-nowrap">
                  {userCriteria.loanTenureYears}년 만기
                </span>
              </div>

              {/* 4-way Tenure Buttons */}
              <div className="grid grid-cols-4 gap-1.5 my-2">
                {loanProductInfo.tenures.map((yr) => (
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
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{userCriteria.loanTenureYears}년 상환 플랜 특징</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight break-keep">
                {userCriteria.loanTenureYears === 40 
                  ? '청년·신혼가구 추천: 매달 원리금 상환액 최소화' 
                  : userCriteria.loanTenureYears === 30 
                  ? '가장 보편적인 표준 만기: 월 원리금과 총이자 균형' 
                  : '단기 상환 집중: 총이자 절약 및 빠른 자산 형성'}
              </p>
              <div className="text-[9px] text-slate-400 pt-0.5 border-t border-white/5 whitespace-nowrap">
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
                <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap ${userCriteria.useMcg ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'}`}>
                  {userCriteria.useMcg ? '방공제 면제' : '방공제 차감'}
                </span>
              </div>

              {/* Main Toggle Button */}
              <button
                type="button"
                onClick={() => setUserCriteria({ ...userCriteria, useMcg: !userCriteria.useMcg })}
                className={`w-full py-2.5 rounded-xl text-xs font-bold my-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{userCriteria.useMcg ? '방공제 5,500만 원 차감 면제 성공' : '방공제로 한도 최대 5,500만 원 차감'}</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight break-keep">
                {userCriteria.useMcg 
                  ? '보증 가입으로 방공제 없이 LTV 70% 전액 대출' 
                  : '미가입 시 최우선변제금(최대 5,500만) 한도 차감'}
              </p>
              <div className="text-[9px] text-emerald-300/90 pt-0.5 border-t border-white/5 whitespace-nowrap">
                연간 수만 원대 보증료로 대출한도 극대화 필수
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 필터 및 정렬 컨트롤 (가격별 정렬 & 가격대 밴드 & 도면 안내) */}
      <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
        {/* 상단: 검색창 & 즐겨찾기 & 숨긴 단지 복구 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* ❤️ 즐겨찾기 모아보기 토글 버튼 */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap border ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : 'bg-rose-50/70 text-rose-600 border-rose-200 hover:bg-rose-100/80'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly || favorites.length > 0 ? 'fill-current' : ''}`} />
              <span>즐겨찾기</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                showFavoritesOnly ? 'bg-white/25 text-white' : 'bg-rose-200/70 text-rose-700'
              }`}>
                {favorites.length}
              </span>
            </button>

            {/* 🚫 숨긴 단지 복구 버튼 (숨긴 단지가 있을 때만 표시) */}
            {hiddenIds.length > 0 && (
              <button
                type="button"
                onClick={resetHiddenProperties}
                title="숨긴 단지를 모두 다시 표시합니다"
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              >
                <RefreshCw className="w-3 h-3" />
                <span>숨긴 단지 복구 ({hiddenIds.length})</span>
              </button>
            )}
          </div>

          {/* 검색창 */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="아파트명, 동(방학동, 창동 등), 역세권, 3-Bay 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 🌟 📍 시/도 | 시/군/구 통합 계층형 지역 선택 컨트롤 */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-xl p-2.5 sm:p-3 border border-slate-200/90 space-y-2">
          {/* 상단: 현재 선택된 위치 Breadcrumb 안내 & 모바일 드롭다운 셀렉터 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>지역 탐색:</span>
              <div className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs font-semibold">
                <span className={selectedRegion !== '전체' ? 'text-blue-700 font-bold' : ''}>
                  {selectedRegion === '전체' ? '수도권 전체' : selectedRegion}
                </span>
                <span className="text-slate-300">/</span>
                <span className={selectedDistrict !== '전체' ? 'text-indigo-700 font-bold' : 'text-slate-500'}>
                  {selectedDistrict === '전체' ? '모든 구·시' : selectedDistrict}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* 모바일 콤팩트 드롭다운 (좁은 화면에서도 원터치 선택) */}
              <div className="flex sm:hidden items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedDistrict('전체');
                  }}
                  className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                  title="시/도 선택"
                >
                  {regionsWithCounts.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} ({r.count})</option>
                  ))}
                </select>
                <span className="text-slate-300 font-light">|</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[110px]"
                  title="시/군/구 선택"
                >
                  {districtsWithCounts.map((d) => (
                    <option key={d.id} value={d.id}>{d.label} ({d.count})</option>
                  ))}
                </select>
              </div>

              {(selectedRegion !== '전체' || selectedDistrict !== '전체') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegion('전체');
                    setSelectedDistrict('전체');
                  }}
                  className="text-[11px] text-slate-500 hover:text-blue-600 font-bold cursor-pointer flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-200/50"
                  title="전체 지역으로 초기화"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>전체 보기</span>
                </button>
              )}
            </div>
          </div>

          {/* 🌟 시/도 | 시/군/구 2단 분할 버튼 패널 */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
            {/* [1단계] 시/도 (광역자치단체) 선택 탭 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-black text-blue-700 px-2 py-1 bg-blue-50 border border-blue-100 rounded-md whitespace-nowrap shrink-0">
                시/도
              </span>
              <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg shrink-0">
                {regionsWithCounts.map((reg) => {
                  const isSelected = selectedRegion === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(reg.id);
                        setSelectedDistrict('전체');
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs scale-102'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      }`}
                    >
                      <span>{reg.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-blue-100 font-extrabold' : 'text-slate-400'}`}>
                        {reg.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 시각적 명확한 분할 구분선 | (Desktop) / 가로 구분선 (Mobile) */}
            <div className="hidden lg:flex items-center justify-center text-slate-300 font-semibold select-none px-1 text-base">
              |
            </div>
            <div className="block lg:hidden h-px bg-slate-100 w-full" />

            {/* [2단계] 시/군/구 (기초자치단체) 선택 칩 리스트 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              <span className="text-[11px] font-black text-indigo-700 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md whitespace-nowrap shrink-0">
                시/군/구
              </span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-nowrap py-0.5">
                {districtsWithCounts.map((dist) => {
                  const isSelected = selectedDistrict === dist.id;
                  return (
                    <button
                      key={dist.id}
                      type="button"
                      onClick={() => {
                        setSelectedDistrict(dist.id);
                        if (selectedRegion === '전체' && dist.region) {
                          setSelectedRegion(dist.region);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-black shadow-2xs scale-102'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-semibold'
                      }`}
                      title={`${dist.label} (${dist.count}개 단지)`}
                    >
                      <span>{dist.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-indigo-200 font-extrabold' : 'text-slate-400 font-medium'}`}>
                        {dist.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 가격별 정렬 바로가기 버튼 바 (요청사항 반영: 가격별 정렬, 모바일 가로 스크롤 최적화) */}
        <div className="bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-0.5 sm:pb-0">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>정렬:</span>
            </span>

            <button
              type="button"
              onClick={() => setSortOption('regionPrice')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                sortOption === 'regionPrice'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📍 지역 &gt; 금액순 (추천)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortOption('priceLow')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortOption === 'unitsHigh'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              대단지순
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-500 shrink-0">
            현재 정렬: <strong className="text-blue-600 font-extrabold">{sortOption === 'regionPrice' ? '지역 > 금액순' : sortOption === 'priceLow' ? '가격 낮은순' : sortOption === 'priceHigh' ? '가격 높은순' : sortOption === 'jeonseHigh' ? '전세가율순' : sortOption === 'yearNew' ? '신축순' : '대단지순'}</strong>
          </div>
        </div>

        {/* 🌟 가격대별 구간 빠른 필터 (4억대, 5억초반, 5억후반, 6억대) + 6억 초과 아파트 토글 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-1 min-w-0">
            <span className="text-slate-400 font-semibold shrink-0 mr-1">가격대:</span>
            {[
              { id: 'all', label: includeOver600M ? '전체 가격대' : '6억 이하 전체', count: priceBandCounts.all },
              { id: '400M', label: '4억 원대 (실속)', count: priceBandCounts['400M'] },
              { id: '500M_low', label: '5억 초반 (5.0~5.4억)', count: priceBandCounts['500M_low'] },
              { id: '500M_high', label: '5억 후반 (5.5~5.9억)', count: priceBandCounts['500M_high'] },
              ...(includeOver600M ? [{ id: '600M', label: '6억 원대 이상 (6.0억~)', count: priceBandCounts['600M'] }] : [])
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

          {/* 🌟 6억 초과 아파트 숨김 / 표시 토글 스위치 버튼 */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const next = !includeOver600M;
                setIncludeOver600M(next);
                if (!next && priceBand === '600M') {
                  setPriceBand('all');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-2xs active:scale-95 ${
                includeOver600M
                  ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400'
              }`}
              title="6억 초과 아파트 표시 여부를 토글합니다."
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                  includeOver600M ? 'bg-amber-500 text-white font-black' : 'border border-slate-300 bg-white'
                }`}>
                  {includeOver600M && '✓'}
                </span>
                <span>{includeOver600M ? '6억 초과 매물 표시 중' : '6억 초과 매물 보기'}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                includeOver600M ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'
              }`}>
                +{over600MComplexCount}개 단지
              </span>
            </button>
          </div>
        </div>

        {/* 평형 필터 버튼 */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100 flex-wrap sm:flex-nowrap">
          <span className="text-slate-400 font-semibold shrink-0">평형대:</span>
          {['전체', '20평대', '30평대'].map((size) => (
            <button
              key={size}
              onClick={() => setSizeFilter(size)}
              className={`px-2.5 py-0.5 rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                sizeFilter === size
                  ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {size === '20평대' ? '20평대 (59㎡)' : size === '30평대' ? '30평대 (84㎡)' : '전체'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-[11px]">
            {!includeOver600M && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 font-bold hidden sm:inline-block">
                6억 이하 매물만 표시 중
              </span>
            )}
            <span className="text-slate-500">
              총 <strong className="text-blue-600 font-extrabold">{filteredComplexes.length}</strong>개 단지
            </span>
          </div>
        </div>
      </div>

      {/* 3. 매물 카드 리스트 그리드 */}
      {filteredComplexes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-slate-200 space-y-3">
          {showFavoritesOnly ? (
            <>
              <Heart className="w-12 h-12 text-rose-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">아직 즐겨찾기(찜)한 단지가 없습니다</h3>
              <p className="text-xs text-slate-400">마음에 드는 아파트 카드 우측 상단의 ♥ 하트 버튼을 눌러 관심 단지를 모아보세요!</p>
              <button
                type="button"
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                전체 단지 목록 보기
              </button>
            </>
          ) : (
            <>
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 break-keep">
                {searchTerm.trim()
                  ? `'${searchTerm.trim()}' 단지가 현재 선택된 조건(또는 추천 DB)에 없습니다`
                  : '검색 조건에 맞는 매물이 없습니다'}
              </h3>
              <p className="text-xs text-slate-500 break-keep max-w-md mx-auto">
                {searchTerm.trim()
                  ? '다른 지역 필터가 선택되어 있다면 전체 지역으로 초기화하거나, 아래 버튼으로 전국 모든 단지의 실시간 매물·KB시세를 바로 조회하실 수 있습니다.'
                  : '가격대나 지역 필터를 재설정해 보세요.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {(selectedRegion !== '전체' || selectedDistrict !== '전체' || priceBand !== 'ALL' || sizeFilter !== '전체') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegion('전체');
                      setSelectedDistrict('전체');
                      setPriceBand('ALL');
                      setSizeFilter('전체');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>전체 지역·가격에서 다시 찾기</span>
                  </button>
                )}
                {searchTerm.trim() && (
                  <>
                    <a
                      href={`https://m.land.naver.com/search/result/${encodeURIComponent(searchTerm.trim())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
                    >
                      <span>N 네이버부동산 '{searchTerm.trim()}' 바로가기</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://kbland.kr/search?keyword=${encodeURIComponent(searchTerm.trim())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
                    >
                      <span>KB부동산 '{searchTerm.trim()}' 시세 조회</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplexes.map((complex, index) => {
            const property = complex.activeVariant;
            const sim = property.loanSimulation || {};
            const kb = property.kbPrice || {};
            const fp = property.floorPlan || {};
            const isFav = favorites.includes(property.id);
            const currentYear = new Date().getFullYear();
            const buildingAge = Math.max(1, currentYear - complex.buildYear);

            // 📍 지역별 섹션 헤더 (정렬이 regionPrice이고 이전 단지와 구/시가 변경될 때 구분 배너 출력)
            const prev = index > 0 ? filteredComplexes[index - 1] : null;
            const isNewDistrict = !prev || prev.region !== complex.region || prev.district !== complex.district;
            const showSectionDivider = sortOption === 'regionPrice' && isNewDistrict && (selectedRegion === '전체' || selectedDistrict === '전체');
            const regionFullLabel = complex.region === '서울' ? '서울특별시' : complex.region === '경기' ? '경기도' : '인천광역시';
            const districtCount = showSectionDivider
              ? filteredComplexes.filter((c) => c.region === complex.region && c.district === complex.district).length
              : 0;

            return (
              <React.Fragment key={complex.complexKey}>
                {showSectionDivider && (
                  <div className="col-span-full pt-4 pb-1">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-transparent border-l-4 border-blue-600 px-3.5 py-2.5 rounded-r-xl shadow-2xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <h3 className="font-black text-slate-800 text-sm sm:text-base tracking-tight">
                          {regionFullLabel} {complex.district}
                        </h3>
                      </div>
                      <span className="text-[11px] text-blue-700 bg-blue-100 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                        {districtCount}개 단지
                      </span>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => handleOpenDetail(property)}
                  className={`bg-white rounded-2xl border hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group active:scale-[0.99] ${
                    isFav ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                  }`}
                >
                <div>
                  {/* 1. Card Header: 4줄 고정 높이 그리드 정렬 (주소 / 년도(년차)-세대수 / 아파트명 평수(공급/전용) / 기타정보) */}
                  <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100">
                    {/* [1행] 주소 */}
                    <div className="flex items-center justify-between gap-1.5 h-7">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded truncate"
                          title={`${complex.region} ${complex.district} ${complex.dong}`}
                        >
                          {complex.region} {complex.district} {complex.dong}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* 공식 실물 도면 안내 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenFloorPlan(e, property)}
                          className="bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold transition-colors flex items-center gap-1 shrink-0 border border-emerald-300/80 cursor-pointer shadow-2xs"
                          title="네이버부동산 공식 실물 평면도 안내 열기"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-700 group-hover:text-white" />
                          <span>공식 도면 안내</span>
                        </button>

                        {/* ❤️ 즐겨찾기(찜) 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(e, property.id)}
                          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                          title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                          className={`p-1 rounded-md border transition-all cursor-pointer active:scale-90 ${
                            isFav
                              ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {/* 🚫 관심없는 단지 숨기기(제외) 버튼 */}
                        <button
                          type="button"
                          onClick={(e) => toggleHideComplex(e, complex)}
                          aria-label="이 단지 숨기기"
                          title="필요 없는 단지 목록에서 제외(숨김)"
                          className="p-1 rounded-md border bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-90"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* [2행] 년도(년차) - 세대수 */}
                    <div className="flex items-center text-[11px] sm:text-xs text-slate-500 font-medium h-5 mt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-semibold">{complex.buildYear}년({buildingAge}년차)</span>
                        <span className="text-slate-300">-</span>
                        <span className="text-slate-600 font-medium">{complex.totalUnits?.toLocaleString()}세대</span>
                        {complex.totalFloors && (
                          <span className="text-slate-400 text-[10px] sm:text-[11px]">· 최고 {complex.totalFloors}층</span>
                        )}
                      </div>
                    </div>

                    {/* [3행] 아파트명 평수(공급/전용) - 평형이 여러 개면 탭 버튼 제공 */}
                    <div className="flex items-baseline justify-between gap-1.5 h-7 mt-1.5">
                      <h3
                        className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight truncate min-w-0"
                        title={complex.name}
                      >
                        {complex.name}
                      </h3>

                      {complex.variants && complex.variants.length > 1 ? (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {complex.variants.map((v) => {
                              const isSelected = property.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVariant(complex.complexKey, v.id)}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                                      : 'text-slate-600 hover:text-slate-900 bg-white/60'
                                  }`}
                                  title={`클릭하여 ${v.pyeong}평형 (${v.priceDisplay}원)으로 전환`}
                                >
                                  {v.pyeong}평
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 ml-0.5 whitespace-nowrap">
                            (전용 {property.areaSqMeter}㎡)
                          </span>
                        </div>
                      ) : (
                        <div
                          className="text-right shrink-0 whitespace-nowrap"
                          title={`공급 ${property.pyeong}평형 (공급면적 약 ${Math.round(property.pyeong * 3.3058)}㎡ / 전용면적 ${property.areaSqMeter}㎡)`}
                        >
                          <span className="text-xs sm:text-sm font-black text-blue-700">
                            {property.pyeong}평형
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 ml-1">
                            <span className="hidden xl:inline">(공급 {Math.round(property.pyeong * 3.3058)}㎡ / 전용 {property.areaSqMeter}㎡)</span>
                            <span className="xl:hidden">(전용 {property.areaSqMeter}㎡)</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* [4행] 기타정보 (역세권 교통 + 평면 구조) */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 h-5 mt-1">
                      <div className="flex items-center gap-1 truncate min-w-0">
                        <Train className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate" title={`${property.subwayStation} ${property.subwayDistance}`}>
                          {property.subwayStation} {property.subwayDistance}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[10px] sm:text-[11px] shrink-0 ml-1 whitespace-nowrap">
                        {fp.roomsCount ? `${fp.roomsCount}룸 ${fp.bathroomsCount}욕` : property.rooms} · {fp.structure || '판상형'}
                      </span>
                    </div>
                  </div>

                  {/* 🏛️ 공식 실물 평면도 & 단지 평형 안내 배너 */}
                  <div className="px-3.5 sm:px-4 pt-2.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenFloorPlan(e, property)}
                      className="w-full py-2 px-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 hover:from-emerald-100 hover:to-teal-100 active:scale-[0.98] text-emerald-950 border border-emerald-200/90 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/fp cursor-pointer shadow-2xs"
                      title="클릭하여 네이버부동산 공식 실물 평면도 및 구조 스펙 확인"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm">🏛️</span>
                        <span className="font-extrabold text-emerald-950 truncate">
                          {fp.bay || '3-Bay'} {fp.structure || '판상형'} · 공식 실물 평면도
                        </span>
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                          네이버 공식연결
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-emerald-700 group-hover/fp:text-emerald-900 flex items-center gap-0.5 whitespace-nowrap shrink-0">
                        <span>공식 도면 보기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>

                  {/* 2. Unified Financial Block (선택 대출 상품별 실시간 한도 및 적격 심사 결과) */}
                  <div className="mx-3.5 sm:mx-4 my-2.5 p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/80 space-y-2">
                    {/* 상단: 매매 기준가 vs 선택 정책 대출 한도 */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">매매 기준가</span>
                        <span className="text-lg sm:text-xl font-black text-blue-700 tracking-tight">
                          {property.priceDisplay}원
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap truncate">
                          KB {(kb.generalAvg / 100000000).toFixed(2)}억 · {kb.jeonseAvg ? `전세 ${(kb.jeonseAvg / 100000000).toFixed(1)}억 (${kb.jeonseRate}%)` : '전세시세 미제공'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block flex items-center justify-end gap-1 whitespace-nowrap">
                          <ShieldCheck className={`w-3 h-3 ${sim.isEligible ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className={sim.isEligible ? 'text-slate-700 font-bold' : 'text-rose-500 font-bold'}>
                            {sim.loanName || loanProductInfo.shortName}
                          </span>
                        </span>
                        {sim.isEligible ? (
                          <>
                            <span className="text-lg sm:text-xl font-black text-blue-900 tracking-tight whitespace-nowrap">
                              {sim.maxLoanFormatted}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 whitespace-nowrap">
                              LTV {sim.ltvRatio}% ({sim.valuationBasis === 'KB시세' ? `KB시세 ${sim.appraisalPriceFormatted}` : '실매매가 기준'})
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-base sm:text-lg font-black text-rose-600 tracking-tight whitespace-nowrap">
                              대출 대상 제외
                            </span>
                            <span className="text-[10px] text-rose-500 block mt-0.5 whitespace-nowrap truncate max-w-[170px]" title={sim.ineligibilityReasons?.[0]}>
                              {sim.ineligibilityReasons?.[0] || '기준 요건 초과'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 하단: 최소 필요 현금 vs 월 원리금 (또는 대안 대출 안내) */}
                    {sim.isEligible ? (
                      <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block whitespace-nowrap">최소 필요 현금</span>
                          <span className="font-extrabold text-rose-600 text-sm whitespace-nowrap">
                            {sim.requiredCashFormatted}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block whitespace-nowrap">월 원리금 ({sim.loanTenureYears}년)</span>
                          <span className="font-extrabold text-slate-900 text-sm whitespace-nowrap">
                            약 {sim.monthlyPayment?.toLocaleString()}원
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold block whitespace-nowrap">
                            연 {sim.finalInterestRate}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs bg-rose-50/60 p-2 rounded-lg">
                        <span className="text-[11px] text-rose-700 font-bold">
                          💡 {property.allLoans?.newborn?.isEligible ? '신생아 특례 대출 가능' : '타 정책 대출 확인 필요'}
                        </span>
                        {property.allLoans?.newborn?.isEligible && (
                          <span className="text-[11px] font-black text-blue-700 whitespace-nowrap">
                            최대 {property.allLoans.newborn.maxLoanFormatted} (연 {property.allLoans.newborn.finalInterestRate}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Card Footer: 절약액 배지 & 3종 대출 비교 & 네이버 바로가기 & 상세 견적 버튼 */}
                <div className="px-3.5 sm:px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs bg-slate-50/40">
                  <div className="flex items-center gap-1.5">
                    {sim.isEligible && sim.comparison?.monthlySavings > 0 ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-[10px] sm:text-[11px] whitespace-nowrap truncate">
                        월 {sim.comparison?.monthlySavings?.toLocaleString()}원 절약
                      </span>
                    ) : (
                      <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px] sm:text-[11px] whitespace-nowrap truncate">
                        3대 대출 비교 가능
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(property);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      <span>⚖️ 3종 대출 비교</span>
                    </button>
                    {(property.naverMobileUrl || property.naverLandUrl) && (
                      <a
                        href={property.naverMobileUrl || property.naverLandUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`${property.name} 네이버부동산 단지 정보 및 실시간 매물 바로가기`}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 transition-colors whitespace-nowrap shadow-2xs"
                      >
                        <span>N 네이버</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <div className="flex items-center gap-0.5 text-blue-600 font-bold text-xs shrink-0 whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
                      <span>상세</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                </div>
              </React.Fragment>
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
          isFavorite={favorites.includes(selectedProperty.id)}
          onToggleFavorite={(e) => toggleFavorite(e, selectedProperty.id)}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
