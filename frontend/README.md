# ⚛️ React + Vite Starter

This template provides a **minimal yet powerful setup** to get React running on [Vite](https://vitejs.dev/) with **Hot Module Replacement (HMR)** and built‑in **ESLint rules** for code quality.

---

## 🚀 Features

- ⚡ **Fast development** with Vite’s lightning‑quick bundling and HMR
- ✅ **Linting support** out of the box for cleaner, consistent code
- 🔌 **Plugin flexibility** with official React integrations
- 🛠️ Easy to extend with TypeScript, testing libraries, and more

---

## 🔌 Official React Plugins

You can choose between two official plugins depending on your preference:

- [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) → uses **Babel** for Fast Refresh
- [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react-swc) → uses **SWC** (faster, Rust‑based compiler) for Fast Refresh

---

## 📐 ESLint Configuration

This template includes a basic ESLint setup. For production‑grade applications, we recommend:

- Using **TypeScript** for type safety
- Enabling **type‑aware lint rules** with [`typescript-eslint`](https://typescript-eslint.io)
- Exploring the [React + TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for a ready‑made integration

---

## 🛠️ Next Steps

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Customize ESLint and Tailwind/PostCSS configs as needed.
4. Add TypeScript or testing libraries (Jest, Vitest, React Testing Library) for a production‑ready stack.

✨ With this setup, you get a fast, modern, and extensible React environment powered by Vite — perfect for both learning and building real‑world applications.

| Frontend File                        | Description                                                                             | Backend Dependency                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| api/apiClient.js                     | Configures Axios instance with JWT in headers, response interceptors                    | JWT auth in backend; protected endpoints                 |
| contexts/AuthContext.jsx             | Manages user authentication state with JWT token, login/logout methods                  | /api/auth/login,/api/auth/logout,/api/auth/me            |
| pages/Profile.jsx                    | Displays user info; allows editing profile data; uploads avatar/cover images            | /api/users/me,/api/users/me/profile,/api/users/me/avatar |
| components/AvatarUpload.jsx          | UI for selecting and previewing avatar file, sends multipart/form-data on submit        | /api/users/me/avatarwith file upload                     |
| components/CoverUpload.jsx           | Upload cover image with preview                                                         | /api/users/me/cover                                      |
| pages/Complaints/ComplaintForm.jsx   | Form to submit new complaint with multiple file attachments                             | /api/complaintsPOST, multipart/form-data files           |
| pages/Complaints/ComplaintList.jsx   | List complaints with filter/search options                                              | /api/complaints,/api/complaints/my                       |
| pages/Complaints/ComplaintDetail.jsx | Shows complaint info, attachments, comments, status; supports updates and adds comments | /api/complaints/:id, comments, attachments endpoints     |
| components/FileUploader.jsx          | Multi-file uploader with validation and progress                                        | /api/complaints/:id/attachmentsPOST                      |
| pages/Admin/UserList.jsx             | Admin user management with list, filters, pagination, and bulk updates                  | /api/users,/api/users/bulk                               |
| pages/Admin/UserStats.jsx            | Admin user statistics dashboard                                                         | /api/users/stats                                         |
| pages/Admin/ComplaintStats.jsx       | Admin dashboard for complaint statistics and reports                                    | /api/complaints/stats,/api/complaints/export/csv         |
| components/ProtectedRoute.jsx        | Wraps routes and restricts access based on user role                                    | Uses AuthContext with backend role permissions           |
| utils/validators.js                  | Functions for form validation (email, passwords, file types/sizes, required fields)     | Matches backend validation rules                         |
