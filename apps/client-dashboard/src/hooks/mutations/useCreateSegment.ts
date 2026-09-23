import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSegment, segmentsQueryOptions } from "@api/src";
import type { Segment, SegmentInput } from "@api/src";
import type { ApiError } from "@api/src";

interface CreateSegmentVariables {
  courseId: string;
  chapterId: string;
  segment: SegmentInput;
}

export const useCreateSegment = () => {
  const queryClient = useQueryClient();

  return useMutation<Segment, ApiError, CreateSegmentVariables>({
    mutationFn: ({ courseId, chapterId, segment }: CreateSegmentVariables) =>
      createSegment(courseId, chapterId, segment),

    onSuccess: (createdSegment: Segment, { courseId, chapterId }) => {
      const cacheKey = segmentsQueryOptions(courseId, chapterId).queryKey;

      const previous = queryClient.getQueryData<Segment[]>(cacheKey) ?? [];
      queryClient.setQueryData(cacheKey, [...previous, createdSegment]);
    },
  });
};
