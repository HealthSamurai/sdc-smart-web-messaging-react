export * from "sdc-swm-protocol/src";
export {
  getContextFromPayload,
  isDisplayQuestionnairePayload,
  isDisplayQuestionnaireResponsePayload,
  isQuestionnaire,
  isQuestionnaireContext,
  isQuestionnaireResponse,
  isRecord,
  isSdcConfigureContextPayload,
  isSdcConfigurePayload,
  resolveQuestionnaire,
  resolveQuestionnaireResponse,
} from "./guards";
export { useSmartMessaging } from "./hooks/use-smart-messaging";
export type {
  OperationOutcome,
  OperationOutcomeIssue,
  Questionnaire,
  QuestionnaireResponse,
} from "./fhir";
export { SmartMessagingPhase } from "./phase";
export type {
  SmartMessagingError,
  UseSmartMessagingOptions,
  UseSmartMessagingResult,
} from "./types";
