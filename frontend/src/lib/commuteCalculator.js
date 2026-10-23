/**
 * 2026 수도권 신혼·출산가구 맞벌이 부부 5대 주요 업무지구(Hub) 통근 시간 & 직주근접 분석 엔진
 *
 * [5대 핵심 업무지구]
 * - GBD (강남·역삼·선릉·삼성): 2호선·신분당선·7호선·9호선·수인분당선 축
 * - CBD (광화문·종로·시청·을지로): 1호선·2호선·3호선·4호선·5호선·경의중앙선 축
 * - YBD (여의도·영등포·공덕): 5호선·9호선·1호선·신림선·경의중앙선(공덕) 축
 * - MAGOK_DMC (마곡·상암DMC·가산디지털): 5호선·9호선·6호선·공항철도·김포골드·1/7호선 서남권 축
 * - PANGYO (판교·분당 테크노밸리): 신분당선·경강선·수인분당선·8호선 축
 *
 * 통근 시간 산출 = [단지 ↔ 지하철역 접근 시간(도보/마을버스)] + [전철·환승 실소요 시간]
 */

export const WORKPLACE_HUBS = [
  {
    id: 'NONE',
    shortName: '선택 안 함',
    name: '선택 안 함',
    stationLabel: '-',
    badgeColor: 'slate',
  },
  {
    id: 'GBD',
    shortName: '강남·역삼 (GBD)',
    name: '강남·역삼·선릉·삼성 (GBD)',
    stationLabel: '강남역·역삼역·삼성역·강남구청역',
    badgeColor: 'indigo',
  },
  {
    id: 'CBD',
    shortName: '광화문·종로 (CBD)',
    name: '광화문·종로·시청·을지로 (CBD)',
    stationLabel: '광화문역·종각역·시청역·을지로입구역',
    badgeColor: 'blue',
  },
  {
    id: 'YBD',
    shortName: '여의도·공덕 (YBD)',
    name: '여의도·영등포·마포공덕 (YBD)',
    stationLabel: '여의도역·국회의사당역·공덕역',
    badgeColor: 'emerald',
  },
  {
    id: 'MAGOK_DMC',
    shortName: '마곡·상암·가산',
    name: '마곡지구·상암DMC·가산디지털단지',
    stationLabel: '마곡나루역·디지털미디어시티역·가산디지털단지역',
    badgeColor: 'violet',
  },
  {
    id: 'PANGYO',
    shortName: '판교·분당 (IT)',
    name: '판교·분당 테크노밸리',
    stationLabel: '판교역·정자역·서현역',
    badgeColor: 'amber',
  },
];

export const COMMUTE_LIMIT_OPTIONS = [
  { value: 0, label: '통근시간 전체' },
  { value: 35, label: '⚡ 35분 이내 (초직주근접)' },
  { value: 45, label: '🚇 45분 이내 (쾌적 통근권)' },
  { value: 60, label: '🕐 60분 이내 (1시간 통근권)' },
  { value: 75, label: '🚋 75분 이내 (수도권 광역권)' },
];

/**
 * 구/시·동 및 주요 노선별 지하철 탑승 후 5대 업무지구까지 평균 전철 소요 시간(분, 환승 대기 4분 포함)
 * + 대표 환승 경로 요약
 */
const STATION_TRANSIT_MATRIX = [
  // ================= 서울 동북권 =================
  {
    match: ['창동역'],
    times: { GBD: 44, CBD: 28, YBD: 38, MAGOK_DMC: 46, PANGYO: 58 },
    routes: {
      GBD: '4호선 → 노원(7호선) 또는 사당(2호선)',
      CBD: '4호선·1호선 직통 (동대문·종로·시청)',
      YBD: '1호선 → 신길(5호선) / 4호선 → 삼각지·동작',
      MAGOK_DMC: '4호선 → 동대문역사(5호선) / 1호선 직통(가산)',
      PANGYO: '4호선 → 이촌(경의중앙) / 왕십리·강남 환승',
    },
  },
  {
    match: ['노원역'],
    times: { GBD: 38, CBD: 31, YBD: 42, MAGOK_DMC: 48, PANGYO: 54 },
    routes: {
      GBD: '7호선 직통 (강남구청·논현·반포 무환승!)',
      CBD: '4호선 직통 (혜화·동대문·충무로·명동)',
      YBD: '7호선 → 고속터미널(9호선 급행)',
      MAGOK_DMC: '7호선 직통 (가산디지털) / 6호선 환승(DMC)',
      PANGYO: '7호선 → 강남구청(수인분당)·논현(신분당)',
    },
  },
  {
    match: ['중계역', '하계역', '공릉', '태릉입구'],
    times: { GBD: 34, CBD: 32, YBD: 40, MAGOK_DMC: 45, PANGYO: 50 },
    routes: {
      GBD: '7호선 직통 (강남구청·학동·논현 무환승!)',
      CBD: '7호선 → 군자(5호선) / 6호선 → 청구·동묘앞',
      YBD: '7호선 → 고속터미널(9호선 급행)·보라매',
      MAGOK_DMC: '6호선 태릉입구 → DMC 직통 / 7호선 가산 직통',
      PANGYO: '7호선 → 논현(신분당선 판교 직결)',
    },
  },
  {
    match: ['석계역', '돌곶이역'],
    times: { GBD: 38, CBD: 24, YBD: 34, MAGOK_DMC: 38, PANGYO: 52 },
    routes: {
      GBD: '6호선 → 태릉입구(7호선) / 1호선 → 왕십리(분당선)',
      CBD: '1호선 직통 (종로3가·종각·시청 20분대!)',
      YBD: '6호선 → 공덕(5·9호선) / 1호선 → 신길',
      MAGOK_DMC: '6호선 직통 (디지털미디어시티 무환승)',
      PANGYO: '6호선 → 약수(3호선)·신사(신분당선)',
    },
  },
  {
    match: ['솔샘역', '북한산보국문역', '정릉역', '솔밭공원역'],
    times: { GBD: 44, CBD: 28, YBD: 38, MAGOK_DMC: 44, PANGYO: 56 },
    routes: {
      GBD: '우이신설선 → 성신여대(4호선)·보문(6호선)·신설동(2호선)',
      CBD: '우이신설선 → 성신여대(4호선)·보문·신설동(1·2호선)',
      YBD: '우이신설선 → 신설동(1호선)·보문(6호선 공덕)',
      MAGOK_DMC: '우이신설선 → 보문(6호선 DMC)',
      PANGYO: '우이신설선 → 성신여대(4호선) → 신분당선 환승',
    },
  },
  {
    match: ['미아사거리역', '길음역', '한성대입구역', '성신여대입구역', '수유역', '쌍문역'],
    times: { GBD: 39, CBD: 22, YBD: 34, MAGOK_DMC: 42, PANGYO: 52 },
    routes: {
      GBD: '4호선 → 동대문역사(2호선) / 사당(2호선)',
      CBD: '4호선 직통 (혜화·동대문·명동·회현) + 종로 환승',
      YBD: '4호선 → 충무로·동대문역사(5호선) / 동작(9호선)',
      MAGOK_DMC: '4호선 → 삼각지(6호선 DMC) / 사당·대림(가산)',
      PANGYO: '4호선 → 충무로(3호선)·신사(신분당선)',
    },
  },
  {
    match: ['방학역', '도봉역', '도봉산역', '녹천역'],
    times: { GBD: 45, CBD: 31, YBD: 41, MAGOK_DMC: 49, PANGYO: 59 },
    routes: {
      GBD: '7호선 도봉산역 직통 / 1호선 → 창동·노원 환승',
      CBD: '1호선 직통 (종로·시청 무환승)',
      YBD: '1호선 → 신길(5호선)·노량진(9호선)',
      MAGOK_DMC: '1호선 직통(가산디지털) / 6호선 환승(DMC)',
      PANGYO: '7호선 → 논현(신분당선)',
    },
  },
  {
    match: ['봉화산역', '신내역', '양원역'],
    times: { GBD: 36, CBD: 32, YBD: 42, MAGOK_DMC: 46, PANGYO: 50 },
    routes: {
      GBD: '6호선 → 태릉입구(7호선 강남구청 직통)',
      CBD: '6호선 → 동묘앞(1호선)·청구(5호선) / 경의중앙 왕십리',
      YBD: '6호선 → 공덕역 직통 / 경의중앙선 용산·공덕',
      MAGOK_DMC: '6호선 직통 (DMC 무환승) / 7호선 가산',
      PANGYO: '7호선 환승 → 논현(신분당선)',
    },
  },
  {
    match: ['사가정역', '면목역', '중랑역', '장한평역'],
    times: { GBD: 24, CBD: 26, YBD: 34, MAGOK_DMC: 42, PANGYO: 40 },
    routes: {
      GBD: '7호선 직통 (건대입구·청담·강남구청·논현 20분대!)',
      CBD: '5호선 장한평 직통 (광화문·종로3가) / 7호선→군자(5호선)',
      YBD: '5호선 직통 (여의도) / 7호선 → 고속터미널(9호선)',
      MAGOK_DMC: '5호선(마곡) / 7호선 직통(가산디지털)',
      PANGYO: '7호선 → 논현(신분당선 판교 18분)',
    },
  },
  {
    match: ['외대앞역', '신이문역', '제기동역', '고려대역'],
    times: { GBD: 32, CBD: 19, YBD: 29, MAGOK_DMC: 37, PANGYO: 46 },
    routes: {
      GBD: '1호선 → 왕십리(수인분당선 선릉)·시청(2호선)',
      CBD: '1호선 직통 (종로5가·종각·시청 15~20분!)',
      YBD: '1호선 → 신길(5호선)·노량진(9호선) / 6호선 공덕',
      MAGOK_DMC: '6호선 고려대 → DMC 직통 / 1호선 가산 직통',
      PANGYO: '왕십리(수인분당선) / 신사(신분당선)',
    },
  },

  // ================= 서울 서북·서부권 =================
  {
    match: ['불광역', '구파발역', '홍제역', '무악재역'],
    times: { GBD: 36, CBD: 18, YBD: 28, MAGOK_DMC: 24, PANGYO: 48 },
    routes: {
      GBD: '3호선 직통 (압구정·신사·고속터미널·교대·양재 무환승!)',
      CBD: '3호선 직통 (경복궁·안국·종로3가·을지로3가 15분대!)',
      YBD: '3호선 → 종로3가(5호선) / 6호선 불광 → 공덕',
      MAGOK_DMC: '6호선 불광 → DMC 10분대! / 공항철도 마곡나루',
      PANGYO: '3호선 → 신사역(신분당선 판교 직통)',
    },
  },
  {
    match: ['새절역', '응암역', '가좌역', '증산역'],
    times: { GBD: 40, CBD: 24, YBD: 24, MAGOK_DMC: 14, PANGYO: 52 },
    routes: {
      GBD: '6호선 → 합정(2호선)·약수(3호선) / 경의중앙 → 홍대(2호선)',
      CBD: '경의중앙선 서울역 직통 / 6호선 → 공덕(5호선 광화문)',
      YBD: '6호선 → 공덕(5호선 여의도 2정거장) / 서부선 직결 호재',
      MAGOK_DMC: '6호선·경의중앙선 디지털미디어시티(DMC) 5~8분 초인접!',
      PANGYO: '6호선 → 공덕·신사(신분당선)',
    },
  },

  // ================= 서울 서남권 =================
  {
    match: ['남구로역', '대림역', '신풍역'],
    times: { GBD: 26, CBD: 29, YBD: 18, MAGOK_DMC: 12, PANGYO: 42 },
    routes: {
      GBD: '2호선·7호선 직통 (강남역·역삼역·반포·논현 20분대 무환승!)',
      CBD: '2호선 직통 (시청·을지로입구) / 1호선 환승',
      YBD: '7호선 → 보라매(신림선 여의도) / 신안산선 여의도 직결!',
      MAGOK_DMC: '7호선 가산디지털단지 1~2정거장(5분!) / 2호선→까치산(5호선 마곡)',
      PANGYO: '2호선 강남역 → 신분당선 판교역 (15분)',
    },
  },
  {
    match: ['개봉역', '오류동역', '금천구청역', '시흥사거리'],
    times: { GBD: 34, CBD: 32, YBD: 22, MAGOK_DMC: 15, PANGYO: 46 },
    routes: {
      GBD: '1호선 → 신도림(2호선 강남 직통) / 가산디지털(7호선)',
      CBD: '1호선 급행·완행 직통 (서울역·시청·종각 무환승)',
      YBD: '1호선 → 노량진(9호선)·신길(5호선) / 신안산선 여의도 직결',
      MAGOK_DMC: '1호선 가산디지털단지역 5~10분 직통!',
      PANGYO: '1호선 금천구청·가산 → 강남(신분당선)',
    },
  },
  {
    match: ['서울대입구역', '낙성대역', '서울대벤처타운역', '숭실대입구역', '남성역'],
    times: { GBD: 18, CBD: 28, YBD: 19, MAGOK_DMC: 24, PANGYO: 32 },
    routes: {
      GBD: '2호선(서울대입구·낙성대)·7호선(숭실대·남성) 강남 15~20분 직통!',
      CBD: '2호선 → 사당(4호선)·시청 직통',
      YBD: '신림선(서울대벤처타운→샛강/여의도 직통!) / 7호선→보라매',
      MAGOK_DMC: '2·7호선 가산디지털단지 15분대 직통',
      PANGYO: '2호선 강남역 → 신분당선 판교역 30분대!',
    },
  },
  {
    match: ['방화역', '개화산역'],
    times: { GBD: 38, CBD: 36, YBD: 22, MAGOK_DMC: 10, PANGYO: 54 },
    routes: {
      GBD: '5호선 → 김포공항(9호선 급행 신논현·선정릉 직통!)',
      CBD: '5호선 직통 (광화문·종로3가 무환승)',
      YBD: '5호선·9호선 급행 직통 (여의도 20분대!)',
      MAGOK_DMC: '5호선 마곡역·발산역 5~8분 초근접 직주근접!',
      PANGYO: '9호선 급행 → 신논현·양재(신분당선)',
    },
  },
  {
    match: ['신정네거리역', '까치산역'],
    times: { GBD: 32, CBD: 30, YBD: 18, MAGOK_DMC: 16, PANGYO: 46 },
    routes: {
      GBD: '2호선 신도림 직결 (강남·역삼·삼성 직통)',
      CBD: '5호선 까치산 직통 (광화문·여의도 무환승)',
      YBD: '5호선 까치산 → 여의도 15분 직통!',
      MAGOK_DMC: '5호선 마곡 직통 (12분) / 2호선 구로·가산 인접',
      PANGYO: '2호선 강남 → 신분당선 판교',
    },
  },

  // ================= 서울 동남·강동권 =================
  {
    match: ['암사역', '암사역사공원역', '굽은다리역'],
    times: { GBD: 24, CBD: 35, YBD: 38, MAGOK_DMC: 52, PANGYO: 32 },
    routes: {
      GBD: '8호선 → 잠실(2호선 삼성·선릉·강남 20분대 직결!)',
      CBD: '5호선 직통 (광화문·종로3가·을지로4가 무환승)',
      YBD: '5호선 직통 / 8호선 → 석촌(9호선 급행 여의도)',
      MAGOK_DMC: '5호선·9호선 급행 환승',
      PANGYO: '8호선 직통 (모란·복정 → 판교 테크노밸리 쾌속 접근!)',
    },
  },

  // ================= 경기 남부권 (수지·영통·안양·산본·광명·시흥) =================
  {
    match: ['수지구청역'],
    times: { GBD: 26, CBD: 46, YBD: 44, MAGOK_DMC: 54, PANGYO: 12 },
    routes: {
      GBD: '신분당선 직통 (강남·양재·신논현·신사 25분 무환승!)',
      CBD: '신분당선 → 신사(3호선 종로3가·경복궁)',
      YBD: '신분당선 → 신논현(9호선 급행 여의도)',
      MAGOK_DMC: '신분당선 → 강남·신논현 환승',
      PANGYO: '신분당선 판교역 12분 초특급 직통!',
    },
  },
  {
    match: ['매교역', '청명역', '망포역'],
    times: { GBD: 42, CBD: 54, YBD: 52, MAGOK_DMC: 56, PANGYO: 28 },
    routes: {
      GBD: '수인분당선 → 정자(신분당선 강남) / 선릉 직통',
      CBD: '수인분당선 수원역 → 1호선 급행·KTX 서울역',
      YBD: '수인분당선 → 정자(신분당)·신논현(9호선)',
      MAGOK_DMC: '1호선 수원역 급행 → 가산디지털단지',
      PANGYO: '수인분당선 → 정자·이매(판교역 25분대!)',
    },
  },
  {
    match: ['평촌역', '범계역', '안양역', '금정역', '산본역'],
    times: { GBD: 31, CBD: 39, YBD: 32, MAGOK_DMC: 22, PANGYO: 29 },
    routes: {
      GBD: '4호선 → 사당(2호선 강남·역삼 25~30분대!)',
      CBD: '4호선 직통 (서울역·명동·충무로) / 1호선 급행',
      YBD: '4호선 → 동작(9호선)·금정(1호선 노량진·신길)',
      MAGOK_DMC: '1호선 안양·금정 → 가산디지털단지 15분 직통!',
      PANGYO: '인덕원·범계 ↔ 판교 광역버스 / 월판선(예정) 15분대',
    },
  },
  {
    match: ['철산역', '독산역'],
    times: { GBD: 28, CBD: 32, YBD: 22, MAGOK_DMC: 8, PANGYO: 40 },
    routes: {
      GBD: '7호선 철산 직통 (고속터미널·반포·논현·강남구청 무환승!)',
      CBD: '1호선 독산 직통 (서울역·시청) / 7호선→온수·신도림',
      YBD: '7호선 → 보라매(신림선 여의도) / 1호선 노량진·신길',
      MAGOK_DMC: '7호선·1호선 가산디지털단지역 1정거장(3~5분 초직주근접!)',
      PANGYO: '7호선·1호선 → 강남(신분당선) / 광명역 연계',
    },
  },
  {
    match: ['오이도역'],
    times: { GBD: 54, CBD: 62, YBD: 52, MAGOK_DMC: 44, PANGYO: 52 },
    routes: {
      GBD: '4호선 → 사당(2호선) / 광역버스 사당·강남 직행',
      CBD: '4호선 직통 (서울역·명동)',
      YBD: '4호선·서해선(초지) → 김포공항·신안산선 연계',
      MAGOK_DMC: '4호선 → 금정(1호선 가산디지털) / 서해선 김포공항(마곡)',
      PANGYO: '수인분당선 / 제3경인고속도로 광역노선',
    },
  },

  // ================= 경기 서북·서부권 (고양·일산·김포·부천) =================
  {
    match: ['행신역'],
    times: { GBD: 46, CBD: 28, YBD: 29, MAGOK_DMC: 16, PANGYO: 58 },
    routes: {
      GBD: '경의중앙선 → 홍대입구(2호선)·공덕(9호선 급행) / 대곡(GTX-A)',
      CBD: '경의중앙선(서울역 급행)·KTX / 대곡역(GTX-A 서울역 15분!)',
      YBD: '경의중앙선 → 공덕역(5호선 여의도)·용산 직통',
      MAGOK_DMC: '경의중앙선 디지털미디어시티(DMC) 12분 직통 / 서해선 김포공항(마곡)',
      PANGYO: '경의중앙선·GTX-A → 서울역·신사(신분당선)',
    },
  },
  {
    match: ['백석역', '주엽역'],
    times: { GBD: 48, CBD: 36, YBD: 38, MAGOK_DMC: 24, PANGYO: 58 },
    routes: {
      GBD: '3호선 → 대곡(GTX-A)·신사·고속터미널 직통',
      CBD: '3호선 직통(경복궁·종로3가) / GTX-A 킨텍스·대곡→서울역 16분!',
      YBD: '3호선 → 대곡(서해선 김포공항→9호선 급행 여의도)',
      MAGOK_DMC: '3호선 → 대곡(서해선 김포공항·마곡 15분 / 경의중앙 DMC)',
      PANGYO: 'GTX-A / 3호선 → 신사(신분당선)',
    },
  },
  {
    match: ['풍무역', '장기역'],
    times: { GBD: 44, CBD: 38, YBD: 28, MAGOK_DMC: 16, PANGYO: 58 },
    routes: {
      GBD: '김포골드라인 → 김포공항(9호선 급행 신논현·선정릉 직통!)',
      CBD: '김포골드라인 → 김포공항(공항철도 서울역 22분·5호선 광화문)',
      YBD: '김포골드라인 → 김포공항(9호선 급행 여의도 15분·5호선 직통!)',
      MAGOK_DMC: '김포골드라인 → 김포공항(마곡나루 1정거장 3분! / DMC 공항철도)',
      PANGYO: '9호선 급행 → 신논현(신분당선 판교)',
    },
  },
  {
    match: ['부천시청역', '상동역', '신중동역'],
    times: { GBD: 38, CBD: 40, YBD: 29, MAGOK_DMC: 22, PANGYO: 52 },
    routes: {
      GBD: '7호선 직통 (고속터미널·반포·논현·강남구청 무환승!)',
      CBD: '7호선 → 온수(1호선)·부평구청 / 1호선 급행 연계',
      YBD: '7호선 → 보라매(신림선)·대림 / 송내(1호선 급행 노량진·신길)',
      MAGOK_DMC: '7호선 가산디지털단지 18분 직통! / 서해선 부천종합운동장→김포공항(마곡)',
      PANGYO: '7호선 → 논현(신분당선 판교)',
    },
  },
  {
    match: ['중동역', '소사역'],
    times: { GBD: 39, CBD: 36, YBD: 26, MAGOK_DMC: 18, PANGYO: 52 },
    routes: {
      GBD: '1호선 → 신도림(2호선 강남) / 7호선 온수·부천종합운동장',
      CBD: '1호선 직통 (서울역·시청·종각 무환승)',
      YBD: '1호선 → 노량진(9호선)·신길(5호선 여의도 20분대!)',
      MAGOK_DMC: '서해선 소사역 → 김포공항(마곡) 12분 직통! / 1호선 가산 인접',
      PANGYO: '1호선 → 신도림(2호선 강남→신분당선)',
    },
  },

  // ================= 경기 동북권 (다산·구리·의정부) =================
  {
    match: ['다산역', '구리역'],
    times: { GBD: 28, CBD: 36, YBD: 40, MAGOK_DMC: 52, PANGYO: 36 },
    routes: {
      GBD: '8호선 별내선 직통 → 잠실역(2호선 삼성·선릉·강남 25분대!)',
      CBD: '8호선 → 천호(5호선 광화문) / 경의중앙선 구리→청량리·왕십리',
      YBD: '8호선 → 천호(5호선 여의도) / 석촌(9호선 급행 여의도)',
      MAGOK_DMC: '8호선·9호선 급행 / 경의중앙선 DMC 직통',
      PANGYO: '8호선 별내선 직통 (잠실·가락시장·복정·모란 → 판교 테크노밸리!)',
    },
  },
  {
    match: ['회룡역', '어룡역'],
    times: { GBD: 48, CBD: 36, YBD: 46, MAGOK_DMC: 54, PANGYO: 60 },
    routes: {
      GBD: '1호선 회룡 → 도봉산(7호선 강남구청·논현 직통) / 의정부 GTX-C 예정',
      CBD: '1호선 직통 (종로·시청 무환승)',
      YBD: '1호선 → 신길(5호선)·노량진(9호선)',
      MAGOK_DMC: '7호선 도봉산 → 태릉입구(6호선 DMC)',
      PANGYO: '7호선 → 논현(신분당선)',
    },
  },

  // ================= 인천권 (부평·계양·서구·남동·연수·미추홀) =================
  {
    match: ['산곡역', '굴포천역', '부평역'],
    times: { GBD: 44, CBD: 44, YBD: 34, MAGOK_DMC: 26, PANGYO: 58 },
    routes: {
      GBD: '7호선 직통 (굴포천·산곡 → 고속터미널·논현·강남구청 무환승!)',
      CBD: '1호선 부평 특급·급행 직통 (용산·서울역·시청)',
      YBD: '1호선 부평 급행 → 노량진(9호선)·신길(5호선) 30분대!',
      MAGOK_DMC: '7호선 가산디지털단지 24분 직통 / 부평구청(인천1)→계양(공항철도 마곡)',
      PANGYO: '7호선 → 논현(신분당선)',
    },
  },
  {
    match: ['작전역', '가정역', '아라역'],
    times: { GBD: 46, CBD: 38, YBD: 32, MAGOK_DMC: 20, PANGYO: 58 },
    routes: {
      GBD: '인천1호선 → 계양(공항철도) → 김포공항(9호선 급행 신논현)',
      CBD: '계양역·검단(공항철도) → 서울역 28분 직통 / 공덕(5호선 광화문)',
      YBD: '계양역(공항철도) → 김포공항(9호선 급행 여의도)·공덕(5호선) / 청라BRT',
      MAGOK_DMC: '계양역(공항철도) → 마곡나루역 10분·DMC역 18분 초쾌속 직통!',
      PANGYO: '공항철도·9호선 급행 → 신논현(신분당선)',
    },
  },
  {
    match: ['인천시청역', '원인재역', '소래포구역', '인하대역'],
    times: { GBD: 54, CBD: 52, YBD: 42, MAGOK_DMC: 36, PANGYO: 58 },
    routes: {
      GBD: '인천1호선 → 부평구청(7호선 강남 직통) / 광역버스 강남역 직행',
      CBD: '인천1호선 → 부평(1호선 특급·급행 서울역) / GTX-B 인천시청 확정',
      YBD: '1호선 급행 → 노량진·신길 / GTX-B 여의도 직결 호재',
      MAGOK_DMC: '인천1호선 → 부평구청(7호선 가산) / 계양(공항철도 마곡)',
      PANGYO: '수인분당선(원인재·소래포구·인하대) / 제2경인 광역버스 판교행',
    },
  },
];

/**
 * 단지 subwayDistance 텍스트에서 지하철역까지 도보/마을버스 접근 시간(분) 추출
 */
export function parseStationWalkMinutes(subwayDistance = '') {
  if (!subwayDistance) return 7;
  // "도보 3분" 패턴 우선 추출
  const walkMatch = subwayDistance.match(/도보\s*(\d+)/);
  if (walkMatch) {
    return Math.min(Math.max(Number(walkMatch[1]), 2), 18);
  }
  // "버스 5분", "마을버스 5분" 패턴일 경우 (버스 대기+이동 감안 +4분)
  const busMatch = subwayDistance.match(/버스\s*(\d+)/);
  if (busMatch) {
    return Math.min(Math.max(Number(busMatch[1]) + 4, 6), 18);
  }
  return 8;
}

/**
 * 단지의 지하철역·자치구 기반으로 5대 업무지구 통근 시간(Door-to-Door 근사) 계산
 */
export function calculatePropertyCommute(property) {
  const stationText = `${property.subwayStation || ''} ${property.district || ''} ${property.dong || ''}`;
  const walkMins = parseStationWalkMinutes(property.subwayDistance);

  // 매칭되는 노선 프로파일 탐색
  let matchedProfile = STATION_TRANSIT_MATRIX.find((entry) =>
    entry.match.some((keyword) => stationText.includes(keyword))
  );

  // 혹시 매칭되지 않으면 권역 기본값
  if (!matchedProfile) {
    matchedProfile = {
      times: { GBD: 42, CBD: 35, YBD: 36, MAGOK_DMC: 38, PANGYO: 50 },
      routes: {
        GBD: '인근 역세권 → 강남권 환승 노선',
        CBD: '인근 역세권 → 광화문·시청 환승 노선',
        YBD: '인근 역세권 → 여의도 환승 노선',
        MAGOK_DMC: '인근 역세권 → 마곡·DMC·가산 노선',
        PANGYO: '인근 역세권 → 판교 테크노밸리 노선',
      },
    };
  }

  const byHub = {};
  ['GBD', 'CBD', 'YBD', 'MAGOK_DMC', 'PANGYO'].forEach((hubId) => {
    const transitMinutes = matchedProfile.times[hubId];
    const totalMinutes = walkMins + transitMinutes;
    byHub[hubId] = {
      hubId,
      walkMinutes: walkMins,
      transitMinutes,
      totalMinutes,
      routeSummary: matchedProfile.routes[hubId],
      grade:
        totalMinutes <= 30
          ? '초직주근접'
          : totalMinutes <= 45
          ? '쾌적통근'
          : totalMinutes <= 60
          ? '1시간권'
          : '광역통근',
    };
  });

  // 5대 업무지구 중 가장 빠른 업무지구 찾기
  const bestHubId = ['GBD', 'CBD', 'YBD', 'MAGOK_DMC', 'PANGYO'].reduce((best, cur) =>
    byHub[cur].totalMinutes < byHub[best].totalMinutes ? cur : best
  );

  return {
    walkMinutes: walkMins,
    byHub,
    bestHubId,
    bestHubMinutes: byHub[bestHubId].totalMinutes,
  };
}

/**
 * 부부 선택 업무지구(myHub, spouseHub)에 따른 맞벌이 통근 평가
 */
export function evaluateCoupleCommute(commuteInfo, myHub = 'NONE', spouseHub = 'NONE') {
  if (!commuteInfo?.byHub) return null;

  const activeHubs = [];
  if (myHub && myHub !== 'NONE' && commuteInfo.byHub[myHub]) {
    const hubMeta = WORKPLACE_HUBS.find((h) => h.id === myHub);
    activeHubs.push({
      role: '본인',
      hubId: myHub,
      shortName: hubMeta?.shortName || myHub,
      ...commuteInfo.byHub[myHub],
    });
  }
  if (spouseHub && spouseHub !== 'NONE' && commuteInfo.byHub[spouseHub]) {
    const hubMeta = WORKPLACE_HUBS.find((h) => h.id === spouseHub);
    activeHubs.push({
      role: '배우자',
      hubId: spouseHub,
      shortName: hubMeta?.shortName || spouseHub,
      ...commuteInfo.byHub[spouseHub],
    });
  }

  if (activeHubs.length === 0) {
    return {
      isActive: false,
      activeHubs: [],
      maxMinutes: commuteInfo.bestHubMinutes,
      avgMinutes: commuteInfo.bestHubMinutes,
      totalDailyRoundTripMinutes: commuteInfo.bestHubMinutes * 2,
      diffMinutes: 0,
    };
  }

  const mins = activeHubs.map((h) => h.totalMinutes);
  const maxMinutes = Math.max(...mins);
  const avgMinutes = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
  const diffMinutes = activeHubs.length === 2 ? Math.abs(mins[0] - mins[1]) : 0;

  return {
    isActive: true,
    activeHubs,
    maxMinutes,
    avgMinutes,
    diffMinutes,
    balanceGrade:
      activeHubs.length === 2
        ? diffMinutes <= 10
          ? '⚖️ 부부 균형 최우수'
          : diffMinutes <= 20
          ? '👍 부부 균형 양호'
          : '💡 한쪽 직장 편중'
        : null,
  };
}
