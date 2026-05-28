# Remote Job Search Machine — Telegram Bot

매일 오전 8시 (KST) 리모트 잡 10개를 Telegram으로 전송합니다.  
지원여부를 카드별 체크박스로 한 번에 하나씩 확인합니다.

---

## 예시 메시지

```
☀️ 2025년 6월 3일 (화)

10개의 리모트 잡 — 지원 여부를 하나씩 체크하세요:
```

```
3/10

Senior Community Manager
Spotify · Remote (Europe)

🏷 community · music · growth
💰 $80k–$100k
🇰🇷 Korean
🕐 2 days ago

[🔗 View Job]  [⬜ Applied?]
         ↓ 클릭
[🔗 View Job]  [✅ Applied!]
```

---

## 스택

- **Node.js** + **TypeScript** (tsx)
- **Telegraf** — Telegram Bot framework
- **node-cron** — 08:00 KST 스케줄링
- **Prisma** + **Supabase** (PostgreSQL) — 잡 DB + 지원 트래킹
- **JSearch** / **Adzuna** / **Arbeitnow** API 연동

---

## 빠른 시작

### 1. 클론

```bash
git clone https://github.com/eunjungleedev22/gumgopresskit
cd gumgopresskit
git checkout claude/remote-job-search-mvp-tBttA
npm install
```

### 2. 환경변수

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
# 필수
TELEGRAM_BOT_TOKEN=   # @BotFather에서 발급
DATABASE_URL=         # Supabase 접속 주소
DIRECT_URL=           # 동일

# 선택 (API 동기화)
RAPIDAPI_KEY=         # jsearch.p.rapidapi.com
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

### 3. Telegram Bot 만들기

1. Telegram에서 **@BotFather** 찾기
2. `/newbot` 명령 실행
3. 이름 + username 설정
4. 수령한 **token** 을 `TELEGRAM_BOT_TOKEN`에 법어 넣기

### 4. 데이터베이스 세팅

[supabase.com](https://supabase.com)에서 프로젝트 생성 후:

```bash
npm run db:push
```

또는 Supabase SQL Editor에 `supabase/migrations/001_initial.sql` 전체 붙여넣기.

### 5. 보트 실행

```bash
# 일회성 잡 동기화 (API 키 존재 시)
npm run sync

# 봇 실행
npm run bot
```

---

## 커맨드

| Command | 설명 |
|---|---|
| `/start` | 일일 다이제스트 구독 |
| `/stop` | 구독 해제 |
| `/jobs` | 지금 바로 10개 받기 |
| `/applied` | 지원 표시한 잡 목록 |
| `/sync` | 모든 API에서 새 잡 가져오기 |
| `/help` | 도움말 |

---

## 동작 방식

```
[일일 08:00 KST]
    │
    ├─ DB에서 최신 잡 10개 조회
    ├─ 인트로 메시지 전송
    └─ 잡 카드 10개 개별 전송 (0.5초 간격)

[사용자 클릭: ⬜ Applied?]
    │
    ├─ DB에 applied=true 저장
    ├─ 메시지 수정: ⬜ → ✅
    └─ 체크 피드백 팔업

[/applied]
    └─ 지원한 전체 목록 표시
```

---

## Job Sources

| 소스 | 대상 | 인증 |
|---|---|---|
| JSearch (RapidAPI) | 글로벌, 대량 | RapidAPI key |
| Adzuna | EU, UK, AU, US | App ID + Key |
| Arbeitnow | 유럽 리모트 | 무인증 (public) |

잡 비교 스마트 태깅 자동 분류:
- Customer Success / Community / Partnerships / Growth
- Music / Web3 / AI / Startup
- Artist Relations / A&R / Label
- Korean speaking / Visa sponsorship

---

## 서버로 운영하기 (24/7)

로컈에서 지속 실행하려면 **Railway** 또는 **Render** 를 권장합니다.

```bash
# Railway
npm install -g @railway/cli
railway login
railway init
railway up
# Railway 대시보드에서 환경변수 설정
# Start command: npm run bot
```

또는 VPS에서 pm2 사용:

```bash
npm install -g pm2
pm2 start --interpreter tsx bot/index.ts --name remote-job-bot
pm2 save
pm2 startup
```

---

## 프로젝트 구조

```
bot/
├── index.ts        # 진입점: 커맨드 + 콜백 + 시작
├── digest.ts       # 데일리 다이제스트 전송 + cron 스케줄러
├── formatter.ts    # 메시지 포맷 + 인라인 키보드
└── storage.ts      # DB 조작 (subscribe, toggle apply, get jobs)

src/lib/
├── fetchers/       # JSearch / Adzuna / Arbeitnow API
├── tagger.ts       # 키워드 기반 자동 태깅
├── deduplicator.ts # URL 기반 중복 제거 + 45일 만료
└── prisma.ts       # Prisma 클라이언트

prisma/schema.prisma  # Job, ChatSubscription, BotApply, SyncLog
scripts/sync.ts       # CLI 수동 동기화
```
