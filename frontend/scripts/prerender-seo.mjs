/**
 * 검색엔진(네이버·구글)용 정적 페이지 생성기
 *
 * `vite build` 직후 실행되어 frontend/dist 안에 다음을 만든다.
 *   - dist/apt/<단지id>/index.html : 단지별 고유 제목·설명·canonical·OG·JSON-LD + 본문 텍스트
 *   - dist/sitemap.xml
 *   - dist/robots.txt
 *
 * 본문 텍스트는 <div id="root"> 안에 들어가므로 JS가 없는 크롤러도 읽을 수 있고,
 * 브라우저에서는 React가 마운트되면서 앱 화면으로 교체된다(앱이 /apt/:id 를 보고 상세창을 연다).
 *
 * 사이트 주소는 환경변수 SITE_URL 로 바꿀 수 있다 (기본: https://our-family.onrender.com).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || 'https://our-family.onrender.com').replace(/\/+$/, '');
const DIST = path.join(__dirname, '..', 'dist');
const DATA = path.join(__dirname, '..', '..', 'backend', 'data', 'properties.json');
const SITE_NAME = '우리家';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const won = (v) => {
  if (!v) return '';
  const eok = Math.floor(v / 1e8);
  const man = Math.round((v - eok * 1e8) / 1e4);
  return `${eok ? `${eok}억` : ''}${man ? `${eok ? ' ' : ''}${man.toLocaleString('ko-KR')}만` : ''}원`;
};

const cleanName = (name) => name.replace(/\s*\(\d+평형?\)\s*/g, '').trim();
const aptPath = (id) => `/apt/${encodeURIComponent(id)}/`;

function pageMeta(p) {
  const base = cleanName(p.name);
  const loc = `${p.district} ${p.dong}`.replace(/\s*\(.*?\)/g, '');
  const title = `${base} ${p.pyeong}평 실거래가·시세 (${loc}) | ${SITE_NAME}`;
  const latest = (p.recentTrades || [])[0];
  const parts = [
    `${p.region} ${loc} ${base} 전용 ${p.areaSqMeter}㎡(${p.pyeong}평)`,
    `대표 매매가 ${p.priceDisplay}`,
    latest ? `최근 실거래 ${latest.date} ${latest.floor}층 ${won(latest.price)}` : '',
    p.totalUnits ? `${Number(p.totalUnits).toLocaleString('ko-KR')}세대` : '',
    p.buildYear ? `${p.buildYear}년 준공` : '',
    '신생아 특례·보금자리론·디딤돌 대출 한도와 필요 현금 계산',
  ].filter(Boolean);
  return { title, description: parts.join(' · '), base, loc };
}

function bodyHtml(p, meta) {
  const trades = (p.recentTrades || [])
    .map((t) => `<li>${esc(t.date)} · ${esc(t.floor)}층 · ${esc(won(t.price))}</li>`)
    .join('');
  const highlights = (p.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('');
  return `
    <main style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:sans-serif;line-height:1.6">
      <nav><a href="/">${SITE_NAME} 홈</a> › ${esc(p.region)} › ${esc(p.district)}</nav>
      <h1>${esc(meta.base)} ${esc(p.pyeong)}평 실거래가·시세</h1>
      <p>${esc(p.address || '')}</p>
      <ul>
        <li>전용면적 ${esc(p.areaSqMeter)}㎡ (${esc(p.pyeong)}평형)${p.rooms ? ` · ${esc(p.rooms)}` : ''}</li>
        ${p.buildYear ? `<li>${esc(p.buildYear)}년 준공${p.totalUnits ? ` · ${esc(Number(p.totalUnits).toLocaleString('ko-KR'))}세대` : ''}</li>` : ''}
        ${p.subwayStation ? `<li>${esc(p.subwayStation)} ${esc(p.subwayDistance || '')}</li>` : ''}
        <li>대표 매매가 ${esc(p.priceDisplay)}${p.priceRange ? ` (호가 ${esc(p.priceRange)})` : ''}</li>
      </ul>
      ${trades ? `<h2>최근 매매 실거래가</h2><ul>${trades}</ul><p>출처: 국토교통부 실거래가 공개시스템</p>` : ''}
      ${highlights ? `<h2>단지 특징</h2><ul>${highlights}</ul>` : ''}
      <h2>이 집, 대출 받으면 얼마 필요할까?</h2>
      <p>신생아 특례대출·보금자리론·생애최초 디딤돌 대출 한도(LTV 70% 기준)와 취득세·중개보수를 포함한 필요 현금은
      <a href="${esc(aptPath(p.id))}">${SITE_NAME} 시뮬레이터</a>에서 바로 계산할 수 있습니다.</p>
    </main>`;
}

function jsonLd(p, meta, url) {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'ApartmentComplex',
      name: meta.base,
      url,
      address: {
        '@type': 'PostalAddress',
        streetAddress: p.address,
        addressLocality: p.district,
        addressRegion: p.region,
        addressCountry: 'KR',
      },
      ...(p.totalUnits ? { numberOfAccommodationUnits: p.totalUnits } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: `${meta.base} ${p.pyeong}평`, item: url },
      ],
    },
  ]).replace(/</g, '\\u003c');
}

function buildPage(template, p) {
  const meta = pageMeta(p);
  const url = `${SITE_URL}${aptPath(p.id)}`;
  // 템플릿(index.html)의 공통 제목·설명·OG·canonical 을 걷어내고 단지 전용 값으로 교체
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="(?:title|description)"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:(?:title|description|url|type)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  const head = `
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <script type="application/ld+json">${jsonLd(p, meta, url)}</script>
  </head>`;
  html = html.replace(/<\/head>/i, head);
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${bodyHtml(p, meta)}</div>`);
  return html;
}

function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('[prerender-seo] dist/index.html 이 없습니다. 먼저 vite build 를 실행하세요.');
    process.exit(1);
  }
  // 홈 index.html 에 하드코딩된 기본 주소를 SITE_URL 로 교체 (도메인 변경 대응)
  const template = fs
    .readFileSync(templatePath, 'utf8')
    .replaceAll('https://our-family.onrender.com', SITE_URL);
  fs.writeFileSync(templatePath, template);
  if (!/<div id="root"><\/div>/i.test(template)) {
    console.error('[prerender-seo] index.html 에서 <div id="root"></div> 를 찾지 못했습니다.');
    process.exit(1);
  }
  const properties = JSON.parse(fs.readFileSync(DATA, 'utf8'));

  const aptDir = path.join(DIST, 'apt');
  fs.rmSync(aptDir, { recursive: true, force: true });
  for (const p of properties) {
    const dir = path.join(aptDir, p.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(template, p));
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${SITE_URL}/`, ...properties.map((p) => `${SITE_URL}${aptPath(p.id)}`)];
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  console.log(`[prerender-seo] 단지 페이지 ${properties.length}개, sitemap.xml(${urls.length} URL), robots.txt 생성 완료 → ${SITE_URL}`);
}

main();
