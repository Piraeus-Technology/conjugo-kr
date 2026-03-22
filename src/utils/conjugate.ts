import {
  getStem,
  decompose,
  compose,
  isHangul,
  hasFinalConsonant,
  getFinalConsonant,
  getMedialVowel,
  removeFinal,
  replaceFinal,
  isBrightVowel,
  INITIALS,
  MEDIALS,
  FINALS,
} from './hangul';

// ──────────────────────── Types ────────────────────────

export type VerbType = 'regular' | 'irregular';
export type IrregularType =
  | 'ㅂ' | 'ㄷ' | 'ㅅ' | 'ㅎ' | 'ㄹ' | '르' | '으' | '러';
export type TOPIKLevel = '1' | '2' | '3' | '4' | '5' | '6';

export type ConjugationForm =
  | 'dictionary'
  // Polite (해요체)
  | 'present_polite'
  | 'past_polite'
  | 'future_polite'
  // Formal (합쇼체)
  | 'present_formal'
  | 'past_formal'
  | 'future_formal'
  // Casual (해체)
  | 'present_casual'
  | 'past_casual'
  | 'future_casual'
  // Negative
  | 'negative_polite'
  | 'negative_formal'
  // Connective
  | 'connective_and'
  | 'connective_but'
  | 'connective_so'
  // Conditional
  | 'conditional'
  // Imperative
  | 'imperative_polite'
  | 'imperative_formal'
  // Propositive
  | 'propositive_polite'
  | 'propositive_formal'
  // Honorific
  | 'present_honorific'
  | 'past_honorific';

export const FORM_LABELS: Record<ConjugationForm, { ko: string; en: string }> = {
  dictionary: { ko: '사전형', en: 'Dictionary' },
  present_polite: { ko: '현재 해요체', en: 'Present Polite' },
  past_polite: { ko: '과거 해요체', en: 'Past Polite' },
  future_polite: { ko: '미래 해요체', en: 'Future Polite' },
  present_formal: { ko: '현재 합쇼체', en: 'Present Formal' },
  past_formal: { ko: '과거 합쇼체', en: 'Past Formal' },
  future_formal: { ko: '미래 합쇼체', en: 'Future Formal' },
  present_casual: { ko: '현재 해체', en: 'Present Casual' },
  past_casual: { ko: '과거 해체', en: 'Past Casual' },
  future_casual: { ko: '미래 해체', en: 'Future Casual' },
  negative_polite: { ko: '부정 해요체', en: 'Negative Polite' },
  negative_formal: { ko: '부정 합쇼체', en: 'Negative Formal' },
  connective_and: { ko: '연결 (-고)', en: 'And (connective)' },
  connective_but: { ko: '연결 (-지만)', en: 'But (connective)' },
  connective_so: { ko: '연결 (-아/어서)', en: 'So/Because' },
  conditional: { ko: '조건 (-면)', en: 'Conditional (if)' },
  imperative_polite: { ko: '명령 해요체', en: 'Imperative Polite' },
  imperative_formal: { ko: '명령 합쇼체', en: 'Imperative Formal' },
  propositive_polite: { ko: '청유 해요체', en: 'Propositive Polite' },
  propositive_formal: { ko: '청유 합쇼체', en: "Propositive Formal" },
  present_honorific: { ko: '현재 높임말', en: 'Present Honorific' },
  past_honorific: { ko: '과거 높임말', en: 'Past Honorific' },
};

export const ALL_FORMS: ConjugationForm[] = Object.keys(FORM_LABELS) as ConjugationForm[];

export interface VerbExample {
  ko: string;
  en: string;
}

export interface VerbData {
  translation: string;
  regular: boolean;
  irregularType?: IrregularType;
  topik: TOPIKLevel;
  examples?: VerbExample[];
  overrides?: Partial<Record<ConjugationForm, string>>;
}

export interface ConjugationResult {
  form: ConjugationForm;
  labelKo: string;
  labelEn: string;
  value: string;
}

// Form groupings for display
export const FORM_GROUPS = [
  {
    title: 'Polite (해요체)',
    titleKo: '해요체',
    forms: ['dictionary', 'present_polite', 'past_polite', 'future_polite'] as ConjugationForm[],
  },
  {
    title: 'Formal (합쇼체)',
    titleKo: '합쇼체',
    forms: ['present_formal', 'past_formal', 'future_formal'] as ConjugationForm[],
  },
  {
    title: 'Casual (해체)',
    titleKo: '해체',
    forms: ['present_casual', 'past_casual', 'future_casual'] as ConjugationForm[],
  },
  {
    title: 'Negative',
    titleKo: '부정',
    forms: ['negative_polite', 'negative_formal'] as ConjugationForm[],
  },
  {
    title: 'Connective',
    titleKo: '연결',
    forms: ['connective_and', 'connective_but', 'connective_so'] as ConjugationForm[],
  },
  {
    title: 'Conditional / Imperative / Propositive',
    titleKo: '조건·명령·청유',
    forms: ['conditional', 'imperative_polite', 'imperative_formal', 'propositive_polite', 'propositive_formal'] as ConjugationForm[],
  },
  {
    title: 'Honorific',
    titleKo: '높임말',
    forms: ['present_honorific', 'past_honorific'] as ConjugationForm[],
  },
];

// ──────────────────────── Helpers ────────────────────────

/** Get 아/어 vowel harmony suffix. Returns '아' for bright vowels, '어' for dark. */
function getHarmony(stemWithoutFinal: string): string {
  // Check the last vowel in the stem
  for (let i = stemWithoutFinal.length - 1; i >= 0; i--) {
    const ch = stemWithoutFinal[i];
    if (isHangul(ch)) {
      return isBrightVowel(stemWithoutFinal.slice(0, i + 1)) ? '아' : '어';
    }
  }
  return '어';
}

/**
 * Core function: attach 아/어 to the stem, handling vowel contraction.
 * This is the most complex part of Korean conjugation.
 */
function attachAEo(stem: string, verbData: VerbData): string {
  if (stem.length === 0) return stem;

  const lastChar = stem[stem.length - 1];
  if (!isHangul(lastChar)) return stem;

  const jamo = decompose(lastChar);
  const vowel = MEDIALS[jamo.medial];
  const hasFinal = jamo.final !== 0;
  const finalCh = FINALS[jamo.final];

  // Handle irregular types
  if (!verbData.regular && verbData.irregularType) {
    switch (verbData.irregularType) {
      case 'ㅂ': {
        // ㅂ irregular: final ㅂ → 오/우 + 아/어 (e.g., 돕다 → 도와, 춥다 → 추워)
        if (hasFinal && finalCh === 'ㅂ') {
          const stemNoFinal = removeFinal(stem);
          const stemVowel = getMedialVowel(stemNoFinal);
          if (stemVowel === 'ㅗ') {
            // 돕다 → 도와 (stem + 와 as separate syllable)
            return stemNoFinal + '와';
          } else {
            // 춥다 → 추워
            return stemNoFinal + '워';
          }
        }
        break;
      }
      case 'ㄷ': {
        // ㄷ irregular: final ㄷ → ㄹ before vowel (e.g., 듣다 → 들어)
        if (hasFinal && finalCh === 'ㄷ') {
          const newStem = replaceFinal(stem, 'ㄹ');
          return attachAEoRegular(newStem);
        }
        break;
      }
      case 'ㅅ': {
        // ㅅ irregular: final ㅅ drops before vowel (e.g., 짓다 → 지어)
        // No vowel contraction — always add 어/아 as separate syllable
        if (hasFinal && finalCh === 'ㅅ') {
          const stemNoFinal = removeFinal(stem);
          const bright = isBrightVowel(stemNoFinal);
          return stemNoFinal + (bright ? '아' : '어');
        }
        break;
      }
      case 'ㅎ': {
        // ㅎ irregular: final ㅎ drops and vowel contracts (e.g., 좋다 → 좋아 is regular, but 그렇다 → 그래)
        if (hasFinal && finalCh === 'ㅎ') {
          const stemNoFinal = removeFinal(stem);
          const stemVowel = getMedialVowel(stemNoFinal);
          if (stemVowel === 'ㅏ') {
            return stemNoFinal; // 하얗다 → 하얘 (already correct via contraction)
          }
          // ㅓ + ㅎ → ㅐ (e.g., 그렇다 → 그래)
          const lastJ = decompose(stemNoFinal[stemNoFinal.length - 1]);
          return stemNoFinal.slice(0, -1) + compose(lastJ.initial, MEDIALS.indexOf('ㅐ'), 0);
        }
        break;
      }
      case '르': {
        // 르 irregular: 르 → ㄹ라/ㄹ러 (e.g., 모르다 → 몰라, 빠르다 → 빨라)
        if (stem.length >= 2 && lastChar === '르') {
          // Actually the stem is everything before 르 + ㄹ final + 라/러
          // But 르 is a full syllable, so stem ends in X르 where X is the preceding syllable
          const prevPart = stem.slice(0, -1); // everything before 르
          if (prevPart.length > 0) {
            const prevChar = prevPart[prevPart.length - 1];
            if (isHangul(prevChar)) {
              // Add ㄹ final to previous syllable
              const prevJ = decompose(prevChar);
              const withFinal = compose(prevJ.initial, prevJ.medial, FINALS.indexOf('ㄹ'));
              const bright = isBrightVowel(prevPart);
              return prevPart.slice(0, -1) + withFinal + (bright ? '라' : '러');
            }
          }
        }
        break;
      }
      case '으': {
        // 으 irregular: 으 drops (e.g., 쓰다 → 써, 크다 → 커)
        if (!hasFinal && vowel === 'ㅡ') {
          // Check the vowel before ㅡ for harmony
          if (stem.length >= 2) {
            const prevPart = stem.slice(0, -1);
            const bright = isBrightVowel(prevPart);
            return prevPart + (bright ? '아' : '어');
          }
          // Single syllable with ㅡ: just use 어 (e.g., 쓰다 → 써)
          return stem.slice(0, -1) + compose(jamo.initial, MEDIALS.indexOf('ㅓ'), 0);
        }
        break;
      }
      case '러': {
        // 러 irregular: stem + 러 (e.g., 이르다(arrive) → 이르러)
        return stem + '러';
      }
      case 'ㄹ': {
        // ㄹ irregular: ㄹ is kept (regular pattern, just flagged for other forms)
        // For 아/어 attachment, behaves regularly
        return attachAEoRegular(stem);
      }
    }
  }

  return attachAEoRegular(stem);
}

/** Regular 아/어 attachment with vowel contraction */
function attachAEoRegular(stem: string): string {
  if (stem.length === 0) return stem;

  const lastChar = stem[stem.length - 1];
  if (!isHangul(lastChar)) return stem;

  const jamo = decompose(lastChar);
  const vowel = MEDIALS[jamo.medial];
  const hasFinal = jamo.final !== 0;

  // If the stem ends in a consonant, just add 아/어
  if (hasFinal) {
    const bright = isBrightVowel(stem);
    return stem + (bright ? '아' : '어');
  }

  // Vowel contraction rules (no final consonant)
  switch (vowel) {
    case 'ㅏ':
      // ㅏ + 아 → ㅏ (가다 → 가)
      return stem;
    case 'ㅗ':
      // ㅗ + 아 → ㅘ (오다 → 와)
      return stem.slice(0, -1) + compose(jamo.initial, MEDIALS.indexOf('ㅘ'), 0);
    case 'ㅜ':
      // ㅜ + 어 → ㅝ (배우다 → 배워)
      return stem.slice(0, -1) + compose(jamo.initial, MEDIALS.indexOf('ㅝ'), 0);
    case 'ㅡ':
      // ㅡ + 어 → ㅓ (쓰다 → 써 — but this is for regular)
      return stem.slice(0, -1) + compose(jamo.initial, MEDIALS.indexOf('ㅓ'), 0);
    case 'ㅣ':
      // ㅣ + 어 → ㅕ (마시다 → 마셔)
      return stem.slice(0, -1) + compose(jamo.initial, MEDIALS.indexOf('ㅕ'), 0);
    case 'ㅐ':
    case 'ㅔ':
      // Already has the right vowel, no change needed
      return stem;
    case 'ㅓ':
      // ㅓ + 어 → ㅓ (서다 → 서)
      return stem;
    default:
      // Default: just append
      return stem + (isBrightVowel(stem) ? '아' : '어');
  }
}

/** Check if 하다 verb */
function isHadaVerb(verb: string): boolean {
  return verb.endsWith('하다');
}

/** Check if 되다 verb */
function isDoedaVerb(verb: string): boolean {
  return verb.endsWith('되다');
}

// ──────────────────────── Main Conjugation ────────────────────────

export function conjugateVerb(verb: string, verbData: VerbData, form: ConjugationForm): string {
  // Check overrides first
  if (verbData.overrides && verbData.overrides[form]) {
    return verbData.overrides[form]!;
  }

  if (form === 'dictionary') return verb;

  const stem = getStem(verb);
  const lastChar = stem[stem.length - 1];
  const hasFinal = isHangul(lastChar) && hasFinalConsonant(stem);
  const finalCh = getFinalConsonant(stem);

  // Special handling for 하다 verbs
  if (isHadaVerb(verb)) {
    return conjugateHada(stem, verbData, form);
  }

  // Special handling for 이다 (to be)
  if (verb === '이다') {
    return conjugateIda(form);
  }

  // Special handling for 아니다 (to not be)
  if (verb === '아니다') {
    return conjugateAnida(form);
  }

  // Handle ㄹ irregular: ㄹ drops before ㄴ, ㅂ, ㅅ
  const isLIrregular = !verbData.regular && verbData.irregularType === 'ㄹ';
  const stemForNBS = (isLIrregular || (hasFinal && finalCh === 'ㄹ')) ? removeFinal(stem) : stem;

  switch (form) {
    // ── Polite (해요체) ──
    case 'present_polite': {
      return attachAEo(stem, verbData) + '요';
    }
    case 'past_polite': {
      return attachAEo(stem, verbData) + 'ㅆ어요';
      // Actually need to add ㅆ as final to the result, then 어요
    }
    case 'future_polite': {
      // -(으)ㄹ 거예요
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '을 거예요';
      }
      return stemForNBS + 'ㄹ 거예요';
      // Need to add ㄹ as final consonant
    }

    // ── Formal (합쇼체) ──
    case 'present_formal': {
      // -ㅂ니다 / -습니다
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '습니다';
      }
      return stemForNBS + 'ㅂ니다';
    }
    case 'past_formal': {
      return attachAEo(stem, verbData) + 'ㅆ습니다';
    }
    case 'future_formal': {
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '을 겁니다';
      }
      return stemForNBS + 'ㄹ 겁니다';
    }

    // ── Casual (해체) ──
    case 'present_casual': {
      return attachAEo(stem, verbData);
    }
    case 'past_casual': {
      return attachAEo(stem, verbData) + 'ㅆ어';
    }
    case 'future_casual': {
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '을 거야';
      }
      return stemForNBS + 'ㄹ 거야';
    }

    // ── Negative ──
    case 'negative_polite': {
      // 안 + verb (present polite) OR stem + 지 않아요
      return stem + '지 않아요';
    }
    case 'negative_formal': {
      return stem + '지 않습니다';
    }

    // ── Connective ──
    case 'connective_and': {
      return stem + '고';
    }
    case 'connective_but': {
      return stem + '지만';
    }
    case 'connective_so': {
      return attachAEo(stem, verbData) + '서';
    }

    // ── Conditional ──
    case 'conditional': {
      // ㄹ final: just add 면 (ㄹ stays), no final: add 면, other final: add 으면
      if (hasFinal && finalCh === 'ㄹ') {
        return stem + '면';
      }
      if (hasFinal) {
        return stem + '으면';
      }
      return stem + '면';
    }

    // ── Imperative ──
    case 'imperative_polite': {
      // Same as present polite for most verbs
      return attachAEo(stem, verbData) + '요';
    }
    case 'imperative_formal': {
      // -(으)십시오
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '으십시오';
      }
      return stemForNBS + '십시오';
    }

    // ── Propositive ──
    case 'propositive_polite': {
      return attachAEo(stem, verbData) + '요';
    }
    case 'propositive_formal': {
      // -(으)ㅂ시다
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '읍시다';
      }
      return stemForNBS + 'ㅂ시다';
    }

    // ── Honorific ──
    case 'present_honorific': {
      // -(으)세요
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '으세요';
      }
      return stemForNBS + '세요';
    }
    case 'past_honorific': {
      if (hasFinal && finalCh !== 'ㄹ') {
        return stem + '으셨어요';
      }
      return stemForNBS + '셨어요';
    }

    default:
      return verb;
  }
}

/** Post-process: properly attach jamo that are shown as separate chars */
function postProcess(result: string): string {
  let processed = result;

  // Handle ㅆ어요, ㅆ습니다, ㅆ어 — the ㅆ should be final consonant of previous syllable
  processed = processed.replace(/([가-힣])ㅆ/g, (_, prev) => {
    if (isHangul(prev)) {
      const j = decompose(prev);
      if (j.final === 0) {
        return compose(j.initial, j.medial, FINALS.indexOf('ㅆ'));
      }
    }
    return prev + 'ㅆ';
  });

  // Handle ㄹ 거예요, ㄹ 거야, ㄹ 겁니다 — ㄹ should be final consonant
  processed = processed.replace(/([가-힣])ㄹ /g, (_, prev) => {
    if (isHangul(prev)) {
      const j = decompose(prev);
      if (j.final === 0) {
        return compose(j.initial, j.medial, FINALS.indexOf('ㄹ')) + ' ';
      }
    }
    return prev + 'ㄹ ';
  });

  // Handle ㅂ니다 — ㅂ should be final consonant of previous syllable
  processed = processed.replace(/([가-힣])ㅂ니다/g, (_, prev) => {
    if (isHangul(prev)) {
      const j = decompose(prev);
      if (j.final === 0) {
        return compose(j.initial, j.medial, FINALS.indexOf('ㅂ')) + '니다';
      }
    }
    return prev + 'ㅂ니다';
  });

  // Handle ㅂ시다 — ㅂ should be final consonant
  processed = processed.replace(/([가-힣])ㅂ시다/g, (_, prev) => {
    if (isHangul(prev)) {
      const j = decompose(prev);
      if (j.final === 0) {
        return compose(j.initial, j.medial, FINALS.indexOf('ㅂ')) + '시다';
      }
    }
    return prev + 'ㅂ시다';
  });

  return processed;
}

/** 하다 verb conjugation */
function conjugateHada(stem: string, verbData: VerbData, form: ConjugationForm): string {
  const prefix = stem.slice(0, -1); // remove 하

  switch (form) {
    case 'present_polite': return prefix + '해요';
    case 'past_polite': return prefix + '했어요';
    case 'future_polite': return prefix + '할 거예요';
    case 'present_formal': return prefix + '합니다';
    case 'past_formal': return prefix + '했습니다';
    case 'future_formal': return prefix + '할 겁니다';
    case 'present_casual': return prefix + '해';
    case 'past_casual': return prefix + '했어';
    case 'future_casual': return prefix + '할 거야';
    case 'negative_polite': return stem + '지 않아요';
    case 'negative_formal': return stem + '지 않습니다';
    case 'connective_and': return stem + '고';
    case 'connective_but': return stem + '지만';
    case 'connective_so': return prefix + '해서';
    case 'conditional': return stem + '면';
    case 'imperative_polite': return prefix + '해요';
    case 'imperative_formal': return prefix + '하십시오';
    case 'propositive_polite': return prefix + '해요';
    case 'propositive_formal': return prefix + '합시다';
    case 'present_honorific': return prefix + '하세요';
    case 'past_honorific': return prefix + '하셨어요';
    default: return stem + '다';
  }
}

/** 이다 (to be) conjugation */
function conjugateIda(form: ConjugationForm): string {
  switch (form) {
    case 'dictionary': return '이다';
    case 'present_polite': return '이에요';
    case 'past_polite': return '이었어요';
    case 'future_polite': return '일 거예요';
    case 'present_formal': return '입니다';
    case 'past_formal': return '이었습니다';
    case 'future_formal': return '일 겁니다';
    case 'present_casual': return '이야';
    case 'past_casual': return '이었어';
    case 'future_casual': return '일 거야';
    case 'negative_polite': return '아니에요';
    case 'negative_formal': return '아닙니다';
    case 'connective_and': return '이고';
    case 'connective_but': return '이지만';
    case 'connective_so': return '이어서';
    case 'conditional': return '이면';
    case 'imperative_polite': return '이에요';
    case 'imperative_formal': return '이십시오';
    case 'propositive_polite': return '이에요';
    case 'propositive_formal': return '입시다';
    case 'present_honorific': return '이세요';
    case 'past_honorific': return '이셨어요';
    default: return '이다';
  }
}

/** 아니다 (to not be) conjugation */
function conjugateAnida(form: ConjugationForm): string {
  switch (form) {
    case 'dictionary': return '아니다';
    case 'present_polite': return '아니에요';
    case 'past_polite': return '아니었어요';
    case 'future_polite': return '아닐 거예요';
    case 'present_formal': return '아닙니다';
    case 'past_formal': return '아니었습니다';
    case 'future_formal': return '아닐 겁니다';
    case 'present_casual': return '아니야';
    case 'past_casual': return '아니었어';
    case 'future_casual': return '아닐 거야';
    case 'negative_polite': return '아니지 않아요';
    case 'negative_formal': return '아니지 않습니다';
    case 'connective_and': return '아니고';
    case 'connective_but': return '아니지만';
    case 'connective_so': return '아니어서';
    case 'conditional': return '아니면';
    case 'imperative_polite': return '아니에요';
    case 'imperative_formal': return '아니십시오';
    case 'propositive_polite': return '아니에요';
    case 'propositive_formal': return '아닙시다';
    case 'present_honorific': return '아니세요';
    case 'past_honorific': return '아니셨어요';
    default: return '아니다';
  }
}

// ──────────────────────── Public API ────────────────────────

export function conjugateReading(verb: string, verbData: VerbData, form: ConjugationForm): string {
  const raw = conjugateVerb(verb, verbData, form);
  return postProcess(raw);
}

export function conjugate(verb: string, verbData: VerbData, form: ConjugationForm): ConjugationResult {
  const value = conjugateReading(verb, verbData, form);
  const labels = FORM_LABELS[form];

  return {
    form,
    labelKo: labels.ko,
    labelEn: labels.en,
    value,
  };
}

export function conjugateAll(verb: string, verbData: VerbData): ConjugationResult[] {
  return ALL_FORMS.map((form) => conjugate(verb, verbData, form));
}

// ──────────────────────── Conjugation Search Index ────────────────────────

export interface ConjugationIndexEntry {
  verb: string;
  form: ConjugationForm;
  conjugated: string;
  translation: string;
}

let _conjugationIndex: ConjugationIndexEntry[] | null = null;

/** Lazily build an index of all conjugated forms for reverse lookup */
export function getConjugationIndex(verbsData: Record<string, VerbData>): ConjugationIndexEntry[] {
  if (_conjugationIndex) return _conjugationIndex;

  const quizForms: ConjugationForm[] = [
    'present_polite', 'past_polite', 'future_polite',
    'present_formal', 'past_formal',
    'present_casual', 'past_casual',
    'negative_polite', 'connective_and', 'connective_so',
    'conditional', 'present_honorific',
  ];

  const entries: ConjugationIndexEntry[] = [];
  for (const [verb, data] of Object.entries(verbsData)) {
    for (const form of quizForms) {
      const conjugated = conjugateReading(verb, data, form);
      entries.push({ verb, form, conjugated, translation: data.translation });
    }
  }

  _conjugationIndex = entries;
  return entries;
}
