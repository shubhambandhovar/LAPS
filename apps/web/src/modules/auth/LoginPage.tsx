import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LoginSchema, LoginInput } from '@laps/shared';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Eye, EyeOff, Lock, User, AlertCircle, School } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse redirectTo from query params if present
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirectTo') || '/portal';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(data.identifier, data.password);
      navigate(redirectTo, { replace: true });
    } catch {
      // Always display generic message per NIST SP 800-63B guidelines
      setErrorMsg('Invalid credentials. Please verify your username and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <div className="max-w-md w-full">
        {/* School Crest Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-500/10">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Little Angels School
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-300 mt-1">
            Gohad, Madhya Pradesh • ERP Portal
          </p>
        </div>

        <Card
          title="Sign in to your account"
          subtitle="Access your academic portal, attendance, and reports"
          className="bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20"
          footer={
            <div className="text-center">
              <Link
                to="/"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← Return to Public Website
              </Link>
            </div>
          }
        >
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 mb-5 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                  Authentication Failed
                </p>
                <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1.5"
              >
                Username or Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  placeholder="admin@littleangelsschool.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  disabled={isSubmitting}
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
