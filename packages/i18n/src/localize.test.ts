import { describe, expect, it } from "vitest";
import { localize } from "./localize";

const translations = [
  { localeCode: "nl", title: "Titel", content: "Inhoud" },
  { localeCode: "en", title: "Title", content: "Content" },
];

describe("localize", () => {
  it("returns the translation for the selected language", () => {
    expect(localize(translations, "title", "default", "en")).toBe("Title");
  });

  it("returns the translation for a different locale", () => {
    expect(localize(translations, "title", "default", "nl")).toBe("Titel");
  });

  it("returns the translation for a different key", () => {
    expect(localize(translations, "content", "default", "nl")).toBe("Inhoud");
  });

  it("returns the default locale translation when current locale has no entry", () => {
    expect(localize(translations, "title", "default", "de")).toBe("Titel");
  });

  it("returns the first translation when neither current nor default locale exists", () => {
    const onlyCz = [{ localeCode: "cz", title: "Ahoj" }];
    expect(localize(onlyCz, "title", "default", "de")).toBe("Ahoj");
  });

  it("returns the default value when no translation is available", () => {
    expect(localize([], "title", "Fallback", "en")).toBe("Fallback");
  });

  it("returns the default value when no translation has the requested key", () => {
    expect(localize(translations, "key" as never, "Foo", "en")).toBe("Foo");
  });
});
