import { describe, it, expect } from 'vitest';
import {
  CONSENT_COPY,
  CONSENT_KEYS,
  ConsentRequiredError,
  consentRequiredBody,
  readConsentRequired,
} from './index';

describe('consent copy', () => {
  it('has wording for every consent it offers, and nothing else', () => {
    expect(Object.keys(CONSENT_COPY).sort()).toEqual([...CONSENT_KEYS].sort());
    for (const key of CONSENT_KEYS) {
      expect(CONSENT_COPY[key].title).not.toBe('');
      expect(CONSENT_COPY[key].summary).not.toBe('');
      expect(CONSENT_COPY[key].whenOff).not.toBe('');
    }
  });
});

describe('consent refusals', () => {
  it('round-trips: what the API sends is what the client reads back', () => {
    for (const key of CONSENT_KEYS) {
      expect(readConsentRequired(consentRequiredBody(key))).toBe(key);
    }
  });

  it('is a 403-shaped body that names the consent and says what to do', () => {
    const body = consentRequiredBody('bodyMeasurements');
    expect(body.code).toBe('CONSENT_REQUIRED');
    expect(body.consent).toBe('bodyMeasurements');
    expect(body.message).toContain('Body weight');
  });

  it('does not mistake other errors for a consent refusal', () => {
    expect(readConsentRequired(null)).toBeNull();
    expect(readConsentRequired('nope')).toBeNull();
    expect(readConsentRequired({ error: 'Unauthorized' })).toBeNull();
    expect(readConsentRequired({ code: 'CONSENT_REQUIRED' })).toBeNull();
    expect(readConsentRequired({ code: 'CONSENT_REQUIRED', consent: 'newsletter' })).toBeNull();
  });

  it('carries the consent on the error clients throw', () => {
    const err = new ConsentRequiredError('aiProcessing');
    expect(err).toBeInstanceOf(Error);
    expect(err.consent).toBe('aiProcessing');
    expect(err.message).toContain('AI-assisted logging');
  });
});
