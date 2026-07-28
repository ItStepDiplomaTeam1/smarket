import React, { useState, useEffect } from 'react';
import { useLocationStore } from '@/shared/store/locationStore';
import { MapPin, Search, Navigation, X, Check, Building2 } from 'lucide-react';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CITIES = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків'];

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentCity, availableCities, isLoadingCities, isDetectingLocation, setCity, fetchCities, detectGeoLocation } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen, fetchCities]);

  if (!isOpen) return null;

  const handleSelectCity = (cityName: string) => {
    setCity(cityName);
    onClose();
  };

  const handleDetectGeo = async () => {
    const detected = await detectGeoLocation();
    if (detected) {
      onClose();
    }
  };

  // Фільтрація міст за пошуковим запитом
  const filteredCities = availableCities.filter((item) =>
    item.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#15231D] border border-[#E5E7EB] dark:border-[#22382F] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-[#22382F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EEF5F1] dark:bg-[#1D2A25] text-[#265447] dark:text-[#3DAE8B]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#173B33] dark:text-white">Оберіть ваше місто</h3>
              <p className="text-xs text-[#6D8279] dark:text-[#A4B3AF]">Для відображення супермаркетів та цін поруч із вами</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6D8279] hover:text-[#173B33] dark:text-[#A4B3AF] dark:hover:text-white rounded-lg hover:bg-[#EEF5F1] dark:hover:bg-[#1D2A25] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Autodetect button */}
          <button
            onClick={handleDetectGeo}
            disabled={isDetectingLocation}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] font-semibold text-sm hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            {isDetectingLocation ? 'Визначення локації...' : 'Визначити моє місто автоматично'}
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9B94] dark:text-[#6D8279]" />
            <input
              type="text"
              placeholder="Пошук міста..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] dark:bg-[#1D2A25] border border-[#E5E7EB] dark:border-[#263D34] rounded-xl text-sm text-[#173B33] dark:text-white placeholder-[#8A9B94] focus:outline-none focus:ring-2 focus:ring-[#3DAE8B] transition-all"
            />
          </div>

          {/* Popular Cities */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A9B94] dark:text-[#6D8279] mb-2 block">
              Популярні міста
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.map((cityName) => {
                const isSelected = currentCity.toLowerCase() === cityName.toLowerCase();
                return (
                  <button
                    key={cityName}
                    onClick={() => handleSelectCity(cityName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#265447] text-white dark:bg-[#3DAE8B] dark:text-[#111A17] shadow-sm'
                        : 'bg-[#F0F4F2] dark:bg-[#1D2A25] text-[#173B33] dark:text-[#EAF3EF] hover:bg-[#E2ECE7] dark:hover:bg-[#253730]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {cityName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All / Filtered Cities List */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A9B94] dark:text-[#6D8279] mb-2 block">
              Всі доступні міста
            </span>
            {isLoadingCities ? (
              <div className="py-8 text-center text-sm text-[#8A9B94] animate-pulse">
                Завантаження переліку міст...
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#8A9B94] dark:text-[#6D8279]">
                Місто "{searchQuery}" не знайдено
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredCities.map((item) => {
                  const isSelected = currentCity.toLowerCase() === item.city.toLowerCase();
                  return (
                    <button
                      key={item.city}
                      onClick={() => handleSelectCity(item.city)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#265447] bg-[#EEF5F1] dark:border-[#3DAE8B] dark:bg-[#1E3028] font-semibold text-[#265447] dark:text-[#3DAE8B]'
                          : 'border-[#E5E7EB] dark:border-[#22382F] hover:bg-[#F9FAFB] dark:hover:bg-[#1D2A25] text-[#173B33] dark:text-[#EAF3EF]'
                      }`}
                    >
                      <span className="truncate">{item.city}</span>
                      <span className="flex items-center gap-1 text-xs text-[#8A9B94] dark:text-[#6D8279] shrink-0">
                        <Building2 className="w-3 h-3" />
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
