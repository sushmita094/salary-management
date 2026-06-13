import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/router";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./features/auth/AuthProvider";

/** App composition: toast region → router → auth session → routes. */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
