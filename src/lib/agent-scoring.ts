// Lightweight client-side relevance scoring for the /agents splash.
// Server returns all published agents (currently dozens at most); we score
// here so we can rank by «боль клиента», not just SQL substring match.

export type ScorableAgent = {
  name: string;
  description?: string | null;
  category?: string | null;
  keywords?: string[] | null;
};

const RU_STOPWORDS = new Set([
  "и","в","во","не","что","он","на","я","с","со","как","а","то","все","она","так","его","но","да","ты","к","у","же","вы","за","бы","по","только","ее","мне","было","вот","от","меня","ещё","нет","о","из","ему","теперь","когда","даже","ну","вдруг","ли","если","уже","или","ни","быть","был","него","до","вас","нибудь","опять","уж","вам","ведь","там","потом","себя","ничего","ей","может","они","тут","где","есть","надо","ней","для","мы","тебя","их","чем","была","сам","чтоб","без","будто","чего","раз","тоже","себе","под","будет","ж","тогда","кто","этот","того","потому","этого","какой","совсем","ним","здесь","этом","один","почти","мой","тем","чтобы","нее","сейчас","были","куда","зачем","всех","никогда","можно","при","наконец","два","об","другой","хоть","после","над","больше","тот","через","эти","нас","про","всего","них","какая","много","разве","три","эту","моя","впрочем","хорошо","свою","этой","перед","иногда","лучше","чуть","том","нельзя","такой","им","более","всегда","конечно","всю","между",
]);

const EN_STOPWORDS = new Set([
  "the","a","an","and","or","but","if","of","at","by","for","with","about","to","in","on","is","are","was","were","be","been","do","does","did","my","your","you","we","us","our","i","me","this","that","these","those","it","its",
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !RU_STOPWORDS.has(w) && !EN_STOPWORDS.has(w));
}

// Грубый стем — режем русские/английские суффиксы. Достаточно для поиска
// типа «автоматизировать» ↔ «автоматизация», «отвечает» ↔ «отвечать».
function stem(word: string): string {
  let w = word;
  // длинные суффиксы первыми
  const tails = [
    "ировать", "ирующий", "ируется", "ируются",
    "ование", "ования", "ованию", "ованием", "овании",
    "ировал", "ировала", "ировали",
    "овать", "евать",
    "ается", "аются", "ался", "алась", "ались",
    "ует", "уют", "ует ся", "уются",
    "ение", "ения", "ению", "ением", "ении",
    "ться", "тся",
    "ство", "ства", "ству", "ством", "стве",
    "ость", "ости", "остью",
    "ская", "ский", "ское", "ские",
    "ный", "ная", "ное", "ные", "ным", "ной", "ную",
    "ыми", "ими", "ого", "его",
    "ать", "ять", "еть", "ить", "уть", "ыть",
    "ешь", "ете", "ишь", "ите",
    "ает", "ают", "яет", "яют",
    "тель", "теля", "телю",
    "ing", "ed", "es", "er", "ers", "ly",
    "ам", "ям", "ах", "ях", "ом", "ем", "ой", "ей",
    "ы", "и", "у", "ю", "а", "я", "е", "о", "ь",
    "s",
  ];
  for (const t of tails) {
    if (w.length - t.length >= 3 && w.endsWith(t)) {
      w = w.slice(0, -t.length);
      break;
    }
  }
  // финальный prefix-cap для надёжности
  return w.length > 6 ? w.slice(0, 6) : w;
}

function matches(word: string, token: string): "exact" | "stem" | "partial" | null {
  if (!word) return null;
  if (word === token) return "exact";
  const wStem = stem(word);
  const tStem = stem(token);
  if (wStem === tStem && wStem.length >= 3) return "stem";
  if (word.includes(token) || token.includes(word)) return "partial";
  return null;
}

export function scoreAgent(agent: ScorableAgent, query: string): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return 0;

  const nameWords = (agent.name || "").toLowerCase().replace(/ё/g, "е").split(/\s+/);
  const descWords = (agent.description || "").toLowerCase().replace(/ё/g, "е").split(/\s+/);
  const cat = (agent.category || "").toLowerCase().replace(/ё/g, "е");
  const keywords = (agent.keywords || []).map((k) => k.toLowerCase().replace(/ё/g, "е"));

  let score = 0;
  for (const t of tokens) {
    // name
    for (const w of nameWords) {
      const m = matches(w, t);
      if (m === "exact") score += 5;
      else if (m === "stem") score += 4;
      else if (m === "partial") score += 2;
    }
    // category
    if (cat) {
      const m = matches(cat, t);
      if (m === "exact") score += 3;
      else if (m === "stem") score += 2;
    }
    // description
    for (const w of descWords) {
      const m = matches(w, t);
      if (m === "exact") score += 2;
      else if (m === "stem") score += 1;
    }
    // keywords (главный сигнал)
    for (const kw of keywords) {
      const m = matches(kw, t);
      if (m === "exact") score += 6;
      else if (m === "stem") score += 5;
      else if (m === "partial") score += 2;
    }
  }
  return score;
}
