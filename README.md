🧑‍💻 Dev Tycoon – Game mô phỏng hành trình lập trình viên từ freelancer đến startup founder
Từ những dòng code đầu tiên đầy bug... đến khi bạn trở thành ông trùm công nghệ dẫn dắt startup tỷ đô.
Một tựa game web mô phỏng hành trình phát triển sự nghiệp lập trình viên – dành cho những ai từng “ăn ngủ cùng deadline”.
________________________________________
🎮 Giới thiệu
Dev Tycoon là một web simulation game mô phỏng quá trình phát triển sự nghiệp của một lập trình viên – bắt đầu từ freelancer viết bug dạo, dần dần trở thành senior dev, trưởng phòng IT, rồi founder startup công nghệ.
Người chơi sẽ:
•	Viết code, nhận job freelance, nâng cấp kỹ năng.
•	Tuyển nhân viên, mở công ty, mở rộng dự án.
•	Giao tiếp với khách hàng, mentor, đối tác qua AI NPC.
•	Quản lý tài chính, deadline, và danh tiếng công ty.
•	Từng bước xây dựng “đế chế công nghệ” của riêng mình.
________________________________________
🧩 Tech Stack
Thành phần	Công nghệ
Frontend	Next.js + TailwindCSS
Backend	Laravel 11
Database	MySQL
Authentication	Laravel Sanctum
Realtime	Pusher Channels
AI Engine (Phase 3)	Google Gemini API
________________________________________
⚙️ Cài đặt dự án
1️⃣ Clone repository
git clone https://github.com/thong2085/dev-tycoon.git
cd dev-tycoon
2️⃣ Cài đặt backend (Laravel)
cd backend
composer install
cp .env.example .env
php artisan key:generate
•	Cấu hình database trong .env (MySQL)
•	Chạy migration:
php artisan migrate --seed
•	Chạy server:
php artisan serve
3️⃣ Cài đặt frontend (Next.js)
cd frontend
npm install
npm run dev
Frontend sẽ chạy ở http://localhost:3000 và kết nối đến API Laravel ở http://127.0.0.1:8000.
________________________________________
🚀 Gameplay Core Loop
1.	Freelancer Phase:
o	Nhận job nhỏ, viết code, nộp sản phẩm.
o	Kiếm XP và tiền để nâng cấp kỹ năng.
2.	Team Phase:
o	Thuê dev phụ, chia task, tối ưu thời gian.
o	Quản lý stress và deadline.
3.	Startup Phase:
o	Tạo sản phẩm riêng, gọi vốn, marketing.
o	Đối mặt với rủi ro, bug production và drama nội bộ 😅
________________________________________
🤖 AI Tích hợp (Phase 3)
✨ Gemini API – AI cho thế giới Dev Tycoon
•	AI Mentor: Cho lời khuyên coding, career, productivity.
•	AI Project Generator: Sinh ngẫu nhiên dự án theo cấp độ player.
•	AI NPC: Hội thoại động với khách hàng, đồng nghiệp, nhà đầu tư.
•	AI Event Engine: Tạo sự kiện ngẫu nhiên trong thế giới công nghệ.
Tất cả đều được sinh bởi Gemini, với prompt được thiết kế theo context game state để giữ tính logic và hài hước.
________________________________________
🧱 Cấu trúc thư mục
DevTycoon/
├── backend/              # Laravel API (Game logic, DB, Auth)
│   ├── app/
│   ├── database/
│   └── routes/api.php
│
├── frontend/             # Next.js UI (Dashboard, Gameplay, Chat)
│   ├── components/
│   ├── pages/
│   └── services/api.ts
│
├── docs/                 # Tài liệu phát triển
│   ├── AI-Integration-Gemini.md
│   ├── ERD-System-Architecture.md
│   └── Game-Design-Overview.md
│
└── README.md             # File này :)
________________________________________
🧭 Roadmap
🏗️ Phase 1 – Core Game Engine (Laravel)
•	 User Auth (Sanctum)
•	 GameState, Project, Employee Models
•	 Clicker & Idle Income Loop
💼 Phase 2 – UI & Realtime Integration
•	 Next.js Dashboard (Job Board, Tasks)
•	 Pusher Realtime Updates
🧠 Phase 3 – AI Integration (Gemini)
•	 AI Mentor Chat
•	 AI Project Generator
•	 AI NPC Conversations
🌐 Phase 4 – Public Launch & Balancing
•	 Leaderboard, Economy Balancing
•	 Save/Load Cloud State
________________________________________
❤️ Đóng góp
Mọi ý tưởng, pull request hoặc bug report đều được hoan nghênh!
Nếu bạn cũng từng là “dev bị deadline dí”, thì đây chính là nơi để biến trải nghiệm đó thành... gameplay 😆
________________________________________
📫 Liên hệ & Cộng đồng
Tác giả: Thống
Email: thong208585@gmail.com
Cộng đồng dev: (Sẽ cập nhật...)
________________________________________
Dev Tycoon – Một tựa game cho dev, bởi dev, và về dev. 💻🔥


Dev Tycoon — ERD & System Architecture
Backend: Laravel (API + Simulation Engine)
Frontend: NextJS (React)
DB: MySQL + Redis (cache, queue)
Realtime: Laravel Pusher 
Queue: Redis Queue (Laravel Horizon)
________________________________________
1. Mục tiêu tài liệu
Tài liệu này mô tả ERD (Entity Relationship Diagram), các bảng chính, quan hệ giữa chúng, cùng luồng dữ liệu (sequence flow) cho các hành động quan trọng (click → income, start project, hire employee, prestige), kiến trúc service-level, cron/queue design và các event broadcast cần có.
Mục tiêu: cung cấp blueprint để dev backend Laravel + frontend NextJS triển khai Phase 1–2 (Freelancer → Studio) với mở rộng cho Phase 3+.
________________________________________
2. ERD (Mermaid)
erDiagram
    users ||--o{ companies : owns
    users ||--o{ game_states : has
    companies ||--o{ employees : employs
    companies ||--o{ projects : runs
    users ||--o{ projects : creates
    projects ||--o{ project_tasks : contains
    employees ||--o{ tasks : performs
    companies ||--o{ products : builds
    researches }o--|| companies : belongs_to
    market_events ||--o{ companies : affects
    leaderboards ||--o{ users : ranks

    USERS {
      bigint id PK
      varchar name
      varchar email
      varchar password
      int level
      int prestige_points
      datetime last_active
      timestamps
    }

    COMPANIES {
      bigint id PK
      bigint user_id FK
      varchar name
      int company_level
      decimal cash
      decimal monthly_revenue
      decimal monthly_costs
      timestamps
    }

    GAME_STATES {
      bigint id PK
      bigint user_id FK
      bigint company_id FK NULL
      decimal money
      decimal click_power
      decimal auto_income
      int xp
      int level
      json upgrades
      timestamps
    }

    EMPLOYEES {
      bigint id PK
      bigint company_id FK
      varchar name
      varchar role
      int productivity
      int skill_level
      int salary
      int energy
      enum status
      timestamps
    }

    PROJECTS {
      bigint id PK
      bigint company_id FK
      bigint user_id FK
      varchar title
      text description
      int difficulty
      decimal reward
      int progress
      datetime started_at
      datetime deadline
      enum status
      timestamps
    }

    PROJECT_TASKS {
      bigint id PK
      bigint project_id FK
      varchar title
      int estimated_hours
      int progress
      bigint assigned_employee_id FK NULL
      timestamps
    }

    PRODUCTS {
      bigint id PK
      bigint company_id FK
      varchar name
      varchar type
      int active_users
      decimal revenue_per_tick
      int version
      timestamps
    }

    RESEARCHES {
      bigint id PK
      bigint company_id FK
      varchar tech_name
      int level
      json bonuses
      datetime started_at
      datetime completed_at NULL
      timestamps
    }

    MARKET_EVENTS {
      bigint id PK
      varchar event_type
      text description
      json effect
      datetime start_time
      datetime end_time
      timestamps
    }

    LEADERBOARDS {
      bigint id PK
      bigint user_id FK
      int rank
      decimal score
      timestamps
    }

________________________________________
3. Key Relationships & Notes
•	users ↔ companies: Một user có thể sở hữu nhiều company (tương lai cho multi-company feature), mặc định phase 1 chỉ dùng 1 company.
•	game_states lưu trạng thái game tách biệt để dễ cache/snapshot/restore.
•	companies chứa các thông tin kinh tế toàn cục (cash, revenue, costs).
•	projects được chạy bên trong companies và có thể chứa nhiều project_tasks để mô phỏng agile.
•	employees liên kết với companies và có thể assigned task.
•	researches là tech tree items.
•	market_events là nguồn phát event toàn cầu ảnh hưởng tới doanh thu/costs/skill/market.
________________________________________
4. Sequence Flows (Mermaid)
4.1 Click → Income (user active)
sequenceDiagram
  participant Client
  participant API (Laravel)
  participant DB
  Client->>API: POST /api/game/click {user_id}
  API->>DB: BEGIN TRANSACTION
  API->>DB: UPDATE game_states SET money = money + click_power
  API-->>DB: SAVE
  API->>Client: 200 OK {newMoney, clickPower}
  API->>Broadcast: Event IncomeUpdated(user, delta)
  Broadcast-->>Client: IncomeUpdated via WebSocket
4.2 Offline Income Calculation (login)
sequenceDiagram
  participant Client
  participant API
  participant DB
  Client->>API: GET /api/game (user logs in)
  API->>DB: SELECT last_active, auto_income
  API->>DB: calculate secondsOffline = now - last_active
  API->>DB: money += secondsOffline * auto_income
  API-->>DB: UPDATE game_states (last_active = now)
  API->>Client: 200 OK {game_state}
4.3 Start Project → Project Progress (background)
sequenceDiagram
  participant Client
  participant API
  participant DB
  participant QueueWorker
  Client->>API: POST /api/projects/start {projectParams}
  API->>DB: INSERT project(status: in_progress)
  API->>Queue: dispatch ProcessProjectProgress(project_id)
  Queue->>QueueWorker: pick job
  QueueWorker->>DB: update project.progress += computedRate
  alt project.completed
    QueueWorker->>DB: project.status = completed
    QueueWorker->>Broadcast: ProjectCompleted
  end
________________________________________
5. Jobs & Scheduler design
•	Jobs (queued)
o	CalculateIdleIncome (every minute) — iterate active game_states or companies and compute income; write to DB and broadcast.
o	ProcessProjectProgress — triggered on project start and periodically by scheduler to progress tasks.
o	TriggerMarketEvent (every 5–15 min) — create global events affecting companies.
o	AIBehaviorTick — for NPC companies or AI assistant behaviors.
•	Scheduler
o	Use app/Console/Kernel.php to schedule jobs. Use Laravel Horizon + Redis for visibility.
o	Granularity: every 1 minute for most updates; per-second client UI can animate but persisted changes done per-minute.
Why per-minute?
•	Reduces DB writes, easier to scale. Client can show smoother per-second update using autoIncome/60.
________________________________________
6. Realtime events (Broadcast list)
Use Laravel Echo with laravel-websockets or Pusher.
•	IncomeUpdated — payload: {userId, delta, money}
•	ProjectUpdated — {projectId, progress, status}
•	ProjectCompleted — {projectId, reward}
•	EmployeeHired — {companyId, employee}
•	EmployeeQuit — {companyId, employeeId}
•	MarketEventTriggered — {eventId, effect}
•	LeaderboardUpdated — {top: []}
________________________________________
7. API Design (Important Endpoints)
•	POST /api/auth/register — create user
•	POST /api/auth/login — login (JWT / Sanctum)
•	GET /api/game — fetch full game state for dashboard
•	POST /api/game/click — perform click (returns delta)
•	POST /api/game/upgrade — buy upgrade
•	POST /api/projects/start — start project
•	POST /api/projects/:id/claim — claim completed project reward
•	POST /api/employees/hire — hire employee
•	POST /api/research/start — start research
•	POST /api/prestige — prestige/reset
•	GET /api/leaderboard — global leaderboard
Auth: Use Laravel Sanctum for SPA token or Passport for full OAuth. For NextJS, Sanctum with cookie-based SPA auth is smooth.
________________________________________
8. Caching & Performance
•	Cache heavy-read: GET /api/game should be cached per user for short TTL (e.g. 5s) in Redis.
•	Atomic updates: Use DB transactions for money updates; use optimistic locking where needed.
•	Shard/Partition: As user base grows, partition game_states and projects by user_id mod N.
•	Use queues for all heavy writes/compute (Horizon + Redis).
•	Rate limit: throttle clicks per second server-side to avoid abuse.
________________________________________
9. Migrations samples (pseudo-Laravel)
create_game_states_table
Schema::create('game_states', function (Blueprint $table) {
  $table->id();
  $table->foreignId('user_id')->constrained();
  $table->foreignId('company_id')->nullable()->constrained();
  $table->decimal('money', 20, 2)->default(0);
  $table->decimal('click_power', 12, 2)->default(1);
  $table->decimal('auto_income', 12, 2)->default(0);
  $table->integer('xp')->default(0);
  $table->integer('level')->default(1);
  $table->json('upgrades')->nullable();
  $table->timestamp('last_active')->nullable();
  $table->timestamps();
});
create_projects_table
Schema::create('projects', function (Blueprint $table) {
  $table->id();
  $table->foreignId('company_id')->constrained();
  $table->foreignId('user_id')->constrained();
  $table->string('title');
  $table->text('description')->nullable();
  $table->integer('difficulty')->default(1);
  $table->decimal('reward', 20, 2)->default(0);
  $table->integer('progress')->default(0);
  $table->enum('status', ['queued','in_progress','completed','failed'])->default('queued');
  $table->timestamps();
});
________________________________________
10. Security & Anti-cheat
•	Server-side authoritative: Never trust client for money/calculation.
•	Rate-limiting: clicks and upgrade requests.
•	HMAC-signed requests: optional, to make botting harder.
•	Detect anomalies: background job to flag impossible progress (huge money jumps) and soft-ban.
________________________________________
11. Deployment & Scaling
•	Initial: single Laravel app + Redis + MySQL managed (e.g., DigitalOcean, Linode, or AWS Lightsail)
•	Mid scale: Move to microservices: split economy-service, project-service, ai-service; use Kubernetes or ECS.
•	Realtime: Use laravel-websockets or Pusher. Consider horizontal scaling with Redis pub/sub.
•	CI/CD: GitHub Actions deploy to server(s); use worker pool for queues.
________________________________________
12. Next steps (recommended immediate deliverables)
1.	Finalize DB schema for Phase 1 (GameState, Users, Projects, Employees).
2.	Implement Laravel Sanctum auth + GET /api/game endpoint.
3.	Implement POST /api/game/click with DB transaction + broadcast.
4.	Create CalculateIdleIncome job and schedule it in Kernel (every minute).
5.	Build NextJS dashboard to display game state and call click endpoint.
________________________________________
13. Appendix — Useful Laravel packages
•	laravel/sanctum (auth)
•	beyondcode/laravel-websockets (websockets)
•	laravel/horizon (queue dashboard)
•	spatie/laravel-permission (roles/permissions if needed)
•	spatie/laravel-activitylog (audit)
•	spatie/laravel-rate-limited-queue (throttle queues)
________________________________________
Nếu Thống muốn, tôi có thể tiếp tục:
•	Viết migration đầy đủ + Eloquent models + sample controllers cho các endpoint quan trọng;
•	Tạo repo skeleton Laravel + NextJS (boilerplate) có auth, click endpoint, cron job đơn giản;
•	Hoặc phác họa UI mockup cho dashboard (NextJS + Tailwind).
Chọn tiếp: 1) Migrations + Models + Controllers skeleton hoặc 2) Repo skeleton (Laravel + NextJS) hoặc 3) UI mockup.

