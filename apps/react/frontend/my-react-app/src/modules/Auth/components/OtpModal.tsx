import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Mail } from 'lucide-react';

interface OtpModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onVerify: (code: string) => void;
    isVerifying: boolean;
    onResend: () => void;
    isResending: boolean;
    error: string | null;
}

export function OtpModal({
    isOpen,
    email,
    onClose,
    onVerify,
    isVerifying,
    onResend,
    isResending,
    error,
}: OtpModalProps) {
    const [code, setCode] = useState<string[]>(Array(6).fill(''));
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        setCountdown(60);
        setCode(Array(6).fill(''));
        // Focus first input
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, countdown]);

    if (!isOpen) return null;

    const handleChange = (value: string, index: number) => {
        if (value && !/^\d+$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!code[index] && index > 0) {
                // Focus previous input
                inputRefs.current[index - 1]?.focus();
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
            } else {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length === 6) {
            onVerify(fullCode);
        }
    };

    const handleResendClick = () => {
        if (countdown === 0 && !isResending) {
            onResend();
            setCountdown(60);
            setCode(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    const maskEmail = (emailStr: string) => {
        if (!emailStr || !emailStr.includes('@')) return emailStr;
        const [local, domain] = emailStr.split('@');
        const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
        return `${maskedLocal}@${domain}`;
    };

    const isCodeComplete = code.every(digit => digit !== '');

    return (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-md flex items-center justify-center font-inter animate-modal-fade-in px-[16px]">
            {/* Modal Box */}
            <div className="relative w-full max-w-[440px] bg-white dark:bg-[#111A17] border border-[rgba(38,84,71,0.08)] dark:border-[rgba(38,84,71,0.2)] rounded-[24px] p-[32px] shadow-[0px_18px_48px_rgba(23,59,51,0.12)] text-center transition-all transform animate-modal-scale-up">
                
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-[20px] right-[20px] text-[#6D8279] hover:text-[#265447] dark:text-[#A9B6B0] dark:hover:text-[#3DAE8B] cursor-pointer transition-colors p-[4px] rounded-full hover:bg-[rgba(38,84,71,0.05)]"
                >
                    <X className="w-[20px] h-[20px]" />
                </button>

                {/* Header Icon */}
                <div className="w-[56px] h-[56px] bg-[#EAF7F2] dark:bg-[#1C2C26] text-[#265447] dark:text-[#3DAE8B] rounded-full flex items-center justify-center mx-auto mb-[20px] shadow-sm">
                    <Mail className="w-[24px] h-[24px]" />
                </div>

                {/* Titles */}
                <h2 className="font-manrope text-[24px] font-extrabold leading-[32px] text-[#265447] dark:text-white mb-[8px]">
                    Підтвердження пошти
                </h2>
                <p className="text-[13px] leading-[20px] text-[#6D8279] dark:text-[#A9B6B0] mb-[28px]">
                    Ми надіслали 6-значний код підтвердження на адресу <br />
                    <span className="font-semibold text-[#173B33] dark:text-[#EAF7F2]">{maskEmail(email)}</span>
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    
                    {/* Inputs */}
                    <div className="flex justify-center gap-[10px] mb-[24px]" onPaste={handlePaste}>
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => { inputRefs.current[idx] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                disabled={isVerifying}
                                className={`w-[48px] h-[56px] text-center text-[22px] font-extrabold border rounded-[12px] bg-white dark:bg-[#1D2A25] text-[#111827] dark:text-[#EAF7F2] outline-none transition-all duration-200 focus:border-[#265447] dark:focus:border-[#3DAE8B] focus:ring-2 focus:ring-[#265447]/10 dark:focus:ring-[#3DAE8B]/10 ${
                                    error 
                                    ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500' 
                                    : 'border-[rgba(38,84,71,0.16)] dark:border-[rgba(38,84,71,0.2)]'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Server Error Message */}
                    {error && (
                        <p className="text-red-500 text-[12px] font-semibold mb-[16px] text-center animate-shake">
                            {error}
                        </p>
                    )}

                    {/* Resend Action */}
                    <div className="text-[13px] text-[#6D8279] dark:text-[#A9B6B0] mb-[28px]">
                        {countdown > 0 ? (
                            <span>Надіслати код повторно через <strong className="text-[#265447] dark:text-[#3DAE8B]">{countdown}с</strong></span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendClick}
                                disabled={isResending}
                                className="text-[#265447] dark:text-[#3DAE8B] font-bold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-50 inline-flex items-center gap-[4px]"
                            >
                                {isResending && <Loader2 className="w-[12px] h-[12px] animate-spin" />}
                                Надіслати код повторно
                            </button>
                        )}
                    </div>

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={isVerifying || !isCodeComplete}
                        className="w-full h-[46px] bg-[#265447] dark:bg-[#3DAE8B] text-white dark:text-[#111A17] rounded-[10px] border-none cursor-pointer font-inter text-[14px] font-bold transition-all duration-200 hover:bg-[#1A3E2F] dark:hover:bg-[#2C9E7C] hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-[8px]"
                    >
                        {isVerifying && <Loader2 className="w-[18px] h-[18px] animate-spin" />}
                        <span>{isVerifying ? 'Перевірка...' : 'Підтвердити пошту'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
