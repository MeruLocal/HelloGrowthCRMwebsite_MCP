/** Phrases and patterns that must never reach an LLM-facing string. Test-only: this file is deliberately
 * not imported by any served code, so the banned strings are never sent to a model. */
export const BANNED_PHRASES = [
  {
    "phrase": "SOC 2 Type II certified",
    "rule": "CL-5"
  },
  {
    "phrase": "Unlimited users",
    "rule": "CL-11"
  },
  {
    "phrase": "SLA-backed 99.9% uptime / uptime guarantee",
    "rule": "CL-13"
  },
  {
    "phrase": "630 integrations (as working)",
    "rule": "CL-10/18"
  },
  {
    "phrase": "Rs 1,099",
    "rule": "canonical price sheet"
  },
  {
    "phrase": "$13 per user",
    "rule": "canonical price sheet"
  },
  {
    "phrase": "GST-inclusive INR price",
    "rule": "gstinPricing.ts"
  },
  {
    "phrase": "WhatsApp-first / WhatsApp-native CRM",
    "rule": "hellocrm CLAUDE.md 1.1"
  },
  {
    "phrase": "switches language mid-conversation",
    "rule": "founder guardrail 2026-07-02 (Q-L13)"
  },
  {
    "phrase": "X-regime compliant (GDPR, PIPEDA, PDPA, ...)",
    "rule": "CL-17"
  },
  {
    "phrase": "ISO 27001 certified",
    "rule": "CL-15"
  },
  {
    "phrase": "AI calling works out of the box",
    "rule": "operator guide, Loop 13"
  }
] as const;

export const BANNED_PATTERNS: { re: RegExp; note: string }[] = [
  { re: /SOC\s*2\s*Type\s*II[^"'`\n]{0,40}?(?:certif|attest)/i, note: "CL-5 certified/attested" },
  { re: /unlimited\s+users/i, note: "CL-11" },
  { re: /\b630\+?\s*(?:native\s+)?integrations/i, note: "CL-10/18" },
  { re: /1,?099/, note: "never present Rs 1,099" },
  { re: /\$\s?13\b/, note: "USD monthly is $12, never $13" },
  { re: /\b(?:150|200)\s*leads\b/i, note: "Free cap is pending a founder decision" },
  { re: /ISO\s*27001\s*certif/i, note: "CL-15" },
  { re: /whatsapp[- ](?:first|native)/i, note: "positioning: WhatsApp is one channel" },
  { re: /\bkill(?:ed|ing|s)?\b/i, note: "house rule: never use violent words" },
];
