import {useCallback, useEffect, useRef, useState} from "react";
import type {
  QuestionnaireContext,
  SdcUiChangedFocusPayload,
  SdcUiChangedQuestionnaireResponsePayload,
} from "sdc-smart-web-messaging";
import {INITIAL_PHASE, SmartMessagingPhase} from "../phase";
import type {IncomingMessage, UseSmartMessagingOptions, UseSmartMessagingResult} from "../types";
import {useCreateMessenger} from "./use-create-messenger";
import {useHandler} from "./use-handler";
import {useLatestRef} from "./use-latest-ref";
import {usePhase} from "./use-phase";
import {useRequiredPhaseHandler} from "./use-required-phase-handler";

export function useSmartMessaging(options: UseSmartMessagingOptions): UseSmartMessagingResult {
  const [questionnaire, setQuestionnaireState] = useState<fhir4.Questionnaire | null>(null);
  const [questionnaireResponse, setQuestionnaireResponseState] =
    useState<fhir4.QuestionnaireResponse | null>(null);
  const [context, setContextState] = useState<QuestionnaireContext | null>(null);
  const [config, setConfigState] = useState<UseSmartMessagingResult["config"]>(null);
  const [fhirVersion, setFhirVersionState] = useState<UseSmartMessagingResult["fhirVersion"]>(
    null,
  );
  const phaseRef = useRef<SmartMessagingPhase>(INITIAL_PHASE);
  const questionnaireRef = useRef(questionnaire);
  const responseRef = useRef(questionnaireResponse);
  const contextRef = useRef(context);
  const configRef = useRef(config);
  const optionsRef = useLatestRef(options);
  const handlerRef = useRef<(message: IncomingMessage) => void>(() => undefined);
  const { phase, advancePhase } = usePhase(phaseRef);

  const setQuestionnaire = useCallback((value: fhir4.Questionnaire | null) => {
    questionnaireRef.current = value;
    setQuestionnaireState(value);
  }, []);

  const setQuestionnaireResponse = useCallback((value: fhir4.QuestionnaireResponse | null) => {
    responseRef.current = value;
    setQuestionnaireResponseState(value);
  }, []);

  const setContext = useCallback((value: QuestionnaireContext | null) => {
    contextRef.current = value;
    setContextState(value);
  }, []);

  const setConfig = useCallback((value: UseSmartMessagingResult["config"]) => {
    configRef.current = value;
    setConfigState(value);
  }, []);

  const setFhirVersion = useCallback((value: UseSmartMessagingResult["fhirVersion"]) => {
    setFhirVersionState(value);
  }, []);

  const messenger = useCreateMessenger(handlerRef);

  const handler = useHandler({
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
  });

  const guardedHandler = useRequiredPhaseHandler({
    handler,
    phaseRef,
    optionsRef,
    messenger,
  });

  useEffect(() => {
    handlerRef.current = guardedHandler;
  }, [guardedHandler]);

  useEffect(() => {
    if (!messenger && phaseRef.current !== SmartMessagingPhase.Disabled) {
      advancePhase(SmartMessagingPhase.Disabled);
      optionsRef.current.onError?.({
        phase: phaseRef.current,
        message: "Missing SDC SWM parameters.",
      });
    }
  }, [messenger, advancePhase, optionsRef, phaseRef]);

  const onQuestionnaireResponseChange = useCallback(
    (response: fhir4.QuestionnaireResponse) => {
      setQuestionnaireResponse(response);
      if (!messenger) return;
      messenger.sendEvent("sdc.ui.changedQuestionnaireResponse", {
        questionnaireResponse: response,
      } satisfies SdcUiChangedQuestionnaireResponsePayload);
    },
    [messenger, setQuestionnaireResponse],
  );

  const onFocusChange = useCallback(
    (payload: SdcUiChangedFocusPayload) => {
      if (!messenger) return;
      messenger.sendEvent("sdc.ui.changedFocus", payload);
    },
    [messenger],
  );

  return {
    questionnaire,
    questionnaireResponse,
    context,
    config,
    fhirVersion,
    phase,
    onQuestionnaireResponseChange,
    onFocusChange,
  };
}
