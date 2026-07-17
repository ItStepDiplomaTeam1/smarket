// src/shared/components/ThemeToggle.tsx
import { useThemeStore } from '../store/useThemeStore';

export function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();
    const isDark = theme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-[34px] h-[13px] rounded-full p-0 flex items-center transition-colors duration-300 cursor-pointer border-none overflow-visible ${
                isDark ? 'bg-[#3CD27D]' : 'bg-[#173B33]'
            }`}
            aria-label="Toggle theme"
        >
            {/* Велика яскраво-зелена бульбашка, яка рухається.
              Вона виступає за межі треку зверху, знизу та по боках.
            */}
            <div
                className={`absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-[#3CD27D] flex items-center justify-center transition-transform duration-300 left-[-4px] ${
                    isDark ? 'translate-x-[24px]' : 'translate-x-0'
                }`}
            >
                {/* Внутрішня темна кулька */}
                <div className="w-[18px] h-[18px] rounded-full bg-[#1A352E] relative shadow-inner">
                    
                    {/* Білий реалістичний відблиск з макета */}
                    <span className="absolute top-[2px] right-[2px] w-[5px] h-[5px] bg-white rounded-full opacity-90 transform rotate-45 scale-x-[1.2]" />
                
                </div>
            </div>
        </button>
    );
}