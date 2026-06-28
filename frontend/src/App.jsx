import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Chat from './pages/Chat';
import MyItems from './pages/MyItems';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/post-detail" element={<PostDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/my-items" element={<MyItems />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
