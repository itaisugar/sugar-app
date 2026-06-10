// ─── Build flags ─────────────────────────────────────────────────────────────
// DEMO_MODE gates the seeded sample data (fabricated club member counts, activity
// percentages, "active now" pulses, sample achievements and mock discussion
// snippets). It MUST stay false for the real beta build so testers only ever see
// honest, real data. Flip to true only for screenshots / sales demos.
//
// The sample data itself is kept in constants/MockData.ts so a future Demo Mode
// can reuse it — we isolate it here rather than deleting it.
export const DEMO_MODE = false;
