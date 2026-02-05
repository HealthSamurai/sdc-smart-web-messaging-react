import type {MutableRefObject} from "react";
import {useMemo} from "react";
import type {
  QuestionnaireContext,
  SdcMessageType,
  SdcRequestCurrentQuestionnaireResponseResponse,
  SdcRequestExtractRequest,
} from "sdc-smart-web-messaging";
import {mergeContext} from "../context";
import {
  getContextFromPayload,
  isDisplayQuestionnairePayload,
  isDisplayQuestionnaireResponsePayload,
  isRecord,
  isSdcConfigureContextPayload,
  isSdcConfigurePayload,
  resolveQuestionnaire,
  resolveQuestionnaireResponse,
} from "../guards";
import {buildOutcome} from "../outcome";
import {SmartMessagingPhase} from "../phase";
import type {createMessenger} from "../transport";
import type {IncomingMessage, UseSmartMessagingOptions, UseSmartMessagingResult} from "../types";

type Handler = (message: IncomingMessage) => void;
type Messenger = ReturnType<typeof createMessenger>;

type UseHandlerParams = {
  optionsRef: MutableRefObject<UseSmartMessagingOptions>;
  phaseRef: MutableRefObject<SmartMessagingPhase>;
  contextRef: MutableRefObject<QuestionnaireContext | null>;
  questionnaireRef: MutableRefObject<fhir4.Questionnaire | null>;
  responseRef: MutableRefObject<fhir4.QuestionnaireResponse | null>;
  messenger: Messenger | null;
  setConfig: (value: UseSmartMessagingResult["config"]) => void;
  setContext: (value: QuestionnaireContext | null) => void;
  setQuestionnaire: (value: fhir4.Questionnaire | null) => void;
  setQuestionnaireResponse: (value: fhir4.QuestionnaireResponse | null) => void;
  setFhirVersion: (value: UseSmartMessagingResult["fhirVersion"]) => void;
  advancePhase: (next: SmartMessagingPhase) => void;
};

export function useHandler({
  optionsRef,
  phaseRef,
  contextRef,
  questionnaireRef,
  responseRef,
  messenger,
  setConfig,
  setContext,
  setQuestionnaire,
  setQuestionnaireResponse,
  setFhirVersion,
  advancePhase,
}: UseHandlerParams): Handler {
  return useMemo(() => {
    if (!messenger) return () => undefined;
    const { sendResponse } = messenger;

    return (message) => {
      if (typeof message.messageType !== "string") return;
      const messageType = message.messageType as SdcMessageType;

      switch (messageType) {
        case "status.handshake": {
          const payload = isRecord(message.payload) ? message.payload : {};
          const fhirVersion =
            typeof payload.fhirVersion === "string" ? payload.fhirVersion : null;
          setFhirVersion(fhirVersion);
          sendResponse("status.handshake", message.messageId, {
            application: optionsRef.current.application,
            capabilities: optionsRef.current.capabilities,
          });
          advancePhase(SmartMessagingPhase.AwaitingConfig);
          return;
        }
        case "sdc.configure": {
          if (!isSdcConfigurePayload(message.payload)) {
            sendResponse("sdc.configure", message.messageId, {
              status: "error",
              outcome: buildOutcome("error", "invalid", "Invalid sdc.configure payload."),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.configure",
              message: "Invalid sdc.configure payload.",
            });
            return;
          }
          setConfig(message.payload);
          advancePhase(SmartMessagingPhase.AwaitingContext);
          sendResponse("sdc.configure", message.messageId, { status: "success" });
          return;
        }
        case "sdc.configureContext": {
          if (!isSdcConfigureContextPayload(message.payload)) {
            sendResponse("sdc.configureContext", message.messageId, {
              status: "error",
              outcome: buildOutcome("error", "invalid", "Invalid sdc.configureContext payload."),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.configureContext",
              message: "Invalid sdc.configureContext payload.",
            });
            return;
          }
          setContext(message.payload.context ?? null);
          advancePhase(SmartMessagingPhase.AwaitingQuestionnaire);
          sendResponse("sdc.configureContext", message.messageId, { status: "success" });
          return;
        }
        case "sdc.displayQuestionnaire": {
          if (!isDisplayQuestionnairePayload(message.payload)) {
            sendResponse("sdc.displayQuestionnaire", message.messageId, {
              status: "error",
              outcome: buildOutcome(
                "error",
                "invalid",
                "Invalid sdc.displayQuestionnaire payload.",
              ),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.displayQuestionnaire",
              message: "Invalid sdc.displayQuestionnaire payload.",
            });
            return;
          }
          const resolvedQuestionnaire = resolveQuestionnaire(message.payload);
          if (!resolvedQuestionnaire) {
            sendResponse("sdc.displayQuestionnaire", message.messageId, {
              status: "error",
              outcome: buildOutcome(
                "error",
                "invalid",
                "Missing questionnaire in sdc.displayQuestionnaire.",
              ),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.displayQuestionnaire",
              message: "Missing questionnaire in sdc.displayQuestionnaire.",
            });
            return;
          }
          setContext(mergeContext(contextRef.current, getContextFromPayload(message.payload)));
          setQuestionnaire(resolvedQuestionnaire);
          const resolvedResponse = resolveQuestionnaireResponse(message.payload);
          if (resolvedResponse) {
            setQuestionnaireResponse(resolvedResponse);
          } else {
            setQuestionnaireResponse(null);
          }
          advancePhase(SmartMessagingPhase.Ready);
          sendResponse("sdc.displayQuestionnaire", message.messageId, { status: "success" });
          return;
        }
        case "sdc.displayQuestionnaireResponse": {
          if (!isDisplayQuestionnaireResponsePayload(message.payload)) {
            sendResponse("sdc.displayQuestionnaireResponse", message.messageId, {
              status: "error",
              outcome: buildOutcome(
                "error",
                "invalid",
                "Invalid sdc.displayQuestionnaireResponse payload.",
              ),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.displayQuestionnaireResponse",
              message: "Invalid sdc.displayQuestionnaireResponse payload.",
            });
            return;
          }
          const resolvedResponse = resolveQuestionnaireResponse(message.payload);
          if (!resolvedResponse) {
            sendResponse("sdc.displayQuestionnaireResponse", message.messageId, {
              status: "error",
              outcome: buildOutcome(
                "error",
                "invalid",
                "Missing questionnaireResponse in sdc.displayQuestionnaireResponse.",
              ),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.displayQuestionnaireResponse",
              message: "Missing questionnaireResponse in sdc.displayQuestionnaireResponse.",
            });
            return;
          }
          const resolvedQuestionnaire = resolveQuestionnaire(message.payload);
          if (resolvedQuestionnaire) {
            setQuestionnaire(resolvedQuestionnaire);
          }
          if (!questionnaireRef.current && !resolvedQuestionnaire) {
            sendResponse("sdc.displayQuestionnaireResponse", message.messageId, {
              status: "error",
              outcome: buildOutcome(
                "error",
                "invalid",
                "Questionnaire is required to render QuestionnaireResponse.",
              ),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.displayQuestionnaireResponse",
              message: "Questionnaire is required to render QuestionnaireResponse.",
            });
            return;
          }
          setQuestionnaireResponse(resolvedResponse);
          advancePhase(SmartMessagingPhase.Ready);
          sendResponse("sdc.displayQuestionnaireResponse", message.messageId, {
            status: "success",
          });
          return;
        }
        case "sdc.requestCurrentQuestionnaireResponse": {
          if (!isRecord(message.payload)) {
            sendResponse("sdc.requestCurrentQuestionnaireResponse", message.messageId, {
              outcome: buildOutcome(
                "error",
                "invalid",
                "Invalid sdc.requestCurrentQuestionnaireResponse payload.",
              ),
            } satisfies SdcRequestCurrentQuestionnaireResponseResponse["payload"]);
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.requestCurrentQuestionnaireResponse",
              message: "Invalid sdc.requestCurrentQuestionnaireResponse payload.",
            });
            return;
          }
          if (responseRef.current) {
            sendResponse("sdc.requestCurrentQuestionnaireResponse", message.messageId, {
              questionnaireResponse: responseRef.current,
            });
            return;
          }
          sendResponse("sdc.requestCurrentQuestionnaireResponse", message.messageId, {
            outcome: buildOutcome(
              "error",
              "not-found",
              "No QuestionnaireResponse is currently loaded.",
            ),
          });
          optionsRef.current.onError?.({
            phase: phaseRef.current,
            messageType: "sdc.requestCurrentQuestionnaireResponse",
            message: "No QuestionnaireResponse is currently loaded.",
          });
          return;
        }
        case "sdc.requestExtract": {
          if (!isRecord(message.payload)) {
            sendResponse("sdc.requestExtract", message.messageId, {
              outcome: buildOutcome("error", "invalid", "Invalid sdc.requestExtract payload."),
            });
            optionsRef.current.onError?.({
              phase: phaseRef.current,
              messageType: "sdc.requestExtract",
              message: "Invalid sdc.requestExtract payload.",
            });
            return;
          }
          const extractHandler = optionsRef.current.onRequestExtract;
          if (extractHandler) {
            const extractPayload = message.payload as SdcRequestExtractRequest["payload"];
            void Promise.resolve()
              .then(() => extractHandler(extractPayload))
              .then((payload) => {
                sendResponse("sdc.requestExtract", message.messageId, payload);
              })
              .catch((error) => {
                const diagnostics =
                  error instanceof Error
                    ? `Extract handler failed: ${error.message}`
                    : "Extract handler failed.";
                sendResponse("sdc.requestExtract", message.messageId, {
                  outcome: buildOutcome("error", "exception", diagnostics),
                });
                optionsRef.current.onError?.({
                  phase: phaseRef.current,
                  messageType: "sdc.requestExtract",
                  message: diagnostics,
                });
              });
            return;
          }
          sendResponse("sdc.requestExtract", message.messageId, {
            outcome: buildOutcome(
              "error",
              "not-supported",
              "Extract is not implemented in this renderer.",
            ),
          });
          optionsRef.current.onError?.({
            phase: phaseRef.current,
            messageType: "sdc.requestExtract",
            message: "Extract is not implemented in this renderer.",
          });
          return;
        }
        default:
          return;
      }
    };
  }, [
    advancePhase,
    contextRef,
    optionsRef,
    questionnaireRef,
    responseRef,
    messenger,
    setConfig,
    setContext,
    setQuestionnaire,
    setQuestionnaireResponse,
    setFhirVersion,
    phaseRef,
  ]);
}
