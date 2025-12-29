import "./App.css";
import Pages from "@/pages/index.jsx";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Pages />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
