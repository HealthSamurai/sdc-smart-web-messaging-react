import type { MutableRefObject } from "react";
import { useMemo } from "react";
import type { SdcMessageType } from "sdc-swm-protocol/src";
import { buildOutcome } from "../outcome";
import { REQUIRED_PHASE_BY_MESSAGE, SmartMessagingPhase, isAtLeastPhase } from "../phase";
import type { createMessenger } from "../transport";
import type {IncomingMessage, UseSmartMessagingOptions} from "../types";

type Handler = (message: IncomingMessage) => void;
type Messenger = ReturnType<typeof createMessenger>;

type UseRequiredPhaseHandlerParams = {
  handler: Handler;
  phaseRef: MutableRefObject<SmartMessagingPhase>;
  optionsRef: MutableRefObject<UseSmartMessagingOptions>;
  messenger: Messenger | null;
};

export function useRequiredPhaseHandler({
  handler,
  phaseRef,
  optionsRef,
  messenger,
}: UseRequiredPhaseHandlerParams): Handler {
  return useMemo(() => {
    return (message) => {
      if (typeof message.messageType !== "string") return;
      const messageType = message.messageType as SdcMessageType;
      const requiredPhase = REQUIRED_PHASE_BY_MESSAGE[messageType];

      if (!requiredPhase || isAtLeastPhase(phaseRef.current, requiredPhase)) {
        handler(message);
        return;
      }

      const diagnostics = `Unexpected ${messageType} while ${SmartMessagingPhase[phaseRef.current]}. Expected ${SmartMessagingPhase[requiredPhase]} or later.`;
      optionsRef.current.onError?.({
        phase: phaseRef.current,
        messageType,
        message: diagnostics,
      });

      if (!messenger) return;

      switch (messageType) {
        case "sdc.configure":
        case "sdc.configureContext":
        case "sdc.displayQuestionnaire":
        case "sdc.displayQuestionnaireResponse":
          messenger.sendResponse(messageType, message.messageId, {
            status: "error",
            outcome: buildOutcome("error", "invalid", diagnostics),
          });
          return;
        case "sdc.requestCurrentQuestionnaireResponse":
        case "sdc.requestExtract":
          messenger.sendResponse(messageType, message.messageId, {
            outcome: buildOutcome("error", "invalid", diagnostics),
          });
          return;
        default:
          return;
      }
    };
  }, [handler, messenger, optionsRef, phaseRef]);
}
