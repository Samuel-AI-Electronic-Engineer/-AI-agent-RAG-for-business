export const passwordRules = [
    { key: 'length', label: '8 caracteres como mínimo', test: (value) => value.length >= 8 },
    { key: 'uppercase', label: 'una letra mayúscula', test: (value) => /[A-Z]/.test(value) },
    { key: 'lowercase', label: 'una letra minúscula', test: (value) => /[a-z]/.test(value) },
    { key: 'number', label: 'un número', test: (value) => /\d/.test(value) },
    { key: 'symbol', label: 'un símbolo', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const getPasswordRules = (password) => passwordRules.map((rule) => ({
    ...rule,
    valid: rule.test(password),
}));

export const isStrongPassword = (password) => getPasswordRules(password).every((rule) => rule.valid);

export const getApiErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((item) => item.msg).join('. ');
    }
    return detail || fallback;
};
