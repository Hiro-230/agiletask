import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AppearanceProvider } from "./context/AppearanceContext";

export default function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <RouterProvider router={router} />
      </AppearanceProvider>
    </AuthProvider>
  );
}
