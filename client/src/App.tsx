import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { BrandingContext, useBrandingState } from '@/hooks/useBranding';
import { RequireAuth } from '@/components/layout/RequireAuth';

import { HomePage } from '@/pages/HomePage';
import { TermsPage } from '@/pages/TermsPage';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { AdultQuestionnairePage } from '@/pages/AdultQuestionnairePage';
import { LoginPage } from '@/pages/LoginPage';
import { ListPage } from '@/pages/backoffice/ListPage';
import { PipelinePage } from '@/pages/backoffice/PipelinePage';
import { ProfilePage } from '@/pages/backoffice/ProfilePage';

export default function App() {
  const authState = useAuthState();
  const branding = useBrandingState();

  return (
    <BrandingContext.Provider value={branding}>
      <AuthContext.Provider value={authState}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/hello" element={<QuestionnairePage />} />
            <Route path="/welkom" element={<QuestionnairePage />} />
            <Route path="/pro/hello" element={<AdultQuestionnairePage />} />
            <Route path="/pro/welkom" element={<AdultQuestionnairePage />} />
            <Route path="/coach" element={<LoginPage />} />

            {/* Protected backoffice routes */}
            <Route
              path="/backoffice"
              element={
                <RequireAuth>
                  <ListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/backoffice/coachee/:id"
              element={
                <RequireAuth>
                  <PipelinePage />
                </RequireAuth>
              }
            />
            <Route
              path="/backoffice/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </BrandingContext.Provider>
  );
}
