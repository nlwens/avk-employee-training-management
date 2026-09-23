import "i18next";

import { resources, defaultNS } from "../resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
    enableSelector: "strict";
  }
}
