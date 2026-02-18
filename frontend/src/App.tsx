import type { JSX } from "react";

import { Route, Routes } from "react-router";

import { AppLayout } from "./components/layout/AppLayout";
import { useWebSocket } from "./hooks/useWebSocket";
import { GalleryPage } from "./pages/GalleryPage";
import { GenerationPage } from "./pages/GenerationPage";
import { ModelsPage } from "./pages/ModelsPage";
import { SettingsPage } from "./pages/SettingsPage";


export const App = (): JSX.Element => {
  useWebSocket();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<GenerationPage />} />
        <Route element={<GalleryPage />} path="gallery" />
        <Route element={<ModelsPage />} path="models" />
        <Route element={<SettingsPage />} path="settings" />
      </Route>
    </Routes>
  );
};
