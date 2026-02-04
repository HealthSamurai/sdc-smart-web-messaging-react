export * from "sdc-smart-web-messaging";
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
export { SmartMessagingPhase } from "./phase";
export type {
  SmartMessagingError,
  UseSmartMessagingOptions,
  UseSmartMessagingResult,
} from "./types";
