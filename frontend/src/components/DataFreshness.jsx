import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * 데이터 갱신 상태 안내
 * 금리·뉴스·정책은 GitHub Actions 가 매시 7분·37분에 확인해, 내용이 바뀌었을 때만 사이트를 다시 배포한다.
 * 페이지를 열어 둔 동안에는 App 이 5분마다 최신 배포본을 확인해 자동으로 화면에 반영한다.
 */
const CHECK_MINUTES = [7, 37]; // .github/workflows/daily-data-sync.yml 의 cron 과 맞출 것

const formatKst = (date, withDay = true) =>
  date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...(withDay ? { month: 'long', day: 'numeric' } : {}),
    hour: 'numeric',
    minute: '2-digit',
  });

const relative = (t, now) => {
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
};

// 다음 예정 확인 시각 (한국 시간은 정시 단위 시차라 '분'은 그대로 비교 가능)
const nextCheck = (now) => {
  const d = new Date(now);
  d.setSeconds(0, 0);
  for (let i = 0; i < 2; i++) {
    for (const m of CHECK_MINUTES) {
      const c = new Date(d);
      c.setHours(d.getHours() + i, m);
      if (c.getTime() > now) return c;
    }
  }
  return null;
};

export default function DataFreshness({ lastUpdated }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const updated = lastUpdated ? new Date(lastUpdated) : null;
  const valid = updated && !Number.isNaN(updated.getTime());
  const next = nextCheck(now);

  return (
    <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-left shrink-0 self-start md:self-center">
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-emerald-300" />
        <span>마지막 업데이트 {valid ? formatKst(updated) : '-'}</span>
        {valid && <span className="text-slate-300 font-medium">({relative(updated.getTime(), now)})</span>}
      </div>
      <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 whitespace-nowrap">
        {next ? `다음 자동 확인 ${formatKst(next, false)} 예정` : '30분마다 자동 확인'} · 바뀌면 화면에 자동 반영
      </div>
    </div>
  );
}
