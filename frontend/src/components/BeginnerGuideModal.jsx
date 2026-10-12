import React from 'react';
import { 
  X, HelpCircle, CheckCircle2, DollarSign, Lightbulb, 
  Sparkles, ShieldCheck, HeartHandshake, Compass, AlertCircle
} from 'lucide-react';

export default function BeginnerGuideModal({ onClose }) {
  const qnaList = [
    {
      q: "5억 5천만 원 아파트를 사려면 통장에 5억 5천만 원이 다 있어야 하나요?",
      a: "전혀 아닙니다! 신생아 특례대출(구입자금)을 이용하면 정부의 가계부채 관리 및 실수요자 대출 규제 기준에 맞춘 안전 상한인 LTV 70%까지 저금리로 지원받을 수 있습니다.\n따라서 5억 5천만 원짜리 아파트는 최대 약 3억 8,500만 원까지 대출이 가능하므로, 실제 내 통장에 필요한 순수 매수 현금은 약 1억 6,500만 원(취득세·중개보수 등 부대비용 포함 약 1.7억 원대) 정도면 서울·경기 역세권 아파트를 내집으로 만들 수 있습니다.",
      tag: "자금계획",
      highlight: "순수 필요 현금 약 1.65억 원 (LTV 70% 안전 기준 적용)"
    },
    {
      q: "생애최초인데 왜 LTV 80%가 아니라 70%로 계산되나요?",
      a: "정부의 부동산 대출 규제 및 가계부채 관리 방침에 따라, 과도한 레버리지(영끌)로 인한 가계 부실 위험을 방지하기 위해 수도권 주택 매수 시 LTV 70% 안전 상한이 실질적으로 엄격하게 적용됩니다.\n대신 생애최초 주택구입자에게는 무리한 빚을 지우는 대신 '취득세 최대 200만 원 전액 감면' 혜택과 최저 연 1%대 초저금리를 제공하여 실질적인 초기 자금 부담을 확실히 줄여주고 있습니다.",
      tag: "대출정책",
      highlight: "정부 가계대출 관리 기준 LTV 70% 준수 + 생애최초 취득세 200만 원 감면!"
    },
    {
      q: "신생아 특례대출이 왜 '역대급 혜택'이라고 불리나요? 일반 은행 대출과 뭐가 달라요?",
      a: "가장 큰 이유는 두 가지입니다.\n① DSR(스트레스 대출 규제) 미적용: 일반 은행은 소득이 적으면 대출 한도를 수천만 원 깎아버리지만, 신생아 특례는 DSR 규제를 아예 적용하지 않아 최대 5억 원까지 넉넉하게 나옵니다.\n② 초저금리 혜택: 일반 은행 주택담보대출 금리는 연 3.5~4.5% 수준이지만, 신생아 특례는 연 1.6%~3.3%로 절반 가까이 저렴하여 매달 이자만 30만 원 이상(30년 동안 약 1억 원 이상!) 절약됩니다.",
      tag: "대출비교",
      highlight: "DSR 규제 제외 + 일반 은행 대비 매월 30만 원 이상 이자 절약!"
    },
    {
      q: "아파트 평면도에서 '2-Bay, 3-Bay, 4-Bay'는 무슨 뜻인가요?",
      a: "Bay(베이)는 아파트에서 '햇빛이 들어오는 남향 전면 창가 쪽에 방과 거실이 몇 개 배치되어 있는가'를 뜻합니다.\n• 2-Bay: 거실 1개 + 안방 1개 (구축 아파트 대표, 거실과 안방이 큼직함)\n• 3-Bay: 방 1개 + 거실 1개 + 안방 1개 (2000년대 이후 대세, 채광과 환기 균형)\n• 4-Bay: 방 2개 + 거실 1개 + 안방 1개 (모든 방이 남향 햇살을 받는 최신 신축 구조, 맞통풍 최고)",
      tag: "도면이해",
      highlight: "베이 숫자가 많을수록 햇빛이 잘 들고 환기가 잘 됩니다."
    },
    {
      q: "'방공제'라는 무서운 단어가 나오는데, 방을 뺀다는 뜻인가요?",
      a: "방을 뺀다는 뜻이 아닙니다! 은행이 대출을 해줄 때 '만약 이 집에 세입자가 살아서 보증금을 먼저 챙겨가면 어쩌지?' 하고 미리 대출금에서 5,500만 원(서울 기준)을 깎고 주는 것을 '방공제'라고 합니다.\n하지만 걱정 마세요! 'MCG(모기지신용보증)'라는 보증보험(비용 몇만 원)을 가입하면 방공제 없이 정부 기준 LTV 70% 한도 100%를 고스란히 다 대출받을 수 있습니다. ('우리가' 계산기는 MCG 가입을 기본으로 안전하게 계산해 드립니다!)",
      tag: "대출용어",
      highlight: "MCG 보증 가입만 체크하면 5,500만 원 깎이지 않고 LTV 70% 전액 대출 가능!"
    },
    {
      q: "집값 말고 추가로 준비해야 하는 '숨은 비용'은 없나요?",
      a: "집을 살 때는 집값 잔금 외에 다음 부대비용이 듭니다.\n① 취득세: 6억 이하 아파트는 약 1.1% (약 600만 원). 단, 생애최초 주택구입 시 정부에서 최대 200만 원을 깎아줍니다!\n② 부동산 중개보수(복비): 법정 상한 요율 0.4% (약 200만~240만 원)\n③ 법무사 등기비용 및 채권할인: 약 50만~100만 원\n따라서 집값 외에 약 700만~1,000만 원 정도의 여유 현금을 통장에 더 쥐고 계셔야 안전합니다.",
      tag: "부대비용",
      highlight: "집값 외에 취득세+중개보수로 약 700만~1,000만 원 여유자금 필요!"
    },
    {
      q: "KB 부동산 시세는 왜 실거래가랑 금액이 다른가요?",
      a: "실거래가는 '어제 또는 지난달에 누군가 실제로 계약한 금액'이고, KB 부동산 시세는 'KB국민은행의 전문 조사원들이 매주 아파트 단지의 표준적인 가치를 매긴 공식 가격'입니다. 은행은 손님의 말이나 최근 최고 실거래가를 믿는 것이 아니라, 이 'KB 부동산 시세'를 기준으로 대출 한도를 정합니다.",
      tag: "시세기준",
      highlight: "은행 대출 심사는 오직 'KB 부동산 일반평균가'를 기준으로 결정됩니다."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              🐣
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>부린이(부동산 초보)를 위한 3분 핵심 가이드</span>
              </h2>
              <p className="text-xs text-slate-500">
                어려운 용어 없이, 내집마련 준비할 때 꼭 알아야 할 6가지 질문과 해답
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Top Quick Tip Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-4 rounded-2xl border border-blue-200/80 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-blue-900 block text-sm">
                핵심 요약: "내 돈 얼마 있으면 5~6억 집 살 수 있나요?"
              </span>
              <p className="text-blue-800 leading-relaxed">
                신생아 특례대출(구입자금)을 활용하면 <strong>현금 약 1억 2,000만 ~ 1억 6,000만 원</strong>(부대비용 포함)만 있으면 서울·경기 5~6억 원대 역세권 대단지 아파트를 내집으로 만들 수 있습니다. 매달 갚는 돈은 연 2%대 금리로 약 140만~160만 원 수준입니다.
              </p>
            </div>
          </div>

          {/* QnA Cards */}
          <div className="space-y-4">
            {qnaList.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/80 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-start gap-2">
                    <span className="text-blue-600 font-extrabold shrink-0">Q{idx + 1}.</span>
                    <span>{item.q}</span>
                  </h3>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                    {item.tag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line pl-6">
                  {item.a}
                </p>

                <div className="pl-6 pt-1">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>핵심: {item.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3단계 왕초보 행동 체크리스트 */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>부린이를 위한 '우리가 (우리家)' 활용 3단계</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="font-black text-blue-300 block mb-1">1단계: 내 조건 맞추기</span>
                <p>상단 시뮬레이터에서 우리 부부 합산 연소득과 생애최초 여부를 설정하세요.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="font-black text-emerald-300 block mb-1">2단계: 가격별 정렬 보기</span>
                <p>'가격 낮은순(4억대~)' 버튼을 눌러 내 자본금으로 살 수 있는 단지를 둘러보세요.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="font-black text-amber-300 block mb-1">3단계: 도면 & 견적서 확인</span>
                <p>'도면 보기'를 눌러 방 구조를 보고, 카드를 눌러 취득세 포함 최종 견적서를 확인하세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
          >
            이해했어요! 매물 보러가기
          </button>
        </div>
      </div>
    </div>
  );
}
