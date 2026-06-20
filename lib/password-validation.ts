export interface PasswordStrengthResult {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  requirements: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function validatePassword(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  };

  // Calculate score based on requirements met
  const requirementsMet = Object.values(requirements).filter(Boolean).length;

  // Score: 0-20 (weak), 21-40 (fair), 41-60 (good), 61-100 (strong)
  const score = requirementsMet * 20;

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 60) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'good';
  } else if (score >= 20) {
    strength = 'fair';
  }

  return {
    score: Math.min(score, 100),
    strength,
    requirements,
  };
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 8 characters and include lowercase, uppercase, number, and special character.';

export function isPasswordStrong(password: string): boolean {
  const requirements = validatePassword(password).requirements;
  return Object.values(requirements).every(Boolean);
}

export function getStrengthColor(strength: string): string {
  switch (strength) {
    case 'strong':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'good':
      return 'text-blue-600 dark:text-blue-400';
    case 'fair':
      return 'text-orange-600 dark:text-orange-400';
    case 'weak':
    default:
      return 'text-red-600 dark:text-red-400';
  }
}

export function getProgressColor(strength: string): string {
  switch (strength) {
    case 'strong':
      return 'bg-emerald-600 dark:bg-emerald-400';
    case 'good':
      return 'bg-blue-600 dark:bg-blue-400';
    case 'fair':
      return 'bg-orange-600 dark:bg-orange-400';
    case 'weak':
    default:
      return 'bg-red-600 dark:bg-red-400';
  }
}
