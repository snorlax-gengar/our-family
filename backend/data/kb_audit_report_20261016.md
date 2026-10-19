# KB시세·실거래가 전수조사 리포트 (2026.10.16)

- 출처: KB부동산(kbland.kr) API — KB시세(시세기준일 2026.10.16), 국토교통부 실거래 신고분(KB 연동), 매물 호가
- 패치 파일: `kb_audit_patch_20261016.json` (136개 단지)
- 대상 160개 중 **136개 갱신**, **24개 제외**(KB에서 해당 단지·평형을 확인할 수 없음)

## 산정 기준
- `kbPrice.generalAvg / highAvg / lowAvg` = KB 매매 일반가 / 상위평균가 / 하위평균가, `jeonseAvg` = KB 전세 일반가
- `jeonseRate` = jeonseAvg ÷ generalAvg × 100 (소수 첫째자리)
- `recentTrades` = 2026.07 이후 계약된 매매 실거래(취소건 제외) 최신순 최대 4건. 3분기 이후 거래가 2건 미만이면 직전 거래로 2건까지 보충
- `priceKrw` = (KB 일반가 + 3분기 이후 최근 3건 실거래 중앙값) ÷ 2, 100만 원 단위 반올림 (3분기 거래가 없으면 KB 일반가)
- `priceRange` = 현재 등록 매물 호가 최저~최고. 매물이 0~1건이면 KB 하위~상위평균가

## 가격대 분포 (갱신 136개)
- 5억 미만: 19개 / 5~7억: 50개 / **7억 이상: 67개**
- 원본 데이터의 "5~6억대" 가정과 달리 절반가량이 7억 이상입니다(예: 신정아이파크 24평 16.5억, 상도더샵1차 24평 17억, 사당대림 24평 14.75억, 암사선사현대 24평 15.34억).

## 제외 24개 (원본 정보 확인 필요)
| id | 사유 |
|---|---|
| gyeonggi-yongin-giheung-newmillennium-5 | KB에 새천년그린빌5단지 없음(네이버코드 3689는 녹원새천년그린빌2단지) |
| gyeonggi-hwaseong-dongtan-solbit-seohae | KB 동탄솔빛마을서해그랑블에 전용 84.89㎡ 없음 (최소 100.70㎡/39평) |
| gyeonggi-bucheon-mirinae-eunhasu-24 | KB에서 은하수타운 59㎡ 확인 불가 |
| gyeonggi-bucheon-mirinae-eunhasu-32 | KB에서 은하수타운 84㎡ 확인 불가 |
| gyeonggi-bucheon-yeonhwa-ssangyong-26 | KB 연화마을(쌍용)에 전용 69.96㎡ 없음 (가장 가까운 60.00㎡/23평) |
| gyeonggi-bucheon-songnae-newseoul-26 | KB 뉴서울에 전용 69.45㎡ 없음 (59.97㎡/24.5평) |
| gyeonggi-bucheon-sosa-jugong2-32 | KB 소사주공1단지에 전용 84.9㎡ 없음 (최대 58.14㎡) |
| incheon-gyeyang-jakjeon-hyundai2-25 | KB 작전2-2차현대에 59㎡ 없음 (84.93㎡ 단일) |
| incheon-gyeyang-jakjeon-hyundai-2-24 | 위와 동일 |
| incheon-yeonsu-dongchun-hyundai1-26 | KB 동춘현대1차에 전용 69.9㎡ 없음 (84.97㎡ 단일) |
| seoul-dobong-dobong-hanshin-26 | KB 도봉한신에 전용 68.4㎡ 없음 (77.46㎡/28.85평) |
| seoul-dobong-ssangmun-hanyang-1-31 | KB 쌍문한양1차에 전용 84.87㎡ 없음 (최대 79.20㎡/29.6평) |
| seoul-dobong-ssangmun-samik-26 | KB 쌍문동 삼익(삼익세라믹)에 전용 68.85㎡ 없음 |
| seoul-gangseo-deungchon-jugong-3-21 | KB 등촌3단지주공에 전용 49.5㎡ 없음 (37.67/58.14㎡) |
| seoul-gangseo-deungchon-ipark-24 | KB 등촌동아이파크에 59㎡ 없음 |
| gyeonggi-goyang-haengsin-haetbit-21-24 | KB에 햇빛마을21단지 없음 |
| gyeonggi-goyang-ilsan-baekma-1-32 | KB 백마마을(삼성)에 84㎡ 없음 (최소 101.91㎡) |
| gyeonggi-gwangmyeong-haan-jugong-7-22 | KB 하안주공7단지에 전용 49.5㎡ 없음 (45.77/58.01㎡) |
| incheon-yeonsu-woosung-1-31 | KB 연수1차우성에 84㎡ 없음 (최소 101.97㎡) |
| seoul-yeongdeungpo-singil-woosung-3-23 | KB 신길우성3차에 전용 59.94㎡ 없음 (53.24/64.40㎡) |
| gyeonggi-goyang-ilsanseo-juyeop-kangseon-19-24 | KB 강선19단지우성에 59㎡ 없음 (최소 101.82㎡) |
| gyeonggi-anyang-dongan-pyeongchon-chowlwon-7-24 | KB 초원부영에 전용 54.5㎡ 없음 (50.00/60.00㎡) |
| gyeonggi-gunpo-sanbon-maehwa-14-24 | KB 매화14단지에 전용 58.4㎡ 없음 (49.67㎡) |
| gyeonggi-guri-galmae-purgio-24 | KB 구리갈매푸르지오에 59㎡ 없음 (최소 84.47㎡) |

## 갱신했지만 확인이 필요한 항목
**원본 전용면적이 KB와 다름(평형은 일치 → KB 평형으로 갱신)**
- seoul-gwanak-sillim-hyundai-23: 원본 55.35㎡ → KB 59.85㎡(23평)
- seoul-dobong-ssangmun-hanyang-1-27: 원본 69.84㎡ → KB 66.33㎡(27.5평)
- gyeonggi-yongin-suji-pungdeokcheon-24: 원본 59.98㎡ → KB 62.26㎡(24.7평)
- gyeonggi-bucheon-sosa-jugong2-24: 원본 59.85㎡ → KB 58.14㎡(23.9평)
- gyeonggi-goyang-ilsandong-baekseok-baeksong-24: 원본 56.5㎡ → KB 59.88㎡(23평)

**KB시세 미제공 / 전세 미제공**
- gyeonggi-namyangju-dasan-nature-epyeonhan: KB시세 미제공 → `kbPrice` 생략(실거래·호가만 갱신)
- seoul-gangdong-gil-dong-samik-park-23, gyeonggi-yongin-suji-pungdeokcheon-samik-24: KB 전세가 미제공 → `jeonseAvg`, `jeonseRate` = null

**원본 naverComplexNo가 KB 기록과 다름(이름·면적은 일치)**
- 한아름마을 삼환(24·31평), 상계주공3단지(17평), 월계한진한화그랑빌(25·33평), 돈암한신한진(24·31평), 신내동성, 은평뉴타운상림마을(→KB 상림마을6단지푸르지오 C-6, 네이버 26292 일치), 루원호반·검단금호(인천 행정구역 개편: 서구→서해구·검단구)

**2026년 3분기 이후 매매 거래 0~1건 (직전 거래로 보충)** — 40개
- 3분기 이후 거래 0건: 개봉현대33, 배곧한라비발디1차, 방학청구, 방학벽산1, 부평동아1(28·31), 창동주공17(21), 쌍문한양1차(21), 쌍문극동(2021년 거래가 마지막), 신내데시앙, 용마산하늘채, 장안현대홈타운1차(24), 은평상림, 개봉푸르지오(2025년), 풍덕천한국, 인창주공1, 길동삼익파크, 상도더샵1차(2025년), 인천논현힐스테이트
- 3분기 이후 거래 1건: 백련산힐스테이트1(25), 비산삼성래미안, 방학신동아2, 방학거성, 산곡현대3(26), 작전현대2차(31), 루원호반(29), 창동주공17(18), 도봉서원, 상계주공3, 두산위브트레지움, 길음푸르지오2(24), 면목한신, 무악청구, 구로두산, 남서울힐스테이트, 신정아이파크, 대림현대3, 하안주공5(19), 사당대림, 백송5단지

**실거래 이상치(원자료 그대로 반영)**: 다산자연앤e편한세상 2026.09 17층 5.3억, 번동주공1 2026.10 1층 3.05억, 길음푸르지오2 33평 2026.08 7.5억, 석관두산 2026.09 7.26억 — 직거래·특수관계 거래 가능성. 대표가 산정에는 중앙값을 써서 영향을 줄였습니다.
