import { conjugateReading, VerbData, ConjugationForm } from '../utils/conjugate';

function c(verb: string, data: VerbData, form: ConjugationForm): string {
  return conjugateReading(verb, data, form);
}

// ── Regular verb: 가다 (to go) — bright vowel, no final consonant ──
describe('가다 (regular, bright vowel)', () => {
  const data: VerbData = { translation: 'to go', regular: true, topik: '1' };

  test('dictionary', () => expect(c('가다', data, 'dictionary')).toBe('가다'));
  test('present polite', () => expect(c('가다', data, 'present_polite')).toBe('가요'));
  test('past polite', () => expect(c('가다', data, 'past_polite')).toBe('갔어요'));
  test('future polite', () => expect(c('가다', data, 'future_polite')).toBe('갈 거예요'));
  test('present formal', () => expect(c('가다', data, 'present_formal')).toBe('갑니다'));
  test('past formal', () => expect(c('가다', data, 'past_formal')).toBe('갔습니다'));
  test('present casual', () => expect(c('가다', data, 'present_casual')).toBe('가'));
  test('past casual', () => expect(c('가다', data, 'past_casual')).toBe('갔어'));
  test('negative polite', () => expect(c('가다', data, 'negative_polite')).toBe('가지 않아요'));
  test('connective and', () => expect(c('가다', data, 'connective_and')).toBe('가고'));
  test('connective but', () => expect(c('가다', data, 'connective_but')).toBe('가지만'));
  test('connective so', () => expect(c('가다', data, 'connective_so')).toBe('가서'));
  test('conditional', () => expect(c('가다', data, 'conditional')).toBe('가면'));
  test('present honorific', () => expect(c('가다', data, 'present_honorific')).toBe('가세요'));
});

// ── Regular verb: 먹다 (to eat) — dark vowel, with final consonant ──
describe('먹다 (regular, final consonant)', () => {
  const data: VerbData = { translation: 'to eat', regular: true, topik: '1' };

  test('present polite', () => expect(c('먹다', data, 'present_polite')).toBe('먹어요'));
  test('past polite', () => expect(c('먹다', data, 'past_polite')).toBe('먹었어요'));
  test('future polite', () => expect(c('먹다', data, 'future_polite')).toBe('먹을 거예요'));
  test('present formal', () => expect(c('먹다', data, 'present_formal')).toBe('먹습니다'));
  test('past formal', () => expect(c('먹다', data, 'past_formal')).toBe('먹었습니다'));
  test('conditional', () => expect(c('먹다', data, 'conditional')).toBe('먹으면'));
  test('imperative formal', () => expect(c('먹다', data, 'imperative_formal')).toBe('먹으십시오'));
  test('present honorific', () => expect(c('먹다', data, 'present_honorific')).toBe('먹으세요'));
});

// ── 하다 verb: 공부하다 (to study) ──
describe('공부하다 (하다 verb)', () => {
  const data: VerbData = { translation: 'to study', regular: true, topik: '1' };

  test('present polite', () => expect(c('공부하다', data, 'present_polite')).toBe('공부해요'));
  test('past polite', () => expect(c('공부하다', data, 'past_polite')).toBe('공부했어요'));
  test('future polite', () => expect(c('공부하다', data, 'future_polite')).toBe('공부할 거예요'));
  test('present formal', () => expect(c('공부하다', data, 'present_formal')).toBe('공부합니다'));
  test('past formal', () => expect(c('공부하다', data, 'past_formal')).toBe('공부했습니다'));
  test('present casual', () => expect(c('공부하다', data, 'present_casual')).toBe('공부해'));
  test('connective so', () => expect(c('공부하다', data, 'connective_so')).toBe('공부해서'));
  test('conditional', () => expect(c('공부하다', data, 'conditional')).toBe('공부하면'));
  test('present honorific', () => expect(c('공부하다', data, 'present_honorific')).toBe('공부하세요'));
});

// ── 이다 (to be) ──
describe('이다 (to be)', () => {
  const data: VerbData = { translation: 'to be', regular: true, topik: '1' };

  test('present polite', () => expect(c('이다', data, 'present_polite')).toBe('이에요'));
  test('present formal', () => expect(c('이다', data, 'present_formal')).toBe('입니다'));
  test('past polite', () => expect(c('이다', data, 'past_polite')).toBe('이었어요'));
  test('negative polite', () => expect(c('이다', data, 'negative_polite')).toBe('아니에요'));
  test('conditional', () => expect(c('이다', data, 'conditional')).toBe('이면'));
});

// ── 아니다 (to not be) ──
describe('아니다 (to not be)', () => {
  const data: VerbData = { translation: 'to not be', regular: true, topik: '1' };

  test('present polite', () => expect(c('아니다', data, 'present_polite')).toBe('아니에요'));
  test('present formal', () => expect(c('아니다', data, 'present_formal')).toBe('아닙니다'));
  test('conditional', () => expect(c('아니다', data, 'conditional')).toBe('아니면'));
});

// ── ㅂ irregular: 춥다 (to be cold) ──
describe('춥다 (ㅂ irregular)', () => {
  const data: VerbData = { translation: 'to be cold', regular: false, irregularType: 'ㅂ', topik: '1' };

  test('present polite', () => expect(c('춥다', data, 'present_polite')).toBe('추워요'));
  test('past polite', () => expect(c('춥다', data, 'past_polite')).toBe('추웠어요'));
  test('present formal', () => expect(c('춥다', data, 'present_formal')).toBe('춥습니다'));
  test('connective and', () => expect(c('춥다', data, 'connective_and')).toBe('춥고'));
});

// ── ㅂ irregular: 돕다 (to help) — special case with ㅗ vowel ──
describe('돕다 (ㅂ irregular, bright vowel)', () => {
  const data: VerbData = { translation: 'to help', regular: false, irregularType: 'ㅂ', topik: '2' };

  test('present polite', () => expect(c('돕다', data, 'present_polite')).toBe('도와요'));
  test('past polite', () => expect(c('돕다', data, 'past_polite')).toBe('도왔어요'));
});

// ── ㄷ irregular: 듣다 (to listen) ──
describe('듣다 (ㄷ irregular)', () => {
  const data: VerbData = { translation: 'to listen', regular: false, irregularType: 'ㄷ', topik: '1' };

  test('present polite', () => expect(c('듣다', data, 'present_polite')).toBe('들어요'));
  test('past polite', () => expect(c('듣다', data, 'past_polite')).toBe('들었어요'));
  test('present formal', () => expect(c('듣다', data, 'present_formal')).toBe('듣습니다'));
  test('connective and', () => expect(c('듣다', data, 'connective_and')).toBe('듣고'));
});

// ── ㅅ irregular: 짓다 (to build) ──
describe('짓다 (ㅅ irregular)', () => {
  const data: VerbData = { translation: 'to build', regular: false, irregularType: 'ㅅ', topik: '2' };

  test('present polite', () => expect(c('짓다', data, 'present_polite')).toBe('지어요'));
  test('past polite', () => expect(c('짓다', data, 'past_polite')).toBe('지었어요'));
  test('present formal', () => expect(c('짓다', data, 'present_formal')).toBe('짓습니다'));
});

// ── 르 irregular: 모르다 (to not know) ──
describe('모르다 (르 irregular)', () => {
  const data: VerbData = { translation: 'to not know', regular: false, irregularType: '르', topik: '1' };

  test('present polite', () => expect(c('모르다', data, 'present_polite')).toBe('몰라요'));
  test('past polite', () => expect(c('모르다', data, 'past_polite')).toBe('몰랐어요'));
});

// ── 르 irregular: 빠르다 (to be fast) ──
describe('빠르다 (르 irregular, bright)', () => {
  const data: VerbData = { translation: 'to be fast', regular: false, irregularType: '르', topik: '1' };

  test('present polite', () => expect(c('빠르다', data, 'present_polite')).toBe('빨라요'));
});

// ── 으 irregular: 쓰다 (to write) ──
describe('쓰다 (으 irregular)', () => {
  const data: VerbData = { translation: 'to write', regular: false, irregularType: '으', topik: '1' };

  test('present polite', () => expect(c('쓰다', data, 'present_polite')).toBe('써요'));
  test('past polite', () => expect(c('쓰다', data, 'past_polite')).toBe('썼어요'));
});

// ── 으 irregular: 크다 (to be big) ──
describe('크다 (으 irregular)', () => {
  const data: VerbData = { translation: 'to be big', regular: false, irregularType: '으', topik: '1' };

  test('present polite', () => expect(c('크다', data, 'present_polite')).toBe('커요'));
});

// ── Regular vowel contraction: 오다 (to come) — ㅗ + 아 → ㅘ ──
describe('오다 (vowel contraction ㅗ→ㅘ)', () => {
  const data: VerbData = { translation: 'to come', regular: true, topik: '1' };

  test('present polite', () => expect(c('오다', data, 'present_polite')).toBe('와요'));
  test('past polite', () => expect(c('오다', data, 'past_polite')).toBe('왔어요'));
});

// ── Regular vowel contraction: 배우다 (to learn) — ㅜ + 어 → ㅝ ──
describe('배우다 (vowel contraction ㅜ→ㅝ)', () => {
  const data: VerbData = { translation: 'to learn', regular: true, topik: '1' };

  test('present polite', () => expect(c('배우다', data, 'present_polite')).toBe('배워요'));
});

// ── Regular vowel contraction: 마시다 (to drink) — ㅣ + 어 → ㅕ ──
describe('마시다 (vowel contraction ㅣ→ㅕ)', () => {
  const data: VerbData = { translation: 'to drink', regular: true, topik: '1' };

  test('present polite', () => expect(c('마시다', data, 'present_polite')).toBe('마셔요'));
});

// ── ㄹ final verbs: 살다 (to live) — ㄹ drops before ㄴ,ㅂ,ㅅ ──
describe('살다 (ㄹ final)', () => {
  const data: VerbData = { translation: 'to live', regular: true, topik: '1' };

  test('present formal', () => expect(c('살다', data, 'present_formal')).toBe('삽니다'));
  test('present polite', () => expect(c('살다', data, 'present_polite')).toBe('살아요'));
  test('conditional', () => expect(c('살다', data, 'conditional')).toBe('살면'));
  test('future polite', () => expect(c('살다', data, 'future_polite')).toBe('살 거예요'));
});

// ── Verb data validation ──
describe('verbs.json validation', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const verbsData = require('../data/verbs.json');

  test('all verbs end in 다', () => {
    for (const verb of Object.keys(verbsData)) {
      expect(verb.endsWith('다')).toBe(true);
    }
  });

  test('all verbs have required fields', () => {
    for (const [verb, data] of Object.entries(verbsData) as [string, any][]) {
      expect(data.translation).toBeDefined();
      expect(typeof data.regular).toBe('boolean');
      expect(data.topik).toBeDefined();
    }
  });

  test('irregular verbs have irregularType', () => {
    for (const [verb, data] of Object.entries(verbsData) as [string, any][]) {
      if (!data.regular) {
        expect(data.irregularType).toBeDefined();
      }
    }
  });
});
