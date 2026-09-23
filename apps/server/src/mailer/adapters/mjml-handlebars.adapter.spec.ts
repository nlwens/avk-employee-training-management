import Handlebars from 'handlebars';
import type { ISendMailOptions, MailerOptions } from '@nestjs-modules/mailer';
import { MjmlHandlebarsAdapter } from './mjml-handlebars.adapter';

type Mail = { data: ISendMailOptions };

// Minimal MJML valid enough for mjml2html to compile without errors.
const SIMPLE_TEMPLATE = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello {{name}}!</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`.trim();

const TEMPLATE_WITH_HELPER = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>{{t "welcome.greeting" name=name}}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`.trim();

const TEMPLATE_WITH_PARTIAL = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>body</mj-text>
      </mj-column>
    </mj-section>
    {{> footer}}
  </mj-body>
</mjml>`.trim();

const FOOTER_PARTIAL = `
<mj-section>
  <mj-column>
    <mj-text>footer-content</mj-text>
  </mj-column>
</mj-section>`.trim();

const mailerOptions = {
  template: { dir: '/templates' },
} as MailerOptions;

// Subclass that injects template/partial content directly, removing the need to
// mock the filesystem.
class TestableAdapter extends MjmlHandlebarsAdapter {
  constructor(
    private readonly templateContent: string,
    private readonly partialMap: Record<string, string> = {},
    helpers: Handlebars.HelperDeclareSpec = {},
  ) {
    super(helpers);
  }

  protected getTemplatePath(): string {
    return __dirname;
  }

  protected readFile(path: string): string {
    // Normalize to forward slashes, so the check also works on Windows.
    if (path.replace(/\\/g, '/').includes('/partials/')) {
      const name = path.split(/[\\/]/).pop()!.replace('.mjml', '');
      return this.partialMap[name] ?? '';
    }

    return this.templateContent;
  }

  protected listPartialFiles(): string[] {
    return Object.keys(this.partialMap).map((k) => `${k}.mjml`);
  }
}

// Helper that wraps the callback-style compile() in a Promise.
const compileMailAsync = (
  adapter: MjmlHandlebarsAdapter,
  mail: Mail,
): Promise<void> =>
  new Promise((resolve, reject) =>
    adapter.compile(
      mail,
      (err) => (err ? reject(err) : resolve()),
      mailerOptions,
    ),
  );

describe('MjmlHandlebarsAdapter', () => {
  afterEach(() => {
    // Prevent Handlebars global state from leaking across tests.
    Object.keys(Handlebars.partials).forEach((name) =>
      Handlebars.unregisterPartial(name),
    );
  });

  it('interpolates Handlebars variables before MJML compilation', async () => {
    const mail: Mail = {
      data: {
        template: 'test',
        context: { name: 'Jan' },
      },
    };

    await compileMailAsync(new TestableAdapter(SIMPLE_TEMPLATE), mail);

    expect(mail.data.html).toContain('Hello Jan!');
  });

  it('calls the t helper with the locale from context', async () => {
    const tHelper = jest.fn().mockReturnValue('Welkom, Jan!');

    const mail: Mail = {
      data: {
        template: 'test',
        context: {
          name: 'Jan',
          locale: 'nl',
        },
      },
    };

    await compileMailAsync(
      new TestableAdapter(TEMPLATE_WITH_HELPER, {}, { t: tHelper }),
      mail,
    );

    expect(tHelper).toHaveBeenCalled();
    expect(tHelper.mock.calls[0][0]).toBe('welcome.greeting');

    expect(mail.data.html).toContain('Welkom, Jan!');
  });

  it('inlines Handlebars partials as MJML snippets before compilation', async () => {
    const mail: Mail = {
      data: {
        template: 'test',
        context: {},
      },
    };

    await compileMailAsync(
      new TestableAdapter(TEMPLATE_WITH_PARTIAL, { footer: FOOTER_PARTIAL }),
      mail,
    );

    expect(mail.data.html).toContain('footer-content');
  });

  it('propagates errors to the callback', async () => {
    // Subclass that throws on readFile to simulate a filesystem or template error.
    class ErrorAdapter extends MjmlHandlebarsAdapter {
      protected readFile(): string {
        throw new Error('ENOENT: no such file');
      }
      protected listPartialFiles(): string[] {
        return [];
      }
    }

    const mail: Mail = {
      data: {
        template: 'missing',
        context: {},
      },
    };

    await expect(compileMailAsync(new ErrorAdapter(), mail)).rejects.toThrow(
      'ENOENT: no such file',
    );
  });
});
