import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./layout/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Kanban } from "./pages/Kanban";
import { AIAssistant } from "./pages/AIAssistant";
import { Tasks } from "./pages/Tasks";
import { TaskDetail } from "./pages/TaskDetail";
import { Settings } from "./pages/Settings";

// Simple route guard - check if user exists in localStorage
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const currentUser = localStorage.getItem("@AgileTask:currentUser");

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, Component: Dashboard },
      { path: "tarefas", Component: Tasks },
      { path: "tarefas/:taskId", Component: TaskDetail },
      { path: "kanban", Component: Kanban },
      { path: "ai-assistant", Component: AIAssistant },
      { path: "configuracoes", Component: Settings },
      { path: "*", Component: () => <Navigate to="/" replace /> },
    ],
  },
]);
