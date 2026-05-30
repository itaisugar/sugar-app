export type DailyQuote = {
  text: string;
  author: string;
  source?: string;
};

const QUOTES: DailyQuote[] = [
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'The more I read, the more I acquire, the more certain I am that I know nothing.', author: 'Voltaire' },
  { text: 'Whereof one cannot speak, thereof one must be silent.', author: 'Ludwig Wittgenstein' },
  { text: 'A man who carries a cat by the tail learns something he can learn in no other way.', author: 'Mark Twain' },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
  { text: 'The function of education is to teach one to think intensively and to think critically.', author: 'Martin Luther King Jr.' },
  { text: 'Read the best books first, or you may not have a chance to read them at all.', author: 'Henry David Thoreau' },
  { text: 'The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.', author: 'Daniel J. Boorstin' },
  { text: 'I have no special talent. I am only passionately curious.', author: 'Albert Einstein' },
  { text: 'It is the mark of an educated mind to be able to entertain a thought without accepting it.', author: 'Aristotle' },
  { text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.', author: 'Richard Feynman' },
  { text: 'Reading furnishes the mind only with materials of knowledge; it is thinking that makes what we read ours.', author: 'John Locke' },
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R. R. Martin' },
  { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', author: 'Plutarch' },
  { text: 'Doubt is not a pleasant condition, but certainty is absurd.', author: 'Voltaire' },
  { text: "If you don't have time to read, you don't have the time (or the tools) to write.", author: 'Stephen King' },
  { text: 'No problem can be solved from the same level of consciousness that created it.', author: 'Albert Einstein' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'Beware the barrenness of a busy life.', author: 'Socrates' },
  { text: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
  { text: 'A library is not a luxury but one of the necessities of life.', author: 'Henry Ward Beecher' },
  { text: 'Thinking is the hardest work there is, which is probably the reason so few engage in it.', author: 'Henry Ford' },
  { text: 'Wonder is the beginning of wisdom.', author: 'Socrates' },
  { text: 'Knowledge is of no value unless you put it into practice.', author: 'Anton Chekhov' },
  { text: "We don't see things as they are, we see them as we are.", author: 'Anaïs Nin' },
  { text: 'Whoever wishes to foresee the future must consult the past.', author: 'Niccolò Machiavelli' },
  { text: 'The aim of art is to represent not the outward appearance of things, but their inward significance.', author: 'Aristotle' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'A mind that is stretched by a new experience can never go back to its old dimensions.', author: 'Oliver Wendell Holmes' },
];

export function getDailyQuote(date = new Date()): DailyQuote {
  // Days since 1970-01-01 (UTC) — stable across timezones for one calendar day
  const dayIndex = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  return QUOTES[dayIndex % QUOTES.length];
}
