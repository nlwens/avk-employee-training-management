## Getting Started

The following instructions will get you the server up and running on your local machine for development and testing purposes.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)

### 1. Server Setup

Install dependencies in the root directory of the application:

```bash
# Install npm dependencies
npm install
```

### 2. Environment Setup

Before running the application, create `.env` file inside the `/server` directory. You can copy the secrets from the provided `.env.example` file.

For Docker setup instructions, see the [Docker Setup section in the root README](../../README.md#docker-setup).

### 3. Run the NestJS application in development mode

Run the application in `/server` directory:

```bash
# Development mode
npm run start:dev
```

### 4. Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

---

## Custom decorators

### Authentication and Authorization

Three composable decorators are available for controller routes.

#### `@Auth()`

Requires a valid JWT with a UUID of an existing user entity, ensuring that the user is authenticated. Applies
`JwtAuthGuard` and adds Swagger annotations.

```ts
@Get('profile')
@Auth()
getProfile(@CurrentUser() user: User) { ... }
```

#### `@AdminOnly()`

Requires a valid JWT **and** the `admin` flag on the user. Applies `JwtAuthGuard` + `AdminGuard` and adds Swagger
annotations.

```ts
@Delete(':id')
@AdminOnly()
remove(@Param('id') id: string) { ... }
```

#### `@CurrentUser()`

Parameter decorator that extracts the authenticated user from the request object. Use it inside any route protected by
`@Auth()` or `@AdminOnly()`.

```ts
@Get('me')
@Auth()
me(@CurrentUser() user: User) {
  return user;
}
```

### Serialization

#### `@Serialize(dto)`

Transforms outgoing responses through a DTO class before they are sent to the client. Service methods typically
return ORM entities that expose internal fields (e.g., hashed passwords). `@Serialize` strips those by remapping the
output through `instanceToPlain` followed by `plainToInstance(dto, ...)`.

> [!important]
> Fields are stripped only if the `@Exclude()` decorator is applied to them. `class-transformer` cannot strip missing
> fields automatically, as it does not have enough information in runtime to do so.

Apply it to a whole controller or to a single route handler:

```ts
@Serialize(UserDto)
@Controller('users')
export class UsersController { ... }

@Get(':id')
@Serialize(UserDto)
findOne(@Param('id') id: string) { ... }
```

The DTO controls which fields are exposed using the standard class-transformer `@Expose` and `@Exclude` decorators.

Nested arrays are transformed recursively when DTO properties carry a `@Type()` decorator, which tells
`class-transformer` which DTO class to instantiate for each element:

```ts
export class QuestionDto {
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
```

Without `@Type()`, nested arrays are copied as plain objects and their DTO decorators (including `@ExposeToAdmin()`)
have no effect.

`@Serialize` also reads the authenticated user from the request and passes an admin group to `plainToInstance` when
appropriate, enabling `@ExposeToAdmin()` (see below).

#### `@ExposeToAdmin()`

Marks a DTO property so that it is included in the response only when the authenticated user is an admin. Non-admin
responses have the property omitted entirely rather than set to `null`.

```ts
export class QuestionDto {
  @ExposeToAdmin()
  correctAnswerId: string | null;
}
```

Relies on `@Serialize()` being active on the controller or route.

## Pagination

Two shared building blocks live in `src/common/dto/` for any endpoint that returns a paged list.

### `PaginationQueryDto`

Extend this DTO to add `page` and `limit` query parameters to a resource-specific query DTO:

```ts
export class QueryCourseParamsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
```

Both fields are optional. The endpoint defaults to page 1 with 20 items per page. `limit` is capped at 100.

### `PaginatedResponseDto(itemType)`

A mixin function that returns an abstract class carrying the pagination envelope. It is a function rather than a generic
class for the same reason as `CreateBaseTranslationDto`: TypeScript erases generics at runtime, but `@Type` and
`@ApiProperty` both need the actual constructor as a value at decoration time.

The envelope shape:

```ts
{
  data: T[];     // the page of items
  total: number; // total items across all pages
  page: number;  // current page (1-indexed)
  limit: number; // items per page for this response
  pages: number; // Math.ceil(total / limit)
}
```

Create a concrete named subclass for each endpoint that needs pagination:

```ts
export class PaginatedCourseDto extends PaginatedResponseDto(CourseDto) {}
```

You can then use this type to serialize the response in the controller. You must fill in the fields manually.

## Translations

Four base classes for resources that store their data in multiple locales.

### `BaseTranslation`

Abstract TypeORM entity that every translation table entity must inherit. Provides the `localeCode` primary column and a
`@ManyToOne` relation to the `Locale` entity. The locale column acts as part of a composite primary key alongside the
owning resource's ID:

```ts
@Entity('course_translations')
export class CourseTranslation extends BaseTranslation {
  @PrimaryColumn('uuid', { name: 'course_id' })
  courseId: string;

  // ... other fields ...
}
```

### `BaseTranslationInputDto`

Abstract DTO that every per-locale translation input must inherit. Provides the `locale` field validated against the
list of supported locales. Extend it and add the translatable fields for a specific resource:

```ts
export class CreateCourseTranslationDto extends BaseTranslationInputDto { ... }
```

### `CreateBaseTranslationDto(translationType)`

Mixin function that returns an abstract class with a validated `translations` array. Pass the concrete translation DTO
constructor and extend the result:

```ts
export class CreateCourseDto extends CreateBaseTranslationDto(CreateCourseTranslationDto) { ... }
```

It is a mixin function rather than a generic class because TypeScript generics are erased at runtime; `@Type` and
`@ApiProperty` both need the actual constructor as a value.

### `BaseTranslationService<T>`

Abstract service that every translation-backed service must extend. Provides `findTranslation` and `findTranslations`
helpers that query by locale and fall back to the default locale when no result is found for the requested one. Pass the
translation repository to `super()` in the subclass constructor:

```ts
@Injectable()
export class CoursesService extends BaseTranslationService<CourseTranslation> {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseTranslation)
    courseTranslationRepository: Repository<CourseTranslation>,
  ) {
    super(courseTranslationRepository);
  }
}
```

The inherited `this.repository` can then be used directly in the subclass for any additional queries.

## Database seeding

The seeder populates the database with realistic fake data for local development and testing.

### Running the seeder

```bash
npm run seed
```

### `@Seed(fn)`

A property decorator that attaches a faker factory function to an entity column. `SeedFactory` reads these annotations
automatically when generating instances.

```ts
@Seed((faker) => faker.person.firstName())
@Column()
name: string;
```

The second argument to the factory function is the partially built entity object. Columns are processed in declaration
order, so earlier fields are already available:

```ts
@Seed((faker, { name, surname }) =>
  faker.internet.email({
    firstName: name as string,
    lastName: surname as string
  }),
)
@Column({ unique: true })
email: string;
```

Async factory functions are awaited automatically:

```ts
@Seed((faker) => bcrypt.hash(faker.internet.password(), 12))
@Column()
password: string;
```

### `SeedFactory`

Injectable service that creates and persists entity instances by reading `@Seed` metadata. It is registered in
`SeederModule` and called explicitly from the seed script for simple entities:

```ts
await factory.createMany(User, 5);
await factory.createMany(Group, 3);
```

For entities with cross-entity relationships, inject `SeedFactory` into a dedicated seeder class and use
`factory.create` with overrides:

```ts
const course = await factory.create(Course, {
  groups: faker.helpers.arrayElements(groups, { min: 1, max: 3 }),
});

await Promise.all(
  SUPPORTED_LOCALES.map((locale) =>
    factory.create(CourseTranslation, {
      courseId: course.id,
      localeCode: locale,
    }),
  ),
);
```

Register such seeders as providers in `SeederModule` (not in their own feature module, as you might run into
cross-dependencies), then call them from the seed script via `app.get(...).seed(...)`.

`SeedFactory` only needs a `DataSource`, so it can also be added as a provider in E2E test modules to create fixtures
without running the seed script:

```ts
app = await createTestServer([UsersModule, AuthModule], undefined, [
  SeedFactory,
]);
const factory = app.get(SeedFactory);

await factory.createMany(User, 5);
await factory.create(User, { admin: true });
```

## Audit logging

Every write to the `audit_logs` table is driven by the `@AuditLog()` decorator. This is done to avoid logging actions
executed by the server (actions executed outside an active scope) or user actions that we are not interested in.

Each log entry records the authenticated actor's UUID, the client IP address, the action label, the affected entity type
and ID, and a before/after diff of the entity's fields, as well as the action context.

### `@AuditLog(operation)`

Apply to a controller class or to individual route handlers. The `operation` argument is a string that identifies the
business event. By convention use `resources.verb` form:

```ts
@Post()
@AuditLog('users.create')
create(@Body() dto: CreateUserDto) { ... }
```

When the decorator is present, `AuditSubscriber` captures every TypeORM `INSERT`, `UPDATE`, and `DELETE` that occurs
during the request and writes a separate log entry for each. Sensitive fields such as `password` and `token` are
stripped from all diffs automatically.

#### Dot notation shorthand

Passing a string that ends with a dot instructs the interceptor to append a verb derived from the HTTP method
automatically. This is most useful when decorating an entire controller, so each handler gets its own operation string
without repeating the resource name:

| HTTP method | Appended verb |
|-------------|---------------|
| `POST`      | `create`      |
| `PUT`       | `update`      |
| `PATCH`     | `update`      |
| `DELETE`    | `delete`      |

```ts
@AuditLog('users.')
@Controller('users')
export class UsersController {}
```

A handler-level decorator always takes precedence over the class-level one, so individual routes can override the
default when needed:

```ts
@AuditLog('users.')
@Controller('users')
export class UsersController {
  @Delete()
  @AuditLog('users.bulk-delete')
  bulkDelete() { ... }
}
```

`GET` routes are excluded from the dot notation shorthand and are never audited when the operation ends with a dot, as
reads are typically not relevant to the audit trail.

### Logging events manually

For actions that do not map to an entity change, call `AuditLogService.log()` directly from the service. The entry is
only written if the route is decorated with `@AuditLog()`, so the decorator must still be present on the corresponding
controller method:

```ts
@Post('login')
@AuditLog('auth.login')
login(@Body() dto: LoginDto) { ... }
```

```ts
// auth.service.ts
await this.auditLogService.log({
  actor: user ? { id: user.id } : null,
  action: AuditAction.LOGIN_FAILED,
  metadata: { email },
});
```

`AuditAction` provides named constants for the built-in action strings. Feel free to extend it with custom actions.

## File Uploading

### `StorageProviderSelector`

Injectable service that loads a storage provider instance by using `provider` type. By default, the selector will store a default
provider that was assigned in `env` file, and it can be exposed using `getDefaultProvider()` method:

```ts
// files.service.ts
constructor(
  @InjectRepository(File) private readonly filesRepository: Repository<File>,
  private readonly selector: StorageProviderSelector,
) {}

someMethod() {
  const provider = this.selector.getDefaultProvider();
  // ...
}
```

The `FilesModule` automatically handles all provider dependencies. To add more providers, simply inject it to the `providers` array:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([File]), DiscoveryModule],
  providers: [
    // ...
    DriveStorageProvider,
    /* Inject your provider here (e.g.: S3StorageProvider) */
    // ...
  ],
  exports: [FilesService],
})
export class FilesModule {}
```

## Internationalization

The application uses [nestjs-i18n](https://nestjs-i18n.com) as its i18n layer. `I18nModule` is registered globally in
`AppModule`, making `I18nService` available for injection anywhere without additional imports.

Translation files live in `src/i18n/` and are organized by locale, then by namespace. Keys are addressed as
`{namespace}.{nested.path}`, e.g., `mail.common.footer`. Strings use `{variable}` placeholders for interpolation:

```json
{
  "common": {
    "footer": "Sent by {appName}."
  }
}
```

For services, `I18nService` can be used to translate the strings:

```ts
constructor(private readonly i18n: I18nService) {}

footer(lang: string, appName: string): string {
  return this.i18n.t('mail.common.footer', { lang, args: { appName } });
}
```

To add a new locale, create its directory under `src/i18n/` (e.g., `src/i18n/cs/`) with the same namespace files, and
extend `LocaleCode` in `src/locales/locales.ts`.

## Mailer

The mailer module handles sending emails. Templates are written in [MJML](https://mjml.io), a markup language that
compiles to cross-client-compatible HTML, with [Handlebars](https://handlebarsjs.com) used for dynamic content.
Translations are provided by `nestjs-i18n` (see above).

I recommend installing an extension for your editor to make MJML syntax highlighting work:

- [MJML Support](https://plugins.jetbrains.com/plugin/16418-mjml-support) for JetBrains IDEs
- [MJML Official](https://marketplace.visualstudio.com/items?itemName=mjmlio.vscode-mjml) for Visual Studio Code

### How it works

Sending an email goes through two compilation steps:

1. **Handlebars** resolves all dynamic parts of the source file: context variables (`{{name}}`), translations
   (`{{t "key" var=value}}`), and partials (`{{> partial-name}}`). The result is a self-contained MJML document.
2. **MJML** compiles the assembled document to email-client-compatible HTML, resolving any `<mj-include>` directives
   along the way.

The entry point for all email sends is `MailerService.send()`:

```ts
await mailerService.send({
  to: user.email,
  subject: 'Your subject',
  template: 'your-template',
  locale: user.localeCode,
  context: { name: user.name },
});
```

`subject`, `cc`, `bcc`, and `replyTo` are also accepted. When `subject` is omitted, it is resolved automatically from
the `mail.<template>.subject` translation key for the requested locale.

The following variables are injected into every template automatically, without the caller needing to pass them:

| Variable  | Source             |
|-----------|--------------------|
| `appName` | `APP_NAME` env var |
| `appUrl`  | `APP_URL` env var  |
| `year`    | Current year       |
| `locale`  | User's locale code |

### Templates and partials

Templates live in `src/mailer/templates/`. Each template is an `.mjml` file whose name matches the `template` argument
passed to `send()`. Reusable MJML sections are kept in `src/mailer/templates/partials/` and included using one of two
mechanisms depending on whether the partial contains dynamic content:

- `<mj-include>` for static partials with no Handlebars expressions. Processed by MJML at step 2, so the file is read
  from the disk after Handlebars has already finished. Use this for structural partials such as `head` and `header`.
- `{{> partial-name}}` for partials that contain context variables or `{{t}}` calls. Processed by Handlebars at step 1,
  so all expressions inside the partial are resolved before MJML sees the document. Use this for partials such as
  `footer` that embed `{{year}}` or `{{appName}}`.

```mjml
<mjml>
  <mj-head>
    <mj-include path="./partials/head.mjml" />
  </mj-head>
  
  <mj-body>
    <mj-include path="./partials/header.mjml" />

    <mj-section>
      <mj-column>
        <mj-text>{{t "mail.welcome.greeting" name=name}}</mj-text>
      </mj-column>
    </mj-section>

    {{> footer}}
  </mj-body>
</mjml>
```

Handlebars partials are registered automatically from the `partials/` directory when the first email is sent.

> [!important]
> `.mjml` template files are non-TypeScript assets. The development watcher picks up changes to existing templates, but
> does not detect newly added files. Restart the server after adding a new template.

### Adding a new email template

1. Create `src/mailer/templates/<name>.mjml`.
2. Add the translation keys under `mail.<name>.*` in `src/i18n/*/mail.json` for every supported locale.
3. Call `mailerService.send({ template: '<name>', ... })`.

### Local mail server

The Docker Compose file includes a [MailDev](https://github.com/maildev/maildev) service that acts as a local SMTP
server and captures all outgoing emails. Captured emails are visible in its web UI at <http://localhost:1080>.
The `.env.example` defaults already point at it (`MAIL_HOST=localhost`, `MAIL_PORT=1025`), so no extra configuration
is needed for local development.

### Configuration

All mail settings are read from environment variables. See `.env.example` for the full list. The relevant variables:

| Variable            | Description                                   |
|---------------------|-----------------------------------------------|
| `MAIL_HOST`         | SMTP server hostname                          |
| `MAIL_PORT`         | SMTP port (default `1025` for MailDev)        |
| `MAIL_SECURE`       | Use TLS (`true`/`false`, default `false`)     |
| `MAIL_USER`         | SMTP username (omit for unauthenticated)      |
| `MAIL_PASSWORD`     | SMTP password                                 |
| `MAIL_FROM_NAME`    | Display name in the From header               |
| `MAIL_FROM_ADDRESS` | Sender address                                |
| `APP_NAME`          | Application name injected into every template |
| `APP_URL`           | Base URL injected into every template         |
