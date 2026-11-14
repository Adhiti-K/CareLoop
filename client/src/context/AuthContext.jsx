import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('careloop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('careloop_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUserSession() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('careloop_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification fallback', err.message);
        }
      }
      setLoading(false);
    }
    verifyUserSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('careloop_token', userToken);
      localStorage.setItem('careloop_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('careloop_token', userToken);
      localStorage.setItem('careloop_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network logout errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('careloop_token');
      localStorage.removeItem('careloop_user');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
