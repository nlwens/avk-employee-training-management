import { readdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import type { MailerOptions, TemplateAdapter } from '@nestjs-modules/mailer';

// Why a custom adapter instead of MjmlAdapter from @nestjs-modules/mailer?
//
// @nestjs-modules/mailer ships a built-in MjmlAdapter that wraps
// HandlebarsAdapter and calls mjml2html synchronously. That works with MJML v4,
// which had a synchronous API. However, MJML v4 contains known security
// vulnerabilities and should not be used in production.
//
// MJML v5 resolves those vulnerabilities but changed mjml2html to an async
// function. The built-in adapter calls it synchronously and accesses .html on
// the returned Promise, which yields undefined; every email would have an empty
// body. Upgrading to v5 while keeping the built-in adapter is therefore not an
// option.
//
// This adapter reimplements the same Handlebars -> MJML pipeline but awaits
// mjml2html correctly, using an async IIFE to stay within the synchronous
// callback contract that TemplateAdapter requires.
//
// Once the following issue is resolved, we can switch back to the built-in
// adapter: https://github.com/nest-modules/mailer/issues/1312
export class MjmlHandlebarsAdapter implements TemplateAdapter {
  // Partials are read from disk once and registered in the global Handlebars
  // registry; the flag prevents redundant re-reads on every send.
  private partialsRegistered = false;

  constructor(private readonly helpers: Handlebars.HelperDeclareSpec = {}) {}

  compile(
    mail: any,
    callback: (err?: Error, body?: string) => void,
    mailerOptions: MailerOptions,
  ): void {
    // TemplateAdapter.compile() is synchronous by contract, but mjml2html in
    // v5 is async. The void IIFE bridges the gap: errors still reach the
    // callback rather than becoming unhandled rejections.
    void (async () => {
      try {
        const templateDir: string = mailerOptions.template?.dir ?? '';
        const templatePath = this.getTemplatePath(
          templateDir,
          mail.data.template as string,
        );
        const mjmlSource = this.readFile(templatePath);

        // First, resolve Handlebars variables and partials.
        this.ensurePartialsRegistered(templateDir);
        Handlebars.registerHelper(this.helpers);
        const interpolatedMjml = Handlebars.compile(mjmlSource)(
          mail.data.context ?? {},
        );

        // Only then compile the assembled MJML document to HTML.
        const { html, errors } = await mjml2html(interpolatedMjml, {
          filePath: templatePath,
          ignoreIncludes: false,
        });

        if (errors.length > 0) {
          const message = errors
            .map((error) => error.formattedMessage)
            .join('\n');

          return callback(new Error(`MJML compilation failed:\n${message}`));
        }

        mail.data.html = html;

        callback();
      } catch (err) {
        callback(err as Error);
      }
    })();
  }

  private ensurePartialsRegistered(templateDir: string): void {
    if (this.partialsRegistered) {
      return;
    }

    try {
      const partialsDir = join(templateDir, 'partials');
      const files = this.listPartialFiles(partialsDir);

      for (const file of files) {
        if (extname(file) === '.mjml') {
          Handlebars.registerPartial(
            basename(file, '.mjml'),
            this.readFile(join(partialsDir, file)),
          );
        }
      }
    } catch {
      // The partials folder is absent, which is expected; let it fall through.
    }

    this.partialsRegistered = true;
  }

  protected getTemplatePath(templateDir: string, templateName: string): string {
    return join(templateDir, `${templateName}.mjml`);
  }

  protected readFile(path: string): string {
    return readFileSync(path, 'utf-8');
  }

  protected listPartialFiles(dir: string): string[] {
    return readdirSync(dir);
  }
}
