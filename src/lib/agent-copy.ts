const featureCopyRewrites: Array<[RegExp, string]> = [
  [/gpt-?\s*4\s*под\s*капотом/i, "Живые ответы по смыслу"],
  [/gpt-?\s*4/i, "Умные ответы без шаблонов"],
  [/gpt-?саммари\s*изменений/i, "Короткие понятные сводки"],
  [/tone of voice/i, "Пишет в вашем стиле"],
];

export function normalizeAgentFeatureLabel(feature: string) {
  for (const [pattern, replacement] of featureCopyRewrites) {
    if (pattern.test(feature)) {
      return replacement;
    }
  }

  return feature;
}

export function normalizeAgentFeatureList(features: unknown) {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((feature) => {
      if (typeof feature === "string") return feature;
      // Новый формат {title, desc}[] (миграция 2026-05-22_features_title_desc):
      // в карточке-превью показываем только title. Без этой ветки агенты на
      // новом формате теряли фичи на лендинге → карточки выходили разной высоты.
      if (feature && typeof feature === "object" && "title" in feature) {
        const title = (feature as { title?: unknown }).title;
        return typeof title === "string" ? title : "";
      }
      return "";
    })
    .filter((label): label is string => label.length > 0)
    .map(normalizeAgentFeatureLabel);
}
