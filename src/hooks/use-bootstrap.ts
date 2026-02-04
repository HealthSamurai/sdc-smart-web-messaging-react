import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { SmartMessagingPhase } from "../phase";
import type { createMessenger } from "../transport";
import type { UseSmartMessagingOptions } from "../types";

type Messenger = ReturnType<typeof createMessenger> | null;

type UseBootstrapParams = {
  messenger: Messenger;
  phaseRef: MutableRefObject<SmartMessagingPhase>;
  advancePhase: (next: SmartMessagingPhase) => void;
  optionsRef: MutableRefObject<UseSmartMessagingOptions>;
  handshakeSent: MutableRefObject<boolean>;
};

export function useBootstrap({
  messenger,
  phaseRef,
  advancePhase,
  optionsRef,
  handshakeSent,
}: UseBootstrapParams) {
  useEffect(() => {
    if (!messenger) {
      if (phaseRef.current !== SmartMessagingPhase.Disabled) {
        advancePhase(SmartMessagingPhase.Disabled);
        optionsRef.current.onError?.({
          phase: phaseRef.current,
          message: "Missing SDC SWM parameters.",
        });
      }
      return;
    }
    if (handshakeSent.current) return;
    messenger.sendRequest("status.handshake", {
      protocolVersion: "1.0",
      fhirVersion: "R4",
    });
    advancePhase(SmartMessagingPhase.AwaitingConfig);
    handshakeSent.current = true;
  }, [messenger, advancePhase, optionsRef, phaseRef, handshakeSent]);
}
