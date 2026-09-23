import { type SegmentFile } from "./segment-files";
import { type LocaleCode } from "./index";

export type SegmentAttachmentType = "pdf" | "video" | "text" | "image" | "pptx";

export interface SegmentTranslation {
  localeCode: LocaleCode;
  content: string;
}

export interface Segment {
  id: string;
  chapterId: string;
  type: SegmentAttachmentType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  translations: SegmentTranslation[];
  files: SegmentFile[];
}

export type SegmentInput = {
  type: SegmentAttachmentType;
  order: number;
  translations: { locale: string; content: string }[];
  files: {
    locale: string;
    file?: File | SegmentFile;
  }[];
};
