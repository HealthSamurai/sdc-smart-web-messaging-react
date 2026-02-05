import type {
  QuestionnaireContext,
  SdcConfigureRequest,
  SdcMessageType,
  SdcRequestExtractRequest,
  SdcRequestExtractResponse,
  SdcUiChangedFocusPayload,
} from "sdc-smart-web-messaging";
import type {SmartMessagingPhase} from "./phase";

export type UseSmartMessagingOptions = {
  application: {
    name: string;
    publisher?: string;
    version?: string;
  };
  capabilities?: {
    extraction?: boolean;
    focusChangeNotifications?: boolean;
  };
  onRequestExtract?: (
    payload: SdcRequestExtractRequest["payload"],
  ) => Promise<SdcRequestExtractResponse["payload"]> | SdcRequestExtractResponse["payload"];
  onError?: (error: SmartMessagingError) => void;
};

export type SmartMessagingError = {
  phase: SmartMessagingPhase;
  message: string;
  messageType?: SdcMessageType;
};

export type UseSmartMessagingResult = {
  questionnaire: fhir4.Questionnaire | null;
  questionnaireResponse: fhir4.QuestionnaireResponse | null;
  context: QuestionnaireContext | null;
  config: SdcConfigureRequest["payload"] | null;
  fhirVersion: string | null;
  phase: SmartMessagingPhase;
  onQuestionnaireResponseChange: (response: fhir4.QuestionnaireResponse) => void;
  onFocusChange: (payload: SdcUiChangedFocusPayload) => void;
};

export type { SmartMessagingPhase } from "./phase";
export type IncomingMessage = {
  messageId: string;
  messageType: string;
  payload: unknown;
};
