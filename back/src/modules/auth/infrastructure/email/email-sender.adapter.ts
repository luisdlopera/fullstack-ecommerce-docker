import { Inject, Injectable } from '@nestjs/common';
import { EmailService } from '../../../../shared/infrastructure/email/email.service';
import type {
  EmailSenderPort,
  EmailVerificationMessage,
  PasswordResetMessage,
} from '../../domain/ports/email-sender.port';

@Injectable()
export class EmailSenderAdapter implements EmailSenderPort {
  constructor(@Inject(EmailService) private readonly emailService: EmailService) {}

  sendEmailVerificationEmail(input: EmailVerificationMessage): Promise<void> {
    return this.emailService.sendEmailVerificationEmail(input);
  }

  sendPasswordResetEmail(input: PasswordResetMessage): Promise<void> {
    return this.emailService.sendPasswordResetEmail(input);
  }
}
