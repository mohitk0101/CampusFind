import React, { createContext, useContext, useState, useEffect } from 'react';
import { CF } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(CF.isLoggedIn());
  const [user, setUser] = useState(CF.getUser());

  // The localStorage user is only a display cache. Validate the real session
  // with the backend; apiFetch will refresh an expired access cookie if possible.
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const data = await CF.apiGet('/auth/me');
        if (cancelled) return;
        CF.setAuth(data.user);
        setUser(data.user);
        setIsLoggedIn(true);
      } catch {
        if (cancelled) return;
        CF.clearAuth();
        setUser(null);
        setIsLoggedIn(false);
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, []);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark'; // default to false (light theme)
  });

  // Apply theme class to document body
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Cached data state
  const [stats, setStats] = useState(null);
  const [statsLastFetched, setStatsLastFetched] = useState(null);

  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [postsLastFetched, setPostsLastFetched] = useState(null);
  const [activeFiltersKey, setActiveFiltersKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Helper: check if cache is valid (TTL: 60 seconds)
  const isCacheValid = (lastFetched) => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < 60000; // 60 seconds
  };

  const loginUser = (userObj) => {
    CF.setAuth(userObj);
    setIsLoggedIn(true);
    setUser(userObj);
    clearCache();
  };

  const logoutUser = async () => {
    try {
      await CF.apiPost('/auth/logout', {});
    } catch (error) {
      // Clear the local UI even if the network is unavailable.
      console.warn('Server logout request failed:', error.message);
    } finally {
      CF.clearAuth();
      setIsLoggedIn(false);
      setUser(null);
      clearCache();
    }
  };

  const clearCache = () => {
    setStats(null);
    setStatsLastFetched(null);
    setPosts([]);
    setTotalPosts(0);
    setTotalPages(1);
    setPostsLastFetched(null);
    setActiveFiltersKey('');
  };

  const getStats = async (force = false) => {
    // If cache is valid and not forced, return cached stats
    if (!force && stats && isCacheValid(statsLastFetched)) {
      return stats;
    }
    try {
      const data = await CF.apiGet('/posts/dashboard-stats');
      setStats(data.stats);
      setStatsLastFetched(Date.now());
      return data.stats;
    } catch (e) {
      console.error('Error fetching stats:', e);
      throw e;
    }
  };

  const getPosts = async (queryString, force = false, append = false) => {
    const cacheKey = queryString;
    // If cache is valid, filters haven't changed, and not forced, return cached posts (only when not appending)
    if (!force && posts.length > 0 && activeFiltersKey === cacheKey && isCacheValid(postsLastFetched) && !append) {
      return { posts, totalPosts, totalPages };
    }

    setIsLoading(true);
    try {
      const data = await CF.apiGet(`/posts?${queryString}`);
      const fetchedPosts = data.posts || [];
      if (append) {
        setPosts((prev) => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }
      setTotalPosts(data.total || 0);
      setTotalPages(data.pages || 1);
      setPostsLastFetched(Date.now());
      setActiveFiltersKey(cacheKey);
      setIsLoading(false);
      return { posts: fetchedPosts, totalPosts: data.total, totalPages: data.pages };
    } catch (e) {
      setIsLoading(false);
      console.error('Error fetching posts:', e);
      throw e;
    }
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn,
      user,
      loginUser,
      logoutUser,
      stats,
      getStats,
      posts,
      totalPosts,
      totalPages,
      getPosts,
      isLoading,
      clearCache,
      isDark,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
