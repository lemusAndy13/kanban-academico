import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import ProtectedRoute from "./routes/ProtectedRoute";
import CalendarPage from "./pages/Calendar";
import Courses from "./pages/Courses";
import BoardPage from "./pages/Board";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Login />} />
        <Route path="admin-login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="boards" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="courses" element={<Courses />} />
          <Route path="board/:id" element={<BoardPage />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);
