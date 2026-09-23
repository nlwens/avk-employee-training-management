import type { Segment, SegmentFile } from "@api/src";
import type { SegmentInput } from "@api/src";
import type {
  ChapterContentType,
  ChapterFormValues,
} from "@ui/components/forms/validators";

type SegmentBlock = ChapterFormValues["contentBlocks"][number];

type SyncSegmentsResult = {
  completed: number;
  failed: number;
  errors: unknown[];
};

type SyncChapterSegmentsType = {
  courseId: string;
  chapterId: string;
  originalSegments: Segment[];
  newFormValues: ChapterFormValues;
  mutations: SegmentMutations;
};

/**
 * API operations needed to sync the chapter form with the backend.
 *
 * They are injected by the page so this file can focus
 * on differing form state against the original API state.
 */
export type SegmentMutations = {
  createSegment: (variables: {
    courseId: string;
    chapterId: string;
    body: SegmentInput;
  }) => Promise<Segment>;

  updateSegment: (variables: {
    courseId: string;
    chapterId: string;
    segmentId: string;
    body: SegmentInput;
  }) => Promise<Segment>;

  deleteSegment: (variables: {
    courseId: string;
    chapterId: string;
    segmentId: string;
  }) => Promise<void>;
};

/**
 * A reusable generic operation handler that executes an operation and
 * observes completed or failed actions.
 *
 * @param result contains two result counts: completed and failed operations.
 * @param operation an asynchronous function that is executed during the run.
 */
const runSyncOperation = async <T>(
  result: SyncSegmentsResult,
  operation: () => Promise<T>,
): Promise<T | undefined> => {
  try {
    const value = await operation();

    result.completed += 1;

    return value;
  } catch (error) {
    result.failed += 1;
    result.errors.push(error);

    return undefined;
  }
};

/**
 * Creates, updates, and deletes segments for a chapter.
 *
 * Each request is tracked separately so a failed segment
 * request does not stop other operations from running.
 */
export const syncChapterSegments = async ({
  courseId,
  chapterId,
  originalSegments,
  newFormValues,
  mutations,
}: SyncChapterSegmentsType): Promise<SyncSegmentsResult> => {
  const result: SyncSegmentsResult = {
    completed: 0,
    failed: 0,
    errors: [],
  };

  // Map all old segment blocks (both unchanged and updated).
  const originalBlocksMap: Map<string, SegmentBlock> = new Map();
  for (const segment of originalSegments) {
    originalBlocksMap.set(segment.id, segmentToBlock(segment));
  }

  // Collects the IDs of segments that exist in both the form and the original server data.
  // If current block does not have an exsiting ID, then it will end up being ignored.
  const keptSegmentIds: string[] = [];
  for (const block of newFormValues.contentBlocks) {
    if (block.id && originalBlocksMap.has(block.id)) {
      keptSegmentIds.push(block.id);
    }
  }

  for (const [index, block] of newFormValues.contentBlocks.entries()) {
    /**
     * We are taking here the original block that we expect to
     * exist in new (updated) blocks. If original does not exist
     * in new blocks, then create a new segment. Otherwise, update
     * existing segment.
     */
    const originalBlock: SegmentBlock | undefined = originalBlocksMap.get(
      block.id,
    );

    const order = index + 1;

    const body = {
      courseId,
      chapterId,
      block,
      order,
      mutations,
      result,
    };

    if (originalBlock) {
      await syncExistingSegment({
        ...body,
        originalBlock,
      });
    } else {
      await syncNewSegment(body);
    }
  }

  for (const segment of originalSegments) {
    if (!keptSegmentIds.includes(segment.id)) {
      await runSyncOperation(result, () =>
        mutations.deleteSegment({
          courseId,
          chapterId,
          segmentId: segment.id,
        }),
      );
    }
  }

  return result;
};

/**
 * Updates an existing segment when its form block differs from
 * the original API block.
 *
 * The incoming block is merged with the current order before comparison,
 * so reordering a segment also triggers an update. If nothing changed,
 * no API request is sent.
 */
const syncExistingSegment = async ({
  courseId,
  chapterId,
  originalBlock,
  block,
  order,
  mutations,
  result,
}: {
  courseId: string;
  chapterId: string;
  originalBlock: SegmentBlock;
  block: SegmentBlock;
  order: number;
  mutations: SegmentMutations;
  result: SyncSegmentsResult;
}) => {
  const updatedBlock = { ...block, order };

  if (!hasSegmentChanged(originalBlock, updatedBlock)) return;

  await runSyncOperation(result, () =>
    mutations.updateSegment({
      courseId,
      chapterId,
      segmentId: block.id,
      body: blockToSegment(updatedBlock),
    }),
  );
};

/**
 * Creates a new segment for a form block that does not exist
 * in the original API segment list.
 *
 * The block is assigned its current form order before being converted
 * to the API payload.
 */
const syncNewSegment = async ({
  courseId,
  chapterId,
  block,
  order,
  mutations,
  result,
}: {
  courseId: string;
  chapterId: string;
  block: SegmentBlock;
  order: number;
  mutations: SegmentMutations;
  result: SyncSegmentsResult;
}) => {
  await runSyncOperation(result, () =>
    mutations.createSegment({
      courseId,
      chapterId,
      body: blockToSegment({ ...block, order }),
    }),
  );
};

export const blockToSegment = (block: SegmentBlock): SegmentInput => {
  const input = {
    type: block.type,
    order: block.order,
    translations: Object.entries(block.translations)
      .filter(([, data]) => data.content.trim().length > 0)
      .map(([locale, data]) => ({
        locale,
        content: data.content,
      })),
    files: Object.entries(block.translations)
      .filter(([, data]) => data.file != null)
      .map(([locale, data]) => ({
        locale,
        file: data.file as File | SegmentFile,
      })),
  };

  return input;
};

export const segmentToBlock = (
  segment: Segment,
  order?: number,
): SegmentBlock => ({
  id: segment.id,
  type: segment.type as ChapterContentType,
  order: order ?? segment.order,
  translations: {
    en: {
      content:
        segment.translations.find((t) => t.localeCode === "en")?.content ?? "",
      file: segment.files.find((f) => f.localeCode === "en") ?? null,
    },
    nl: {
      content:
        segment.translations.find((t) => t.localeCode === "nl")?.content ?? "",
      file: segment.files.find((f) => f.localeCode === "nl") ?? null,
    },
  },
});

/**
 * Compares old segment state with a new one.
 *
 * The function goes through each comparison step:
 *
 * 1. First, check if order has been updated.
 * 2. If not, check if segment content has been updated.
 * 3. And none of these were changed, then check if new file has been attached.
 *
 * If one of the conditions passes, then function immediately returns True.
 */
const hasSegmentChanged = (
  oldSeg: SegmentBlock,
  newSeg: SegmentBlock,
): boolean => {
  if (oldSeg.order !== newSeg.order) return true;

  if (
    oldSeg.translations.en.content !== newSeg.translations.en.content ||
    oldSeg.translations.nl.content !== newSeg.translations.nl.content
  ) {
    return true;
  }

  const fileChanged = (
    oldFile: typeof oldSeg.translations.en.file,
    newFile: typeof newSeg.translations.en.file,
  ): boolean => {
    if (!oldFile && !newFile) return false;
    if (!oldFile || !newFile) return true;
    if (newFile instanceof File) return true;
    if (oldFile instanceof File) return true;
    return oldFile.id !== newFile.id;
  };

  return (
    fileChanged(oldSeg.translations.en.file, newSeg.translations.en.file) ||
    fileChanged(oldSeg.translations.nl.file, newSeg.translations.nl.file)
  );
};
