import type {
  QuestionnaireContext,
  SdcConfigureRequest,
  SdcMessageType,
  SdcRequestExtractRequest,
  SdcRequestExtractResponse,
  SdcUiChangedFocusPayload,
} from "sdc-swm-protocol/src";
import type { Questionnaire, QuestionnaireResponse } from "./fhir";
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
  questionnaire: Questionnaire | null;
  questionnaireResponse: QuestionnaireResponse | null;
  context: QuestionnaireContext | null;
  config: SdcConfigureRequest["payload"] | null;
  phase: SmartMessagingPhase;
  onQuestionnaireResponseChange: (response: QuestionnaireResponse) => void;
  onFocusChange: (payload: SdcUiChangedFocusPayload) => void;
};

export type { SmartMessagingPhase } from "./phase";
export type IncomingMessage = {
  messageId: string;
  messageType: string;
  payload: unknown;
};
