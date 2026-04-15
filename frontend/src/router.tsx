import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShellLayout } from './AppShellLayout';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { SlotSelectionPage } from './pages/SlotSelectionPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { AdminPage } from './pages/AdminPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShellLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/:eventTypeId" element={<SlotSelectionPage />} />
          <Route path="/booking/:eventTypeId/confirm" element={<BookingConfirmationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AppShellLayout>
    </BrowserRouter>
  );
}
