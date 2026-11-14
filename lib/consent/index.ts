/**
 * The consents Nutri asks for, in one place.
 *
 * Imported by the API routes that refuse without consent, the inline prompt that asks for it at the
 * moment of use, and the Privacy settings page that lets people withdraw it. The wording lives here so
 * those three never disagree about what the user agreed to.
 *
 * Only flags that gate something real belong here (CLAUDE.md, rule 4). The `user_consent` table still
 * has newsletter / push / research / analytics / third-party columns from an earlier design; nothing
 * reads them, so they are not offered.
 *
 * No server-only imports: this file is used from client components.
 */

export type ConsentKey = 'aiProcessing' | 'bodyMeasurements' | 'sensitiveHealthData';

export const CONSENT_KEYS: readonly ConsentKey[] = ['aiProcessing', 'bodyMeasurements', 'sensitiveHealthData'];

export interface ConsentCopy {
  /** Short name, as shown on the toggle and in refusals. */
  title: string;
  /** One or two sentences: what we do and why. Shown where consent is asked. */
  summary: string;
  /** What happens when the user turns it off. Said plainly, including what is kept. */
  whenOff: string;
}

export const CONSENT_COPY: Record<ConsentKey, ConsentCopy> = {
  aiProcessing: {
    title: 'AI-assisted logging',
    summary:
      'The messages you type to the food logger, and the earlier messages in that conversation, are sent to Anthropic, our AI provider, to work out what you ate. Required to use the chat.',
    whenOff: 'The chat stops working. Nothing is sent to Anthropic. Foods you can still add by searching.',
  },
  bodyMeasurements: {
    title: 'Body weight',
    summary:
      'Store your body weight and use it for your daily targets. Several nutrition authorities set targets per kilogram of body weight, protein and amino acids especially, so this makes those targets yours instead of an average adult’s. One current weight in whole kilograms; no history is kept.',
    whenOff:
      'Nutri stops using your weight and your targets go back to an average adult’s. The saved value stays, encrypted, until you erase it here or delete your account.',
  },
  sensitiveHealthData: {
    title: 'Pregnancy and breastfeeding',
    summary:
      'Use your pregnancy or breastfeeding status to adjust your daily targets. This is health data with extra protection under GDPR, and it is used only for this.',
    whenOff:
      'Nutri stops using your status and your targets go back to the everyday ones. The saved value stays, encrypted, until you erase it here or delete your account.',
  },
};

/** The body of the 403 an API sends when a consent is missing. */
export interface ConsentRequiredBody {
  error: 'Consent required';
  code: 'CONSENT_REQUIRED';
  consent: ConsentKey;
  message: string;
}

export function consentRequiredBody(consent: ConsentKey): ConsentRequiredBody {
  return {
    error: 'Consent required',
    code: 'CONSENT_REQUIRED',
    consent,
    message: `${CONSENT_COPY[consent].title} needs your permission first. You can allow it now or manage it in Settings › Privacy.`,
  };
}

/** Which consent a refusal is asking for, or null if the response is not a consent refusal. */
export function readConsentRequired(body: unknown): ConsentKey | null {
  if (typeof body !== 'object' || body === null) return null;
  const { code, consent } = body as { code?: unknown; consent?: unknown };
  if (code !== 'CONSENT_REQUIRED') return null;
  return CONSENT_KEYS.includes(consent as ConsentKey) ? (consent as ConsentKey) : null;
}

/**
 * Thrown by client code when the server refused for want of a consent, so a caller can ask for it
 * and try again instead of showing an error.
 */
export class ConsentRequiredError extends Error {
  constructor(
    public readonly consent: ConsentKey,
    message?: string
  ) {
    super(message ?? consentRequiredBody(consent).message);
    this.name = 'ConsentRequiredError';
  }
}
