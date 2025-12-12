# CF-Buddy 🚀 :: Analyze & Compare Codeforces Progress

**CF-Buddy** is a modern, futuristic web application designed for competitive programmers to track, analyze, and compare problem-solving progress on Codeforces. Experience a stunning 3D user interface, AI-powered insights, and personalized daily practice problems.

![Screenshot of the Application](./demo.png)

---

## ✨ Key Features

- **👤 Multi-User Tracking**: Add multiple Codeforces handles to monitor solved problems side-by-side.
- **🔐 Secure Authentication**: Integrated **Clerk** authentication for secure sign-up/sign-in and user profile management.
- **🤖 AI-Powered DPP**: Experience next-gen **Daily Practice Problems (DPP)** powered by **Google Gemini AI**.
  - Get personalized problem sets curated just for you.
  - AI analyzes your solving history to recommend "Warm-up" and "Main" problems.
  - **Elite Solver Insights**: Learn from the best with quick links to solutions by elite users.
- **🎨 Futuristic 3D UI**: Immersive user experience with **Three.js** background effects and glassmorphism design.
- **📊 Advanced Analytics Dashboard**:
  - **Rating History**: Visualize rating changes with rank color bands.
  - **Activity Heatmap**: GitHub-style submission consistency tracker.
  - **Skill Analysis**: Deep dive into your strengths and weaknesses by tag and rating.
- **🔍 Smart Filtering**:
  - **Dynamic Rating Slider**: Filter problems by precise difficulty ranges.
  - **Tag System**: Filter by algorithms (DP, Graphs, Number Theory, etc.).
- **🌐 Consolidated Problem List**: View a unified list of problems solved by tracked users, with status indicators (Solved/Attempted/Unsolved).

---

## 🛠️ Tech Stack

### Frontend (Client)

- **Framework**: [React](https://reactjs.org/) (v18+) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **3D & Motion**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei), [Framer Motion](https://www.framer.com/motion/)
- **Auth**: [Clerk](https://clerk.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)

### Backend (Server)

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose)
- **AI**: [Google Gemini API](https://ai.google.dev/) (@google/generative-ai)

---

## 📋 Prerequisites

- **Node.js**: LTS version (v18.x or v20.x recommended)
- **npm** (v9+) or **yarn**
- **MongoDB**: LOCAL or Atlas connection string.
- **API Keys**:
  - Clerk (Publishable Key & Secret Key)
  - Google Gemini API Key
  - Codeforces API Key & Secret

---

## 🚀 Getting Started

Follow these steps to set up the full stack application.

### 1. Clone the repository

```bash
git clone https://github.com/prashant-sagar-shakya/CF-Buddy.git
cd CF-Buddy
```

### 2. Backend Setup (`/server`)

Navigate to the server directory, install dependencies, and configure environment variables.

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CODEFORCES_KEY=your_codeforces_key
CODEFORCES_SECRET=your_codeforces_secret
```

Start the backend server:

```bash
npm run dev
```

_Server will run on http://localhost:5000_

### 3. Frontend Setup (`/client`)

Open a new terminal, navigate to the client directory, and install dependencies.

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Start the frontend development server:

```bash
npm run dev
```

_Client will run on http://localhost:5173_

---

## 🎈 Usage Guide

1.  **Initialize System**: On first load, click the **"Initialize System"** button to check server health and authentication status.
2.  **Sign In**: secure login via **Clerk** to access personalized features.
3.  **Dashboard**: After login, you are redirected to the dashboard where you can:
    - View your stats.
    - Generate **AI-curated DPPs**.
    - Chat with the AI assistant.
4.  **Track Users**: Add friends' handles to compare progress on the main landing page.

---

## 🤝 Contributing

Contributions are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License.
