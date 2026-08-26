import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import { Button } from '../components/ui/Button';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password,
      });

      console.log('Login response:', response);

      if (!response.data?.token || !response.data?.user) {
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          setError('Server returned an HTML page. Is the backend running on port 5000?');
        } else {
          console.error("Invalid response format:", response.data);
          setError(`Invalid response format from server. Data type: ${typeof response.data}`);
        }
        return;
      }

      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100 flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-gray-200">
        <img 
          src="/image-login.jpeg" 
          alt="Kasthuri Schools Campus" 
          className="w-full h-full object-cover object-center" 
        />
      </div>
      
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 lg:p-16">
        <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <img src={logo} alt="Kasthuri School Logo" className="w-29 h-24 mr-3" />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600   "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" loading={loading} loadingText="Logging in..." className="w-full">
            Login
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default Login;
