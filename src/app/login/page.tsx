'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl, getEndpoint } from '@/config/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStep(2);
      setError('');
    } else {
      setError('Kullanıcı adı gerekli');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Şifre gerekli');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // API login
      const response = await fetch(getApiUrl(getEndpoint('LOGIN')), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ UserName: username, Password: password }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status}${errorText ? `, message: ${errorText}` : ''}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const permissions: string[] = data.data.permissions || [];
        const isPlatformAdmin = !data.data.tenantId || permissions.includes('tenants.manage');

        // Token'ı kaydet (+ refresh token)
        localStorage.setItem('token', data.data.token);
        if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify({
          userId: data.data.userId,
          userName: data.data.userName,
          tenantId: data.data.tenantId,
          roles: data.data.roles,
          specialRoles: data.data.specialRoles,
          permissions,
          isPlatformAdmin
        }));

        // Platform admin'in firması yok; tenant-info çağrısını atla
        if (!isPlatformAdmin) {
          try {
            const tenantResponse = await fetch(getApiUrl(getEndpoint('TENANT_PING')), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${data.data.token}`,
                'Content-Type': 'application/json',
              },
            });

            if (tenantResponse.ok) {
              const tenantData = await tenantResponse.json();
              if (tenantData.success) {
                localStorage.setItem('tenantInfo', JSON.stringify(tenantData.data));
              }
            }
          } catch (tenantError) {
            console.warn('Tenant info alınamadı:', tenantError);
          }
        } else {
          localStorage.removeItem('tenantInfo');
        }

        router.push('/');
      } else {
        setError(data.message || 'Giriş başarısız');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      if (errorMessage.includes('401')) {
        setError('Kullanıcı adı veya şifre hatalı');
      } else if (errorMessage.includes('403')) {
        setError('Lisans süreniz dolmuştur');
      } else {
        setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Modern Logo */}
        <div className="text-center mb-3">
          <img
            src="/cicekgologo.png"
            alt="ÇiçekGo Logo"
            className="mx-auto h-24 w-auto object-contain"
          />
        </div>

        {/* Modern Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          {step === 1 ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı adınızı girin"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    autoFocus
                  />
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Devam Et
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-sm text-blue-600 font-medium">Kullanıcı adı</p>
                  <p className="text-gray-900 font-semibold text-lg">{username}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrenizi girin"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm focus:outline-none transition-colors duration-200"
                >
                  ← Kullanıcı adını değiştir
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Copyright */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2025 cicekgo.net Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
