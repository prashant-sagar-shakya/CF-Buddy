# CF-Buddy 🚀 :: Analyze & Compare Codeforces Progress

**CF-Buddy** is a modern web application designed for competitive programmers to track, analyze, and compare problem-solving progress on Codeforces. Add multiple user handles, filter problems by rating and tags, view consolidated lists, visualize analytics, get personalized Daily Practice Problems (DPP), and gain insights into your and your friends' Codeforces journeys!

![Screenshot of the Application](./demo.png)
---

## ✨ Key Features

-   **👤 Multi-User Tracking**: Add multiple Codeforces handles to monitor solved problems side-by-side.
-   **🎯 Current User Context & Personalized Experience**: Designate a "current user" (by signing in with a handle) to:
    -   See problems *you've solved* highlighted green in the main problem list.
    -   See problems *you've attempted unsuccessfully* highlighted red in the main problem list.
    -   Filter the main list to show only problems you *have* or *have not* solved.
    -   Enable personalized Daily Practice Problems (DPP) based on your unsolved problems.
-   **📅 Daily Practice Problems (DPP)**: (Accessible via Header Button) *(New!)*
    -   **Curated Problem Sets**: Generate daily sets of "Warm-up" and "Main" problems tailored to your skill level.
    -   **Level Selection**: Choose from predefined DPP levels, each with a specific rating range.
    -   **Smart Generation**: Problems are selected based on:
        *   Matching the chosen rating range.
        *   Being solved by a predefined list of "elite" Codeforces users.
        *   Not yet solved by *you* (the signed-in user).
    -   **Elite Solver Insights**: For each DPP problem, view links to submissions from elite users who have solved it. If no elite solutions are listed, a direct "Solve" link to Codeforces is provided.
    -   **Problem Details**: See problem name (links to Codeforces), rating, and an expandable list of tags.
    -   **Daily Caching**: Generated DPP sets are saved locally (in browser storage) for the current day, per user and level, to avoid re-generation and ensure consistency.
    -   **Data Versioning**: Ensures that cached DPP data remains compatible with application updates, prompting for regeneration if stale.
-   **📊 User Analytics Dashboard**: (Accessible via Header Button)
    -   **Rating History**: Visualize rating changes over time with rank color bands.
    -   **Activity Heatmap**: See submission consistency with a GitHub-style heatmap.
    -   **Detailed Statistics**: Track total problems solved, yearly/monthly counts, and longest solving streaks.
    -   **Problem Difficulty Analysis**: Bar chart showing the distribution of solved problems by rating.
    *   **Tag Analysis**: Pie/Donut chart displaying the distribution of solved problem tags.
-   **🔍 Advanced Problem Filtering (Main List)**:
    -   **Rating Slider**: Dynamically filter problems in the main list by minimum and maximum rating.
    -   **Tag Selection**: Filter by multiple Codeforces tags (e.g., "dp", "graphs", "data structures"). Tags are automatically populated based on the added users' solved problems.
-   **📋 Consolidated Problem List**:
    -   View problems solved by *any* of the tracked users (matching filters), excluding duplicates.
    -   Clearly see *who* solved each problem (excluding the current signed-in user from this list).
    -   Link to others' submissions (where available).
    -   Sort problems easily by rating.
-   **🌐 Language Localization**: Problem names and some contest details are displayed based on your browser's preferred language setting (supports English and Russian via Codeforces API).
-   **🎨 Dark/Light Mode**: Toggle between themes for comfortable viewing.
-   **📱 Responsive Design**: Adapts gracefully to different screen sizes (desktop, tablet, mobile).
-   **💬 Toast Notifications**: User-friendly feedback for actions like adding users, sign-in, DPP generation, and API errors.
-   **⏳ Loading States**: Clear visual indicators while data is being fetched.

---

## 🛠️ Tech Stack

-   **Core**:
    -   [React](https://reactjs.org/) (v18+) - UI Library
    -   [TypeScript](https://www.typescriptlang.org/) - Static Typing
    -   [Vite](https://vitejs.dev/) - Build Tool & Dev Server
    -   [React Router DOM](https://reactrouter.com/) - Client-side Routing
-   **UI & Styling**:
    -   [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
    -   [Shadcn/UI](https://ui.shadcn.com/) - Accessible & Reusable Component Primitives
    -   [Lucide React](https://lucide.dev/) - Icon Library
-   **Charting & Visualization**:
    -   [Recharts](https://recharts.org/) - Composable Charting Library
    -   [date-fns](https://date-fns.org/) - Modern Date Utility Library
    -   (Optional: `react-calendar-heatmap`, `react-tooltip` - *Confirm if still used or remove if Recharts covers heatmap*)
-   **State Management**:
    -   React Context API (`UserContext`, `ThemeContext`)
    -   Component State (`useState`, `useCallback`, `useMemo`, `useEffect`)
-   **Data Fetching & API**:
    -   Browser `fetch` API
    -   [Codeforces API](https://codeforces.com/apiHelp)
    -   Browser `localStorage` (for DPP caching)
-   **(Development)**
    -   ESLint / Prettier (Assumed for code quality)

---

## 📋 Prerequisites

-   [Node.js](https://nodejs.org/) - LTS version (v18.x or v20.x recommended)
-   [npm](https://www.npmjs.com/) (v9+) or [yarn](https://classic.yarnpkg.com/) (v1.22+)

---

## 🚀 Getting Started

Get your local copy up and running in a few steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/prashant-sagar-shakya/CF-Buddy.git
    cd CF-Buddy
    ```

2.  **Install dependencies:**
    *   Using npm:
        ```bash
        npm install
        ```
    *   Or using yarn:
        ```bash
        yarn install
        ```

3.  **Run the development server:**
    *   Using npm:
        ```bash
        npm run dev
        ```
    *   Or using yarn:
        ```bash
        yarn dev
        ```

4.  **Open your browser:** Navigate to `http://localhost:5173` (or the port specified in your console output).

---

## 🎈 Usage Guide

1.  **Launch:** Start the application using the steps above.
2.  **Add Handles:** Use the input field (likely near the top on the main page) to add one or more Codeforces handles you want to track for the consolidated problem list.
3.  **Sign In (Set Current User):** Click the "Sign In" button in the header and enter *your* Codeforces handle. This handle will be used as the reference point for highlighting solved/attempted problems in the main list and for generating personalized Daily Practice Problems (DPP).
4.  **Filter Problems (Main List):**
    *   Use the **Rating Slider** to select a difficulty range.
    *   Click on **Tags** in the filter section to narrow down problems by topic. Available tags update based on the problems fetched for the added handles.
5.  **View Problem List (Main List):** The main area will display a consolidated list of problems solved by the added handles (matching your filters), sorted by rating.
    *   Observe the green/red highlights indicating your (current user's) status on those problems.
    *   See which *other* users solved each problem and link to their submissions.
6.  **Use Daily Practice Problems (DPP):**
    *   Ensure you are **signed in** with your Codeforces handle.
    *   Click the **DPP** button (🧠 icon) in the header (more prominent on larger screens).
    *   In the dialog, **select a DPP level** from the dropdown. Each level corresponds to a specific rating range.
    *   Click **"Generate Set"**. The application will fetch necessary data (if not already cached for the day) and compile a list of problems.
        *   If a set for that level and day is already cached in your browser, it will be displayed. You can choose to "Regenerate Set" for a fresh list.
        *   If cached data is from an older version or structure, you'll be prompted to regenerate.
    *   View the **"Warm-up"** and **"Main"** problem tables.
    *   For each problem, you'll see its name (link to problem), rating, tags (click `+X more` or the chevron to expand), and links to solutions by "elite" users (if available). If no elite solutions are listed for a problem, a direct "Solve" link to Codeforces is provided.
    *   The problems selected are those within the level's rating range, solved by elite users, and *not yet solved by you*.
7.  **Explore Analytics:**
    *   Click the **Analytics** button (📊 icon) in the header.
    *   Analyze rating trends, submission activity, rating/tag distributions for the signed-in user (or navigate to `/analytics/<handle>` manually if needed).
8.  **Toggle Theme:** Use the Sun/Moon icon in the header to switch between light and dark modes.

---

## 🧪 Running Tests

*(This section is a placeholder. Update if you add tests.)*

```bash
# Example using Vitest (if configured)
npm run test
# or
yarn test
```

Provide details on the testing framework used (e.g., Vitest, Jest, React Testing Library) and any specific setup required.

---

## 🤝 Contributing

Contributions make the open-source community great! Any contributions are **welcome and greatly appreciated**.

If you have improvements or features in mind:

1.  **Check for existing issues:** Look for related discussions or tasks.
2.  **Fork the Project:** Create your own copy.
3.  **Create a Feature Branch:** (`git checkout -b feature/YourAmazingFeature`)
4.  **Make your changes:** Implement your feature or bug fix.
5.  **Commit your Changes:** (`git commit -m 'feat: Add some AmazingFeature'`) - Follow Conventional Commits if possible.
6.  **Ensure Code Quality:** Run linters/formatters if set up (`npm run lint` / `yarn lint`).
7.  **Push to the Branch:** (`git push origin feature/YourAmazingFeature`)
8.  **Open a Pull Request:** Describe your changes clearly.

You can also open an issue with the tag "enhancement" or "bug" if you find problems or have ideas. Thank you! ⭐

---

## 📜 License

Distributed under the MIT License. See `LICENSE.md` for more information.

---

## 🙏 Acknowledgements

*   **Codeforces:** For their fantastic platform and public API.
*   **Shadcn/UI:** For the elegant component library structure.
*   **Recharts:** For the charting capabilities.
*   **Lucide React:** For the clean icons.
*   **Vite Team:** For the blazing fast development experience.
*   **Tailwind Labs:** For the utility-first CSS framework.