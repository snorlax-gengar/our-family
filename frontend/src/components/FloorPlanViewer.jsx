import React, { useState } from 'react';
import { 
  Maximize2, Eye, Compass, LayoutGrid, CheckCircle2, 
  Sparkles, Layers, ShieldCheck, ArrowRight, Info
} from 'lucide-react';

export default function FloorPlanViewer({ floorPlan, propertyName, areaSqMeter, pyeong }) {
  const [isExpandedMode, setIsExpandedMode] = useState(true); // 확장형 vs 기본형
  const [hoveredRoom, setHoveredRoom] = useState(null);

  if (!floorPlan) return null;

  const planType = floorPlan.type || '84_3bay';

  // 도면별 SVG 렌더링 함수
  const renderBlueprintSvg = () => {
    switch (planType) {
      case '59_2bay':
        return (
          <svg viewBox="0 0 500 380" className="w-full h-full select-none">
            {/* Background Grid */}
            <defs>
              <pattern id="grid592" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="500" height="380" fill="#fafafa" />
            <rect width="500" height="380" fill="url(#grid592)" />

            {/* 외벽 (Outer Walls) */}
            <rect x="40" y="30" width="420" height="320" fill="#ffffff" stroke="#334155" strokeWidth="6" rx="4" />

            {/* 1. 발코니 (남향 전면) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '전면 발코니 (남향)', desc: isExpandedMode ? '확장 시 거실과 안방 공간으로 편입되어 실사용 면적이 5평 이상 증가합니다.' : '빨래 건조 및 화초 재배, 단열에 유리한 광폭 통발코니입니다.', area: '약 3.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="43" y="275" width="414" height="72" fill={isExpandedMode ? '#e0f2fe' : '#f8fafc'} stroke="#94a3b8" strokeWidth="2" strokeDasharray={isExpandedMode ? '4 3' : 'none'} />
              <text x="250" y="318" textAnchor="middle" className="text-xs font-bold fill-slate-500">
                {isExpandedMode ? '전면 발코니 (확장 시공 구역)' : '전면 광폭 발코니 (빨래건조/단열)'}
              </text>
            </g>

            {/* 2. 거실 (Living Room) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '거실 (Living Room)', desc: '폭 3.8m의 쾌적한 남향 거실. 채광과 일조량이 우수합니다.', area: '약 6.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="43" y="145" width="220" height={isExpandedMode ? 195 : 130} fill="#fef3c7" fillOpacity="0.45" stroke="#cbd5e1" strokeWidth="2" />
              <text x="153" y="210" textAnchor="middle" className="text-sm font-black fill-slate-800">거실</text>
              <text x="153" y="230" textAnchor="middle" className="text-[11px] font-medium fill-slate-500">3.8m × 3.6m</text>
            </g>

            {/* 3. 침실1 (안방 - Master Bedroom) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 1 (안방)', desc: '12자 붙박이장과 킹사이즈 침대 배치가 가능한 정남향 안방입니다.', area: '약 4.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="263" y="145" width="194" height={isExpandedMode ? 195 : 130} fill="#ede9fe" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="360" y="210" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 1 (안방)</text>
              <text x="360" y="230" textAnchor="middle" className="text-[11px] font-medium fill-slate-500">3.6m × 3.4m</text>
            </g>

            {/* 4. 침실2 (작은방/서재/아이방) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 2 (아이방 / 서재)', desc: '복도 쪽 창문이 있는 침실. 붙박이장 수납이 가능합니다.', area: '약 2.9평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="263" y="33" width="194" height="112" fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="360" y="85" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 2</text>
              <text x="360" y="105" textAnchor="middle" className="text-[11px] font-medium fill-slate-500">3.0m × 2.8m</text>
            </g>

            {/* 5. 주방 / 식당 (Kitchen & Dining) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '주방 / 식당', desc: '일자형 싱크대와 4인용 식탁 배치가 가능하며 다용도실과 연결됩니다.', area: '약 3.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="120" y="33" width="143" height="112" fill="#ffedd5" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="2" />
              <text x="191" y="85" textAnchor="middle" className="text-sm font-black fill-slate-800">주방 / 식당</text>
              <text x="191" y="105" textAnchor="middle" className="text-[11px] font-medium fill-slate-500">싱크대 / 냉장고장</text>
            </g>

            {/* 6. 욕실 (Bathroom) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '욕실 (공용)', desc: '욕조 또는 샤워부스가 설치된 공용 욕실입니다.', area: '약 1.3평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="43" y="33" width="77" height="65" fill="#e0f2fe" fillOpacity="0.7" stroke="#cbd5e1" strokeWidth="2" />
              <text x="81" y="68" textAnchor="middle" className="text-xs font-black fill-slate-800">욕실</text>
            </g>

            {/* 7. 현관 (Entrance) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '현관 (신발장)', desc: '신발 수납장 및 중문 설치가 가능한 현관 공간입니다.', area: '약 1.1평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer transition-opacity hover:opacity-85"
            >
              <rect x="43" y="98" width="77" height="47" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <text x="81" y="126" textAnchor="middle" className="text-xs font-black fill-slate-800">현관</text>
            </g>

            {/* 치수선 및 방위표 */}
            <g transform="translate(425, 45)">
              <circle cx="15" cy="15" r="14" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 15 5 L 18 17 L 15 14 L 12 17 Z" fill="#ef4444" />
              <path d="M 15 25 L 18 17 L 15 14 L 12 17 Z" fill="#94a3b8" />
              <text x="15" y="4" textAnchor="middle" className="text-[8px] font-black fill-red-500">N (남향배치)</text>
            </g>
          </svg>
        );

      case '59_3bay':
        return (
          <svg viewBox="0 0 520 400" className="w-full h-full select-none">
            {/* 59㎡ 3-Bay 판상형 (방3 / 욕실2) */}
            <rect width="520" height="400" fill="#fafafa" />
            <rect x="35" y="25" width="450" height="345" fill="#ffffff" stroke="#334155" strokeWidth="6" rx="4" />

            {/* 전면 발코니 구역 (확장 옵션) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '전면 3-Bay 발코니', desc: isExpandedMode ? '침실2, 거실, 안방 발코니가 모두 확장되어 실사용 공간이 대폭 늘어납니다.' : '전면 3Bay에 걸친 채광 및 단열 통발코니 구역입니다.', area: '약 4.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer"
            >
              <rect x="38" y="295" width="444" height="72" fill={isExpandedMode ? '#e0f2fe' : '#f8fafc'} stroke="#94a3b8" strokeWidth="2" strokeDasharray={isExpandedMode ? '4 3' : 'none'} />
              <text x="260" y="338" textAnchor="middle" className="text-xs font-bold fill-slate-500">
                {isExpandedMode ? '전면 3-Bay 발코니 (확장 시공)' : '전면 3-Bay 광폭 발코니'}
              </text>
            </g>

            {/* 3Bay 전면: [침실2] [거실] [침실1(안방)] */}
            {/* 침실 2 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 2 (전면 자녀방)', desc: '3Bay 전면에 배치되어 채광과 일조권이 뛰어난 자녀방입니다.', area: '약 2.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="38" y="160" width="130" height={isExpandedMode ? 207 : 135} fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="103" y="225" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 2</text>
              <text x="103" y="245" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">2.8m × 3.2m</text>
            </g>

            {/* 거실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '거실 (Living Room)', desc: '중앙에 위치한 개방감 높은 4.0m 광폭 거실입니다.', area: '약 6.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="168" y="160" width="180" height={isExpandedMode ? 207 : 135} fill="#fef3c7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="258" y="225" textAnchor="middle" className="text-sm font-black fill-slate-800">거실</text>
              <text x="258" y="245" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">4.0m × 3.8m</text>
            </g>

            {/* 안방 (침실1) + 부부욕실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 1 (안방) & 부부욕실', desc: '안방 전용 부부욕실 및 파우더 공간이 완비된 마스터룸입니다.', area: '약 4.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="348" y="160" width="134" height={isExpandedMode ? 207 : 135} fill="#ede9fe" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="410" y="163" width="70" height="50" fill="#e0f2fe" fillOpacity="0.8" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="445" y="193" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">부부욕실</text>
              <text x="390" y="245" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 1(안방)</text>
            </g>

            {/* 후면: [현관 + 공용욕실] [주방/식당] [침실3] */}
            {/* 현관 & 공용욕실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '현관 & 공용욕실', desc: '현관 신발장 및 욕조가 포함된 가족 공용 욕실입니다.', area: '약 2.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="38" y="28" width="65" height="65" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <text x="70" y="64" textAnchor="middle" className="text-xs font-bold fill-slate-800">현관</text>
              <rect x="38" y="93" width="65" height="67" fill="#e0f2fe" stroke="#cbd5e1" strokeWidth="2" />
              <text x="70" y="130" textAnchor="middle" className="text-xs font-bold fill-slate-800">공용욕실</text>
            </g>

            {/* 침실 3 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 3 (서재 / 드레스룸)', desc: '북향에 위치하여 집중도가 높고 드레스룸으로 활용하기 좋습니다.', area: '약 2.6평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="103" y="28" width="105" height="132" fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="155" y="95" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 3</text>
              <text x="155" y="115" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">2.7m × 2.8m</text>
            </g>

            {/* 주방 / 식당 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '주방 / 식당 (맞통풍 창문)', desc: '거실과 일직선으로 배치되어 완벽한 맞통풍 판상형 환기가 가능합니다.', area: '약 3.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="208" y="28" width="180" height="132" fill="#ffedd5" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="2" />
              <text x="298" y="90" textAnchor="middle" className="text-sm font-black fill-slate-800">주방 / 식당</text>
              <text x="298" y="110" textAnchor="middle" className="text-[10px] font-bold fill-emerald-600">★ 거실 맞통풍 창문</text>
            </g>

            {/* 다용도실 (세탁실) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '다용도실 (세탁실/보일러)', desc: '세탁기 및 건조기 직렬 배치가 가능한 후면 발코니 공간입니다.', area: '약 1.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="388" y="28" width="94" height="132" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="435" y="95" textAnchor="middle" className="text-xs font-bold fill-slate-600">다용도실</text>
              <text x="435" y="115" textAnchor="middle" className="text-[9px] fill-slate-400">세탁기/실외기</text>
            </g>

            {/* 방위표 */}
            <g transform="translate(445, 38)">
              <circle cx="15" cy="15" r="13" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 15 6 L 18 16 L 15 14 L 12 16 Z" fill="#ef4444" />
              <path d="M 15 24 L 18 16 L 15 14 L 12 16 Z" fill="#94a3b8" />
              <text x="15" y="4" textAnchor="middle" className="text-[8px] font-black fill-red-500">N</text>
            </g>
          </svg>
        );

      case '84_4bay':
        return (
          <svg viewBox="0 0 540 400" className="w-full h-full select-none">
            {/* 84㎡ 4-Bay 최신 판상형 평면도 */}
            <rect width="540" height="400" fill="#fafafa" />
            <rect x="30" y="25" width="480" height="345" fill="#ffffff" stroke="#334155" strokeWidth="6" rx="4" />

            {/* 전면 4-Bay 발코니 구역 (확장형 옵션) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '전면 4-Bay 발코니 (확장 시공)', desc: isExpandedMode ? '모든 침실과 거실이 확장되어 35평 이상의 체감 실사용 공간을 제공합니다.' : '4베이 전체에 걸친 초대형 전면 발코니 구역입니다.', area: '약 5.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer"
            >
              <rect x="33" y="295" width="474" height="72" fill={isExpandedMode ? '#e0f2fe' : '#f8fafc'} stroke="#94a3b8" strokeWidth="2" strokeDasharray={isExpandedMode ? '4 3' : 'none'} />
              <text x="270" y="338" textAnchor="middle" className="text-xs font-bold fill-slate-500">
                {isExpandedMode ? '전면 4-Bay 광폭 발코니 (확장 시공 완료)' : '전면 4-Bay 광폭 발코니'}
              </text>
            </g>

            {/* 전면 4-Bay: [침실3] [침실2] [거실] [침실1(안방)] */}
            {/* 침실 3 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 3 (남향 전면 자녀방 1)', desc: '전면 4Bay 채광이 보장되는 첫 번째 자녀방입니다.', area: '약 3.0평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="33" y="170" width="105" height={isExpandedMode ? 197 : 125} fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="85" y="235" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 3</text>
              <text x="85" y="255" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">3.0m × 3.3m</text>
            </g>

            {/* 침실 2 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 2 (남향 전면 자녀방 2)', desc: '가변형 벽체로 침실3과 통합 가능한 넓은 방입니다.', area: '약 3.1평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="138" y="170" width="105" height={isExpandedMode ? 197 : 125} fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="190" y="235" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 2</text>
              <text x="190" y="255" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">3.0m × 3.3m</text>
            </g>

            {/* 거실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '거실 (Living Room 4.6m)', desc: '우물천장과 4.6m 광폭 거실로 탁 트인 개방감을 제공합니다.', area: '약 8.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="243" y="170" width="145" height={isExpandedMode ? 197 : 125} fill="#fef3c7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="315" y="235" textAnchor="middle" className="text-base font-black fill-slate-800">거실</text>
              <text x="315" y="255" textAnchor="middle" className="text-[11px] font-medium fill-slate-500">4.6m × 4.2m</text>
            </g>

            {/* 안방 (침실1) + 드레스룸 + 부부욕실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '마스터룸 (안방 + 대형 드레스룸 + 부부욕실)', desc: '워크인 드레스룸, 화장대 파우더룸, 샤워부스 부부욕실이 풀옵션으로 구비됩니다.', area: '약 6.1평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="388" y="170" width="119" height={isExpandedMode ? 197 : 125} fill="#ede9fe" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              {/* 드레스룸 / 부부욕실 구획 */}
              <rect x="388" y="170" width="60" height="55" fill="#f5d0fe" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="1" />
              <text x="418" y="198" textAnchor="middle" className="text-[9px] font-bold fill-slate-700">드레스룸</text>
              <rect x="448" y="170" width="59" height="55" fill="#e0f2fe" fillOpacity="0.7" stroke="#cbd5e1" strokeWidth="1" />
              <text x="477" y="198" textAnchor="middle" className="text-[9px] font-bold fill-slate-700">부부욕실</text>
              <text x="447" y="255" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 1(안방)</text>
            </g>

            {/* 후면: [현관 + 공용욕실] [주방 팬트리 + 대형 ㄷ자 주방] [다용도실] */}
            {/* 현관 & 공용욕실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '현관 신발장 & 가족 공용욕실', desc: '양면 신발장과 욕조가 설치된 호텔식 공용 욕실입니다.', area: '약 2.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="33" y="28" width="65" height="70" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <text x="65" y="68" textAnchor="middle" className="text-xs font-bold fill-slate-800">현관</text>
              <rect x="33" y="98" width="65" height="72" fill="#e0f2fe" stroke="#cbd5e1" strokeWidth="2" />
              <text x="65" y="138" textAnchor="middle" className="text-xs font-bold fill-slate-800">공용욕실</text>
            </g>

            {/* 팬트리 & 알파 수납 공간 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '대형 복도 팬트리 (수납 특화)', desc: '골프백, 캠핑용품, 생활 잡화를 모두 보관할 수 있는 대형 팬트리입니다.', area: '약 1.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="98" y="28" width="80" height="142" fill="#fed7aa" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="138" y="98" textAnchor="middle" className="text-xs font-bold fill-amber-900">복도 팬트리</text>
              <text x="138" y="118" textAnchor="middle" className="text-[9px] fill-slate-500">대용량 수납</text>
            </g>

            {/* 주방 / 식당 (대형 ㄷ자형 대면형 주방) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: 'ㄷ자형 대면형 주방 (맞통풍 창문)', desc: '거실을 바라보는 대면형 ㄷ자 주방과 6인용 식탁 공간, 와이드 환기창이 있습니다.', area: '약 4.6평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="178" y="28" width="220" height="142" fill="#ffedd5" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="2" />
              <text x="288" y="90" textAnchor="middle" className="text-base font-black fill-slate-800">ㄷ자형 대면주방</text>
              <text x="288" y="115" textAnchor="middle" className="text-xs font-bold fill-emerald-600">★ 4-Bay 거실 맞통풍 창문</text>
            </g>

            {/* 다용도실 / 세탁실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '다용도실 (보조주방 겸 세탁실)', desc: '세탁기, 건조기, 보조 싱크대 수납이 가능한 후면 발코니입니다.', area: '약 1.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="398" y="28" width="109" height="142" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="452" y="95" textAnchor="middle" className="text-xs font-bold fill-slate-700">다용도실</text>
              <text x="452" y="115" textAnchor="middle" className="text-[9px] fill-slate-400">보조주방/세탁실</text>
            </g>
          </svg>
        );

      case '84_3bay':
      default:
        return (
          <svg viewBox="0 0 520 400" className="w-full h-full select-none">
            {/* 84㎡ 3-Bay 전통 판상형 국민평형 평면도 */}
            <rect width="520" height="400" fill="#fafafa" />
            <rect x="35" y="25" width="450" height="345" fill="#ffffff" stroke="#334155" strokeWidth="6" rx="4" />

            {/* 전면 발코니 구역 (남향) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '전면 3-Bay 광폭 발코니', desc: isExpandedMode ? '거실 및 침실2 확장 시 약 7평 이상의 광활한 실사용 면적을 확보합니다.' : '빨래건조, 화초 재배, 단열에 탁월한 1.5m~2.0m 광폭 통발코니입니다.', area: '약 4.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer"
            >
              <rect x="38" y="295" width="444" height="72" fill={isExpandedMode ? '#e0f2fe' : '#f8fafc'} stroke="#94a3b8" strokeWidth="2" strokeDasharray={isExpandedMode ? '4 3' : 'none'} />
              <text x="260" y="338" textAnchor="middle" className="text-xs font-bold fill-slate-500">
                {isExpandedMode ? '전면 3-Bay 발코니 (확장 시공)' : '전면 3-Bay 광폭 발코니 (단열/휴식)'}
              </text>
            </g>

            {/* 전면 3-Bay: [침실2] [거실] [침실1(안방)] */}
            {/* 침실 2 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 2 (전면 채광 자녀방)', desc: '정남향 배치로 햇살이 풍부하며 붙박이장 배치가 용이합니다.', area: '약 3.5평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="38" y="160" width="130" height={isExpandedMode ? 207 : 135} fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="103" y="225" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 2</text>
              <text x="103" y="245" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">3.3m × 3.5m</text>
            </g>

            {/* 거실 (4.5m 대형 거실) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '거실 (Living Room 4.5m 광폭)', desc: '온 가족이 모이는 4.5m 대형 거실. 6인용 소파와 대형 TV 배치가 여유롭습니다.', area: '약 7.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="168" y="160" width="180" height={isExpandedMode ? 207 : 135} fill="#fef3c7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="258" y="225" textAnchor="middle" className="text-base font-black fill-slate-800">거실 (4.5m)</text>
              <text x="258" y="248" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">4.5m × 4.2m</text>
            </g>

            {/* 안방 (침실1) + 부부욕실 + 파우더룸 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 1 (안방) & 부부욕실 & 파우더룸', desc: '14자 대형 장롱과 부부욕실, 화장대가 분리된 여유로운 마스터룸입니다.', area: '약 5.8평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="348" y="160" width="134" height={isExpandedMode ? 207 : 135} fill="#ede9fe" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="410" y="163" width="70" height="55" fill="#e0f2fe" fillOpacity="0.8" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="445" y="195" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">부부욕실</text>
              <text x="395" y="245" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 1 (안방)</text>
            </g>

            {/* 후면: [현관 + 공용욕실] [주방/식당] [침실3] */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '현관 신발장 & 가족 공용욕실', desc: '대형 욕조가 구비된 공용 욕실과 전신 거울 신발장입니다.', area: '약 2.4평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="38" y="28" width="65" height="65" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <text x="70" y="64" textAnchor="middle" className="text-xs font-bold fill-slate-800">현관</text>
              <rect x="38" y="93" width="65" height="67" fill="#e0f2fe" stroke="#cbd5e1" strokeWidth="2" />
              <text x="70" y="130" textAnchor="middle" className="text-xs font-bold fill-slate-800">공용욕실</text>
            </g>

            {/* 침실 3 (후면 방) */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '침실 3 (자녀방 2 / 서재)', desc: '붙박이장이 포함된 쾌적한 침실로 자녀방이나 서재로 최적입니다.', area: '약 3.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="103" y="28" width="105" height="132" fill="#dcfce7" fillOpacity="0.5" stroke="#cbd5e1" strokeWidth="2" />
              <text x="155" y="95" textAnchor="middle" className="text-sm font-black fill-slate-800">침실 3</text>
              <text x="155" y="115" textAnchor="middle" className="text-[10px] font-medium fill-slate-500">3.0m × 3.2m</text>
            </g>

            {/* 주방 / 식당 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '주방 / 식당 (ㄱ자형 싱크대 & 다이닝)', desc: '6인용 식탁과 대형 냉장고 수납장, 거실과 일직선 맞통풍 환기창을 갖추었습니다.', area: '약 4.2평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="208" y="28" width="180" height="132" fill="#ffedd5" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="2" />
              <text x="298" y="90" textAnchor="middle" className="text-sm font-black fill-slate-800">주방 / 식당</text>
              <text x="298" y="112" textAnchor="middle" className="text-[10px] font-bold fill-emerald-600">★ 거실-주방 맞통풍 구조</text>
            </g>

            {/* 보조주방 & 세탁실 */}
            <g
              onMouseEnter={() => setHoveredRoom({ name: '후면 발코니 (보조주방 & 세탁실)', desc: '생선 조리용 보조 가스레인지 설치가 가능하며 대용량 세탁기·건조기가 들어갑니다.', area: '약 2.0평' })}
              onMouseLeave={() => setHoveredRoom(null)}
              className="cursor-pointer hover:opacity-85"
            >
              <rect x="388" y="28" width="94" height="132" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <text x="435" y="95" textAnchor="middle" className="text-xs font-bold fill-slate-600">보조주방</text>
              <text x="435" y="115" textAnchor="middle" className="text-[9px] fill-slate-400">세탁실/다용도실</text>
            </g>
          </svg>
        );
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-700/80 shadow-2xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {floorPlan.bay} 구조
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-semibold px-2 py-0.5 rounded">
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

        {/* View Toggle (확장형 vs 기본형) */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpandedMode(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isExpandedMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            확장형 평면도 (실사용 극대화)
          </button>
          <button
            type="button"
            onClick={() => setIsExpandedMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isExpandedMode
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            기본형 (발코니 보존)
          </button>
        </div>
      </div>

      {/* SVG Blueprint Canvas & Interactive Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SVG Drawing Column */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl p-3 border border-slate-800 relative flex items-center justify-center min-h-[300px] overflow-hidden">
          <div className="w-full max-w-[500px]">
            {renderBlueprintSvg()}
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-[11px] text-slate-400 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>각 방을 마우스로 가리키면 세부 설명과 면적이 표시됩니다.</span>
          </div>
        </div>

        {/* Right Info Column: Room Details & Specs */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Active Hovered Room Panel */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 min-h-[140px] flex flex-col justify-center">
            {hoveredRoom ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {hoveredRoom.name}
                  </span>
                  <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded font-bold">
                    {hoveredRoom.area}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {hoveredRoom.desc}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                <Eye className="w-6 h-6 mx-auto mb-1.5 text-slate-500 opacity-60" />
                <span className="text-xs font-semibold block text-slate-300">구조 도면 탐색</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  도면의 거실, 안방, 주방 등을 터치하거나 마우스를 올려보세요.
                </span>
              </div>
            )}
          </div>

          {/* Key Architectural Specs */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
            <span className="font-bold text-slate-200 block border-b border-slate-700 pb-1.5">
              📐 평면 구조 특성 요약
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
              <CheckCircle2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
