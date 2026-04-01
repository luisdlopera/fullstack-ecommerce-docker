export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export type EmailVerificationMessage = {
  to: string;
  verifyUrl: string;
  ttlMinutes: number;
};

export type PasswordResetMessage = {
  to: string;
  resetUrl: string;
  ttlMinutes: number;
};

export interface EmailSenderPort {
  sendEmailVerificationEmail(input: EmailVerificationMessage): Promise<void>;
  sendPasswordResetEmail(input: PasswordResetMessage): Promise<void>;
}
