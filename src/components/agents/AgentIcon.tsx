type Props = {
  slug: string;
  size?: number;
};

export function hasAgentIcon(slug: string): boolean {
  return slug === "content-writer" || slug === "competitor-monitor" || slug === "news-digest-bot";
}

export function AgentIcon({ slug, size = 16 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    style: { display: "block" } as const,
  };

  if (slug === "content-writer") {
    return (
      <svg {...common}>
        <path
          d="M5 6 H27 V22 H11 L6 27 V22 H5 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line x1="9" y1="11" x2="22" y2="11" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="15" x2="22" y2="15" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="19" x2="17" y2="19" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="23" cy="6" r="3" fill="var(--hr-teal, #22d3ee)" />
      </svg>
    );
  }

  if (slug === "competitor-monitor") {
    return (
      <svg {...common}>
        <rect x="6" y="8" width="16" height="11" rx="1.5" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.8" />
        <rect x="3" y="13" width="22" height="14" rx="1.8" stroke="currentColor" strokeWidth="2" />
        <circle cx="6.5" cy="16.5" r="1" fill="var(--hr-teal, #22d3ee)" />
      </svg>
    );
  }

  if (slug === "news-digest-bot") {
    return (
      <svg {...common}>
        <circle cx="16" cy="9" r="4" fill="var(--hr-teal, #22d3ee)" />
        <line x1="6" y1="18" x2="26" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="6" y1="23" x2="26" y2="23" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="28" x2="20" y2="28" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}
