export const PASSWORD_RULES = [
    { label: 'Мінімум 8 символів', check: (password: string) => password.length >= 8 },
    { label: 'Велика літера', check: (password: string) => /[A-Z]/.test(password) },
    { label: 'Мала літера', check: (password: string) => /[a-z]/.test(password) },
    { label: 'Цифра', check: (password: string) => /\d/.test(password) },
    { label: 'Спецсимвол (!@#$%^&*)', check: (password: string) => /[!@#$%^&*()\-_=+[\]{}|;:,.<>?/~`]/.test(password) },
];

export const validatePassword = (password: string): boolean => {
    return PASSWORD_RULES.every(rule => rule.check(password));
};
