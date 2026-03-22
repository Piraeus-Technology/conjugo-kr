import verbs from '../data/verbs.json';

type VerbEntry = {
  translation: string;
  regular: boolean;
  irregularType?: string;
  topik: string;
  examples?: { ko: string; en: string }[];
  overrides?: Record<string, string>;
};

const validIrregularTypes = ['ㅂ', 'ㄷ', 'ㅅ', 'ㅎ', 'ㄹ', '르', '으', '러'];
const validTopikLevels = ['1', '2', '3', '4', '5', '6'];

describe('Korean verbs data validation', () => {
  const entries = Object.entries(verbs as Record<string, VerbEntry>);

  test('has at least 100 verbs', () => {
    expect(entries.length).toBeGreaterThanOrEqual(100);
  });

  test('all verbs end in 다', () => {
    for (const [verb] of entries) {
      expect(verb.endsWith('다')).toBe(true);
    }
  });

  test('all verbs have valid TOPIK level', () => {
    for (const [verb, data] of entries) {
      expect(validTopikLevels).toContain(data.topik);
    }
  });

  test('all verbs have translation', () => {
    for (const [verb, data] of entries) {
      expect(data.translation).toBeTruthy();
    }
  });

  test('irregular verbs have valid irregularType', () => {
    for (const [verb, data] of entries) {
      if (!data.regular) {
        expect(validIrregularTypes).toContain(data.irregularType);
      }
    }
  });

  test('regular verbs do not have irregularType', () => {
    for (const [verb, data] of entries) {
      if (data.regular) {
        expect(data.irregularType).toBeUndefined();
      }
    }
  });

  test('examples have both ko and en fields', () => {
    for (const [verb, data] of entries) {
      if (data.examples) {
        for (const ex of data.examples) {
          expect(ex.ko).toBeTruthy();
          expect(ex.en).toBeTruthy();
        }
      }
    }
  });
});
