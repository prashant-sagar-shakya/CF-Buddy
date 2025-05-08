# CF-Buddy 🚀

**CF-Buddy** is a modern web application designed to help competitive programmers track, analyze, and compare their problem-solving progress on Codeforces. Add multiple user handles, filter problems by rating and tags, and gain insights into your and your friends' Codeforces journeys!

![Screenshot of the Application](./demo.png)

## ✨ Features

- **Multi-User Tracking**: Add and monitor the solved problems of multiple Codeforces users.
- **Current User Context**: Set a "current user" to highlight their solved problems or identify problems they've attempted unsuccessfully within other users' lists.
- **Advanced Problem Filtering**:
  - **Rating Slider**: Dynamically filter problems by a minimum and maximum rating.
  - **Tag Selection**: Filter problems by one or more tags (e.g., "dp", "graphs", "data structures"). Tags are dynamically populated based on fetched problems.
  - **Clear Filters**: Easily reset tag filters or all filters.
- **Detailed Problem Lists**:
  - View a list of solved problems for each tracked user, based on current filters.
  - Problems are **sorted by rating** in ascending order.
  - Information includes problem name, contest ID, index, and rating.
  - **Visual Cues**:
    - Problems solved by the "current user" are highlighted (e.g., green).
    - Problems the "current user" has attempted but got incorrect submissions on are highlighted (e.g., red).
- **Responsive Design**: User-friendly interface that works across different screen sizes.
- **Toast Notifications**: Informative feedback for API calls and errors.
- **Loading States**: Clear indicators when data is being fetched.
- **Dynamic Tag Discovery**: Problem tags available for filtering are automatically discovered from users' solved problems.

## 🛠️ Tech Stack

- **Frontend**:
  - [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
  - [TypeScript](https://www.typescriptlang.org/) - Superset of JavaScript for strong typing.
  - [Vite](https://vitejs.dev/) (Assumed, common for modern React projects) - Next-generation frontend tooling.
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
  - [Shadcn/UI](https://ui.shadcn.com/) - Beautifully designed components that you can copy and paste into your apps.
  - [Lucide React](https://lucide.dev/) - Simply beautiful open-source icons.
- **State Management**:
  - React Context API (`UserContext`)
- **API**:
  - [Codeforces API](https://codeforces.com/apiHelp) - For fetching user submissions and problem data.
- **Utilities**:
  - `use-toast` (from Shadcn/UI) for notifications.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18.x or v20.x)
- [npm](https://www.npmjs.com/) or [yarn](https://classic.yarnpkg.com/)

## 🚀 Getting Started

Follow these steps to get a local copy up and running:

1.  **Clone the repository:**

    ```bash
    https://github.com/prashant-sagar-shakya/CF-Buddy.git
    cd CF-Buddy
    ```

2.  **Install dependencies:**
    Using npm:

    ```bash
    npm install
    ```

    Or using yarn:

    ```bash
    yarn install
    ```

3.  **Run the development server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    This will typically start the application on `http://localhost:5173` (or another port if specified by Vite).

## 🎈 Usage

1.  **Add Codeforces Handles**: Enter one or more Codeforces handles in the designated input area.
2.  **Set Current User (Optional)**: Select one of the added handles as the "current user" via the User Context provider (how this is implemented in UI would be detailed here - e.g., a dropdown or a settings panel).
3.  **Apply Filters**:
    - Adjust the **Rating Slider** to define a difficulty range.
    - Click on **Tags** to include or exclude problems with specific topics.
4.  **View Problem Lists**: The application will display tables of solved problems for each user (excluding the current user's separate table, as their status is shown on others' lists).
    - Observe color highlights for problems solved or attempted by the current user.
    - Click problem names to navigate to the problem page on Codeforces.

## 🧪 Running Tests (If Applicable)

```bash
npm test
# or
yarn test
```

_(Add more details if you have specific test suites or configurations)_

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Ensure code quality** (e.g., `npm run lint` or `yarn lint` if linters are set up)
5.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
6.  **Open a Pull Request**

Please ensure your PR describes the problem and solution. Include screenshots if applicable.

## 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

- [Codeforces API](https://codeforces.com/apiHelp) for providing the data.
- [Shadcn/UI](https://ui.shadcn.com/) for the beautiful components.
- [Lucide Icons](https://lucide.dev/) for the icons.
