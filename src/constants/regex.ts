export const Regex = {
    PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,60}$/,
    EMAIL: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/,
    PHONE: /^\+(?:[0-9]●?){6,14}[0-9]$/,
    OS: /^(?:ios|android)$/
}