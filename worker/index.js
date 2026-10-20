/**
 * Cloudflare Worker: 정적 사이트 제공 + 30분 주기 데이터 수집 트리거
 *
 * - fetch     : 모든 요청을 정적 파일(frontend/dist)로 넘긴다. (없는 주소는 index.html)
 * - scheduled : Cron Trigger(wrangler.jsonc 의 triggers.crons)마다 GitHub Actions 의
 *               데이터 수집 워크플로(daily-data-sync.yml)를 workflow_dispatch 로 실행시킨다.
 *               GitHub 자체 예약 실행은 지연·누락이 잦아서, 정시성이 좋은 Cloudflare 예약으로 대신 깨운다.
 *
 * 필요한 설정
 * - GITHUB_TOKEN (Secret) : 이 저장소의 Actions 쓰기 권한만 가진 fine-grained 토큰
 *     → Cloudflare 대시보드 > our-family > Settings > Variables and Secrets 에서 Secret 으로 추가
 * - GITHUB_REPO, GITHUB_WORKFLOW (vars) : wrangler.jsonc 에 정의
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(triggerDataSync(env, controller.cron));
  },
};

async function triggerDataSync(env, cron) {
  if (!env.GITHUB_TOKEN) {
    console.error('[cron] GITHUB_TOKEN 시크릿이 없어 수집을 실행하지 못했습니다.');
    return;
  }
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'our-family-cron',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  if (res.status === 204) {
    console.log(`[cron ${cron}] 데이터 수집 워크플로 실행 요청 완료`);
  } else {
    console.error(`[cron ${cron}] 실행 요청 실패: HTTP ${res.status} ${await res.text()}`);
  }
}
