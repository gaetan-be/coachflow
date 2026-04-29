import { useEffect } from 'react';
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

  useEffect(() => {
    document.title = branding.brand_name;
  }, [branding.brand_name]);

  return (
    <BrandingContext.Provider value={branding}>
      <AuthContext.Provider value={authState}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/fr/hello/student" element={<QuestionnairePage />} />
            <Route path="/nl/hello/student" element={<QuestionnairePage />} />
            <Route path="/fr/hello/pro" element={<AdultQuestionnairePage />} />
            <Route path="/nl/hello/pro" element={<AdultQuestionnairePage />} />
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
