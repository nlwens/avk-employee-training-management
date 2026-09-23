/**
 * Error codes for 400 Bad Reqest responses.
 *
 * These codes identify specific validation and business logic errors that occur during request processing.
 * Unlike HTTP status codes, these codes provide specific error details for client-side localiation and handling.
 *
 * Error codes start at integer 1000+ to avoid confusion with HTTP status codes.
 *
 * Used in:
 * - Error responses with 400 Bad Request status
 * - Client error localization (i18n)
 *
 * Reference: Discord's error codes model
 * https://docs.discord.com/developers/topics/opcodes-and-status-codes#json
 */
export enum ErrorCode {
  /**
   * The answer ID provided does not belong to the question being answered.
   *
   * Occurs when a user tries to submit an answer to a question using an answer ID that
   * is associated with a different question.
   */
  ANSWER_NOT_FOR_QUESTION = 1001,

  /**
   * The chapter ID provided does not belong to the specified course.
   *
   * Occurs when a user tries to mark a chapter as completed using a chapter ID that
   * belongs to a different course than the one specified.
   */
  CHAPTER_NOT_FOR_COURSE = 1002,

  /**
   * The correct answer ID provided does not belong to the specified question.
   *
   * Occurs when an admin tries to set a correct answer for a question using an
   * answer ID that is associated with a different question.
   */
  CORRECT_ANSWER_NOT_FOR_QUESTION = 1003,

  /**
   * The group cannot be deleted because users or courses are still assigned to it.
   *
   * Occurs when an admin tries to delete a group that still has users or courses
   * linked through the users_groups or courses_groups join tables.
   */
  GROUP_HAS_ASSIGNMENTS = 1004,

  /**
   * A file is required for non-text segment types.
   *
   * Occurs when an admin tries to create a PDF, VIDEO, or IMAGE segment without providing a file.
   */
  FILE_IS_REQUIRED = 1005,

  /**
   * The file cannot be accessed outside of the upload target directory.
   *
   * Occurs when file is tried to be accessed from parent directories.
   */
  CANNOT_ACCESS_OUTSIDE_DIRECTORY = 1006,

  /**
   * Translations are not allowed for a specific entity.
   *
   * Occurs when an admin tries to include translations into the request where it should not be allowed.
   */
  TRANSLATIONS_NOT_ALLOWED = 1007,

  /**
   * The file has an invalid type for the segment.
   *
   * Occurs when a file's extension does not match the segment type requirements
   * (e.g., uploading an MP4 to a PDF segment, or a PNG to a VIDEO segment).
   */
  INVALID_FILE_TYPE = 1008,

  /**
   * The file exceeds the maximum allowed size for the segment type.
   *
   * Occurs when a file size exceeds type-specific limits.
   */
  EXCEEDS_MAX_FILE_SIZE = 1009,
}
