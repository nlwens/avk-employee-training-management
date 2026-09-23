import type { Group } from "./group";
import type { LocaleCode } from "./index";

export type User = {
  id: string;
  email?: string;
  name: string;
  surname: string;
  admin?: boolean;
  createdAt: string;
  updatedAt: string;
  localeCode: LocaleCode;
  groups: Group[];
};
