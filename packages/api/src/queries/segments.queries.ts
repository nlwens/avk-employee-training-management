import { queryOptions } from "@tanstack/react-query";
import { API } from "../api";
import type { SegmentInput, Segment } from "../types/segments";

export const segmentsQueryOptions = (courseId: string, chapterId: string) =>
  queryOptions({
    queryKey: ["courses", courseId, "chapters", chapterId, "segments"],
    queryFn: () =>
      API.get<Segment[]>(`/courses/${courseId}/chapters/${chapterId}/segments`),
  });

export const createSegment = (
  courseId: string,
  chapterId: string,
  body: SegmentInput,
) =>
  API.post<Segment>(
    `/courses/${courseId}/chapters/${chapterId}/segments`,
    toSegmentFormData(body),
  );

export const updateSegment = (
  courseId: string,
  chapterId: string,
  segmentId: string,
  body: SegmentInput,
) =>
  API.patch<Segment>(
    `/courses/${courseId}/chapters/${chapterId}/segments/${segmentId}`,
    toSegmentFormData(body),
  );

export const deleteSegment = (
  courseId: string,
  chapterId: string,
  segmentId: string,
) =>
  API.delete<void>(
    `/courses/${courseId}/chapters/${chapterId}/segments/${segmentId}`,
  );

/**
 * Transforms content block to a FormData.
 */
const toSegmentFormData = (body: SegmentInput): FormData => {
  const formData = new FormData();

  formData.append("type", body.type);
  formData.append("order", String(body.order));

  if (body.type === "text") {
    body.translations.forEach((translation, index) => {
      formData.append(`translations[${index}][locale]`, translation.locale);
      formData.append(`translations[${index}][content]`, translation.content);
    });
  } else {
    if (body.files) {
      body.files.forEach(({ locale, file }) => {
        if (file instanceof File) {
          formData.append(`file_${locale}`, file);
        }
      });
    }
  }

  return formData;
};
