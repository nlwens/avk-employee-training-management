import { LocaleCode } from '@/locales/locales';

export interface SendMailOptions {
  /** Primary recipient address or list of addresses. */
  to: string | string[];

  /**
   * Email subject line. When omitted, resolved automatically from the
   * `mail.<template>.subject` translation key for the requested locale.
   */
  subject?: string;

  /**
   * Name of the `.mjml` template file inside `src/mailer/templates/`,
   * without the file extension (e.g. `'welcome'`).
   */
  template: string;

  /** Locale used for subject resolution and the `{{t}}` helper inside the template. */
  locale: LocaleCode;

  /**
   * Variables passed to the Handlebars template. The following are injected
   * automatically and do not need to be provided by the caller:
   * `appName`, `appUrl`, `year`, `locale`.
   */
  context?: Record<string, unknown>;

  /** Carbon-copy recipient address or list of addresses. */
  cc?: string | string[];

  /** Blind carbon-copy recipient address or list of addresses. */
  bcc?: string | string[];

  /** Reply-To address, when different from the sender. */
  replyTo?: string;
}
