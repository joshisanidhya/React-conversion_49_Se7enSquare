import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Index from './Pages/Index';
import Landing from './Pages/Landing';
import Login from './Pages/Login';
import Pricing from './Pages/Pricing';
import Dashboard from './Pages/Dashboard';
import Chat from './Pages/Chat';
import Discovery from './Pages/Discovery';
import Events from './Pages/Events';
import EventApproval from './Pages/EventApproval';
import EventRegistrants from './Pages/EventRegistrants';
import CreateCommunity from './Pages/CreateCommunity';
import CommunityPage from './Pages/CommunityPage';
import CommunitySettings from './Pages/CommunitySettings';
import Report from './Pages/Report';
import Appeal from './Pages/Appeal';
import ModPanel from './Pages/ModPanel';
import AdminDashboard from './Pages/AdminDashboard';
import OrganizerDashboard from './Pages/OrganizerDashboard';
import OwnerDashboard from './Pages/OwnerDashboard';
import ProfileSettings from './Pages/ProfileSettings';
import User from './Pages/User';

// Protected Route wrapper with role-based access control
function getStoredUser() {
  try {
    const raw = localStorage.getItem('nexus_user') || localStorage.getItem('currentUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles }) {
  const user = getStoredUser();

  if (!user || !user.username) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.role || '').toLowerCase();
    // admin has superuser access to all admin/mod/cm/organizer/owner views
    if (role === 'admin') {
      return children;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/landing.html" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login.html" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing.html" element={<Pricing />} />

      {/* Authenticated User Core Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard.html" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat.html" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/discovery.html" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
      <Route path="/create-community" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
      <Route path="/create-community.html" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
      <Route path="/community-page" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-page.html" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-page/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/community-settings" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/community-settings.html" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/community-settings/:id" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/events.html" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/event-registrants" element={<ProtectedRoute><EventRegistrants /></ProtectedRoute>} />
      <Route path="/event-registrants.html" element={<ProtectedRoute><EventRegistrants /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/report.html" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/appeal" element={<ProtectedRoute><Appeal /></ProtectedRoute>} />
      <Route path="/appeal.html" element={<ProtectedRoute><Appeal /></ProtectedRoute>} />
      <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="/profile-settings.html" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
      <Route path="/user.html" element={<ProtectedRoute><User /></ProtectedRoute>} />

      {/* Role-Specific Protected Routes */}
      <Route
        path="/admin-dashboard"
        element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin-dashboard.html"
        element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/owner-dashboard"
        element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/owner-dashboard.html"
        element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/organizer-dashboard"
        element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/organizer-dashboard.html"
        element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/mod-panel"
        element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><ModPanel /></ProtectedRoute>}
      />
      <Route
        path="/mod-panel.html"
        element={<ProtectedRoute allowedRoles={['moderator', 'admin']}><ModPanel /></ProtectedRoute>}
      />
      <Route
        path="/event-approval"
        element={<ProtectedRoute allowedRoles={['community_manager', 'admin']}><EventApproval /></ProtectedRoute>}
      />
      <Route
        path="/event-approval.html"
        element={<ProtectedRoute allowedRoles={['community_manager', 'admin']}><EventApproval /></ProtectedRoute>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
