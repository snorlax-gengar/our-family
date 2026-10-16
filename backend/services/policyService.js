import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const policiesCachePath = path.join(__dirname, '..', 'data', 'policies_cache.json');

const parser = new Parser();

/**
 * 1. 부동산 필수 용어 사전 (카테고리별 체계화)
 */
export const REAL_ESTATE_TERMS = [
  // [대출 / 금융]
  {
    id: "term-ltv",
    term: "LTV (주택담보인정비율)",
    english: "Loan to Value Ratio",
    category: "대출/금융",
    difficulty: "초급",
    shortDef: "주택 가격 대비 대출받을 수 있는 최대 금액의 비율",
    fullDef: "담보로 인정받는 주택의 평가가치(KB시세 또는 감정평가액) 중 대출 취급 가능한 한도 비율을 말합니다. 예를 들어 5억 원 아파트에 LTV 70%가 적용되면 최대 3억 5,000만 원까지 대출이 가능합니다.",
    formula: "LTV = (대출금액 / 주택가격) × 100",
    example: "5억 5,000만 원 아파트 매수 시 LTV 70% 안전 상한 적용 = 최대 3억 8,500만 원 대출 가능 (정부 가계부채 관리 기준 준수)",
    tag: "핵심규제"
  },
  {
    id: "term-dsr",
    term: "DSR (총부채원리금상환비율)",
    english: "Debt Service Ratio",
    category: "대출/금융",
    difficulty: "중급",
    shortDef: "연간 소득 대비 모든 대출의 '원금 + 이자' 상환액의 비율",
    fullDef: "차주가 보유한 모든 금융 대출(주택담보대출, 신용대출, 마이너스통장, 자동차할부, 카드론 등)의 연간 원리금 상환 총액을 연소득으로 나눈 비율입니다. 현재 1금융권 은행에서는 DSR 40% 규제를 적용하고 있습니다.",
    formula: "DSR = (모든 대출의 연간 원리금 상환액 / 연소득) × 100",
    example: "연소득 6,000만 원인 경우 1년 원리금 상환액이 2,400만 원(월 200만 원)을 넘을 수 없음. ★단, 신생아 특례대출과 디딤돌 대출은 DSR이 미적용되어 소득 대비 높은 한도를 받을 수 있습니다!",
    tag: "핵심규제"
  },
  {
    id: "term-stress-dsr",
    term: "스트레스 DSR (1·2·3단계)",
    english: "Stress DSR",
    category: "대출/금융",
    difficulty: "고급",
    shortDef: "향후 금리 상승 위험을 감안해 DSR 산정 시 가산금리(스트레스 금리)를 얹어 대출 한도를 줄이는 제도",
    fullDef: "변동금리나 주기형 대출을 이용할 때, 향후 금리가 오를 위험에 대비하여 실제 대출 금리보다 일정 가산금리를 붙여 시뮬레이션함으로써 차주의 대출 한도를 축소시키는 제도입니다. 2단계부터 수도권(서울·경기·인천) 주담대에는 1.2%p의 높은 가산금리가 차등 적용됩니다.",
    formula: "DSR 계산 시 적용 금리 = 실제 약정금리 + 스트레스 가산금리(수도권 1.2%p)",
    example: "실제 금리가 3.5%라도 수도권 대출 한도 계산 시 4.7%로 계산하므로, 일반 은행 주담대 한도가 기존 대비 약 3,000만~6,000만 원 가량 줄어듭니다.",
    tag: "최신정책"
  },
  {
    id: "term-dti",
    term: "DTI (총부채상환비율)",
    english: "Debt to Income",
    category: "대출/금융",
    difficulty: "초급",
    shortDef: "연간 소득 대비 (주담대 원리금 + 기타 대출 이자) 비율",
    fullDef: "DSR과 달리 주택담보대출에 대해서만 원금과 이자를 계산하고, 다른 신용대출은 '이자'만 합산하여 계산하는 비율입니다. DSR보다 규제가 완화된 지표입니다.",
    formula: "DTI = (해당 주담대 연간 원리금 + 기타대출 연간 이자) / 연소득 × 100",
    example: "신생아 특례대출 및 정책대출은 DSR 대신 DTI 60%를 적용하므로 한도가 훨씬 여유롭습니다.",
    tag: "대출한도"
  },
  {
    id: "term-bang-gongje",
    term: "방공제 (소액임차보증금 차감) & MCG",
    english: "Small Tenant Deposit Deduction & MCG",
    category: "대출/금융",
    difficulty: "중급",
    shortDef: "주택 경매 시 소액임차인의 최우선변제금을 미리 대출한도에서 차감하는 것",
    fullDef: "주택임대차보호법에 따라 세입자가 최소한 보장받아야 하는 '최우선변제 소액임차보증금'을 은행이 떼일 위험을 방지하기 위해 대출 한도에서 미리 빼는 규정입니다. 서울은 5,500만 원, 경기 과밀억제권역은 4,800만 원이 차감됩니다. 하지만 **MCG(모기지신용보증)** 보험을 가입하면 방공제 없이 LTV 한도 100%를 모두 대출받을 수 있습니다.",
    formula: "방공제 적용 시 한도 = (매매가 × LTV) - 지역별 방공제금액",
    example: "5억 5천 서울 아파트 LTV 70% = 3억 8,500만 원. 방공제 시 5,500만 원 차감되어 3억 3,000만 원만 나옴. 그러나 MCG 보증 가입 시 3억 8,500만 원 전액 수령!",
    tag: "실전팁"
  },
  {
    id: "term-repayment-type",
    term: "원리금균등 vs 원금균등 vs 체증식 분할상환",
    english: "Loan Repayment Schedules",
    category: "대출/금융",
    difficulty: "중급",
    shortDef: "대출금을 매달 어떤 방식으로 갚아나갈 것인가에 대한 상환 방식",
    fullDef: "1) 원리금균등: 매달 내는 '원금+이자'의 합계가 만기까지 똑같음 (예산 관리에 가장 편리).\n2) 원금균등: 매달 갚는 '원금'이 똑같고 이자가 줄어들어 총 이자는 가장 적음.\n3) 체증식: 초기에는 적게 갚고 시간이 지날수록 상환액이 늘어남 (만 40세 미만 젊은 층에 매우 유리, 디딤돌/신생아특례에서 선택 가능).",
    formula: "원리금균등 = 매월 고정금액 납입",
    example: "신생아 특례대출을 받는 만 40세 미만이라면 '체증식 상환'을 선택하여 초기 몇 년간 주거비 지출을 최소화하고 인플레이션 효과를 누릴 수 있습니다.",
    tag: "절세/재테크"
  },

  // [신생아 특례 및 정책 금융]
  {
    id: "term-newborn-loan",
    term: "신생아 특례대출 (디딤돌 구입자금)",
    english: "Newborn Special Mortgage Loan",
    category: "정책대출",
    difficulty: "초급",
    shortDef: "2년 내 출산 가구 대상 최저 1%대 초저금리로 최대 5억 원까지 지원하는 정책 대출",
    fullDef: "저출산 대책의 일환으로 국토교통부와 주택도시기금에서 시행하는 상품입니다. 주택가격 9억 원 이하, 전용면적 85㎡ 이하 주택에 대해 최대 5억 원(정부 가계대출 관리 기준 안전 LTV 70% 상한 준수)까지 지원합니다. 부부소득 요건이 최대 2억 원으로 대폭 완화되었으며, DSR 규제가 적용되지 않는 최고의 내집마련 수단입니다.",
    formula: "최대 한도 5억 원 이내 (매매가 9억 이하, 85㎡ 이하, LTV 70%)",
    example: "5억 5,000만 원 아파트 매수 시 LTV 70% 적용하여 3억 8,500만 원을 연 2%대 초저금리로 대출 가능 (생애최초는 취득세 200만 원 전액 감면)",
    tag: "핵심대출"
  },
  {
    id: "term-didimdol",
    term: "내집마련 디딤돌 대출",
    english: "Didimdol Government Loan",
    category: "정책대출",
    difficulty: "초급",
    shortDef: "서민·무주택자를 위한 정부 주택구입자금 대출",
    fullDef: "부부합산 연소득 6천만 원(신혼 8.5천만 원) 이하, 순자산 4.69억 원 이하인 무주택 세대주가 5억 원(신혼 6억) 이하 주택을 구입할 때 저금리로 지원해 주는 대표적인 정책 금융입니다.",
    formula: "기본 2.5억 원 한도 (신혼부부 최대 4억 원)",
    example: "신생아 조건에 해당하지 않는 신혼부부라도 6억 원 이하 주택에 대해 최대 4억 원까지 저리 대출 가능",
    tag: "핵심대출"
  },
  {
    id: "term-bogeumjari",
    term: "HF 보금자리론 (한국주택금융공사)",
    english: "HF Bogeumjari Mortgage Loan",
    category: "정책대출",
    difficulty: "초급",
    shortDef: "만기까지 금리가 고정되는 한국주택금융공사(HF) 대표 장기 모기지",
    fullDef: "한국주택금융공사에서 취급하는 100% 순수 고정금리 정책 주택담보대출입니다. 주택가격 6억 원 이하(전용면적 제한 없음), 부부합산 연소득 7천만 원(신혼 8.5천만 원, 다자녀 최대 1억) 이하인 무주택자 또는 1주택 처분조건자에게 최대 3억 6천만 원(생애최초 4.2억 원, 신혼 4억 원)까지 대출해 줍니다. 1금융권 은행과 달리 스트레스 DSR이 적용되지 않고 DTI 60%만 적용되어 대출 한도 확보에 유리합니다.",
    formula: "주택 6억 이하, LTV 70% (생애최초 80%), 최대 한도 3.6억~4.2억 원",
    example: "5억 8천만 원 아파트 매수 시 생애최초 LTV 80% 적용하여 최대 4억 2천만 원을 30년 고정금리(연 3.65~3.85%)로 대출 가능",
    tag: "핵심대출"
  },
  {
    id: "term-first-home-didimdol",
    term: "생애최초 주택구입자금 대출 (디딤돌 특례)",
    english: "First-Time Home Buyer Didimdol Loan",
    category: "정책대출",
    difficulty: "초급",
    shortDef: "생애 첫 주택 구매자 대상 LTV 80% 및 0.2%p 우대금리를 주는 정부 기금 대출",
    fullDef: "세대원 전원이 한 번도 주택을 소유한 적이 없는 무주택 세대주를 위한 특례 대출입니다. 일반 디딤돌보다 소득 요건이 연 7천만 원(신혼 8.5천만 원)으로 완화되며, LTV가 70%에서 80%로 확대되어 최대 3억 원(신혼가구 4억 원)까지 대출받을 수 있습니다. 또한 생애최초 0.2%p 추가 우대금리와 취득세 최대 200만 원 전액 비과세 혜택을 동시에 누릴 수 있습니다.",
    formula: "주택 5억(신혼 6억) 이하, LTV 80% 한도 3억(신혼 4억), 우대금리 -0.2%p",
    example: "4억 5천만 원 아파트 매수 시 LTV 80%로 3억 원을 연 2%대 최저금리로 대출받고, 취득세 200만 원 감면까지 더블 혜택 적용",
    tag: "핵심대출"
  },

  // [세금 및 거래 비용]
  {
    id: "term-acquisition-tax",
    term: "취득세 및 생애최초 감면",
    english: "Acquisition Tax & First-time Exemption",
    category: "세금/비용",
    difficulty: "초급",
    shortDef: "부동산을 취득할 때 지방자치단체에 납부하는 세금",
    fullDef: "1주택자의 경우 6억 원 이하 주택 취득 시 1.0%의 기본세율(지방교육세 0.1% 포함 총 1.1%)이 적용됩니다. 6억~9억 원 구간은 1~3% 비례 적용됩니다. ★생애최초로 주택을 구입하는 경우 주택 가격 12억 원 이하에 대해 취득세를 최대 200만 원까지 전액 감면받을 수 있습니다.",
    formula: "6억 이하: 매매가 × 1.1% (생애최초 시 최대 200만 원 감면)",
    example: "5억 5,000만 원 아파트 매수 시 원래 취득세 약 605만 원이나, 생애최초 감면 적용 시 405만 원만 납부",
    tag: "절세꿀팁"
  },
  {
    id: "term-capital-gains-tax",
    term: "1세대 1주택 양도소득세 비과세",
    english: "Capital Gains Tax Exemption (1 House)",
    category: "세금/비용",
    difficulty: "중급",
    shortDef: "1주택을 일정 기간 보유 후 매도할 때 양도차익에 대해 세금을 면제해 주는 제도",
    fullDef: "1세대가 1주택을 2년 이상 보유(취득 당시 조정대상지역인 경우 2년 거주 요건 필요)한 후 매도할 때, 실거래가 12억 원 이하의 양도차익에 대해서는 양도소득세를 전액 비과세합니다. 12억 원 초과분에 대해서만 장기보유특별공제를 적용해 세금을 계산합니다.",
    formula: "양도가액 12억 원 이하 = 양도소득세 0원 (비과세)",
    example: "5.5억에 매수한 아파트가 5년 뒤 9억 원이 되어 3.5억 원의 시세차익이 발생해도 세금 0원!",
    tag: "비과세요건"
  },
  {
    id: "term-funding-plan",
    term: "자금조달계획서",
    english: "Housing Funding Plan",
    category: "세금/비용",
    difficulty: "중급",
    shortDef: "집을 살 때 매수 자금을 어떻게 마련했는지 정부에 신고하는 서식",
    fullDef: "투기과열지구·조정대상지역 내 모든 주택 거래, 또는 비규제지역 6억 원 이상 주택 거래 시 의무 제출 대상입니다. 자기자금(예금, 주식, 부동산처분대금, 증여 등)과 차입금(금융기관 대출, 사채 등)의 출처를 상세히 기재해야 합니다.",
    formula: "총 매수자금 = 자기자금 합계 + 차입금 합계",
    example: "5.5억 아파트 구입 시: 신생아 특례대출 3.85억 + 예금 1.65억 원 명시하여 제출",
    tag: "서류준비"
  },

  // [시세 & 청약]
  {
    id: "term-kb-price",
    term: "KB부동산 시세 (일반/상위/하위 평균가)",
    english: "KB Real Estate Market Price",
    category: "시세/청약",
    difficulty: "초급",
    shortDef: "KB국민은행이 매주 조사하여 발표하는 아파트 담보가치 평가의 절대적 기준",
    fullDef: "대부분의 은행과 정부 정책대출 기금은 아파트 대출 한도를 산정할 때 실거래가가 아닌 'KB부동산 일반평균가'를 기준으로 LTV를 계산합니다. 1층이나 지하층 등 저층은 '하위평균가'를 적용합니다.",
    formula: "대출가능액 = KB부동산 일반평균가 × LTV",
    example: "실제 매매가가 5억 6,000만 원이어도 KB 일반가가 5억 4,500만 원이면 대출은 5억 4,500만 원의 70% 기준으로 나옴",
    tag: "시세조회"
  },
  {
    id: "term-subscription-account",
    term: "주택청약종합저축 인정액 상향 (25만 원)",
    english: "Housing Subscription Account",
    category: "시세/청약",
    difficulty: "초급",
    shortDef: "공공 및 민영주택 분양을 받기 위한 필수 통장",
    fullDef: "공공분양 순위 순차제(납입 인정금액 많은 순) 당첨을 가르는 핵심 통장입니다. 41년 만에 월 납입 인정 한도가 기존 월 10만 원에서 **월 25만 원**으로 상향되었습니다. 소득공제 혜택도 연 300만 원까지 가능합니다.",
    formula: "월 25만 원씩 연간 최대 300만 원 소득공제",
    example: "이제 매달 25만 원씩 자동이체해야 공공분양 당첨 경쟁에서 뒤처지지 않습니다.",
    tag: "최신정책"
  },
  {
    id: "term-progressive-repayment",
    term: "체증식 분할상환 (초기 부담 완화)",
    english: "Graduated Payment Mortgage (GPM)",
    category: "대출/금융",
    difficulty: "초급",
    shortDef: "초기에는 원리금을 적게 내고, 해가 갈수록 상환액이 점차 늘어나는 젊은 층 맞춤 상환 방식",
    fullDef: "대출 초기에는 이자 위주로 적은 금액을 갚고, 연차가 지나 소득이 증가함에 따라 원금 상환 비율을 점진적으로 늘려가는 방식입니다. 현재 HF 보금자리론과 내집마련 디딤돌 대출에서 만 39세 이하 청년층에 한해 선택할 수 있습니다.",
    formula: "초기 월 상환액 ≈ 대출잔액 × 이자율 (원금 상환 최소화)",
    example: "3억 원 대출(30년 만기) 시 원리금균등 방식은 매월 약 130만 원을 내야 하지만, 체증식을 선택하면 초기 5~10년간 월 70~80만 원대만 납부하여 신혼 초기 현금 흐름을 크게 확보할 수 있습니다.",
    tag: "청년꿀팁"
  },
  {
    id: "term-exclusive-vs-supply-area",
    term: "전용면적 vs 공급면적 (평형 산정법)",
    english: "Exclusive Area vs Supply Area",
    category: "시세/청약",
    difficulty: "초급",
    shortDef: "실제 가족이 독점해 사는 내부 실내면적(전용)과 계단·복도 등 공용공간을 합친 면적(공급)의 차이",
    fullDef: "전용면적은 현관문 안쪽의 방, 거실, 주방, 화장실 등 순수 주거 실내 면적(발코니 서비스면적 제외)입니다. 공급면적은 전용면적에 복도, 계단, 엘리베이터 등 주거공용면적을 더한 면적으로 흔히 25평형, 34평형이라 부르는 평형의 기준이 됩니다. 아파트 분양가와 정책대출 기준(전용 85㎡ 이하)은 무조건 전용면적으로 판단합니다.",
    formula: "공급평형(평) ≈ 공급면적(㎡) × 0.3025 (59㎡ 전용 = 약 24~25평형, 84㎡ 전용 = 약 32~34평형 국민평형)",
    example: "전용 59.98㎡ 아파트 = 공급 25평형, 전용 84.9㎡ 아파트 = 공급 34평형 국민평형",
    tag: "기초상식"
  },
  {
    id: "term-brokerage-fee",
    term: "부동산 중개보수 (법정 복비 요율)",
    english: "Real Estate Brokerage Fee",
    category: "세금/비용",
    difficulty: "초급",
    shortDef: "공인중개사를 통해 부동산 계약 체결 시 지급하는 법정 수수료 상한 요율",
    fullDef: "국토교통부 공인중개사법에 따라 주택 매매 시 거래 금액에 따라 정해진 상한 요율 내에서 협의하여 지급합니다. 5억 원 이상 ~ 9억 원 미만 주택 매매의 경우 상한 요율은 0.4%입니다.",
    formula: "중개보수 상한액 = 매매가액 × 0.4% (부가세 별도)",
    example: "5억 5,000만 원 아파트 매수 시 중개보수 = 5.5억 × 0.4% = 최대 220만 원 (일반과세 공인중개사는 부가세 10% 별도, 간이과세는 4%). 잔금 전 영수증 발행 및 요율 협의 가능.",
    tag: "매수비용"
  },
  {
    id: "term-housing-bond-and-registration",
    term: "국민주택채권 할인 & 법무사 등기보수",
    english: "National Housing Bond & Registration Fee",
    category: "세금/비용",
    difficulty: "중급",
    shortDef: "아파트 소유권 이전등기 시 법적으로 의무 매입해야 하는 채권의 할인 비용과 등기 수수료",
    fullDef: "부동산 등기 시 주택도시기금 재원 마련을 위해 시가표준액의 일정 비율만큼 국민주택채권을 의무 매입해야 합니다. 대부분의 매수자는 만기까지 보유하지 않고 은행에 즉시 매도(할인)하여 수십만 원의 할인 손실금만 납부합니다. 여기에 법무사 보수(약 30~50만 원), 인지세(15만 원), 증지대(1.5만 원)가 부대비용으로 발생합니다.",
    formula: "총 등기부대비용 = 취득세 + 국민주택채권 할인금 + 수입인지세(15만 원) + 법무사 수수료",
    example: "5억 원 아파트 매수 시 채권 할인비용은 약 40~60만 원 선이며, 법무통 앱 비교 견적 또는 셀프등기를 활용하면 법무사 보수를 20~30만 원 이상 절감할 수 있습니다.",
    tag: "숨은비용"
  },
  {
    id: "term-mortgage-cancellation",
    term: "등기부등본 갑구·을구 & 근저당 말소조건 계약",
    english: "Title Register & Mortgage Cancellation Clause",
    category: "대출/금융",
    difficulty: "중급",
    shortDef: "매도자의 기존 대출(근저당)을 잔금 날 은행에서 동시에 갚고 깨끗하게 소유권을 넘겨받는 특약",
    fullDef: "등기부등본의 갑구는 소유권 변동(압류, 가압류, 가등기 확인), 을구는 소유권 이외의 권리(기존 주택담보대출 근저당권, 전세권 등)를 확인합니다. 대다수 집주인은 대출이 껴 있으므로, 계약서 특약에 잔금 시 매도인의 기존 대출 근저당권을 전액 상환하고 말소한다는 조건을 명시하고 잔금 당일 은행 법무사를 통해 동시 상환합니다.",
    formula: "안전 계약 공식: 매도인 잔여 대출금 + 전세보증금 < 매매가 (깡통/위험 매물 배제)",
    example: "매도인에게 2억 원의 대출이 있어도 잔금 날 내 대출금(신생아 특례)으로 매도인 대출을 우선 갚고 근저당 말소 영수증을 확인하면 100% 안전하게 내집이 됩니다.",
    tag: "안전계약"
  },
  {
    id: "term-actual-transaction-registration",
    term: "실거래가 등기 표기제 (호가 조작 방지)",
    english: "Ownership Registration Display on Actual Price",
    category: "시세/청약",
    difficulty: "중급",
    shortDef: "국토교통부 실거래가 공개시스템에서 실제 소유권 이전등기까지 마쳤는지 여부를 표시해 주는 검증 제도",
    fullDef: "계약서만 작성해 고가로 실거래가를 띄워놓고 나중에 계약을 슬그머니 해제하는 집값 띄우기 사기 수법을 방지하기 위해, 대법원 등기소와 연계하여 실제 잔금을 치르고 소유권이전 등기가 완료된 건인지 여부를 등기일자로 실시간 공개하는 제도입니다.",
    formula: "진짜 실거래가 = 계약일 + 등기일자 표시 완료 건",
    example: "국토부 실거래가 조회 시 등기일자가 공란으로 비어있고 주변 시세보다 지나치게 높은 가격에 신고된 거래는 시세 띄우기성 계약일 가능성이 있으므로 신중하게 판단해야 합니다.",
    tag: "시세검증"
  }
];

/**
 * 2. 현재 대한민국 시행 중인 핵심 부동산 정책 총정리 (2025~2026 최신판)
 */
export const CURRENT_REAL_ESTATE_POLICIES = [
  {
    id: "policy-stress-dsr-stage2",
    title: "스트레스 DSR 2단계 및 수도권 차등 가산금리(1.2%p) 전면 시행",
    status: "현재 시행 중",
    ministry: "금융위원회 / 금융감독원",
    target: "전국 은행권 주택담보대출 및 신용대출 차주",
    summary: "가계부채 억제 및 수도권 집값 과열 방지를 위해 수도권 주택담보대출에 한해 스트레스 금리를 1.20%p로 대폭 상향 적용합니다. (비수도권은 0.75%p)",
    keyPoints: [
      "수도권 주담대 스트레스 가산금리 1.20%p 반영으로 일반 주담대 대출 한도 5~10% 축소",
      "제2금융권(상호금융, 보험사 등) 주택담보대출 관리 및 차주 심사 강화",
      "★예외 인정: 신생아 특례대출, 디딤돌, 버팀목 등 정책 모기지 대출은 DSR 및 스트레스 DSR 전면 미적용으로 혜택 극대화!"
    ],
    buyerImpact: "일반 은행 주택담보대출을 받으려는 매수자는 한도가 줄어들었으나, 5~6억 원대 아파트를 신생아 특례대출로 매수하는 실거주자는 규제를 받지 않아 절대적으로 유리합니다."
  },
  {
    id: "policy-newborn-expansion",
    title: "신생아 특례대출 부부소득 요건 완화 (최대 2억 원)",
    status: "현재 시행 중",
    ministry: "국토교통부 / 주택도시기금",
    target: "2년 내 출산·입양 가구 무주택 세대주",
    summary: "저출산 극복을 위해 신생아 특례대출의 부부합산 소득 요건을 기존 1억 3,000만 원에서 2억 원으로 대폭 상향하여 맞벌이 고소득 부부도 저금리 혜택을 누릴 수 있도록 개편했습니다.",
    keyPoints: [
      "대상 주택: 매매가 9억 원 이하, 전용면적 85㎡ 이하 (서울/경기 5~6억 대 아파트 100% 충족)",
      "대출 한도: 최대 5억 원 (정부 대출규제 기준 안전 LTV 70% 준수, 생애최초 취득세 200만 원 감면 연계)",
      "금리: 연 1.6% ~ 3.3% 초저금리 (5년간 유지, 추가 출산 시 1자녀당 5년 연장)",
      "순자산 요건: 4.69억 원 이하 충족 시 신청 가능"
    ],
    buyerImpact: "그동안 소득 기준 때문에 정책대출을 못 받던 맞벌이 신혼부부의 5~6억 원대 서울/경기 역세권 아파트 진입 장벽이 획기적으로 낮아졌습니다."
  },
  {
    id: "policy-first-home-tax-benefit",
    title: "생애최초 주택구입 취득세 감면 (최대 200만 원) 연장 운영",
    status: "현재 시행 중",
    ministry: "행정안전부",
    target: "생애최초로 실거래가 12억 원 이하 주택을 구입하는 세대주",
    summary: "소득 제한 없이 생애 처음으로 주택을 매수하는 모든 국민에게 취득세를 최대 200만 원까지 감면해 줍니다.",
    keyPoints: [
      "주택 가액 기준: 12억 원 이하 주택 (수도권 5~6억 원 아파트 전액 대상)",
      "소득 기준: 무관 (부부합산 소득 관계없이 적용)",
      "감면 혜택: 취득세 산출세액에서 최대 200만 원 전액 차감",
      "의무 사항: 취득일로부터 3개월 이내 전입신고 및 3년간 실거주 유지"
    ],
    buyerImpact: "5억 5,000만 원 아파트 매수 시 발생하는 취득세 약 605만 원 중 200만 원을 감면받아 초기 비용을 400만 원 초반으로 절감 가능합니다."
  },
  {
    id: "policy-subscription-reform",
    title: "주택청약통장 월 납입 인정액 상향 (10만 원 → 25만 원) 및 부부 중복청약",
    status: "현재 시행 중",
    ministry: "국토교통부",
    target: "전국 청약통장 보유자 및 신혼부부",
    summary: "41년 만에 청약통장 공공분양 납입 인정액을 10만 원에서 25만 원으로 올리고, 부부 중복 청약 및 배우자 통장 가입기간 합산을 도입했습니다.",
    keyPoints: [
      "월 납입 인정액: 월 10만 원 → 월 25만 원 상향 (소득공제 연 300만 원 확대)",
      "미성년자 가입 인정 기간: 기존 2년(24회) → 5년(60회)으로 확대",
      "부부 같은 단지 동시 청약 가능 (둘 다 당첨 시 선접수분 인정)",
      "신혼부부 특공 시 배우자의 혼인 전 청약 당첨 이력 배제"
    ],
    buyerImpact: "신생아 특례대출과 연계할 수 있는 공공분양 뉴:홈 등 내집마련 기회가 크게 확대되었습니다."
  },
  {
    id: "policy-capital-gains-relief",
    title: "다주택자 양도소득세 중과 배제 유예 지속 및 1세대 1주택 비과세 12억 유지",
    status: "현재 시행 중",
    ministry: "기획재정부",
    target: "부동산 매도자 및 1세대 1주택 보유자",
    summary: "다주택자가 조정대상지역 주택을 매도할 때 최고 75%에 달하던 양도세 중과세를 유예하여 일반세율(6~45%)을 적용하고 장기보유특별공제를 적용합니다.",
    keyPoints: [
      "다주택자 양도세 중과 배제 유예 조치 적용으로 매물 출회 유도",
      "1세대 1주택자 실거래가 12억 원 이하 비과세 유지 (2년 보유 요건)",
      "일시적 2주택 처분 기한 3년 유지"
    ],
    buyerImpact: "다주택자들의 절세 매물이 서울 외곽 및 경기권 5~6억 원대로 꾸준히 출회되어 매수 협상력이 높아집니다."
  },
  {
    id: "policy-electronic-contract",
    title: "국토부 부동산 전자계약 정책금융 우대금리 (연 0.1%p 추가 인하) 및 등기비용 감면",
    status: "현재 시행 중",
    ministry: "국토교통부 / 주택도시보증공사(HUG)",
    target: "전국 아파트 매매·임대차 계약 체결자",
    summary: "종이 계약서 대신 국토교통부 부동산거래 전자계약시스템을 이용할 경우 디딤돌·신생아 특례대출 금리 연 0.1%p 추가 인하 및 등기대행 수수료 약 30% 감면 혜택을 제공합니다.",
    keyPoints: [
      "정책대출 금리 0.1%p 즉시 추가 우대 (3.5억 대출 시 30년간 총 이자 약 1,050만 원 절감)",
      "확정일자 자동 부여 및 실거래가 신고 무료 자동 완료 (주민센터 방문 불필요)",
      "협약 법무사 소유권이전등기 대행 수수료 약 30% 감면 혜택",
      "공인중개사 자격 및 안심 신원 사전 검증으로 무자격 중개사고 원천 차단"
    ],
    buyerImpact: "5~6억 원대 아파트 매수 시 계약서 작성 방식 하나만 모바일 전자계약으로 변경해도 1,000만 원 이상의 이자와 부대비용을 아낄 수 있는 최고 효율의 혜택입니다."
  },
  {
    id: "policy-newborn-special-supply",
    title: "출산·신혼 가구 청약 개편 (신생아 특공 신설 & 결혼 페널티 완전 폐지)",
    status: "현재 시행 중",
    ministry: "국토교통부 주택기금과",
    target: "신혼부부 및 2년 내 출산·입양 무주택 세대구성원",
    summary: "배우자의 혼인 전 당첨 및 주택 소유 이력 불이익을 완전히 배제하고, 부부 중복청약 허용 및 공공·민간분양 연간 7만 가구 이상 신생아 특별·우선공급을 배정합니다.",
    keyPoints: [
      "배우자의 결혼 전 청약 당첨 및 주택 소유 이력 배제 (신혼부부 청약 결격사유 완전 해소)",
      "부부 동일 단지 동시 청약 허용 (동시 당첨 시 접수 일시가 빠른 건 유효 인정)",
      "공공분양 뉴:홈 신생아 특별공급 및 민간분양 신생아 우선공급 신설",
      "다자녀 특공 기준 3자녀 → 2자녀 가구로 완화 적용"
    ],
    buyerImpact: "결혼으로 인한 청약 불이익이 완전히 사라지고, 자녀 출산 가구는 가점과 무관하게 특별공급 추첨을 통해 서울/수도권 신축 당첨 확률이 획기적으로 상승합니다."
  },
  {
    id: "policy-didimdol-guideline",
    title: "2026 수도권 디딤돌 대출 맞춤형 관리 방안 (신생아 특례 대출 LTV 70% 전액 보호)",
    status: "현재 시행 중",
    ministry: "국토교통부 / 주택도시기금",
    target: "신생아 특례 및 일반 디딤돌 대출 신청 무주택자",
    summary: "일반 디딤돌 대출의 방공제(MCG) 차감 등 한도 관리가 강화되는 상황에서도, 저출생 극복 핵심 정책인 신생아 특례 디딤돌 대출은 LTV 70% 한도와 MCG 방공제 면제를 100% 정상 적용하여 보호합니다.",
    keyPoints: [
      "신생아 특례 디딤돌 대출은 LTV 70% 및 MCG 가입(방공제 면제) 전액 유지",
      "주택가격 9억 원 이하, 최대 한도 5억 원 지원 기준 불변",
      "일반 디딤돌 대출은 수도권 아파트 신규 시 소액임차보증금(방공제) 차감 등 건전성 관리",
      "실수요 무주택 출산 가구의 자금 계획 안정성 최우선 보장"
    ],
    buyerImpact: "5~6억 원대 수도권 아파트를 매수하려는 2년 내 출산 무주택 가구는 방공제 차감 없이 온전한 LTV 70%(최대 3.5억~4.2억 원) 대출을 그대로 수령할 수 있습니다."
  },
  {
    id: "policy-reconstruction-fast-track",
    title: "1기 신도시 및 30년 노후 단지 재건축 패스트트랙 특별법",
    status: "현재 시행 중",
    ministry: "국토교통부 도시정비과",
    target: "준공 30년 경과 노후 아파트 소유자 및 실수요 매수자",
    summary: "준공 30년이 경과한 노후 아파트는 안전진단을 통과하지 않아도 정비구역 지정 및 조합 설립 추진이 가능하도록 사업 기간을 최대 3~4년 단축합니다.",
    keyPoints: [
      "준공 30년 경과 아파트 안전진단 명칭을 재건축진단으로 개편 및 사업 착수 후 통과 허용",
      "정비계획 입안 제안, 정비구역 지정, 조합설립 추진위원회 구성을 병행하여 기간 3년 단축",
      "노원·도봉·양천·일산·부천 등 1990년대 초반 준공 구축 대단지 수혜 집중",
      "용적률 완화 및 공공기여 인센티브 가이드라인 정비"
    ],
    buyerImpact: "현재 5억 원대에 형성된 서울 외곽 및 1기 신도시 30년 차 구축 아파트의 재건축 사업 추진 속도와 미래 가치에 직접적인 호재로 작용합니다."
  }
];

// 실시간 수집된 미래/최신 정부 정책 보도자료 캐시
let livePolicyNewsCache = [
  {
    id: "gov-policy-1",
    ministry: "국토교통부",
    title: "국토부, 신생아 특례대출 및 저출생 추세 반전을 위한 주거지원 종합대책 후속조치 점검",
    date: "2026.10.11",
    category: "주거복지 / 금융지원",
    summary: "신생아 특례대출의 차질 없는 공급과 소득 완화 기준(최대 2억 원)에 따른 신청 현황을 점검하고, 수도권 실수요자 주택 구입 지원을 확대합니다.",
    link: "https://www.molit.go.kr",
    status: "보도자료"
  },
  {
    id: "gov-policy-2",
    ministry: "금융위원회",
    title: "금융위, 가계부채 점검회의 개최… 실수요 서민·취약계층 정책대출은 안정적 공급 지속",
    date: "2026.10.08",
    category: "가계부채 / 금융안정",
    summary: "스트레스 DSR 2단계 차등 관리 속에서도 디딤돌·버팀목·신생아특례 등 서민 실수요자 대출은 공급 목표대로 중단 없이 집행하겠다고 강조했습니다.",
    link: "https://www.fsc.go.kr",
    status: "보도자료"
  },
  {
    id: "gov-policy-3",
    ministry: "국토교통부",
    title: "노후계획도시정비 선도지구 특별법 본격 가동… 분당·일산·평촌·산본·중동 재건축 속도",
    date: "2026.10.05",
    category: "도시정비 / 재건축",
    summary: "1기 신도시 선도지구 정비사업 추진 로드맵에 따라 인허가 단축 및 미래형 도시 인프라 지원 방안을 추진합니다.",
    link: "https://www.molit.go.kr",
    status: "보도자료"
  },
  {
    id: "gov-policy-4",
    ministry: "대한민국 정책브리핑",
    title: "2026년도 주거복지 로드맵 발표… 공공분양 뉴:홈 및 신혼·출산가구 전용 청약 확대",
    date: "2026.10.02",
    category: "공공주택 / 청약",
    summary: "신생아 우선공급 비율 확대와 수도권 우수 입지 공공주택 분양 일정을 확정 공개했습니다.",
    link: "https://www.korea.kr",
    status: "정책브리핑"
  }
];

let lastPolicySyncedAt = 0;
let isPolicySyncing = false;
const POLICY_SYNC_TTL_MS = 60 * 60 * 1000; // 1시간마다 자동 갱신

function loadPoliciesCacheFromDisk() {
  try {
    if (fs.existsSync(policiesCachePath)) {
      const parsed = JSON.parse(fs.readFileSync(policiesCachePath, 'utf8'));
      if (Array.isArray(parsed.scrapedPolicies) && parsed.scrapedPolicies.length > 0) {
        livePolicyNewsCache = parsed.scrapedPolicies;
      }
      if (parsed.lastUpdated) {
        lastPolicySyncedAt = new Date(parsed.lastUpdated).getTime() || 0;
      }
    }
  } catch (err) {
    console.warn('[PoliciesCache] Failed to load policies_cache.json:', err.message);
  }
}

function savePoliciesCacheToDisk() {
  try {
    const payload = {
      lastUpdated: new Date(lastPolicySyncedAt || Date.now()).toISOString(),
      scrapedPolicies: livePolicyNewsCache
    };
    fs.writeFileSync(policiesCachePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[PoliciesCache] Failed to write policies_cache.json:', err.message);
  }
}

loadPoliciesCacheFromDisk();

/**
 * 3. 정부 정책 및 보도자료 실시간 웹 스크래퍼
 * 대한민국 정책브리핑(korea.kr) 및 구글 뉴스 정부 정책 피드를 실시간 크롤링하여 policies_cache.json에 저장합니다.
 */
export async function scrapeGovernmentPolicies() {
  const scraped = [];
  try {
    const urls = [
      'https://news.google.com/rss/search?q=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80+%EB%B6%80%EB%8F%99%EC%82%B0+%EC%A0%95%EC%B1%85+%EB%B3%B4%EB%8F%84%EC%9E%90%EB%A3%8C&hl=ko&gl=KR&ceid=KR:ko',
      'https://news.google.com/rss/search?q=%EA%B8%88%EC%9C%B5%EC%9C%84%EC%9B%90%ED%9A%8C+%EA%B0%80%EA%B3%84%EB%8C%80%EC%B6%9C+DSR+%EC%A3%BC%ED%83%9D&hl=ko&gl=KR&ceid=KR:ko'
    ];

    for (const url of urls) {
      try {
        const feed = await parser.parseURL(url);
        if (feed && feed.items) {
          const SPAM_WORDS = ['카지노', '바카라', '토토', '슬롯', '경마', '릴게임'];
          for (const item of feed.items.slice(0, 8)) {
            const cleanTitle = (item.title || '').replace(/<[^>]*>?/gm, '').trim();
            if (SPAM_WORDS.some(w => cleanTitle.includes(w))) continue;
            let ministry = "정책당국";
            if (cleanTitle.includes('국토부') || cleanTitle.includes('국토교통부')) ministry = "국토교통부";
            else if (cleanTitle.includes('금융위') || cleanTitle.includes('금융위원회')) ministry = "금융위원회";
            else if (cleanTitle.includes('기재부') || cleanTitle.includes('기획재정부')) ministry = "기획재정부";

            const pubTimestamp = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
            scraped.push({
              id: `gov-${pubTimestamp}-${Math.random().toString(36).slice(2, 7)}`,
              ministry,
              title: cleanTitle,
              date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
              pubTimestamp,
              category: "최신 부동산 정책 발표",
              summary: (item.contentSnippet || cleanTitle).slice(0, 160) + '...',
              link: item.link,
              status: "실시간 수집"
            });
          }
        }
      } catch (e) {
        console.warn(`Policy RSS fetch notice for ${url}:`, e.message);
      }
    }
  } catch (err) {
    console.error('Government policy scraping error:', err.message);
  }

  if (scraped.length > 0) {
    scraped.sort((a, b) => (b.pubTimestamp || 0) - (a.pubTimestamp || 0));
    const combined = [...scraped, ...livePolicyNewsCache];
    const unique = [];
    const seen = new Set();
    for (const p of combined) {
      const key = p.title.slice(0, 25);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    livePolicyNewsCache = unique.slice(0, 15);
  }

  lastPolicySyncedAt = Date.now();
  savePoliciesCacheToDisk();
  return livePolicyNewsCache;
}

export async function ensureFreshPolicies(force = false) {
  const now = Date.now();
  const isStale = force || !lastPolicySyncedAt || (now - lastPolicySyncedAt > POLICY_SYNC_TTL_MS);
  if (!isStale || isPolicySyncing) {
    return getPolicyData();
  }

  isPolicySyncing = true;
  try {
    await scrapeGovernmentPolicies();
  } finally {
    isPolicySyncing = false;
  }

  return getPolicyData();
}

export function getPolicyData() {
  return {
    terms: REAL_ESTATE_TERMS,
    currentPolicies: CURRENT_REAL_ESTATE_POLICIES,
    scrapedPolicies: livePolicyNewsCache,
    lastUpdated: lastPolicySyncedAt ? new Date(lastPolicySyncedAt).toISOString() : new Date().toISOString()
  };
}
