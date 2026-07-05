import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { Shield, Bell, ChevronDown } from 'lucide-react';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => {
  // In the mockup, active is yellow/orange, inactive is light teal/green
  const bgColor = checked ? 'bg-[#fbc02d]' : 'bg-[#80cbc4]';
  const translate = checked ? 'translate-x-5' : 'translate-x-1';

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${bgColor}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${translate}`}
      />
    </button>
  );
};

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

const ButtonOutline = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="h-[42px] px-6 bg-surface border border-border rounded-lg text-sm font-semibold text-textMain hover:bg-secondary transition-colors whitespace-nowrap"
  >
    {children}
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  // State
  const [security, setSecurity] = useState({ logoutTime: '30 хв', password: '••••••••' });
  const [notifications, setNotifications] = useState({ parserErrors: true, dailyReport: false, newUsers: false, parserRun: false, email: true });
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  // Queries & Mutations
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
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
    mutationFn: async ({ old_password, new_password }: any) => {
      const { data } = await apiClient.patch('/auth/password', { old_password, new_password });
      return data;
    },
  });

  // Init state from fetched profile
  useEffect(() => {
    if (userProfile?.settings) {
      if (userProfile.settings.logoutTime) {
        setSecurity(prev => ({ ...prev, logoutTime: userProfile.settings.logoutTime }));
      }
      if (userProfile.settings.notifications) {
        setNotifications(prev => ({ ...prev, ...userProfile.settings.notifications }));
      }
    }
  }, [userProfile]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      logoutTime: security.logoutTime,
      notifications,
    });
  };

  const handlePasswordSubmit = async (oldPass: string, newPass: string) => {
    await changePasswordMutation.mutateAsync({ old_password: oldPass, new_password: newPass });
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

            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Label>Автовихід із сесії</Label>
                <Select
                  options={['15 хв', '30 хв', '1 година', 'Ніколи']}
                  value={security.logoutTime}
                  onChange={(v) => setSecurity({ ...security, logoutTime: v })}
                />
              </div>
              <div className="pb-1 mt-7">
                <ButtonOutline onClick={handleSaveSettings}>Зберегти зміни</ButtonOutline>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Label>Пароль</Label>
                <Input type="password" value={security.password} disabled className="opacity-70 bg-bgMain" />
              </div>
              <div className="pb-1 mt-7">
                <ButtonOutline onClick={() => setPasswordModalOpen(true)}>Змінити пароль</ButtonOutline>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <SectionHeader icon={Bell} title="Сповіщення" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textMain">Помилки парсерів</span>
              <Toggle checked={notifications.parserErrors} onChange={(v) => setNotifications({ ...notifications, parserErrors: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textMain">Щоденний звіт</span>
              <Toggle checked={notifications.dailyReport} onChange={(v) => setNotifications({ ...notifications, dailyReport: v })} />
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textMain">Нові користувачі</span>
              <Toggle checked={notifications.newUsers} onChange={(v) => setNotifications({ ...notifications, newUsers: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textMain">Запуск парсерів</span>
              <Toggle checked={notifications.parserRun} onChange={(v) => setNotifications({ ...notifications, parserRun: v })} />
            </div>
          </div>
          <div className="space-y-6 self-start">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textMain">E-mail сповіщення</span>
              <Toggle checked={notifications.email} onChange={(v) => setNotifications({ ...notifications, email: v })} />
            </div>
            <div className="flex justify-end pt-4">
              <ButtonOutline onClick={handleSaveSettings}>Зберегти зміни</ButtonOutline>
            </div>
          </div>
        </div>
      </Card>

      <PasswordChangeModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
        onSubmit={handlePasswordSubmit} 
      />

    </div>
  );
};

export default SettingsPage;
