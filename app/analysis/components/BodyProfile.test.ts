/**
 * The weight field's parsing. The rest of BodyProfile is markup, and the project has no DOM test
 * tooling, so this covers the part that can actually be wrong.
 */
import { describe, it, expect } from 'vitest';
import { parseWeightInput } from './BodyProfile';

describe('parseWeightInput', () => {
  it('rounds to whole kilograms, because nothing reads finer', () => {
    expect(parseWeightInput('72.4')).toEqual({ kg: 72 });
    expect(parseWeightInput('72.6')).toEqual({ kg: 73 });
  });

  it('accepts a comma decimal, which is a slip rather than a refusal', () => {
    expect(parseWeightInput('72,4')).toEqual({ kg: 72 });
  });

  it('treats an empty field as clearing the value, not as an error', () => {
    expect(parseWeightInput('')).toEqual({ kg: null });
    expect(parseWeightInput('   ')).toEqual({ kg: null });
  });

  it('refuses what is far likelier to be a slip or a pounds figure than a person', () => {
    for (const raw of ['0', '5', '19', '401', '900', 'seventy', '-70']) {
      expect(parseWeightInput(raw), raw).toHaveProperty('error');
    }
  });

  it('accepts the bounds themselves', () => {
    expect(parseWeightInput('20')).toEqual({ kg: 20 });
    expect(parseWeightInput('400')).toEqual({ kg: 400 });
  });
});
