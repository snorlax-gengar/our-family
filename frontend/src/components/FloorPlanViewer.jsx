import React, { useState } from 'react';
import { 
  Maximize2, Eye, Compass, LayoutGrid, CheckCircle2, 
  Sparkles, Layers, ShieldCheck, ArrowRight, Info, ExternalLink, Image as ImageIcon, Tag
} from 'lucide-react';

export default function FloorPlanViewer({ 
  floorPlan, 
  propertyName, 
  areaSqMeter, 
  pyeong,
  naverLandUrl,
  naverMobileUrl,
  naverComplexNo
}) {
  const [viewMode, setViewMode] = useState('realImage'); // 'realImage' | 'cad'
  const [showOverlayLabels, setShowOverlayLabels] = useState(true);
  const [isExpandedMode, setIsExpandedMode] = useState(true); // 확장형 vs 기본형 (CAD 모드용)
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!floorPlan) return null;

  const planType = floorPlan.type || (areaSqMeter < 75 ? '59_3bay' : '84_3bay');
  const imageSrc = floorPlan.imageUrl || (
    planType === '84_4bay'
      ? '/floorplans/floorplan_84_4bay.jpg'
      : (planType === '59_3bay' || planType === '59_2bay' || areaSqMeter < 75)
      ? '/floorplans/floorplan_59_3bay.jpg'
      : '/floorplans/floorplan_84_3bay.jpg'
  );

  const directNaverUrl = naverMobileUrl || naverLandUrl || (naverComplexNo ? `https://m.land.naver.com/complex/info/${naverComplexNo}` : null);

  // 각 평면도 이미지별 인터랙티브 방 라벨 좌표 (퍼센트 기준)
  const getRoomHotspots = () => {
    if (planType === '84_4bay') {
      return [
        { id: 'living', name: '거실 (Living)', dim: floorPlan.livingRoomWidth ? `${floorPlan.livingRoomWidth} × 4.2m` : '4.6m × 4.2m', area: '약 8.2평', x: 53, y: 67, desc: '4-Bay 전면 중앙에 위치한 광폭 거실로 채광과 개방감이 뛰어납니다.' },
        { id: 'master', name: '안방 (침실1)', dim: floorPlan.masterBedroomWidth ? `${floorPlan.masterBedroomWidth} × 3.8m` : '3.9m × 3.8m', area: '약 5.8평', x: 82, y: 69, desc: '킹사이즈 침대와 대형 워크인 드레스룸, 부부욕실이 연결된 마스터룸입니다.' },
        { id: 'bed2', name: '침실 2', dim: '3.0m × 3.3m', area: '약 3.1평', x: 34, y: 74, desc: '남향 전면에 배치된 자녀방으로 일조량이 풍부하고 붙박이장이 설치됩니다.' },
        { id: 'bed3', name: '침실 3', dim: '3.0m × 3.3m', area: '약 3.0평', x: 15, y: 74, desc: '남향 4-Bay 전면 채광이 보장되는 침실로 자녀방이나 서재로 활용하기 좋습니다.' },
        { id: 'kitchen', name: '주방 / 식당', dim: 'ㄷ자 대면형', area: '약 4.6평', x: 52, y: 34, desc: '거실과 일직선 맞통풍 환기창을 갖춘 대면형 주방 및 6인용 식탁 공간입니다.' },
        { id: 'dress', name: '드레스룸', dim: '워크인 수납', area: '약 1.6평', x: 88, y: 39, desc: '사계절 의류와 이불 수납이 가능한 대형 시스템 드레스룸입니다.' },
        { id: 'bath1', name: '공용욕실', dim: '욕조형', area: '약 1.5평', x: 32, y: 41, desc: '욕조가 설치된 가족 공용 욕실입니다.' },
        { id: 'bath2', name: '부부욕실', dim: '샤워부스형', area: '약 1.4평', x: 75, y: 39, desc: '독립 샤워부스가 설치된 안방 전용 부부욕실입니다.' },
        { id: 'entrance', name: '현관 / 팬트리', dim: '신발장·수납', area: '약 1.8평', x: 20, y: 44, desc: '대용량 신발장과 수납 팬트리가 갖춰진 현관 진입 공간입니다.' }
      ];
    }

    if (planType === '59_3bay' || planType === '59_2bay' || areaSqMeter < 75) {
      return [
        { id: 'living', name: '거실 (Living)', dim: floorPlan.livingRoomWidth ? `${floorPlan.livingRoomWidth} × 3.8m` : '4.0m × 3.8m', area: '약 6.5평', x: 42, y: 62, desc: '전면 남향 채광이 들어오는 실속형 판상형 거실입니다.' },
        { id: 'master', name: '안방 (침실1)', dim: floorPlan.masterBedroomWidth ? `${floorPlan.masterBedroomWidth} × 3.6m` : '3.6m × 3.6m', area: '약 4.5평', x: 82, y: 63, desc: '퀸/킹사이즈 침대와 붙박이장 배치가 여유로운 남향 안방입니다.' },
        { id: 'bed2', name: '침실 2', dim: '2.9m × 3.2m', area: '약 2.9평', x: 20, y: 63, desc: '전면 채광이 우수한 자녀방 또는 서재 공간입니다.' },
        { id: 'bed3', name: '침실 3', dim: '2.7m × 3.0m', area: '약 2.7평', x: 63, y: 62, desc: '아이방이나 드레스룸·서재로 활용도가 높은 침실입니다.' },
        { id: 'kitchen', name: '주방 / 식당', dim: 'ㄱ자형 싱크대', area: '약 3.6평', x: 44, y: 26, desc: '거실과 맞통풍 환기가 가능한 ㄱ자형 주방 및 4인 식탁 공간입니다.' },
        { id: 'bath1', name: '욕실', dim: '욕조/샤워', area: '약 1.4평', x: 85, y: 36, desc: '욕조가 포함된 깔끔한 욕실 공간입니다.' },
        { id: 'balcony', name: '전면 광폭 발코니', dim: '3-Bay 통발코니', area: '약 4.0평', x: 48, y: 85, desc: '단열과 채광, 빨래 건조 및 확장 시 실사용 면적을 넓혀주는 남향 통발코니입니다.' }
      ];
    }

    // Default: 84_3bay (전통 3-Bay 판상형 방3·욕실2)
    return [
      { id: 'living', name: '거실 (Living)', dim: floorPlan.livingRoomWidth ? `${floorPlan.livingRoomWidth} × 4.2m` : '4.5m × 4.2m', area: '약 7.8평', x: 52, y: 63, desc: '온 가족이 모이는 4.5m급 광폭 거실로 주방과 일직선 맞통풍이 가능합니다.' },
      { id: 'master', name: '안방 (침실1)', dim: floorPlan.masterBedroomWidth ? `${floorPlan.masterBedroomWidth} × 3.8m` : '3.9m × 3.8m', area: '약 5.6평', x: 78, y: 66, desc: '12~14자 붙박이장과 킹사이즈 침대, 파우더룸·부부욕실이 연결된 마스터룸입니다.' },
      { id: 'bed2', name: '침실 2 (전면방)', dim: '3.3m × 3.5m', area: '약 3.5평', x: 24, y: 66, desc: '3-Bay 남향 전면에 배치되어 채광이 뛰어난 자녀방입니다.' },
      { id: 'bed3', name: '침실 3 (후면방)', dim: '3.0m × 3.2m', area: '약 3.2평', x: 35, y: 26, desc: '붙박이장과 책상 배치가 용이한 조용한 자녀방/서재입니다.' },
      { id: 'kitchen', name: '주방 / 식당', dim: 'ㄱ자형 주방', area: '약 4.2평', x: 57, y: 27, desc: '6인용 식탁 배치와 거실-주방 맞통풍 환기가 가능한 판상형 주방입니다.' },
      { id: 'bath1', name: '공용욕실', dim: '욕조형', area: '약 1.5평', x: 19, y: 46, desc: '욕조가 구비된 가족 공용 욕실입니다.' },
      { id: 'bath2', name: '부부욕실', dim: '안방 전용', area: '약 1.3평', x: 80, y: 33, desc: '안방 파우더 공간과 연결된 부부 전용 욕실입니다.' },
      { id: 'entrance', name: '현관', dim: '신발장/중문', area: '약 1.2평', x: 20, y: 28, desc: '전신거울 신발장과 중문 설치가 가능한 독립 현관입니다.' },
      { id: 'balcony', name: '남향 3-Bay 발코니', dim: '광폭 통발코니', area: '약 4.8평', x: 48, y: 86, desc: '침실2·거실·안방 전면을 잇는 남향 광폭 발코니(확장 시 실사용 면적 극대화)입니다.' }
    ];
  };

  const hotspots = getRoomHotspots();

  // 도면별 CAD 비교 뷰 렌더링 함수
  const renderBlueprintSvg = () => {
    return (
      <svg viewBox="0 0 520 400" className="w-full h-full select-none">
        <defs>
          <pattern id="woodFloor" width="40" height="12" patternUnits="userSpaceOnUse">
            <rect width="40" height="12" fill="#f5e6d3" />
            <path d="M 0 12 L 40 12 M 20 0 L 20 12" stroke="#e6ccb2" strokeWidth="0.8" />
          </pattern>
          <pattern id="tileFloor" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#f1f5f9" />
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="520" height="400" fill="#f8fafc" />
        <rect x="35" y="25" width="450" height="345" fill="url(#woodFloor)" stroke="#1e293b" strokeWidth="7" rx="3" />

        {/* 전면 발코니 구역 (남향) */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '전면 광폭 발코니', desc: isExpandedMode ? '거실 및 침실 확장 시 실사용 면적이 약 5~7평 넓어집니다.' : '단열·채광·빨래건조에 유리한 1.5m 광폭 통발코니입니다.', area: '약 4.8평', dim: '전면 통발코니' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer"
        >
          <rect x="38" y="295" width="444" height="72" fill={isExpandedMode ? 'url(#woodFloor)' : 'url(#tileFloor)'} stroke="#475569" strokeWidth="2" strokeDasharray={isExpandedMode ? '5 4' : 'none'} />
          <text x="260" y="336" textAnchor="middle" className="text-xs font-extrabold fill-slate-700">
            {isExpandedMode ? '↔ 전면 발코니 확장 시공 구역 (거실·침실 확장)' : '전면 광폭 통발코니 (타일 마감 / 비확장 기본형)'}
          </text>
        </g>

        {/* 침실 2 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '침실 2 (전면 자녀방)', desc: '정남향 배치로 채광이 풍부하며 침대와 책상, 붙박이장 배치가 용이합니다.', area: '약 3.5평', dim: '3.3m × 3.5m' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="38" y="160" width="130" height={isExpandedMode ? 207 : 135} fill="url(#woodFloor)" stroke="#334155" strokeWidth="4" />
          <rect x="46" y="195" width="45" height="65" rx="3" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <rect x="50" y="200" width="37" height="14" rx="2" fill="#e2e8f0" />
          <text x="112" y="225" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 2</text>
          <text x="112" y="242" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">3.3m × 3.5m</text>
        </g>

        {/* 거실 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '거실 (Living Room)', desc: '온 가족이 모이는 중심 공간으로 주방과 일직선 맞통풍이 가능합니다.', area: '약 7.8평', dim: `${floorPlan.livingRoomWidth || '4.5m'} × 4.2m` })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="168" y="160" width="180" height={isExpandedMode ? 207 : 135} fill="url(#woodFloor)" stroke="#334155" strokeWidth="3" />
          {/* 소파 & 테이블 그래픽 */}
          <rect x="285" y="185" width="52" height="85" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
          <rect x="250" y="205" width="24" height="45" rx="2" fill="#d6d3d1" stroke="#78716c" strokeWidth="1.2" />
          <text x="230" y="225" textAnchor="middle" className="text-base font-black fill-slate-900">거실</text>
          <text x="230" y="244" textAnchor="middle" className="text-[11px] font-bold fill-blue-800">{floorPlan.livingRoomWidth || '4.5m'} × 4.2m</text>
        </g>

        {/* 안방 (침실1) + 부부욕실 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '안방 (침실1) & 부부욕실', desc: '킹사이즈 침대와 대형 붙박이장, 부부욕실이 갖춰진 마스터룸입니다.', area: '약 5.8평', dim: `${floorPlan.masterBedroomWidth || '3.9m'} × 3.8m` })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="348" y="160" width="134" height={isExpandedMode ? 207 : 135} fill="url(#woodFloor)" stroke="#334155" strokeWidth="4" />
          <rect x="410" y="160" width="72" height="54" fill="url(#tileFloor)" stroke="#334155" strokeWidth="3" />
          <text x="446" y="190" textAnchor="middle" className="text-[10px] font-extrabold fill-slate-700">부부욕실</text>
          {/* 침대 그래픽 */}
          <rect x="398" y="222" width="74" height="62" rx="3" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <rect x="452" y="227" width="15" height="22" rx="2" fill="#e2e8f0" />
          <rect x="452" y="256" width="15" height="22" rx="2" fill="#e2e8f0" />
          <text x="392" y="245" textAnchor="middle" className="text-sm font-black fill-slate-900">안방</text>
        </g>

        {/* 현관 & 공용욕실 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '현관 & 공용욕실', desc: '대형 욕조가 구비된 공용욕실과 신발장 현관입니다.', area: '약 2.5평', dim: '욕조·신발장' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="38" y="28" width="65" height="65" fill="url(#tileFloor)" stroke="#334155" strokeWidth="4" />
          <text x="70" y="64" textAnchor="middle" className="text-xs font-extrabold fill-slate-700">현관</text>
          <rect x="38" y="93" width="65" height="67" fill="url(#tileFloor)" stroke="#334155" strokeWidth="4" />
          <rect x="43" y="98" width="22" height="52" rx="6" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
          <text x="78" y="130" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-700">공용욕실</text>
        </g>

        {/* 침실 3 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '침실 3 (후면 자녀방 / 서재)', desc: '붙박이장과 책상 배치가 가능한 쾌적한 방입니다.', area: '약 3.2평', dim: '3.0m × 3.2m' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="103" y="28" width="105" height="132" fill="url(#woodFloor)" stroke="#334155" strokeWidth="4" />
          <text x="155" y="92" textAnchor="middle" className="text-sm font-black fill-slate-900">침실 3</text>
          <text x="155" y="110" textAnchor="middle" className="text-[10px] font-bold fill-slate-600">3.0m × 3.2m</text>
        </g>

        {/* 주방 / 식당 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '주방 / 식당 (맞통풍 구조)', desc: 'ㄱ자/ㄷ자 싱크대와 식탁 배치가 가능하며 거실과 맞통풍 환기가 됩니다.', area: '약 4.2평', dim: floorPlan.kitchenType || 'ㄱ자형 주방' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="208" y="28" width="180" height="132" fill="url(#woodFloor)" stroke="#334155" strokeWidth="3" />
          {/* 싱크대 상판 */}
          <path d="M 212 32 L 384 32 L 384 54 L 234 54 L 234 115 L 212 115 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
          {/* 식탁 */}
          <rect x="285" y="75" width="60" height="36" rx="3" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.5" />
          <text x="315" y="97" textAnchor="middle" className="text-xs font-black fill-slate-900">주방 / 식당</text>
          <text x="315" y="135" textAnchor="middle" className="text-[10px] font-extrabold fill-emerald-700">↕ 거실-주방 맞통풍</text>
        </g>

        {/* 다용도실 / 세탁실 */}
        <g
          onMouseEnter={() => setHoveredRoom({ name: '다용도실 / 세탁실', desc: '세탁기·건조기 및 보조 싱크대 설치가 가능한 후면 발코니입니다.', area: '약 1.8평', dim: '세탁실/보일러' })}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer hover:opacity-90"
        >
          <rect x="388" y="28" width="94" height="132" fill="url(#tileFloor)" stroke="#334155" strokeWidth="4" />
          <text x="435" y="92" textAnchor="middle" className="text-xs font-extrabold fill-slate-700">다용도실</text>
          <text x="435" y="110" textAnchor="middle" className="text-[9px] font-semibold fill-slate-500">세탁실/보조주방</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white border border-slate-700/80 shadow-2xl space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {floorPlan.bay} 구조
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
              {floorPlan.structure}
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              {floorPlan.title}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {propertyName} · 공급 {pyeong}평형 (전용 {areaSqMeter}㎡) · {floorPlan.roomsCount}룸 {floorPlan.bathroomsCount}욕실
          </p>
        </div>

        {/* View Mode Switcher: 고화질 입체 평면도 vs 확장/비확장 CAD 비교 */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('realImage')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                viewMode === 'realImage'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>고화질 입체 평면도</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cad')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                viewMode === 'cad'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>확장/기본 비교도</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left/Center Floor Plan Display Column */}
        <div className="lg:col-span-2 bg-white rounded-xl p-2 sm:p-4 border border-slate-700 relative flex flex-col items-center justify-center min-h-[320px] overflow-hidden shadow-inner">
          {/* Sub-controls on top of canvas */}
          <div className="w-full flex items-center justify-between gap-2 mb-2 px-1 z-10">
            {viewMode === 'realImage' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOverlayLabels(!showOverlayLabels)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    showOverlayLabels
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{showOverlayLabels ? '방이름·치수 표시중' : '방이름·치수 켜기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>크게 보기</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpandedMode(true)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    isExpandedMode ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  확장형
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpandedMode(false)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    !isExpandedMode ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  기본형(발코니)
                </button>
              </div>
            )}

            {/* 방위 표시 배지 */}
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-[11px] font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>남향·남동향 기준</span>
            </div>
          </div>

          {/* Floor Plan Image or CAD View */}
          {viewMode === 'realImage' ? (
            <div className="relative w-full max-w-[560px] mx-auto select-none">
              <img
                src={imageSrc}
                alt={`${propertyName} ${pyeong}평형 입체 평면도`}
                onClick={() => setIsZoomOpen(true)}
                className="w-full h-auto rounded-lg object-contain cursor-zoom-in"
              />

              {/* Interactive Room Dimension Badges Overlaid on Image */}
              {showOverlayLabels &&
                hotspots.map((spot) => {
                  const isSelected = hoveredRoom?.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoveredRoom(spot);
                      }}
                      onMouseEnter={() => setHoveredRoom(spot)}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold transition-all cursor-pointer shadow-md border whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-600 text-white border-white scale-110 z-20 ring-2 ring-blue-400'
                          : 'bg-slate-900/80 hover:bg-blue-600 text-white border-white/40 backdrop-blur-xs z-10'
                      }`}
                    >
                      <span>{spot.name}</span>
                      <span className="hidden sm:inline text-[9px] text-amber-300 ml-1 font-semibold">
                        {spot.area}
                      </span>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="w-full max-w-[520px] mx-auto">
              {renderBlueprintSvg()}
            </div>
          )}

          <div className="w-full mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>도면 위 각 방 라벨을 터치/클릭하면 우측에 상세 치수와 설명이 표시됩니다.</span>
            </div>
            {directNaverUrl && (
              <a
                href={directNaverUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 shrink-0 whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>N 네이버부동산 단지·실제평면도 바로가기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right Info Column: Room Details & Specs */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Active Hovered/Clicked Room Panel */}
          <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 min-h-[145px] flex flex-col justify-center">
            {hoveredRoom ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{hoveredRoom.name}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {hoveredRoom.dim && (
                      <span className="text-[11px] bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                        {hoveredRoom.dim}
                      </span>
                    )}
                    <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-bold">
                      {hoveredRoom.area}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed break-keep">
                  {hoveredRoom.desc}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-3">
                <Eye className="w-6 h-6 mx-auto mb-1.5 text-blue-400 opacity-80" />
                <span className="text-xs font-bold block text-slate-200">방별 상세 치수 & 구조 확인</span>
                <span className="text-[11px] text-slate-400 block mt-1 break-keep">
                  평면도 이미지 위의 <strong className="text-amber-300">거실·안방·침실·주방</strong> 버튼을 눌러보세요!
                </span>
              </div>
            )}
          </div>

          {/* Quick Room Selector Pills */}
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              공간별 빠른 선택:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {hotspots.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setHoveredRoom(spot)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    hoveredRoom?.id === spot.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {spot.name}
                </button>
              ))}
            </div>
          </div>

          {/* Key Architectural Specs */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
            <span className="font-bold text-slate-200 block border-b border-slate-700 pb-1.5">
              📐 평면 구조 핵심 요약
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">베이 형태</span>
                <span className="font-extrabold text-blue-400">{floorPlan.bay} 판상형</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">현관 진입방식</span>
                <span className="font-extrabold text-white">{floorPlan.entrance}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">거실 폭</span>
                <span className="font-extrabold text-white">{floorPlan.livingRoomWidth || '4.2m'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">주방 형태</span>
                <span className="font-extrabold text-white">{floorPlan.kitchenType}</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-700 text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{floorPlan.ventilation}</span>
            </div>
          </div>

          {/* Features Badges */}
          <div className="flex flex-wrap gap-1.5">
            {floorPlan.features?.map((f, idx) => (
              <span key={idx} className="bg-blue-950 text-blue-300 border border-blue-800/80 text-[10px] px-2 py-0.5 rounded-md font-medium">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal for Floor Plan Image */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-slate-900">
              <div>
                <h4 className="font-black text-base sm:text-lg">
                  {propertyName} · {pyeong}평형 ({areaSqMeter}㎡) 입체 평면도
                </h4>
                <p className="text-xs text-slate-500">{floorPlan.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>
            <img
              src={imageSrc}
              alt={`${propertyName} 확대 평면도`}
              className="w-full max-h-[75vh] object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
