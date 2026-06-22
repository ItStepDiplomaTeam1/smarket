import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';

interface SystemStatusWidgetProps {
  status: DashboardData['systemStatus'];
}

export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({ status }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-textMain">Статус системи</h3>
      
      <div className="space-y-3">
        {status.map((service, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="font-semibold text-textMain">
              {service.service}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                {service.status === 'operational' && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accentGreen"></span>
                )}
                {service.status === 'degraded' && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accentYellow"></span>
                )}
                {service.status === 'down' && (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accentRed"></span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                service.status === 'operational' ? 'text-accentGreen' : 
                service.status === 'degraded' ? 'text-accentYellow' : 'text-accentRed'
              }`}>
                {service.status === 'operational' ? 'Працює' : 
                 service.status === 'degraded' ? 'Проблеми' : 'Не працює'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

