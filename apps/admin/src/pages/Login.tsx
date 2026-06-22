import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@smarket.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { setToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call for login
    setTimeout(() => {
      // Create a mock JWT token (header.payload.signature)
      // Base64Url encoded payload: {"role":"admin","sub":"123","name":"Admin User"}
      const mockPayload = btoa(JSON.stringify({ role: 'admin', sub: '123', name: 'Admin User' }));
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.signature`;
      
      setToken(mockToken);
      navigate(from, { replace: true });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h2 className="text-2xl font-bold text-textMain mb-2">Welcome Back</h2>
          <p className="text-textMuted">Sign in to Smarket Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-textMuted" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-textMuted" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primaryHover text-white rounded-lg font-medium transition-all focus:ring-2 focus:ring-primary/50 disabled:opacity-70 mt-4 flex justify-center items-center h-[48px]"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
