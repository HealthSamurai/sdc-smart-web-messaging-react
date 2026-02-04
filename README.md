# sdc-smart-web-messaging-react

React hook and helpers for building SDC Questionnaire renderers that speak the SMART Web Messaging protocol.

This library wraps the SDC SMART Web Messaging message flow in a small React-first API. It handles the initial handshake, listens for host requests, validates payloads, and exposes the current questionnaire, response, context, and configuration to your renderer.

## Install

```bash
pnpm add sdc-smart-web-messaging-react
```

## Usage

```tsx
import { useSmartMessaging } from "sdc-smart-web-messaging-react";

export function RendererApp() {
  const { questionnaire, questionnaireResponse, onQuestionnaireResponseChange } =
    useSmartMessaging({
      application: { name: "My Renderer", version: "1.0.0" },
    });

  if (!questionnaire) {
    return <div>Waiting for questionnaire.</div>;
  }

  return (
    <FormRenderer
      questionnaire={questionnaire}
      questionnaireResponse={questionnaireResponse}
      onChange={onQuestionnaireResponseChange}
    />
  );
}
```

Notes for integration:
The host launches the renderer with `messaging_handle` and `messaging_origin` query params. The hook reads these from `window.location.search` and will not handshake without them.
The hook sends a `status.handshake` request once per mount. It also responds to host-initiated handshakes and never regresses phase.

## Examples

### Identify your renderer

```tsx
useSmartMessaging({
  application: { name: "My Renderer", version: "1.0.0" },
});
```

### Advertise what the renderer supports

```tsx
useSmartMessaging({
  application: { name: "My Renderer" },
  capabilities: { extraction: true, focusChangeNotifications: true },
});
```

Set `focusChangeNotifications` to true if you plan to call `onFocusChange`.
Set `extraction` to true if you provide `onRequestExtract`.

### Handle `$extract` requests from the host

```tsx
useSmartMessaging({
  application: { name: "My Renderer" },
  onRequestExtract: async ({ questionnaireResponse }) => {
    // return an OperationOutcome and/or extracted resources here.
  },
});
```

### Log invalid messages

```tsx
useSmartMessaging({
  application: { name: "My Renderer" },
  onError: ({ message, messageType, phase }) => {
    console.warn("Smart messaging error", { message, messageType, phase });
  },
});
```

### Pull patient context when you need it

```tsx
const { context } = useSmartMessaging({ application: { name: "My Renderer" } });

const subjectRef = context?.subject?.reference;
```

### Read host-provided configuration

```tsx
const { config } = useSmartMessaging({ application: { name: "My Renderer" } });

const terminologyServer = config?.terminologyServer;
```

### Render UI based on the current phase

```tsx
import { SmartMessagingPhase, useSmartMessaging } from "sdc-smart-web-messaging-react";

const { phase } = useSmartMessaging({ application: { name: "My Renderer" } });

switch (phase) {
  case SmartMessagingPhase.AwaitingHandshake:
    return <div>Waiting for handshake.</div>;
  case SmartMessagingPhase.AwaitingConfig:
    return <div>Waiting for configuration.</div>;
  case SmartMessagingPhase.AwaitingContext:
    return <div>Waiting for context.</div>;
  case SmartMessagingPhase.AwaitingQuestionnaire:
    return <div>Waiting for questionnaire.</div>;
  case SmartMessagingPhase.Ready:
    return <div>Ready.</div>;
  case SmartMessagingPhase.Disabled:
    return <div>Missing messaging parameters.</div>;
  default:
    return null;
}
```

### Notify the host when the response changes

```tsx
const { questionnaire, onQuestionnaireResponseChange } = useSmartMessaging({
  application: { name: "My Renderer" },
});

if (!questionnaire) return null;

return (
  <FormRenderer
    questionnaire={questionnaire}
    onChange={onQuestionnaireResponseChange}
  />
);
```

### Notify the host when focus changes

```tsx
const { onFocusChange } = useSmartMessaging({ application: { name: "My Renderer" } });

onFocusChange({ linkId: "patient-name", focus_field: "item[0].answer[0].value" });
```

## API

### useSmartMessaging(options)

`options`:

| Option             | Type                                                                                                                                      | Required | Description                                                                          |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------|--------------------------------------------------------------------------------------|
| `application`      | `{ name: string; publisher?: string; version?: string }`                                                                                  | Yes      | Application identity included in the handshake response.                             |
| `capabilities`     | `{ extraction?: boolean; focusChangeNotifications?: boolean }`                                                                            | No       | Advertised capabilities for the host.                                                |
| `onRequestExtract` | `(payload: SdcRequestExtractRequest["payload"]) => Promise<SdcRequestExtractResponse["payload"]> \| SdcRequestExtractResponse["payload"]` | No       | Handler for `sdc.requestExtract`. If omitted, the hook replies with `not-supported`. |
| `onError`          | `(error: SmartMessagingError) => void`                                                                                                    | No       | Called when the hook receives an invalid payload or cannot progress.                 |

`returns`:

| Field                           | Type                                        | Description                                                                      |
|---------------------------------|---------------------------------------------|----------------------------------------------------------------------------------|
| `questionnaire`                 | `Questionnaire \| null`                     | The current questionnaire.                                                       |
| `questionnaireResponse`         | `QuestionnaireResponse \| null`             | The current questionnaire response.                                              |
| `context`                       | `QuestionnaireContext \| null`              | Context from `sdc.configureContext` plus any merged context in display messages. |
| `config`                        | `SdcConfigureRequest["payload"] \| null`    | The last `sdc.configure` payload.                                                |
| `phase`                         | `SmartMessagingPhase`                       | Current lifecycle phase (handshake → config → context → questionnaire → ready). |
| `onQuestionnaireResponseChange` | `(response: QuestionnaireResponse) => void` | Sends `sdc.ui.changedQuestionnaireResponse` to the host and updates local phase. |
| `onFocusChange`                 | `(payload: SdcUiChangedFocusPayload) => void` | Sends `sdc.ui.changedFocus` to the host.                                         |

## Phase

Phase starts at `SmartMessagingPhase.AwaitingHandshake` and advances as valid messages arrive. The hook enforces ordering; out-of-order requests are rejected with an error response and forwarded to `onError`. Use `SmartMessagingPhase.Disabled` to detect missing query params.

Phase transitions:

| Phase                                     | Advances when                                                             |
|-------------------------------------------|---------------------------------------------------------------------------|
| `SmartMessagingPhase.AwaitingHandshake`   | Renderer sends `status.handshake`, or host sends `status.handshake`       |
| `SmartMessagingPhase.AwaitingConfig`      | `sdc.configure` accepted                                                  |
| `SmartMessagingPhase.AwaitingContext`     | `sdc.configureContext` accepted                                           |
| `SmartMessagingPhase.AwaitingQuestionnaire` | `sdc.displayQuestionnaire` or `sdc.displayQuestionnaireResponse` accepted |
| `SmartMessagingPhase.Ready`               | Terminal for the normal flow                                              |
| `SmartMessagingPhase.Disabled`            | Missing `messaging_handle` or `messaging_origin`                          |

Ordering rules:
`sdc.configure` requires `SmartMessagingPhase.AwaitingConfig` or later.
`sdc.configureContext` requires `SmartMessagingPhase.AwaitingContext` or later.
`sdc.displayQuestionnaire` and `sdc.displayQuestionnaireResponse` require `SmartMessagingPhase.AwaitingQuestionnaire` or later.
`sdc.requestCurrentQuestionnaireResponse` and `sdc.requestExtract` require `SmartMessagingPhase.Ready`.
`status.handshake` is always accepted and never regresses phase.

## Development

```bash
pnpm install
pnpm run build
pnpm run typecheck
```

## License

MIT
