# 12 Week Year

Planner web tương tác bám sát vòng lặp thực thi của **The 12 Week Year**: biến tầm nhìn dài hạn thành tối đa ba mục tiêu cho một chu kỳ 12 tuần, xác định các hành động dẫn dắt, xếp chúng vào lịch, đo điểm thực thi hằng tuần và thực hiện đánh giá tuần.

> “12 Week Year” là tên hiển thị của dự án này. “The 12 Week Year” là nhãn hiệu của The Execution Company; dự án vận dụng nguyên lý của sách nhưng không phải sản phẩm chính thức và không sao chép nội dung sách.

## Tính năng đã có

- **Hôm nay:** tổng quan tuần, tiến độ mục tiêu, thời gian chiến lược và check-in nhanh.
- **Thuật ngữ theo sách:** giao diện giữ các cụm nguyên bản `Goals`, `Tactics`, `Lead indicators`, `Lag indicators`, `Weekly Plan`, `Execution Score`, `WAM`, `Strategic`, `Buffer` và `Breakout`, kèm diễn giải tiếng Việt. Vision là định hướng cá nhân nên không được lưu trong planner state.
- **Đăng nhập:** bảo vệ giao diện và API bằng phiên ký số trong cookie `HttpOnly`, tự hết hạn sau 7 ngày.
- **Kế hoạch 12 tuần:** chỉnh Cycle Settings, thêm chu kỳ mới (lưu chu kỳ cũ vào lịch sử), 1–3 mục tiêu, thước đo kết quả và chiến thuật dẫn dắt.
- **Kế hoạch tuần:** sinh cam kết từ chiến thuật, cho phép đơn vị tùy chỉnh (`lần`, `giờ`, `phút`, `trang`…); bộ đếm tăng/giảm theo bước 1, riêng `giờ` theo bước 0,5.
- **Lịch sử hành động:** biểu đồ donut 7 ngày hoặc 4 tuần; bấm từng lát để xem các chiến thuật và đơn vị đã thực hiện.
- **Lịch:** tạo, liên kết chiến thuật, đánh dấu hoàn thành, trì hoãn hoặc chuyển ngày cho các khối Strategic/Buffer/Breakout; mọi thay đổi được ghi vào Calendar Journal.
- **Đánh giá tuần:** ghi thành tựu, điểm đứt gãy, bài học, điều chỉnh tuần tới, lưu lịch sử và sao chép bản tóm tắt họp trách nhiệm tuần.
- **Journal:** xem lại đầy đủ các chu kỳ đã lưu, Goals, Tactics, Action Journal theo tuần và Weekly Review.
- Điều hướng là route thật, hoạt động với chuột, bàn phím và touch; URL có thể chia sẻ trực tiếp.
- Tự động lưu vào PostgreSQL nhúng phía server qua API; không dùng `localStorage` làm nguồn dữ liệu.
- Responsive PWA, bottom navigation trên mobile, font **Inter Variable** self-host.
- Docker image multi-stage, chạy non-root, health check và volume dữ liệu bền vững.

Phiên bản hiện tại tối ưu cho một tài khoản quản trị/cài đặt cá nhân. Đăng ký nhiều người dùng, phân quyền và đồng bộ nhiều tài khoản là bước tiếp theo trước khi vận hành SaaS công khai.

## Vòng lặp sản phẩm

```text
Tầm nhìn
  → 1–3 mục tiêu 12 tuần
  → Thước đo kết quả
  → Thước đo hành động / chiến thuật
  → Cam kết tuần
  → Chặn lịch và thực thi hằng ngày
  → Điểm thực thi tuần
  → Đánh giá / họp trách nhiệm tuần
  → điều chỉnh tuần kế tiếp
```

Các nguyên tắc được giữ xuyên suốt:

1. Kế hoạch tuần chỉ chứa hành động chiến lược đã xuất phát từ Kế hoạch 12 tuần, không phải danh sách việc chung.
2. Điểm thực thi đo hành động người dùng kiểm soát được; tiến độ mục tiêu được hiển thị riêng.
3. Mỗi chu kỳ chỉ có 1–3 mục tiêu để bảo vệ sự tập trung.
4. Mốc 85% là tín hiệu về chất lượng thực thi, không phải cơ chế thưởng/phạt.
5. Lịch phân biệt khối chiến lược, khối xử lý công việc và khối nghỉ tái tạo.
6. Đánh giá tuần là một phần của vòng lặp, không chỉ là báo cáo tùy chọn.
7. Calendar điều chỉnh điểm thực thi: mỗi lần trì hoãn trừ 5 điểm, chuyển ngày trừ 3 điểm, tổng mức trừ tối đa 20 điểm.

Điểm thực thi được tính như sau:

```text
Tổng lượt đã thực hiện / Tổng lượt đã cam kết × 100
```

Mỗi commitment có `target` và `completed`. `completed` không vượt quá `target`, vì làm thêm một tactic không bù cho một tactic khác bị bỏ. Business rule nằm trong `packages/domain` để có thể dùng lại cho web và ứng dụng mobile.

## Kiến trúc

```text
.
├── apps/web/                 # Next.js App Router, UI, PWA và API routes
│   ├── app/api/state/        # GET/PUT toàn bộ planner state
│   ├── app/login/            # Đăng nhập
│   ├── app/plan/             # Cycle Settings, mục tiêu và chiến thuật
│   ├── app/week/             # Cam kết và điểm thực thi tuần
│   ├── app/calendar/         # Chặn lịch
│   ├── app/review/           # Đánh giá và họp trách nhiệm tuần
│   └── app/journal/          # Nhật ký chu kỳ, mục tiêu, chiến thuật và hành động
├── packages/domain/          # Types, seed và business rules dùng chung
├── Dockerfile                # Standalone production image
├── docker-compose.yml        # Web + persistent data volume
└── README.md
```

| Lớp | Công nghệ | Vai trò |
| --- | --- | --- |
| Web | Next.js 16, React 19, TypeScript | Full-stack UI, routing và API |
| Validation | Zod | Kiểm tra payload tại ranh giới API |
| Domain | TypeScript package thuần | Kiểu dữ liệu, dữ liệu khởi đầu, tiến độ và điểm thực thi |
| Database | PGlite (PostgreSQL nhúng) | Persistence server-side, không cần dịch vụ DB riêng cho base |
| Font | Inter Variable self-host | Hiển thị nhất quán, không phụ thuộc Google Fonts |
| Container | Docker multi-stage | Deploy nhất quán, process non-root, health check |
| Mobile | Responsive PWA | Touch-first và cài được lên home screen |

PGlite lưu một planner document có version trong cột `jsonb`. Cấu trúc này giúp base chạy ngay trên mọi máy chỉ với một container. Khi cần multi-user, cộng tác hoặc nhiều instance, nên chuyển repository sang PostgreSQL managed và chuẩn hóa thành `users`, `cycles`, `goals`, `tactics`, `weekly_commitments`, `time_blocks`, `weekly_reviews` và `audit_events`; UI/domain không cần viết lại.

## Chạy local

Yêu cầu Node.js 22+ và pnpm 11+.

```bash
pnpm install
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000). Dữ liệu mặc định nằm tại `.data/pglite` và được tạo tự động khi API được gọi lần đầu.

Các lệnh kiểm tra:

```bash
pnpm typecheck
pnpm build
pnpm start
```

Tạo tài khoản local qua terminal (username và password không nằm trong code):

```bash
pnpm account:create
```

Lệnh sẽ hỏi username, che mật khẩu khi gõ, tự sinh `AUTH_SECRET` và ghi vào `apps/web/.env.local`. Hãy khởi động lại `pnpm dev` sau khi tạo hoặc đổi tài khoản. File này đã được gitignore; production nên dùng secret manager hoặc environment riêng.

Nếu muốn tạo bằng giao diện, khi hệ thống chưa có account hãy mở `/setup`. Form thiết lập lần đầu nhận username/password bằng bàn phím, lưu password dưới dạng hash trong thư mục dữ liệu và tự khóa sau khi account đầu tiên được tạo.

Biến môi trường:

```dotenv
PGLITE_DATA_DIR=.data/pglite
NEXT_PUBLIC_APP_URL=http://107.161.168.82:12500
APP_BIND_ADDRESS=0.0.0.0
APP_PORT=12500
AUTH_USERNAME=<tên đăng nhập do bạn tự đặt>
AUTH_PASSWORD=<mật khẩu do bạn tự đặt>
AUTH_SECRET=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
AUTH_COOKIE_SECURE=false
```

`AUTH_USERNAME`, `AUTH_PASSWORD` và `AUTH_SECRET` không có giá trị dự phòng trong code. Với local development, đặt chúng trong `apps/web/.env.local` (đã được gitignore) hoặc secret manager trước khi chạy; nếu thiếu, endpoint đăng nhập sẽ từ chối hoạt động.

## Chạy bằng Docker

Tạo file `.env` trên máy triển khai từ mẫu (không commit file này vì chứa secret), sau đó khởi động service ở cổng host `12500`:

```bash
cp .env.example .env
# chỉnh AUTH_USERNAME, AUTH_PASSWORD, AUTH_SECRET trong .env
docker compose up -d --build
```

```bash
docker compose ps
curl http://127.0.0.1:12500/api/health
```

Ứng dụng công khai tại `http://107.161.168.82:12500` khi IP này thuộc máy chủ. Có thể đặt `APP_BIND_ADDRESS=107.161.168.82` để chỉ bind đúng interface đó, hoặc giữ `0.0.0.0` để nghe trên mọi interface; `APP_PORT` đổi cổng public, còn container vẫn lắng nghe cổng nội bộ `3000`. Named volume `planner_data` giữ database sau khi container restart hoặc được tạo lại.

```bash
docker compose down
```

Lệnh trên giữ nguyên dữ liệu. Chỉ thêm `--volumes` khi thực sự muốn xóa toàn bộ planner local.

Image lắng nghe cổng nội bộ `3000`, chạy bằng user `nextjs`, có endpoint kiểm tra tại `/api/health`, và ghi database vào `/app/data/pglite`. Docker Compose bắt buộc nhận `AUTH_USERNAME`, `AUTH_PASSWORD` và `AUTH_SECRET` từ environment/secret bên ngoài source code; đặt `AUTH_COOKIE_SECURE=true` khi chạy qua HTTPS. Cổng `12500` chỉ giảm va chạm với bot quét tự động, không thay thế firewall, cập nhật hệ điều hành hoặc HTTPS. Với môi trường thực tế, nên đặt reverse proxy (Nginx/Caddy) phía trước, chỉ mở `80/443`, bật HTTPS rồi đặt `AUTH_COOKIE_SECURE=true`. Có thể triển khai trên VPS nếu gắn persistent volume vào `/app/data`; nền tảng dùng filesystem tạm thời không phù hợp với PGlite, khi đó hãy dùng PostgreSQL managed.

## API và dữ liệu

- `POST /api/auth/login`: kiểm tra thông tin đăng nhập và tạo phiên ký số.
- `POST /api/auth/logout`: kết thúc phiên đăng nhập.
- `GET /api/auth/session`: đọc trạng thái phiên hiện tại.
- `GET /api/state`: đọc dữ liệu kế hoạch của tài khoản, tự tạo dữ liệu khởi đầu nếu chưa có.
- `PUT /api/state`: kiểm tra toàn bộ dữ liệu bằng Zod rồi cập nhật vào PostgreSQL nhúng.
- `GET /api/health`: health check nhẹ cho container/orchestrator.

Ứng dụng tự lưu sau khoảng 450 ms kể từ thay đổi cuối và hiển thị trạng thái `Đang lưu`, `Đã lưu` hoặc lỗi. Mọi mốc thời gian được lưu theo ISO/UTC; ngày và giờ khối thời gian được giữ theo dữ liệu người dùng nhập cho đến khi bổ sung múi giờ hồ sơ đầy đủ.

## Tối ưu mobile

PWA hiện tại đã có layout một cột, vùng chạm tối thiểu 44 px, bottom navigation cố định và manifest/service worker. Nếu phát triển native app, thêm `apps/mobile` bằng Expo/React Native và dùng lại:

- `@twelve-cycle/domain`
- Zod schemas và API contracts
- scoring, progress và cycle rules
- design tokens, không cố chia sẻ toàn bộ UI web

Ứng dụng gốc nên ưu tiên màn hình Hôm nay, thông báo, check-in nhanh và chuyển tiếp sang lịch; các luồng tạo Tầm nhìn/Kế hoạch chu kỳ dài vẫn phù hợp hơn với web hoặc máy tính bảng.

## Giới hạn và roadmap production

1. Đăng ký nhiều tài khoản, múi giờ người dùng và phân quyền phía máy chủ.
2. Khóa Kế hoạch tuần và nhật ký thay đổi sau khi cam kết.
3. Event log/daily log thay cho chỉ lưu bộ đếm tổng.
4. Offline mutation queue và xử lý xung đột giữa thiết bị.
5. Đánh giá chu kỳ cuối tuần 12 và lưu trữ nhiều chu kỳ.
6. Google/Outlook Calendar, web push và accountability sharing.
7. PostgreSQL managed + migration/versioning khi chạy nhiều instance.

## Tiêu chuẩn dự án

- TypeScript strict và dependency được pin phiên bản.
- Business rule quan trọng thuộc domain package, không rải trong component.
- Semantic HTML, focus state, keyboard/touch support và reduced-motion support.
- Không ghi Tầm nhìn, đánh giá hoặc nội dung mục tiêu vào dữ liệu phân tích.
- Không dùng browser storage làm nguồn dữ liệu chính.
- Không thay đổi công thức điểm cũ mà không nâng phiên bản dữ liệu.
