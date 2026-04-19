import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { RequireAuth } from '@/components/layout/RequireAuth';

import { HomePage } from '@/pages/HomePage';
import { TermsPage } from '@/pages/TermsPage';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { LoginPage } from '@/pages/LoginPage';
import { ListPage } from '@/pages/backoffice/ListPage';
import { PipelinePage } from '@/pages/backoffice/PipelinePage';
import { ProfilePage } from '@/pages/backoffice/ProfilePage';

export default function App() {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/hello" element={<QuestionnairePage />} />
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
  );
}
