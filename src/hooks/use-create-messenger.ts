import { useEffect, useMemo } from "react";
import type { MutableRefObject } from "react";
import { isRequest, isResponse } from "sdc-smart-web-messaging";
import { createMessenger } from "../transport";

import {IncomingMessage} from "../types";

type HandlerRef = MutableRefObject<(message: IncomingMessage) => void>;

export function useCreateMessenger(
  handlerRef?: HandlerRef,
): ReturnType<typeof createMessenger> | null {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const messagingHandle = params.get("messaging_handle");
  const messagingOrigin = params.get("messaging_origin");
  const hostWindow = useMemo(() => window.opener || window.parent, []);

  const messenger = useMemo(() => {
    if (!messagingHandle || !messagingOrigin || !hostWindow) return null;
    return createMessenger({
      messagingHandle,
      messagingOrigin,
      hostWindow,
    });
  }, [hostWindow, messagingHandle, messagingOrigin]);

  useEffect(() => {
    if (!messenger || !handlerRef) return;

    const handler = (event: MessageEvent) => {
      if (event.source !== hostWindow) return;
      if (event.origin !== messagingOrigin) return;

      const message = event.data ?? {};
      if (isResponse(message)) {
        return;
      }
      if (!isRequest(message)) {
        return;
      }
      if (message.messagingHandle && message.messagingHandle !== messagingHandle) {
        return;
      }

      handlerRef.current(message);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handlerRef, hostWindow, messenger, messagingHandle, messagingOrigin]);

  return messenger;
}
