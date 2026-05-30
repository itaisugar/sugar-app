-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — 5 high-signal podcast episodes from 2025
-- Editorial summaries match the long-form voice of the existing seed.
-- Idempotent: re-running will not duplicate (matched by exact title).
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.content_items (
  title, hook, summary, source, source_avatar,
  category, category_color, read_time, podcast_duration,
  image_url, content_url,
  content_source, content_type, tags
)
select * from (values

-- 1 — Lex Fridman × Dylan Patel & Nathan Lambert ────────────────────────────
(
  'DeepSeek and the New Geometry of Frontier AI — Dylan Patel and Nathan Lambert with Lex Fridman',
  'When DeepSeek''s R1 reasoning model matched Western frontier labs at a fraction of the training cost, the assumption that scaling alone determined the AI frontier started to crack. Dylan Patel of SemiAnalysis and Nathan Lambert of the Allen Institute spend five hours unpacking what actually changed.',
  'Lex Fridman''s February 2025 conversation with Dylan Patel and Nathan Lambert became the most-listened episode of his year, and not by accident. The two guests are among the few people who can read both the hardware and the algorithmic sides of the frontier-AI race in detail, and the release of DeepSeek''s R1 reasoning model gave them a concrete event to argue from.

The technical core of the conversation is the cost story. By the guests'' best reconstruction, DeepSeek trained a reasoning model competitive with OpenAI''s o1 at roughly $5 million in compute — orders of magnitude below the widely cited frontier-lab numbers. The episode dissects why: an open-weights chain-of-thought reasoning recipe, aggressive use of mixture-of-experts architecture, and an export-controlled but still capable H800 fleet that the Chinese team appears to have run unusually efficiently.

The geopolitical thread is the second half. Patel walks through what export controls have and have not constrained, how Huawei''s Ascend chips fit into China''s ambitions, and why the gap between training and inference economics matters for who can deploy models at scale. Lambert pushes back on the more triumphalist readings: the cost advantage may not extend to the next generation, the open-weights race is itself a strategic choice, and "frontier" remains a moving target.

For listeners new to the topic, the episode is one of the cleanest single-shot introductions to how compute, capital, and algorithms now interact at the cutting edge — a five-hour briefing in lieu of a quarter of reading.',
  'Lex Fridman Podcast', '◆',
  'AI', '#1E40AF', 300, 18000,
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
  'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL',
  'featured', 'podcast',
  array['AI', 'DeepSeek', 'Geopolitics', 'Semiconductors', 'Reasoning']::text[]
),

-- 2 — Huberman Lab × Andy Galpin ────────────────────────────────────────────
(
  'The Six-Part Galpin Series — A Working Manual for Strength, Endurance, and Recovery',
  'Andrew Huberman''s six-part series with the exercise physiologist Andy Galpin is the most thorough public treatment of human performance training to appear in podcast form. Across roughly twenty hours, the pair build a complete protocol for strength, endurance, hypertrophy, fuelling, and recovery.',
  'The Huberman–Galpin series — re-released and expanded through 2025 — has become a quiet reference document for serious athletes, coaches, and physicians. Galpin, a tenured exercise physiologist with a research focus on muscle and metabolism, is unusual among podcast guests in that he is willing to give specific protocols and back them up with the experimental literature in real time.

The structure builds from the bottom up. Episode one and two cover assessment — how to measure aerobic capacity, ventilatory thresholds, and movement quality before prescribing anything. The middle episodes treat the major training modalities individually: maximal strength, hypertrophy, endurance, and the often-neglected category of speed and power. The final episodes turn to fuelling and recovery, with extended sections on hydration, sleep, and the specific recovery interventions that the evidence actually supports.

The intellectual posture is the part worth attending to. Galpin is unusually careful about the difference between recommendation and bet. When the literature is strong he says so; when a protocol is a reasoned guess from physiology he says that too. The series is therefore less a list of rules than a working model of how an evidence-literate trainer thinks about prescribing exercise.

For listeners, the practical pay-off is that almost any reasonable fitness goal — Zone 2 base-building, a strength block, a marathon plan, body composition recomposition — can be designed by following the series and filling in the blanks. Few twenty-hour commitments in modern podcasting offer a higher density of usable, evidence-anchored material.',
  'Huberman Lab', '◉',
  'Performance', '#B91C1C', 240, 14400,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=80',
  'https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P',
  'featured', 'podcast',
  array['Exercise Science', 'Performance', 'Recovery', 'Endurance', 'Strength']::text[]
),

-- 3 — Dwarkesh × Frontier-AI Researcher Interviews ──────────────────────────
(
  'Dwarkesh''s Year of Frontier-AI Conversations — From Zuckerberg to Anthropic to Mechanistic Interpretability',
  'Dwarkesh Patel''s 2025 catalogue is the closest thing the AI field has to an oral history of its own present moment — long, prepared, technical conversations with the researchers and executives who are actually shaping the trajectory.',
  'Dwarkesh Patel reached escape velocity in 2025. His interview format — three to five hours, intensely prepared, often quoting back published work the guest themselves had forgotten — became the canonical long-form treatment of what frontier AI researchers actually believe. The 2025 catalogue includes conversations with Mark Zuckerberg on Meta''s open-weights strategy, multiple Anthropic researchers on mechanistic interpretability, the Google DeepMind team on protein-folding and Gemini, and Tony Blair on what AI does to statecraft.

The methodological signature is preparation. Patel publishes lengthy briefing notes, runs Claude as a real-time research assistant during recording, and reads adjacent literature deliberately enough that guests treat the conversation as peer dialogue rather than promotion. That investment shows up as substantive exchanges on topics — RLHF failure modes, scaling-law extrapolations, the politics of model evaluation — that most interviewers cannot host.

What the catalogue captures, viewed together, is a field still arguing with itself in public. There is no consensus on what frontier models actually understand, on how soon meaningful agents will arrive, on whether open weights help or hurt safety. Patel''s value is in surfacing those disagreements with named guests on the record — a record that is increasingly cited within the labs themselves.

For a listener trying to understand modern AI as a working community rather than a marketing claim, a month of Dwarkesh episodes is, in 2025, probably the single highest-bandwidth way in.',
  'Dwarkesh Podcast', '◇',
  'AI', '#1E40AF', 180, 10800,
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80',
  'https://open.spotify.com/show/4JH4tybY1zX6e5hjCwU6gF',
  'featured', 'podcast',
  array['AI', 'Interpretability', 'Interview', 'Tech', 'Long-form']::text[]
),

-- 4 — The Drive × Peter Attia ────────────────────────────────────────────────
(
  'The Attia Drive in 2025 — The Editorial Standard for Longevity Medicine',
  'Peter Attia''s podcast has matured into the working reference for clinicians and serious patients in the longevity space. The 2025 episodes — on Apo-B, GLP-1s, dementia prevention, and the cardiovascular evidence base — set a standard most health journalism cannot meet.',
  'The Drive, in its 2025 form, no longer reads as a single podcast so much as a serialised post-graduate course in preventive medicine. Peter Attia''s interviews — Apo-B with Allan Sniderman, the GLP-1 era with Tom Dayspring, sleep architecture with Matthew Walker, dementia risk with Tara Spires-Jones — are dense, citation-heavy, and unusually willing to disagree with consensus when the data warrant it.

The intellectual signature is the willingness to revise. Attia''s positions on hormone replacement, on statins, on protein intake have all moved during the run of the show, in each case in response to a specific paper or guest argument. That public updating is part of what makes the podcast a credible reference: listeners watch the framework refactor in real time rather than being handed a fixed manual.

The 2025 episodes that drew the largest audiences leaned into cardiovascular prevention and the new metabolic medicines. Sniderman on Apo-B is the closest thing the show has to a defining lecture; Dayspring''s breakdowns of the GLP-1 trials translate clinical-trial nuance into prescribing practice; multiple episodes interrogate the obesity-versus-glycemic-control framing of the same drugs and what it implies for non-diabetic use.

For a reader who wants to take their own longevity decisions seriously without becoming their own physician, no other 2025 podcast offers a denser combination of mechanistic clarity, citation discipline, and willingness to revise.',
  'The Drive — Peter Attia', '◈',
  'Longevity', '#059669', 150, 9000,
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80',
  'https://open.spotify.com/show/1Hu8klOvfX18p49uZj8s2J',
  'featured', 'podcast',
  array['Longevity', 'Cardiovascular', 'GLP-1', 'Medicine', 'Prevention']::text[]
),

-- 5 — Acquired × TSMC and the Chip War ───────────────────────────────────────
(
  'Acquired''s TSMC Deep-Dive — Four Hours on the Single Most Important Company in the World',
  'Ben Gilbert and David Rosenthal spend nearly four hours unpacking how a Taiwanese fabrication monopoly came to produce 92% of the world''s advanced chips — and what would happen to the global economy if the line in Hsinchu were interrupted.',
  'Acquired''s 2025 episode on Taiwan Semiconductor Manufacturing Company is the show at its strongest: a multi-decade business history that doubles as the most accessible primer to the geopolitical chokepoint of the modern economy. Across nearly four hours, Gilbert and Rosenthal trace the company from Morris Chang''s founding bet on pure-play foundry economics in 1987 to its present position as the indispensable supplier of every Nvidia, Apple, and Qualcomm chip at the leading edge.

The business story is told through three distinct waves. The first is the foundry model itself — Chang''s insight that fabrication and design would specialise apart, and his patient construction of the customer relationships and process discipline that made TSMC the supplier of choice. The second is the leading-edge race: how TSMC overtook Intel and Samsung at the bleeding edge of EUV lithography, and what that overtaking required culturally and operationally. The third is the geopolitical present: 92% of advanced-node production concentrated on a contested island, the CHIPS Act response, and the long manufacturing tail that even an aggressive Arizona buildout cannot replicate quickly.

What lifts the episode above standard business storytelling is the operational granularity. The hosts spend serious time on yield management, the engineering culture that grinds out the seven-sigma defect rates the leading edge requires, and the customer relationships that lock in capacity years in advance. Listeners come away with a working model of why TSMC is so hard to replicate even when the world has every incentive to try.

For anyone trying to make sense of the chip-war headlines, the Apple supply chain, or the Nvidia trade, four hours with Acquired is probably the highest-bandwidth education available without a Bloomberg subscription.',
  'Acquired', '◎',
  'Business', '#7C3AED', 240, 14400,
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
  'https://open.spotify.com/show/7Fj0XEuUQLUqoMZQdsLXqg',
  'featured', 'podcast',
  array['Semiconductors', 'TSMC', 'Business History', 'Geopolitics', 'Strategy']::text[]
)

) as v(title, hook, summary, source, source_avatar, category, category_color,
       read_time, podcast_duration, image_url, content_url,
       content_source, content_type, tags)
where not exists (
  select 1 from public.content_items existing where existing.title = v.title
);
