import { useRouteError } from 'react-router-dom';
import { useState } from 'react';
import { RefreshCw, Home, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export function RootErrorBoundary() {
  const error = useRouteError() as any;
  const [showDetails, setShowDetails] = useState(false);
  const errorMessage = error?.message || error?.statusText || String(error);

  const isChunkError = errorMessage && (
    /failed to fetch/i.test(errorMessage) ||
    /dynamically imported module/i.test(errorMessage) ||
    /importing a module script failed/i.test(errorMessage)
  );

  const handleReload = () => {
    try {
      sessionStorage.removeItem('smarket-chunk-reload-timestamp');
      sessionStorage.removeItem('smarket-chunk-reload-retry');
    } catch (e) {
      console.warn('Failed to access sessionStorage:', e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_r', String(Date.now()));
    window.location.replace(url.toString());
  };

  const handleGoHome = () => {
    try {
      sessionStorage.removeItem('smarket-chunk-reload-timestamp');
      sessionStorage.removeItem('smarket-chunk-reload-retry');
    } catch (e) {
      console.warn('Failed to access sessionStorage:', e);
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0B120F] px-4 py-12 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111C18] rounded-2xl border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.03)] p-8 shadow-sm">
        
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-[#265447]/10 dark:bg-[#3CD27D]/10 rounded-full">
            {isChunkError ? (
              <RefreshCw className="w-12 h-12 text-[#265447] dark:text-[#3CD27D] animate-spin" style={{ animationDuration: '3s' }} />
            ) : (
              <AlertTriangle className="w-12 h-12 text-amber-500 dark:text-amber-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="font-manrope text-2xl font-bold text-center text-[#173B33] dark:text-[#EAEAEA] mb-3">
          {isChunkError ? 'Додаток оновлено' : 'Щось пішло не так'}
        </h1>

        {/* Description */}
        <p className="font-inter text-sm text-center text-[#6D8279] dark:text-[#81998F] leading-relaxed mb-8">
          {isChunkError 
            ? 'Ми випустили нову версію Smarket. Щоб завантажити останні зміни та продовжити користування сервісом, будь ласка, оновив сторінку.'
            : 'Виникла непередбачувана помилка під час роботи додатка. Наші розробники вже працюють над її виправленням.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 font-inter text-sm font-semibold py-3 px-6 rounded-xl bg-[#265447] dark:bg-[#3CD27D] hover:bg-[#1b3d33] dark:hover:bg-[#2fb66a] text-white dark:text-[#0B120F] transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Оновити сторінку
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 font-inter text-sm font-medium py-3 px-6 rounded-xl border border-[#265447] dark:border-[#3CD27D]/30 text-[#265447] dark:text-[#3CD27D] hover:bg-[#265447]/5 dark:hover:bg-[#3CD27D]/5 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            На головну
          </button>
        </div>

        {/* Technical Details Toggle */}
        <div className="border-t border-[#E5E7EB]/50 dark:border-[rgba(255,255,255,0.03)] pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-medium text-[#6D8279] dark:text-[#81998F] hover:text-[#173B33] dark:hover:text-[#EAEAEA] transition-colors"
          >
            <span>Технічна інформація</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-[#080E0C] rounded-lg text-[11px] font-mono text-gray-600 dark:text-[#81998F] overflow-x-auto border border-gray-200/50 dark:border-white/5 break-all max-h-40">
              {errorMessage}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
