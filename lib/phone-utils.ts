const PAKISTAN_PHONE_REGEX = /^(?:\+92|92|0)?3\d{9}$/;

export function normalizePakistaniPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('92')) {
    return `+${digits}`;
  }

  const trimmed = digits.replace(/^0+/, '');
  return `+92${trimmed}`;
}

export function isValidPakistaniPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return PAKISTAN_PHONE_REGEX.test(digits);
}

