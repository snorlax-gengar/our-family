import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * 데이터 갱신 상태 안내
 * - 마지막 변경: 데이터 파일의 lastUpdated (내용이 실제로 바뀌어 반영된 시각)
 * - 마지막 확인: GitHub Actions 수집 워크플로가 마지막으로 성공한 시각 (공개 API, 비로그인 조회)
 * - 다음 확인: Cloudflare Cron(wrangler.jsonc triggers.crons)이 수집을 깨우는 예정 시각
 * 페이지를 열어 둔 동안에는 App 이 5분마다 최신 배포본을 확인해 자동으로 화면에 반영한다.
 */
const CHECK_MINUTES = [7, 37]; // wrangler.jsonc 의 triggers.crons 와 맞출 것
const RUNS_API =
  'https://api.github.com/repos/snorlax-gengar/our-family/actions/workflows/daily-data-sync.yml/runs?status=success&per_page=1';

// 마지막 수집 성공 시각 (탭 간 공유, 3분 캐시 — GitHub 비로그인 한도 시간당 60회 고려)
let lastCheckCache = { at: 0, value: null, pending: null };
const fetchLastCheck = async () => {
  if (Date.now() - lastCheckCache.at < 3 * 60 * 1000) return lastCheckCache.value;
  if (!lastCheckCache.pending) {
    lastCheckCache.pending = fetch(RUNS_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.workflow_runs?.[0]?.updated_at || null)
      .catch(() => null)
      .then((value) => {
        lastCheckCache = { at: Date.now(), value: value ?? lastCheckCache.value, pending: null };
        return lastCheckCache.value;
      });
  }
  return lastCheckCache.pending;
};

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
  const [lastCheck, setLastCheck] = useState(lastCheckCache.value);
  useEffect(() => {
    let alive = true;
    const refreshCheck = () => fetchLastCheck().then((v) => alive && v && setLastCheck(v));
    refreshCheck();
    const tick = setInterval(() => setNow(Date.now()), 30 * 1000);
    const poll = setInterval(refreshCheck, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(tick);
      clearInterval(poll);
    };
  }, []);

  const updated = lastUpdated ? new Date(lastUpdated) : null;
  const valid = updated && !Number.isNaN(updated.getTime());
  const next = nextCheck(now);
  const checked = lastCheck ? new Date(lastCheck) : null;
  const checkedValid = checked && !Number.isNaN(checked.getTime());

  return (
    <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-left shrink-0 self-start md:self-center">
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-emerald-300" />
        <span>마지막 변경 {valid ? formatKst(updated) : '-'}</span>
        {valid && <span className="text-slate-300 font-medium">({relative(updated.getTime(), now)})</span>}
      </div>
      <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 whitespace-nowrap">
        {checkedValid && <>마지막 확인 {formatKst(checked, false)} · </>}
        {next ? `다음 확인 ${formatKst(next, false)} 예정` : '30분마다 자동 확인'}
      </div>
      <div className="text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap">
        바뀐 내용이 있으면 화면에 자동 반영됩니다
      </div>
    </div>
  );
}
