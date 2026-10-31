// CBAM regulatory milestones, shared by the ESG timeline and the roadmap Gantt. law = in force; otherwise a proposal.
export const CBAM_EVENTS: { when: string; year: number; t: string; law: boolean }[] = [
  { when: "Oct 2023", year: 2023, t: "Transitional phase: reporting only", law: true },
  { when: "Jan 2026", year: 2026, t: "Definitive regime: certificates payable; defaults +10%", law: true },
  { when: "Feb 2027", year: 2027, t: "Certificate sales open; weekly prices; defaults +20%", law: true },
  { when: "Sep 2027", year: 2027, t: "First annual declaration (2026 imports) due", law: true },
  { when: "2028", year: 2028, t: "Default mark-up reaches 30%", law: true },
  { when: "2028", year: 2028, t: "Downstream extension to ~180+ steel and aluminium goods", law: false },
  { when: "2028", year: 2028, t: "COM(2026) 616: 15% of phased-out free allocation returned", law: false },
  { when: "2030", year: 2030, t: "Free allocation 77.5% → 51.5%: the cash cliff", law: true },
  { when: "2034", year: 2034, t: "Free allocation reaches 0%", law: true },
  { when: "2038", year: 2038, t: "End of phase-out under the proposal", law: false },
];
