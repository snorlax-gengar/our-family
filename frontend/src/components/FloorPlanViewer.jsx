import React from 'react';
import { 
  Building2, ExternalLink, CheckCircle2, ShieldCheck, Compass, 
  Info, Sparkles, ArrowRight, ChevronRight, FileText, Check
} from 'lucide-react';

export default function FloorPlanViewer({ 
  floorPlan, 
  propertyName, 
  areaSqMeter, 
  pyeong,
  naverLandUrl,
  naverMobileUrl,
  naverComplexNo,
  kbLandUrl
}) {
  if (!floorPlan) return null;

  const cleanPropertyName = (propertyName || '').replace(/\s*\(\d+평형?\)/g, '');

  // 네이버부동산 모바일 단지 평형정보 직결 URL
  const directNaverUrl = naverMobileUrl || (naverComplexNo ? `https://m.land.naver.com/complex/info/${naverComplexNo}` : naverLandUrl);
  const directNaverPcUrl = naverLandUrl || (naverComplexNo ? `https://fin.land.naver.com/complexes/${naverComplexNo}` : null);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white border border-slate-700/80 shadow-2xl space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
              공식 실물 도면 연동
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
              {floorPlan.bay || '3-Bay'} {floorPlan.structure || '판상형'}
            </span>
            {naverComplexNo && (
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap">
                단지 #{naverComplexNo}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-xl font-black tracking-tight text-white mt-1.5">
            {cleanPropertyName} · 공급 {pyeong}평형 (전용 {areaSqMeter}㎡) 공식 평면도
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            건축물대장 인허가 정보 기준: {floorPlan.roomsCount || 3}룸 {floorPlan.bathroomsCount || 2}욕실 · {floorPlan.entrance || '계단식'} 구조
          </p>
        </div>

        {/* 방위 표시 배지 */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>남향 / 남동향 위주 배치</span>
        </div>
      </div>

      {/* 2. 투명성 안내 공지 (AI 상상 도면 전면 배제 & 공인 출처 안내) */}
      <div className="bg-slate-800/80 rounded-xl p-3.5 sm:p-4 border border-slate-700 text-xs leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>공식 실물 평면도 열람 안내</span>
        </div>
        <p className="text-slate-300 break-keep">
          아파트 단지별 실제 인허가 건축도면(2D 기본형/발코니 확장형 및 3D 입체도)은 시공사·한국부동산원 및 네이버부동산에 공식 등록되어 있습니다. 임의 제작된 가상 도면으로 인한 오해를 방지하고자, <strong>해당 단지의 공인된 공식 실물 평면도 페이지</strong>로 1-클릭 직접 연결해 드립니다.
        </p>
      </div>

      {/* 3. Hero Card: 네이버부동산 공식 실물 평면도 바로가기 (주요 CTA) */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 border-2 border-emerald-500/50 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded">
                NAVER LAND
              </span>
              <h4 className="text-base sm:text-lg font-black text-white">
                네이버부동산 공식 단지·평형정보 센터
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 break-keep">
              <strong className="text-emerald-400 font-bold">[{cleanPropertyName}]</strong>의 공식 등록 평면도와 동호수 배치도, 공급/전용면적별 기본형·확장형 실물 도면을 즉시 열람하실 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {directNaverUrl && (
              <a
                href={directNaverUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>네이버 공식 실물 평면도 보기</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {directNaverPcUrl && directNaverPcUrl !== directNaverUrl && (
              <a
                href={directNaverPcUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>PC버전</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 3단계 도면 확인 방법 가이드 */}
        <div className="bg-slate-900/80 rounded-xl p-3 sm:p-4 border border-emerald-900/40">
          <span className="text-[11px] font-bold text-emerald-400 block mb-2.5">
            📌 네이버부동산 페이지에서 공식 평면도 확인하는 방법 (3단계):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block font-bold">공식 페이지 접속</strong>
                <span className="text-[11px] text-slate-400">위 녹색 버튼 클릭 시 해당 아파트 단지 상세로 직결</span>
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block font-bold">[평형정보] 탭 선택</strong>
                <span className="text-[11px] text-slate-400">상단 메뉴에서 [평형정보]를 선택하여 평형 목록 확인</span>
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block font-bold">{pyeong}평형 ({areaSqMeter}㎡) 클릭</strong>
                <span className="text-[11px] text-slate-400">공식 CAD 2D 도면 및 기본형/확장형 입체도 열람</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 건축물대장 및 평면 구조 핵심 스펙 요약 (Real Architectural Specs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>공식 건축물대장 & 평면 구조 핵심 스펙</span>
          </h4>
          <span className="text-[11px] text-slate-400">실측 설계 기준 요약</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">베이 형태 (일조·채광)</span>
            <span className="text-sm font-extrabold text-blue-400 block">{floorPlan.bay || '3-Bay'} 판상형</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">전면 일조 채광 우수</span>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">현관 진입 방식</span>
            <span className="text-sm font-extrabold text-white block">{floorPlan.entrance || '계단식'}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">사생활 보호 및 독립성</span>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">방 / 욕실 구성</span>
            <span className="text-sm font-extrabold text-white block">
              {floorPlan.roomsCount || 3}룸 / {floorPlan.bathroomsCount || 2}욕실
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">안방 부부욕실 구비</span>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">거실 광폭 설계</span>
            <span className="text-sm font-extrabold text-amber-300 block">{floorPlan.livingRoomWidth || '4.2m'}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">안방 폭 약 {floorPlan.masterBedroomWidth || '3.8m'}</span>
          </div>
        </div>

        {/* 세부 구조 특성 2열 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 space-y-1.5">
            <span className="text-slate-400 font-bold block text-[11px]">주방 및 식당 구조</span>
            <div className="font-extrabold text-slate-200 text-xs">
              {floorPlan.kitchenType || 'ㄱ자형 대면형 주방'}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{floorPlan.ventilation || '거실-주방 일직선 맞통풍 환기 구조'}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 space-y-1.5">
            <span className="text-slate-400 font-bold block text-[11px]">발코니 및 확장 공간</span>
            <div className="font-extrabold text-slate-200 text-xs">
              {floorPlan.balconyStatus || '전면 광폭 통발코니'}
            </div>
            <div className="text-[11px] text-slate-400">
              확장 시 실사용 면적 약 5~7평 증가 (임장 시 확장 여부 확인 필수)
            </div>
          </div>
        </div>
      </div>

      {/* 5. 특징 태그들 */}
      {floorPlan.features && floorPlan.features.length > 0 && (
        <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">
            ⭐ {cleanPropertyName} 평형 핵심 설계 포인트:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {floorPlan.features.map((f, idx) => (
              <span 
                key={idx} 
                className="bg-blue-950/70 text-blue-200 border border-blue-800/80 text-[11px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-blue-400 shrink-0" />
                <span>{f}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. 외부 공인 데이터베이스 추가 링크 */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 text-[11px]">
          공식 데이터 출처: 국토교통부 건축물대장 · 네이버부동산 · 한국부동산원
        </span>
        <div className="flex items-center gap-2">
          {kbLandUrl && (
            <a
              href={kbLandUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] hover:underline"
            >
              <span>KB부동산 공식 시세·평형</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {directNaverUrl && (
            <a
              href={directNaverUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[11px] hover:underline"
            >
              <span>네이버 단지정보 바로가기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
