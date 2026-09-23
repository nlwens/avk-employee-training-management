import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { keyFromSelector } from "i18next";

import "@testing-library/jest-dom/vitest";

// Mock localStorage globally for all component tests. While the tests may pass
// locally, they will fail in CI because localStorage is not available.
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
} as unknown as Storage;

class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, "ResizeObserver", {
    value: ResizeObserverMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverMock,
    writable: true,
    configurable: true,
  });
});

// jsdom does not implement scrollIntoView, so we need to mock it.
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// jsdom does not implement the Pointer Capture API, which Radix UI primitives
// (e.g., the Select trigger) call on pointer interactions.
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Create the spy before the mock factory runs.
export const mockT = vi.fn(
  (selector: string | (($: Record<string, unknown>) => unknown)): string => {
    return typeof selector === "string" ? selector : keyFromSelector(selector);
  },
);

// React i18next hook will not work in tests without configuration; we must mock
// it. See https://react.i18next.com/misc/testing for more details.
vi.mock("react-i18next", async (importOriginal) => {
  return {
    // We can mock the i18next instance only partially, as we still need it to
    // properly initialize so that it can function as expected in components.
    ...(await importOriginal<typeof import("react-i18next")>()),
    useTranslation: () => ({
      t: mockT,
      i18n: {
        language: "en",
        resolvedLanguage: "en",
        changeLanguage: () => new Promise(() => {}),
      },
    }),
  };
});
