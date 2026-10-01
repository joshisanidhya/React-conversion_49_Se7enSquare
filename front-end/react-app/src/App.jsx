import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Index from './Pages/Index';
import Landing from './Pages/Landing';
import Login from './Pages/Login';
import Pricing from './Pages/Pricing';
import Dashboard from './Pages/Dashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
