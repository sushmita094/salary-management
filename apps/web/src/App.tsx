import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/router";
import { ToastProvider } from "./components/ui/Toast";

/** App composition: global toast region + client router. */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
