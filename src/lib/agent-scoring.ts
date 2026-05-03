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
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !RU_STOPWORDS.has(w) && !EN_STOPWORDS.has(w));
}

export function scoreAgent(agent: ScorableAgent, query: string): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;
  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return 0;

  const name = (agent.name || "").toLowerCase();
  const desc = (agent.description || "").toLowerCase();
  const cat = (agent.category || "").toLowerCase();
  const keywords = (agent.keywords || []).map((k) => k.toLowerCase());

  let score = 0;
  for (const t of tokens) {
    if (name.includes(t)) score += 4;
    if (cat.includes(t)) score += 2;
    if (desc.includes(t)) score += 1;
    for (const kw of keywords) {
      if (kw === t) score += 5;
      else if (kw.includes(t) || t.includes(kw)) score += 2;
    }
  }
  return score;
}
