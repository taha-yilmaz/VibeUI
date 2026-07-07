# VibeUI - Your Ultimate UI Reference Engine

![VibeUI Demo](./vibeUI.gif)

VibeUI is a powerful, self-hosted crawler and UI reference engine designed to scrape web pages, extract clean HTML structures, and take high-quality desktop and mobile screenshots for UI/UX references. It leverages **Playwright** for headless browser automation, **BullMQ** for robust job queuing, and **React** for a seamless frontend experience.

## 🚀 Features

- **Deep Crawling**: Configure max depth to crawl entire domains and extract all internal links automatically.
- **Headless Browser Scraping**: Powered by Playwright to render JavaScript-heavy sites and capture exact snapshots.
- **DOM Cleaning**: Automatically cleans and normalizes scraped HTML for easy reading and AI prompt usage.
- **Visual References**: Captures both Desktop (1440x900) and Mobile (390x844) full-page screenshots.
- **Robust Queue System**: Powered by BullMQ and Redis for scalable, concurrent background jobs.
- **AI-Ready Exports**: Export cleaned DOM and screenshots directly into AI-friendly Markdown format to recreate UIs with Tailwind and React.
- **Authenticated Scraping (Optional)**: Capture live browser sessions to scrape private/login-protected pages seamlessly.

## 🔐 Authentication & Security
- **100% Optional:** Logging in is completely optional. If you choose not to log in, VibeUI will act as a standard anonymous visitor and scrape only publicly accessible pages.
- **Privacy First:** We never store your passwords or credentials. VibeUI only saves temporary session cookies and local storage (`storageState`) to maintain the login state.

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express
- Prisma ORM (PostgreSQL)
- BullMQ (Redis)
- Playwright & Cheerio
- TypeScript

**Frontend:**
- React 19
- Vite
- TypeScript

**Infrastructure:**
- Docker & Docker Compose (for PostgreSQL & Redis)

## 📦 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vibeui.git
cd vibeui
```

### 2. Start Database and Redis

We use Docker to quickly spin up PostgreSQL and Redis instances.

```bash
docker-compose up -d
```

### 3. Environment Variables

Create a `.env` file in the root directory based on your setup. You can copy the provided `.env.example` file. A typical configuration looks like this:

```env
DATABASE_URL="postgresql://vibeui:vibeui_password@localhost:5433/vibeuidb?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000

# Storage Configuration (Cloudflare R2 or AWS S3)
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_ACCESS_KEY_ID="your_access_key_id"
S3_SECRET_ACCESS_KEY="your_secret_access_key"
S3_PUBLIC_URL="https://pub-xxxxxxxxxxxxxx.r2.dev"
S3_BUCKET_NAME="your_bucket_name"
```

### 4. Install Backend Dependencies & Setup Database

```bash
# Install dependencies
npm install

# Install playwright browsers
npx playwright install --with-deps

# Push the schema to the database and generate Prisma Client
npm run db:push
npm run db:generate
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## 🚀 Running the Application

You will need two terminal windows to run both the backend API (which also starts the background worker) and the frontend application.

### Terminal 1: Start the Backend Server & Worker

```bash
# From the root directory
npm run dev
```
*The server will start on `http://localhost:3000` and the BullMQ worker will begin listening for new crawl jobs.*

### Terminal 2: Start the Frontend Application

```bash
# From the frontend directory
cd frontend
npm run dev
```
*The Vite development server will start, usually on `http://localhost:5173`.*

## 📚 API Endpoints

- `POST /api/jobs` - Create a new crawl job (Body: `{ "url": "https://example.com", "maxDepth": 2 }`)
- `GET /api/jobs/:jobId` - Get the status of a specific job
- `GET /api/jobs/:jobId/pages` - List all discovered and processed pages for a job
- `GET /api/pages/:pageId?format=markdown` - Get the AI-ready markdown format of a scraped page, including the clean DOM and screenshot reference.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a Pull Request if you'd like to improve VibeUI.

## 📝 License

This project is licensed under the [ISC License](LICENSE).
