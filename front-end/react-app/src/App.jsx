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

export default function App() {
  return (
    <Routes>
      {/* Core Pages */}
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/landing.html" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login.html" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing.html" element={<Pricing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard.html" element={<Dashboard />} />

      {/* Community & Chat */}
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat.html" element={<Chat />} />
      <Route path="/discovery" element={<Discovery />} />
      <Route path="/discovery.html" element={<Discovery />} />
      <Route path="/create-community" element={<CreateCommunity />} />
      <Route path="/create-community.html" element={<CreateCommunity />} />
      <Route path="/community-page" element={<CommunityPage />} />
      <Route path="/community-page.html" element={<CommunityPage />} />
      <Route path="/community-settings" element={<CommunitySettings />} />
      <Route path="/community-settings.html" element={<CommunitySettings />} />

      {/* Events */}
      <Route path="/events" element={<Events />} />
      <Route path="/events.html" element={<Events />} />
      <Route path="/event-approval" element={<EventApproval />} />
      <Route path="/event-approval.html" element={<EventApproval />} />
      <Route path="/event-registrants" element={<EventRegistrants />} />
      <Route path="/event-registrants.html" element={<EventRegistrants />} />

      {/* Moderation, Reports & Appeals */}
      <Route path="/report" element={<Report />} />
      <Route path="/report.html" element={<Report />} />
      <Route path="/appeal" element={<Appeal />} />
      <Route path="/appeal.html" element={<Appeal />} />
      <Route path="/mod-panel" element={<ModPanel />} />
      <Route path="/mod-panel.html" element={<ModPanel />} />

      {/* Dashboards & Settings */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-dashboard.html" element={<AdminDashboard />} />
      <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer-dashboard.html" element={<OrganizerDashboard />} />
      <Route path="/owner-dashboard" element={<OwnerDashboard />} />
      <Route path="/owner-dashboard.html" element={<OwnerDashboard />} />
      <Route path="/profile-settings" element={<ProfileSettings />} />
      <Route path="/profile-settings.html" element={<ProfileSettings />} />
      <Route path="/user" element={<User />} />
      <Route path="/user.html" element={<User />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
