import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Shield, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 rounded-full bg-[#f0f9f4] flex items-center justify-center">
      <Icon size={18} className="text-[#10b981]" />
    </div>
    <h2 className="text-lg font-bold text-textMain">{title}</h2>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-surface border border-border rounded-xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-textMuted mb-2">{children}</label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full h-[42px] px-4 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-textMuted"
  />
);

const Select = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[42px] pl-4 pr-10 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
  </div>
);



// ── Main Page ─────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  // Queries & Mutations
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
  });

  const profileLogoutTime = userProfile?.settings?.logoutTime;
  const [security, setSecurity] = useState({ logoutTime: '', password: '••••••••' });
  const selectedLogoutTime = security.logoutTime || profileLogoutTime || '30 хв';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Record<string, unknown>) => {
      const { data } = await apiClient.patch('/auth/settings', { settings: newSettings });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      alert('Налаштування збережено успішно');
    },
    onError: () => alert('Помилка збереження налаштувань'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ old_password, new_password }: { old_password?: string; new_password?: string }) => {
      const { data } = await apiClient.patch('/auth/password', { old_password, new_password });
      return data;
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      logoutTime: selectedLogoutTime,
    });
  };

  const handlePasswordSubmitInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Нові паролі не співпадають');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Пароль має містити щонайменше 8 символів');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordMutation.mutateAsync({ old_password: oldPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: unknown) {
      const errorMsg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail : undefined;
      setPasswordError(errorMsg || (err instanceof Error ? err.message : 'Помилка зміни пароля'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) return <div className="p-8">Завантаження налаштувань...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-[1200px]">
      {/* Header */}
      <div>
        <h1 className="font-manrope text-[26px] font-bold text-textMain leading-tight">Налаштування</h1>
        <p className="text-sm text-textMuted mt-0.5">Головна / Налаштування</p>
        <p className="text-sm text-textMuted mt-2">Керування параметрами платформи</p>
      </div>

      <div className="space-y-6">
        {/* Security */}
        <Card>
          <SectionHeader icon={Shield} title="Безпека" />
          <div className="space-y-6">

            {/* Auto-logout setting */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-border pb-6">
              <div className="flex-1 w-full">
                <Label>Автовихід із сесії</Label>
                <Select
                  options={['15 хв', '30 хв', '1 година', 'Ніколи']}
                  value={selectedLogoutTime}
                  onChange={(v) => setSecurity({ ...security, logoutTime: v })}
                />
              </div>
              <div className="md:mt-6 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="h-[42px] px-6 bg-primary border border-transparent text-white dark:bg-transparent dark:text-[#4ADE80] dark:border-[#4ADE80]/30 rounded-lg text-sm font-semibold hover:bg-primary/90 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap w-full md:w-auto"
                >
                  Зберегти зміни
                </button>
              </div>
            </div>

            {/* Inline Password Change Form */}
            <form onSubmit={handlePasswordSubmitInline} className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-textMain">Зміна пароля</h3>
              
              {passwordError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-lg text-sm flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle size={16} />
                  <span>Пароль успішно змінено</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Поточний пароль</Label>
                  <Input 
                    type="password" 
                    required 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Введіть поточний пароль"
                  />
                </div>
                <div>
                  <Label>Новий пароль</Label>
                  <Input 
                    type="password" 
                    required 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Введіть новий пароль"
                  />
                </div>
                <div>
                  <Label>Підтвердження пароля</Label>
                  <Input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторіть новий пароль"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 w-full">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="h-[42px] px-6 bg-primary border border-transparent text-white dark:bg-transparent dark:text-[#4ADE80] dark:border-[#4ADE80]/30 rounded-lg text-sm font-semibold hover:bg-primary/90 dark:hover:bg-[#4ADE80]/10 transition-colors whitespace-nowrap w-full md:w-auto disabled:opacity-50"
                >
                  {passwordLoading ? 'Збереження...' : 'Зберегти новий пароль'}
                </button>
              </div>
            </form>

          </div>
        </Card>
      </div>

    </div>
  );
};

export default SettingsPage;
