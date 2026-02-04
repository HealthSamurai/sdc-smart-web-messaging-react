import { useCallback, useState } from "react";
import type { MutableRefObject } from "react";
import { SmartMessagingPhase, isAtLeastPhase } from "../phase";

export type UsePhaseResult = {
  phase: SmartMessagingPhase;
  advancePhase: (next: SmartMessagingPhase) => void;
};

export function usePhase(phaseRef: MutableRefObject<SmartMessagingPhase>): UsePhaseResult {
  const [phase, setPhaseState] = useState<SmartMessagingPhase>(phaseRef.current);
  const setPhase = useCallback(
    (value: SmartMessagingPhase) => {
      phaseRef.current = value;
      setPhaseState(value);
    },
    [phaseRef],
  );

  const advancePhase = useCallback(
    (next: SmartMessagingPhase) => {
      const current = phaseRef.current;
      if (next === SmartMessagingPhase.Disabled) {
        setPhase(SmartMessagingPhase.Disabled);
        return;
      }
      if (isAtLeastPhase(current, next)) return;
      setPhase(next);
    },
    [phaseRef, setPhase],
  );

  return { phase, advancePhase };
}
