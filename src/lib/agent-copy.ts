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
    .filter((feature): feature is string => typeof feature === "string" && feature.length > 0)
    .map(normalizeAgentFeatureLabel);
}
