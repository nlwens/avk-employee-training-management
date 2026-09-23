/**
 * Error codes matching server ErrorCode enum.
 * Used for client-side error localization and specific error handling.
 *
 * Reference: Discord's error codes model
 * https://docs.discord.com/developers/topics/opcodes-and-status-codes#json
 *
 *
 * Example usage:
 *
 *  ```
 * if (error.status === ErrorCode.ANSWER_NOT_FOR_QUESTION) {
 *      // Handle specific error - show localized message
 *      const { t } = useTranslation("errors");
 *      showError(t(($) => $.errors.answer_not_for_question));
 *  }
 * ```
 */

export const ErrorCode = {
  ANSWER_NOT_FOR_QUESTION: 1001,
  CHAPTER_NOT_FOR_COURSE: 1002,
  CORRECT_ANSWER_NOT_FOR_QUESTION: 1003,
  GROUP_HAS_ASSIGNMENTS: 1004,
  INVALID_FILE_TYPE: 1008,
  EXCEEDS_MAX_FILE_SIZE: 1009,
};

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
