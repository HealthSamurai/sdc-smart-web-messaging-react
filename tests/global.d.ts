import type { QuestionnaireContext, SdcConfigureRequest, SdcUiChangedFocusPayload } from "sdc-swm-protocol/src";
import type { SmartMessagingPhase } from "../src/phase";
import type { Questionnaire, QuestionnaireResponse } from "../src/fhir";

type HostMessage = {
  messageType?: string;
  messageId?: string;
  responseToMessageId?: string;
  payload?: Record<string, any>;
};

type HostApi = {
  sendRequest: (messageType: string, payload: unknown) => string;
  sendResponse: (messageType: string, responseToMessageId: string, payload: unknown) => string;
  getMessages: () => HostMessage[];
  clearMessages: () => void;
};

type RendererState = {
  questionnaire: Questionnaire | null;
  questionnaireResponse: QuestionnaireResponse | null;
  context: QuestionnaireContext | null;
  config: SdcConfigureRequest["payload"] | null;
  phase: SmartMessagingPhase;
  phaseName?: string;
};

type RendererActions = {
  onQuestionnaireResponseChange: (response: QuestionnaireResponse) => void;
  onFocusChange: (payload: SdcUiChangedFocusPayload) => void;
};

type RendererEvents = {
  errors: Array<{ messageType?: string; message?: string }>;
  extractRequests: unknown[];
};

declare global {
  interface Window {
    __host?: HostApi;
    __messages?: HostMessage[];
    __rendererState?: RendererState;
    __rendererActions?: RendererActions;
    __rendererEvents?: RendererEvents;
  }
}

export {};
