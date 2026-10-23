/**
 * 2026 신혼·출산·생애최초 내집마련 실전 매수 계약서 '필수 특약사항' 생성기 & 계약~잔금 D-Day 체크리스트
 *
 * - 단지명, 매매가, 대출상품(신생아 특례 / 보금자리론 / 디딤돌), 대출한도가 자동 치환된 맞춤형 문구 생성
 * - 중개사·매도인에게 카카오톡/문자로 바로 복사해 보낼 수 있는 원클릭 클립보드 지원
 */

const formatMoneyKor = (val) => {
  if (!val || val <= 0) return '0원';
  const eok = Math.floor(val / 100000000);
  const man = Math.round((val % 100000000) / 10000);
  if (eok > 0) {
    return `${eok}억${man > 0 ? ' ' + man.toLocaleString() + '만' : ''} 원`;
  }
  return `${man.toLocaleString()}만 원`;
};

const LOAN_PRODUCT_NAMES = {
  newborn: '주택도시기금 신생아 특례 디딤돌 대출',
  bogeumjari: '한국주택금융공사(HF) 보금자리론',
  didimdol: '주택도시기금 내집마련 디딤돌 대출(생애최초)',
};

/**
 * 선택한 단지와 대출 조건에 맞춘 6대 실전 필수 특약 조항 생성
 */
export function generateSpecialClauses({
  propertyName = '해당 아파트',
  priceKrw = 600000000,
  loanType = 'newborn',
  loanAmount = 420000000,
}) {
  const cleanName = propertyName.replace(/\s*\(\d+평형?\)\s*/g, '').trim();
  const productLabel = LOAN_PRODUCT_NAMES[loanType] || LOAN_PRODUCT_NAMES.newborn;
  const loanStr = formatMoneyKor(loanAmount);
  const priceStr = formatMoneyKor(priceKrw);

  return [
    {
      id: 'electronic_contract',
      badge: '🔥 금리 0.1%p 즉시 할인 필수',
      category: '우대금리 확보',
      title: '국토교통부 부동산거래 전자계약시스템(IRTS) 체결 특약',
      importance: 'critical',
      defaultSelected: true,
      whyNeeded:
        '신생아 특례·디딤돌·보금자리론 모두 국토부 전자계약 체결 시 연 0.1%p 우대금리(30년 기준 약 700~900만 원 이자 절감)가 적용됩니다. 종이계약서 작성 후에도 잔금일 전 전자계약으로 재작성이 가능하도록 미리 합의해야 합니다.',
      clauseText: `매도인과 매수인은 매수인의 정책모기지(${productLabel}) 우대금리(연 0.1%p 인하) 적용을 위하여 국토교통부 '부동산거래 전자계약시스템'을 통한 전자계약 체결에 상호 적극 협조하기로 한다.`,
    },
    {
      id: 'policy_loan_coop',
      badge: '🛡️ 내 계약금 10% 보호',
      category: '대출 안전장치',
      title: '정책모기지 대출 심사 협조 및 금융기관 사유 반려 시 해제 특약',
      importance: 'critical',
      defaultSelected: true,
      whyNeeded:
        '정책대출(기금e든든·HF)은 심사 기간이 3~6주 소요되며 잔금일 여유(통상 2~3개월)와 매도인의 담보제공/질권설정 서류 협조가 필수입니다. 목적물 권리하자 등으로 대출이 불가할 때 계약금을 지키는 핵심 조항입니다.',
      clauseText: `매수인은 잔금 중 일부(약 ${loanStr} 내외)를 '${productLabel}'로 조달할 예정이며, 매도인은 대출 심사 및 실행에 필요한 절차에 협조한다. 만일 매수인의 귀책사유 없이 목적물의 권리하자 또는 정부 정책·금융기관의 심사 기준 변경으로 인하여 대출 승인이 불가할 경우, 본 계약은 무효로 하고 매도인은 수령한 계약금 전액을 매수인에게 즉시 무이자로 반환하기로 한다.`,
    },
    {
      id: 'prior_mortgage_repay',
      badge: '⚖️ 1순위 근저당 말소 필수',
      category: '권리관계 보호',
      title: '매도인 기존 근저당권(융자) 잔금일 동시 말소 및 추가 권리설정 금지 특약',
      importance: 'critical',
      defaultSelected: true,
      whyNeeded:
        '신생아 특례·보금자리론·디딤돌은 모두 주택도시기금/HF가 1순위 근저당권을 설정해야 실행됩니다. 매도인의 기존 주담대를 잔금일에 동시 상환·말소하고, 계약일~잔금일 사이 추가 대출이나 가압류가 없도록 못 박아야 합니다.',
      clauseText: `매도인은 잔금 수령과 동시에 등기부등본상 설정된 기존의 모든 근저당권 및 제한물권을 전액 상환하고 말소 등기 절차를 이행하기로 한다. 또한 매도인은 계약 체결일로부터 잔금 지급일까지 본 부동산에 추가 담보대출, 전세권, 가압류 등 새로운 권리변동을 발생시키지 않기로 하며, 이를 위반할 경우 매수인은 계약을 해제할 수 있고 매도인은 계약금의 배액을 배상한다.`,
    },
    {
      id: 'major_defect_leak',
      badge: '💧 구축·준신축 누수 방어',
      category: '시설물·하자',
      title: '누수·배관·보일러 등 중대 하자 담보책임(민법 제580조) 명시 특약',
      importance: 'high',
      defaultSelected: true,
      whyNeeded:
        '"현 시설물 상태에서의 계약"이라는 기본 문구만 있으면 입주 직후 천장·욕실 누수나 보일러 고장 시 분쟁이 발생합니다. 잔금일 기준 6개월간 중대 하자(누수 등)에 대한 매도인 책임을 명확히 기재해야 수백만 원 수리비를 아낍니다.',
      clauseText: `현 시설물 상태의 매매계약이나, 계약 당시 매수인이 육안으로 알 수 없었던 중대한 하자(천장·외벽·욕실·배관 누수 및 보일러 본체 고장 등)가 잔금 지급일로부터 6개월 이내에 발견될 경우, 민법 제580조(매도인의 하자담보책임)에 따라 매도인이 책임지고 수리하거나 그 수리 비용을 부담하기로 한다.`,
    },
    {
      id: 'long_term_repair_reserve',
      badge: '🧾 관리비·선수금 정산',
      category: '공과금 정산',
      title: '관리비·장기수선충당금·각종 공과금 잔금일 기준 정산 특약',
      importance: 'medium',
      defaultSelected: true,
      whyNeeded:
        '잔금일 전일까지 발생한 아파트 관리비·도시가스·전기·수도요금과 세입자 거주 시 반환해야 할 장기수선충당금 정산 주체를 명확히 해 잔금 당일 얼굴 붉히는 일을 방지합니다.',
      clauseText: `본 부동산의 관리비, 도시가스, 전기, 수도 등 제세공과금과 아파트 관리규약에 따른 장기수선충당금 정산은 잔금 지급일(입주일) 전일까지의 발생분은 매도인이 부담하고, 잔금 지급일 당일부터의 발생분은 매수인이 부담하여 상호 정산하기로 한다.`,
    },
    {
      id: 'built_in_options',
      badge: '❄️ 에어컨·부착물 확인',
      category: '시설물·하자',
      title: '시스템에어컨·붙박이장·인덕션 등 잔류 부착물 목록 확정 특약',
      importance: 'medium',
      defaultSelected: false,
      whyNeeded:
        '매도인이 시스템에어컨 리모컨, 스마트 도어락 키, 식기세척기, 조명기구 등을 임의로 철거해 가는 분쟁을 막기 위해 현장에 남길 옵션을 명시합니다.',
      clauseText: `본 부동산에 설치된 기본 부착물 및 매도인과 합의한 옵션 품목(시스템에어컨, 붙박이장, 주방 가전 등)은 현 상태 그대로 매수인에게 인계하며, 디지털 도어락 카드키·음식물쓰레기 카드·우편함 비밀번호 및 단지 출입카드를 잔금일에 모두 인계하기로 한다.`,
    },
  ];
}

/**
 * 선택된 특약들을 중개사/매도인 전달용 깔끔한 텍스트로 병합
 */
export function buildFullSpecialClausesText({
  propertyName = '해당 아파트',
  priceKrw = 600000000,
  loanType = 'newborn',
  loanAmount = 420000000,
  selectedClauses = [],
}) {
  const cleanName = propertyName.replace(/\s*\(\d+평형?\)\s*/g, '').trim();
  const productLabel = LOAN_PRODUCT_NAMES[loanType] || LOAN_PRODUCT_NAMES.newborn;
  const header = `[📝 ${cleanName} 매매계약 필수 특약사항 요청안]\n· 매매대금: ${formatMoneyKor(priceKrw)} / 예정 정책대출: ${productLabel}(약 ${formatMoneyKor(loanAmount)})\n----------------------------------------`;

  const body = selectedClauses
    .map((c, idx) => `${idx + 1}. [${c.title}]\n"${c.clauseText}"`)
    .join('\n\n');

  const footer = `\n----------------------------------------\n※ 사장님, 위 특약 조항들을 계약서 작성 시 반영 부탁드립니다. 감사합니다!`;

  return `${header}\n\n${body}${footer}`;
}

/**
 * 가계약 ~ 본계약 ~ 대출신청 ~ 잔금 D-Day 실전 타임라인 체크리스트 (6단계)
 */
export const CONTRACT_TIMELINE_STEPS = [
  {
    step: 'STEP 1 · 가계약 이체 전 (D-75)',
    title: '등기부등본 권리분석 & KB시세·대출한도 사전 확인',
    badge: '계약금 입금 전 필수',
    items: [
      {
        id: 'chk_registry_owner',
        text: '등기부등본(갑구) 소유자 성명·주민번호 앞자리와 매도인 신분증 일치 여부 확인',
      },
      {
        id: 'chk_registry_debt',
        text: '등기부등본(을구) 기존 근저당권 채권최고액이 매매가의 70% 이하인지 및 잔금일 말소 조건 확인',
      },
      {
        id: 'chk_e_contract_broker',
        text: '공인중개사 사무소가 국토부 부동산 전자계약(우대금리 0.1%p) 처리 가능 중개소인지 사전 확인',
      },
      {
        id: 'chk_balance_date_gap',
        text: '잔금일(입주일)이 기금e든든·HF 심사 기간을 고려해 본계약일로부터 최소 60~75일 이후인지 확인',
      },
    ],
  },
  {
    step: 'STEP 2 · 본계약 당일 (D-60)',
    title: '전자계약 체결 & 계약금 10% 이체 & 실거래 신고',
    badge: '계약서 도장 찍는 날',
    items: [
      {
        id: 'chk_special_clauses_inserted',
        text: '계약서 특약란에 [전자계약 협조 / 대출 반려 시 무이자 반환 / 누수 하자담보책임] 문구 기재 확인',
      },
      {
        id: 'chk_seller_bank_account',
        text: '계약금(10%)은 반드시 등기부등본상 소유자(매도인) 본인 명의 계좌로만 이체 및 영수증 수령',
      },
      {
        id: 'chk_irts_signature',
        text: '국토부 부동산거래 전자계약시스템(IRTS) 앱에서 부부(공동명의 시 전원) 본인인증 및 전자서명 완료',
      },
      {
        id: 'chk_rtms_report_cert',
        text: '전자계약 완료 후 자동 발급되는 [부동산거래계약 신고필증] 및 확정일자 부여 여부 확인',
      },
    ],
  },
  {
    step: 'STEP 3 · 잔금 50~60일 전 (D-55)',
    title: '기금e든든 / 한국주택금융공사(HF) 정책대출 온라인 접수',
    badge: '대출 심사 골든타임',
    items: [
      {
        id: 'chk_loan_online_apply',
        text: '기금e든든(신생아특례·디딤돌) 또는 HF 스마트주택금융(보금자리론) 앱에서 잔금 50~60일 전 신청 접수',
      },
      {
        id: 'chk_preferential_docs',
        text: '우대금리 증빙서류(출산가구 가족관계증명서, 청약통장 가입확인서, 전자계약서 사본) 제출 완료',
      },
      {
        id: 'chk_mcg_guarantee_check',
        text: '소액임차보증금(방공제 5,500만 원) 차감 면제를 위한 MCG(모기지신용보증) 가입 체크 확인',
      },
    ],
  },
  {
    step: 'STEP 4 · 잔금 30일 전 (D-30)',
    title: '수탁은행 지점 방문 서류 제출 & 법무사/셀프등기 견적 비교',
    badge: '은행 약정 & 등기 준비',
    items: [
      {
        id: 'chk_bank_branch_visit',
        text: '예비자산심사 적격 판정 후 지정 수탁은행(국민·신한·우리·하나·농협 등) 지점 방문 및 원본 서류 제출',
      },
      {
        id: 'chk_lawyer_quote_compare',
        text: '법무통 앱 등으로 소유권이전등기 법무사 3곳 이상 견적 비교 (또는 셀프등기 위임장 양식 준비)',
      },
      {
        id: 'chk_moving_interior_book',
        text: '포장이사 업체 예약, 입주청소 예약, 아파트 관리사무소 엘리베이터(사다리차) 사용 사전 예약',
      },
    ],
  },
  {
    step: 'STEP 5 · 잔금 3~7일 전 (D-5)',
    title: '잔금 D-Day 이체한도 상향 & 취득세 감면 서류 준비',
    badge: '잔금 사고 예방 필수!',
    items: [
      {
        id: 'chk_otp_transfer_limit',
        text: '🔥 [가장 중요] 잔금 계좌의 1일/1회 모바일 이체한도를 최소 3억~5억 원 이상으로 상향 및 OTP 작동 확인',
      },
      {
        id: 'chk_tax_relief_form',
        text: '생애최초(최대 200만 원) 또는 출산·양육가구(최대 500만 원) 지방세 감면신청서 및 가족관계증명서 준비',
      },
      {
        id: 'chk_final_registry_clean',
        text: '잔금 전날 등기부등본을 재발급하여 계약 이후 매도인의 추가 대출·가압류 등 변동이 없는지 최종 점검',
      },
    ],
  },
  {
    step: 'STEP 6 · 잔금일 D-Day & 입주 직후',
    title: '잔금 치르기 · 소유권이전등기 · 전입신고 완료',
    badge: '내 집 마련 완성 🎉',
    items: [
      {
        id: 'chk_dday_utility_settlement',
        text: '관리사무소에서 잔금일 기준 관리비·장기수선충당금·도시가스 검침 정산 영수증 확인 후 잔금 이체',
      },
      {
        id: 'chk_dday_loan_repay_receipt',
        text: '은행 실행 대출금으로 매도인 기존 근저당 상환 영수증 및 말소 등기 접수증 확인',
      },
      {
        id: 'chk_dday_move_in_report',
        text: '정부24 또는 관할 주민센터에서 전입신고 완료 후 은행에 전입세대열람내역서 제출 (실거주 의무 이행)',
      },
    ],
  },
];
