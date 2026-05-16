<div align="center">

# ⚙️ HireIQ: Intelligent Backend Engine

**The high-performance AI backbone for modern recruitment automation.**

[![Node.js](https://img.shields.io/badge/NODE.JS@20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT@5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Express](https://img.shields.io/badge/EXPRESS.JS-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/POSTGRESQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/PRISMA-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![OpenAI](https://img.shields.io/badge/OPENAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)

[Frontend Repository](https://github.com/tausif-islam-sheik/HireIQ) | [Frontend Live URL](https://hireiq-bay.vercel.app) — Next.js Web Application

</div>

---

## 🚀 AI Processing Pipeline

The HireIQ server acts as an intelligent orchestrator, transforming raw candidate data into actionable hiring insights.

### 1. **Multi-Model AI Integration** 🤖

We leverage an ensemble of state-of-the-art Large Language Models (LLMs) via **Anthropic Claude** and **Meta Llama 3.1** to ensure maximum accuracy in resume parsing and interview coaching.

### 2. **Resume Screening Engine** 🔍

- **Extraction**: High-fidelity text extraction from PDF and DOCX using `pdf-parse` and `mammoth`.
- **NLP Analysis**: Sophisticated prompt engineering to identify technical competencies, soft skills, and experience tiers.
- **Weighted Scoring**: Algorithms that balance AI match percentages with candidate profile completeness and response speed.

### 3. **Smart Recommendation System** 🎯

A hybrid engine that combines:

- **Content-Based Filtering**: Matching candidate skills directly to job requirements.
- **Collaborative Context**: Learning from similar hire patterns to suggest the best-fit roles.

---

## 🛠️ Tech Stack & Infrastructure

- **Runtime**: Node.js 20+ with TypeScript for end-to-end type safety.
- **Database**: PostgreSQL with **Prisma ORM** for high-performance relational mapping.
- **Background Processing**: **BullMQ** & Redis for handling long-running AI screening tasks without blocking APIs.
- **Real-time Communication**: **Socket.io** for pushing AI score updates to the recruiter dashboard instantly.
- **Authentication**: Secure JWT-based auth with Role-Based Access Control (RBAC).

---

## 📦 API Overview

### AI & Recruitment Endpoints

| Endpoint                        | Method | Description                                    |
| :------------------------------ | :----- | :--------------------------------------------- |
| `/api/v1/ai/screen-resume`      | `POST` | Execute AI matching against a specific Job ID  |
| `/api/v1/ai/analyze-resume`     | `POST` | Generate candidate-facing resume quality audit |
| `/api/v1/ai/interview/question` | `POST` | Generate role-specific interview questions     |
| `/api/v1/ai/recommendations`    | `GET`  | Retrieve personalized job matches              |

### Core Management

| Endpoint               | Method | Description                                   |
| :--------------------- | :----- | :-------------------------------------------- |
| `/api/v1/jobs`         | `POST` | Create a job posting (Recruiter only)         |
| `/api/v1/applications` | `GET`  | Manage candidate pipelines and status updates |
| `/api/v1/auth/me`      | `GET`  | Retrieve session context and user role        |

---

## 🛠️ Getting Started

### Installation

```bash
# Clone and enter directory
git clone https://github.com/tausif-islam-sheik/HireIQ.git
cd HireIQ/hireiq-server

# Install dependencies
npm install

# Database setup
npx prisma migrate dev
npx prisma generate
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
CLAUDE_API_KEY="sk-ant-..."
OPENROUTER_API_KEY="sk-or-..."
PORT=5000
```

---

<div align="center">
Designed for scale. Powered by Intelligence. 🤖
</div>
