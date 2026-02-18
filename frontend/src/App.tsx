import { Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { useWebSocket } from "./hooks/useWebSocket";
import { GalleryPage } from "./pages/GalleryPage";
import { GenerationPage } from "./pages/GenerationPage";
import { ModelsPage } from "./pages/ModelsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  useWebSocket();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<GenerationPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
