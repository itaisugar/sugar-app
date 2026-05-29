-- ─────────────────────────────────────────────────────────────────────────────
-- Sapience — 20 most-read science articles & research papers of 2025
-- Sources: Science (Breakthrough of the Year), NEJM (Altmetric Top), Scientific
-- American (Transformational Health), Royal Society (Popular Papers).
-- Idempotent: re-running will not duplicate (matched by exact title).
-- Run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.content_items (
  title, hook, summary, source, source_avatar,
  category, category_color, read_time,
  image_url, content_url,
  content_source, content_type, tags
)
select * from (values

-- 1 ─────────────────────────────────────────────────────────────────────────
(
  'Renewables Cross the Coal Threshold — Science Names the Energy Transition 2025 Breakthrough of the Year',
  'For the first time, global electricity from wind, solar, and storage outproduced coal — a structural shift the editors of Science argued is now too entrenched to reverse. China alone manufactures 80% of the world''s solar cells, 70% of its wind turbines, and 70% of the lithium cells that knit them into a grid.',
  'Science magazine chose the surge of renewable energy as its 2025 Breakthrough of the Year, breaking a long tradition of naming a single laboratory result. The editors argued that the transition has crossed an industrial inflection point: wind, solar, and battery storage produced more electricity worldwide than coal for the first calendar year on record, and the cost curves now favor renewables even without subsidy in most major markets.

The decisive variable, the magazine wrote, is Chinese manufacturing scale. China produces roughly 80% of the world''s solar cells, 70% of its wind turbines, and 70% of the lithium battery cells that make intermittent generation usable. That concentration has driven module prices down nearly tenfold over fifteen years and turned what was once a climate ambition into the cheapest marginal electron in most grids.

The piece is careful about what the transition does not yet solve. Heavy industry, aviation, and shipping still run on fossil molecules. Grid storage at continental scale remains an engineering challenge. And the geopolitics of concentrating critical-mineral supply chains in one country are unresolved. But the editors argued the direction is no longer in genuine doubt: the question is the pace, not the destination.

For readers, the implication is that 2025 may be remembered less for any single discovery than for the year a century-old energy architecture began to be visibly replaced.',
  'Science', '◆',
  'Science', '#0E7490', 7,
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80',
  'https://www.science.org/content/article/breakthrough-2025',
  'featured', 'research',
  array['Energy', 'Climate', 'Renewables', 'China', 'Industrial Policy']::text[]
),

-- 2 ─────────────────────────────────────────────────────────────────────────
(
  'A Bespoke Gene-Edit, Designed in Six Months, Saves an Infant with a One-in-a-Million Disease',
  'A team led by Kiran Musunuru and Rebecca Ahrens-Nicklas designed, manufactured, and infused a personalised base-editing therapy into a newborn with CPS1 deficiency in under six months. The infant tolerated the treatment without significant adverse events — the first time a custom-built genetic medicine has been used in a single patient.',
  'Reported in The New England Journal of Medicine, the case marks a turning point for what regulators have begun calling "n-of-1" genetic medicine. The patient, born with a near-fatal CPS1 deficiency that prevents the liver from clearing ammonia, received a base-editing therapy designed expressly for his mutation and manufactured on a timeline that would have been unthinkable a decade ago.

The technical achievement is the speed. Identifying the mutation, designing a guide RNA, validating it in cell and animal models, manufacturing clinical-grade lipid nanoparticles, and securing FDA authorization compressed into roughly six months — a workflow that the authors argue is now reproducible. Base editing, which rewrites a single DNA letter without breaking the double helix, made the precision possible.

The post-treatment data, while preliminary, are striking. The infant tolerated the infusion without significant adverse events, ammonia levels stabilised, and protein tolerance improved enough to ease the brutal dietary restrictions families with CPS1 deficiency normally face. Long-term safety remains the open question, particularly off-target edits in non-hepatic tissues.

The broader implication is that the economics of rare-disease therapy may be inverting. If a custom edit can be produced in months rather than years, the case for treating ultra-rare conditions individually — rather than waiting for cohorts large enough to justify a commercial program — becomes far stronger.',
  'New England Journal of Medicine', '◇',
  'Health', '#059669', 8,
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2504747',
  'featured', 'research',
  array['Gene Editing', 'CRISPR', 'Rare Disease', 'Pediatrics', 'Base Editing']::text[]
),

-- 3 ─────────────────────────────────────────────────────────────────────────
(
  'Tirzepatide Beats Semaglutide Head-to-Head — A Resolution in the GLP-1 Era',
  'In the first randomised, blinded comparison of the two dominant obesity drugs, tirzepatide produced 20.2% body-weight loss against semaglutide''s 13.7% over 72 weeks. The trial, published in NEJM, ends a long-running debate over which agent leads the GLP-1 class.',
  'The SURMOUNT-5 trial, published in The New England Journal of Medicine and led by Louis Aronne''s group, randomised 751 adults with obesity to maximally tolerated doses of tirzepatide or semaglutide and followed them for 72 weeks. The headline result — 20.2% mean weight loss for tirzepatide versus 13.7% for semaglutide — was statistically and clinically decisive.

The mechanistic difference matters. Semaglutide is a GLP-1 receptor agonist; tirzepatide is a dual agonist of both GLP-1 and GIP receptors, and the additional incretin pathway appears to translate into a roughly 47% greater effect on body weight at matched titration. Waist circumference, lipid panels, and blood pressure all moved further on tirzepatide as well.

Tolerability was the trial''s second message. Gastrointestinal side effects — nausea, vomiting, diarrhoea — were the most common reasons for discontinuation in both arms, but rates were broadly similar. The dual-agonist mechanism did not appear to introduce a new safety signal beyond what was already known for either drug.

For clinicians, the trial converts a years-long inference into evidence. For patients and payers, it sharpens questions about access, manufacturing supply, and the affordability of treating obesity as the chronic, drug-responsive disease it has now decisively become.',
  'New England Journal of Medicine', '◇',
  'Health', '#059669', 7,
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2416394',
  'featured', 'research',
  array['Obesity', 'GLP-1', 'Tirzepatide', 'Clinical Trial', 'Metabolism']::text[]
),

-- 4 ─────────────────────────────────────────────────────────────────────────
(
  'Exercise as Adjuvant Therapy: A Three-Year Programme Cuts Colon-Cancer Recurrence',
  'The CHALLENGE trial randomised colon-cancer patients to a structured three-year exercise programme or standard health advice after adjuvant chemotherapy. The exercise arm showed a 28% reduction in disease recurrence and a 37% lower risk of death — effects large enough to rival many oncology drugs.',
  'The CHALLENGE trial, led by Kerry Courneya and published in The New England Journal of Medicine, is one of the largest randomised tests of exercise as a cancer therapy ever run. Nearly 900 patients with stage II or III colon cancer who had completed adjuvant chemotherapy were randomised either to a three-year supervised exercise programme or to standard written health-promotion advice.

The disease-free survival benefit was substantial: a hazard ratio of 0.72 for recurrence and 0.63 for death over a median follow-up of nearly eight years. In absolute terms, the five-year disease-free survival rate was about 80% in the exercise arm versus 74% in controls. Effects of that magnitude are typical of effective adjuvant chemotherapy regimens — not lifestyle interventions.

The mechanism remains under investigation. Hypotheses include improved insulin sensitivity, lowered systemic inflammation, immune modulation, and altered tumour microenvironment. The trial was not designed to adjudicate among them, but the consistency of the effect across subgroups suggests the benefit is not driven by a single pathway.

The practical implication is that supervised exercise — the kind that requires real coaching, not a pamphlet — should arguably be reimbursed as oncology care. Whether health systems treat it as such is the open political question the trial now puts on the table.',
  'New England Journal of Medicine', '◇',
  'Health', '#059669', 7,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2502760',
  'featured', 'research',
  array['Oncology', 'Exercise', 'Cancer', 'Clinical Trial', 'Survivorship']::text[]
),

-- 5 ─────────────────────────────────────────────────────────────────────────
(
  'The Vera C. Rubin Observatory Opens Its Eyes — and Begins a Decade-Long Survey of the Sky',
  'The 8.4-metre Rubin Observatory on Cerro Pachón released its first scientific images in 2025, beginning the Legacy Survey of Space and Time. Over ten years it will photograph the entire southern sky every few nights and produce the largest astronomical catalogue ever assembled — billions of objects, captured tens of trillions of times.',
  'After two decades of construction, the Vera C. Rubin Observatory in Chile released its first scientific images in 2025, marking the start of the Legacy Survey of Space and Time (LSST). The instrument — an 8.4-metre wide-field telescope feeding the largest digital camera ever built — is designed to photograph the entire visible sky every three to four nights for ten years.

The scale of the data product is the story. LSST will detect tens of billions of galaxies, hundreds of millions of stars, and millions of supernovae and solar-system objects. Each will be captured tens of trillions of times over the survey, producing roughly twenty terabytes of raw imagery per night and a catalogue that will rewrite how astronomy treats time-domain phenomena.

Three scientific programmes drive the design. The first is dark energy: by mapping how galaxies cluster across cosmic time, Rubin will tighten constraints on the equation of state that governs the universe''s acceleration. The second is dark matter, probed through weak gravitational lensing of distant galaxies. The third is solar-system census, including the near-Earth asteroids regulators want better catalogued.

What distinguishes Rubin from any prior survey is the cadence. Anything that changes — supernovae igniting, asteroids drifting, stellar flares, tidal disruptions by black holes — will be detected within hours and broadcast as alerts to a global network. For the first time, the night sky becomes a live data stream rather than an archive.',
  'Vera C. Rubin Observatory', '◉',
  'Science', '#0E7490', 8,
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80',
  'https://www.science.org/content/article/giant-all-seeing-telescope-set-revolutionize-astronomy',
  'featured', 'research',
  array['Astronomy', 'Dark Matter', 'Dark Energy', 'LSST', 'Survey']::text[]
),

-- 6 ─────────────────────────────────────────────────────────────────────────
(
  'The Face of a Denisovan: DNA from the "Dragon Man" Skull Identifies a Mysterious Cousin',
  'A nearly complete archaic-human skull found in Harbin, China — dubbed "Dragon Man" — has yielded the first proteomic and mitochondrial DNA confirmation that it belonged to a Denisovan. After fifteen years of knowing the Denisovans only from a fingertip bone and a jaw fragment, science finally has their face.',
  'When a labourer pulled an extraordinary archaic-human skull from the bed of the Songhua River near Harbin in 1933 and hid it down a well, no one suspected the cranium would eventually settle one of palaeoanthropology''s most stubborn puzzles. In 2025, two papers published in Science used proteomics and mitochondrial DNA recovered from the skull''s dental calculus to confirm what many had suspected: "Dragon Man" was a Denisovan.

The result matters because, for fifteen years, the Denisovans had been a species defined almost entirely by genetics. The original 2010 discovery was a single fingertip bone from a Siberian cave; later finds added a jaw fragment and a few teeth. Researchers could read the Denisovan genome and infer the species'' influence on living human populations — high-altitude adaptation in Tibetans, immune variants in Oceanians — without knowing what Denisovans looked like.

The Harbin cranium answers the morphology question. It is large, robust, with a broad face, heavy brow, and enormous orbits, distinct from both Neanderthals and modern Homo sapiens. The skull''s estimated age of at least 146,000 years places it within the Denisovan range, and the molecular evidence settles the assignment.

The deeper implication is biogeographic. Denisovans are now confirmed to have lived as far east as northeast China, consistent with the genetic ghost they left in modern East Asian and Papuan genomes. The hunt for further specimens — and for the still-unknown relationship between Denisovans and other archaic East Asian fossils — has just become considerably more concrete.',
  'Science', '◈',
  'History', '#A16207', 8,
  'https://images.unsplash.com/photo-1564540583246-934409427776?w=1200&q=80',
  'https://www.science.org/content/article/dragon-man-skull-belongs-mysterious-human-relative',
  'featured', 'research',
  array['Paleoanthropology', 'Denisovan', 'Human Evolution', 'Ancient DNA', 'China']::text[]
),

-- 7 ─────────────────────────────────────────────────────────────────────────
(
  'The Muon''s Magnetism Lines Up After All: Fermilab''s Final Result Closes a Decade-Long Mystery',
  'Fermilab''s Muon g-2 collaboration released its final measurement of the muon''s anomalous magnetic moment with unprecedented precision. After years of apparent disagreement with theory, improved lattice-QCD calculations now match the experiment — collapsing one of the most-watched cracks in the Standard Model.',
  'For nearly two decades, the muon''s anomalous magnetic moment — a number quantifying how the particle wobbles in a magnetic field — was the most-watched anomaly in particle physics. Early measurements at Brookhaven, refined by Fermilab''s Muon g-2 experiment, sat several standard deviations above the value predicted by the Standard Model. Many physicists hoped the gap was a window onto new physics.

The final Fermilab result, released in 2025 with twenty-fold higher precision than the original Brookhaven number, sharpened the experimental side of the equation. But the larger development came from theory: a new generation of lattice-QCD calculations, validated across independent groups, raised the predicted Standard-Model value to a number now consistent with experiment.

The convergence is, in one sense, an anti-climax. The hoped-for crack in the Standard Model has narrowed — perhaps closed — and with it one of the most concrete near-term hints of physics beyond the model. In another sense, it is one of the cleanest stories of how high-precision science actually works: experiment and theory pushed independently to ever-higher accuracy, and the truth slowly emerged from the noise on both sides.

The story leaves the muon g-2 community in a strange position. The measurement is now arguably the most precisely tested prediction in physics. Where new physics will next emerge — whether at the LHC, in dark-matter detectors, or in some yet-unbuilt experiment — is the question the closure of this anomaly leaves open.',
  'Science', '◆',
  'Science', '#0E7490', 9,
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80',
  'https://www.science.org/content/article/cloak-and-dagger-tale-behind-year-s-most-anticipated-result-particle-physics',
  'curated', 'research',
  array['Physics', 'Particle Physics', 'Standard Model', 'Muon', 'Fermilab']::text[]
),

-- 8 ─────────────────────────────────────────────────────────────────────────
(
  'A Genetically Engineered Pig Kidney Functions in a Human Body for Nine Months',
  'A patient at NYU Langone received a pig kidney engineered with ten gene edits and lived with it for roughly nine months — the longest survival of any cross-species transplant. The case has converted xenotransplantation from a decades-long aspiration into a credible answer to the organ-shortage crisis.',
  'In 2025, surgeons at NYU Langone reported that a recipient of a genetically engineered pig kidney had lived with the organ functioning for roughly nine months — far longer than any previous xenotransplant. The kidney carried ten genetic modifications: knockouts of the three pig genes most responsible for hyperacute rejection, and insertions of six human transgenes designed to make the organ tolerable to a human immune system.

The clinical course was not without setbacks. Episodes of rejection required adjustments to immunosuppression, and the eventual decision to remove the organ followed a deterioration in function rather than a sudden failure. But for most of the nine months the kidney did what a kidney is supposed to do, in a human patient with no other realistic option.

The implication for transplant medicine is substantial. More than 100,000 patients are waiting for a kidney in the United States alone; thousands die on the list each year. If xenotransplants can reach durable function with manageable immunosuppression, the organ-shortage crisis becomes solvable in principle for the first time since dialysis was invented.

The remaining obstacles are immunological and infectious. Long-term endogenous retrovirus surveillance, the chronic rejection pathways unique to xeno tissue, and the scaling of clean-pig facilities will all need to be solved before xenotransplantation becomes routine. The nine-month result does not finish that work — but it ends the era in which the field could be dismissed as unrealistic.',
  'Science', '◈',
  'Health', '#059669', 8,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80',
  'https://www.science.org/content/article/can-gene-edited-pigs-solve-organ-transplant-shortage',
  'featured', 'research',
  array['Xenotransplant', 'Organ Transplant', 'Gene Editing', 'Nephrology']::text[]
),

-- 9 ─────────────────────────────────────────────────────────────────────────
(
  'A Single Gene Variant Protects Rice Yields Through Heat Waves',
  'Chinese geneticists identified a natural variant of the rice gene QT12 that preserves grain filling under the heat extremes increasingly common during the growing season. Field trials showed roughly 20% higher yields under heat stress without trade-offs in normal conditions.',
  'A team at the Chinese Academy of Sciences reported in 2025 the identification of QT12, a previously uncharacterised rice gene whose variant alleles dramatically alter heat tolerance during grain filling. The finding addresses a problem that has begun to bite hard in tropical and subtropical agriculture: even modest heat spikes during the reproductive window can collapse yields in varieties bred for productivity rather than resilience.

The mechanism appears to involve transcriptional regulation of starch synthesis under thermal stress, although the team is candid that the full pathway is not yet mapped. What is mapped is the field-trial result: under realistic heat-wave conditions, lines carrying the protective allele produced roughly 20% more grain than near-isogenic controls, with no apparent yield penalty in cooler seasons.

The agricultural implication is unusually direct. Because the variant is natural — not engineered — it can be introgressed into commercial cultivars through conventional breeding, avoiding the regulatory complexity that has slowed transgenic approaches in many rice-producing economies. Several breeding programmes are already incorporating the allele into elite lines.

The deeper story is that climate adaptation in staple crops is becoming a tractable molecular problem. As surveys of wild and traditional rice varieties find more heat- and drought-resilience alleles, the lag between identification and field deployment is collapsing. Whether breeding can keep ahead of the warming curve remains the question on which a meaningful share of global food security now hinges.',
  'Science', '◆',
  'Science', '#0E7490', 7,
  'https://images.unsplash.com/photo-1568347877321-f8935c7dc5a3?w=1200&q=80',
  'https://www.science.org/content/article/major-breakthrough-natural-gene-variant-protects-rice-heat-waves',
  'curated', 'research',
  array['Agriculture', 'Climate', 'Genetics', 'Food Security', 'Rice']::text[]
),

-- 10 ────────────────────────────────────────────────────────────────────────
(
  'Two New Antibiotics for Gonorrhoea — the First Mechanistic Class in Six Decades',
  'After more than half a century without a novel oral antibiotic for the disease, two new drugs — gepotidacin and zoliflodacin — moved through regulatory approval in 2025. Both target bacterial topoisomerases in a way drug-resistant N. gonorrhoeae has not yet learned to evade.',
  'Drug-resistant gonorrhoea has been on the World Health Organization''s priority pathogen list for years, and the clinical pipeline against it has been close to empty since the 1960s. Two new antibiotics — gepotidacin from GSK and zoliflodacin developed by the Global Antibiotic Research and Development Partnership — broke that drought in 2025 by clearing late-stage trials and securing regulatory approval as oral, single-dose therapies.

Both drugs target bacterial type II topoisomerases — the enzymes that manage DNA supercoiling during replication — but at a binding site distinct from the fluoroquinolone pocket that resistance has overrun. Cross-resistance to existing classes is, so far, undetectable, and the mutational paths to escape appear to require multiple coordinated changes rather than a single point mutation.

Phase-three results were straightforward: cure rates above 95% in uncomplicated gonococcal infections, with side-effect profiles comparable to existing therapies. Zoliflodacin in particular has been positioned as a treatment for use in low- and middle-income countries where resistance is most advanced and ceftriaxone supplies most fragile.

The strategic question is how the new agents are stewarded. Gonorrhoea has historically chewed through antibiotic classes within a decade or two of widespread use. The hope among public-health authorities is that disciplined deployment — combined with point-of-care diagnostics that match drug to strain — can stretch the useful life of these two drugs further than any of their predecessors.',
  'Science', '◇',
  'Health', '#059669', 6,
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
  'https://www.science.org/content/article/new-antibiotic-gonorrhea-could-help-beat-back-drug-resistant-infections',
  'curated', 'research',
  array['Antibiotics', 'Public Health', 'Drug Resistance', 'Infectious Disease']::text[]
),

-- 11 ────────────────────────────────────────────────────────────────────────
(
  'Nerve Cells Hand Over Mitochondria to Cancer Cells — A Newly Discovered Mechanism of Metastasis',
  'Researchers reported in 2025 that peripheral nerves can physically transfer mitochondria into tumour cells, supercharging their metabolism and dramatically increasing the probability of metastatic spread. The finding suggests a new therapeutic target for some of the deadliest cancers.',
  'In a result that reframes the cellular biology of metastasis, a 2025 study reported that nerve cells in the tumour microenvironment can transfer functional mitochondria — the cell''s energy-producing organelles — directly into cancer cells. The donated mitochondria are then used by the tumour cells to power the metabolic demands of invasion and distant colonisation.

The work, replicated across multiple cancer models, showed that the mitochondrial transfer occurs through thin membrane bridges called tunnelling nanotubes. Cancer cells that received donor mitochondria were measurably more aggressive, more energetically active, and more likely to form distant metastases in mouse models than otherwise identical cells without the transfer.

The therapeutic implication is the headline. Cancer metastasis kills roughly nine out of ten patients who die of solid tumours, and few drugs target the metastatic process directly. If the nerve-to-tumour mitochondrial pathway can be interrupted — by blocking nanotube formation, by inhibiting the transfer enzymes, or by denervating tumour beds — a previously unexploited intervention point opens up.

The result also revives an older idea that tumour neurobiology matters. Pancreatic cancer, prostate cancer, and certain breast cancers are all notable for dense neural infiltration. That association, long observed but mechanistically unexplained, now has a candidate cellular basis — and a potential explanation for why nerves are sometimes a tumour''s most useful neighbour.',
  'Science', '◉',
  'Science', '#0E7490', 7,
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&q=80',
  'https://www.science.org/content/article/tumors-may-get-supercharged-acquiring-powerhouses-nerve-cells',
  'curated', 'research',
  array['Cancer', 'Metastasis', 'Mitochondria', 'Neuroscience', 'Cell Biology']::text[]
),

-- 12 ────────────────────────────────────────────────────────────────────────
(
  'The Shingles Vaccine May Reduce Dementia Risk — A Natural Experiment in Wales',
  'A clever natural experiment in Wales tracked adults whose eligibility for the shingles vaccine was determined by birth date and found that those who received it were 20% less likely to develop dementia over seven years. The result is the most rigorous causal evidence yet linking a viral exposure to Alzheimer''s.',
  'A 2025 study published in Nature exploited a quirk of Welsh vaccination policy to do something rare in dementia research: a near-randomised test of whether the shingles vaccine reduces the risk of Alzheimer''s. Because eligibility for the live zoster vaccine was assigned by a sharp birth-date cutoff, adults born one week apart were either offered the shot or not, on the basis of nothing related to their underlying dementia risk.

The result was striking. Over seven years of follow-up, vaccinated adults were roughly 20% less likely to develop dementia than the unvaccinated controls. The effect was larger in women than in men. Crucially, the birth-date design eliminates the usual selection bias that has plagued observational vaccine–dementia studies: the vaccinated and unvaccinated populations are essentially indistinguishable in baseline health behaviours.

The mechanism is unsettled but plausible. Reactivation of latent varicella-zoster virus has been linked to vascular and neuroinflammatory damage in the central nervous system, and other herpesviruses have long been suspected of contributing to Alzheimer''s pathology. The vaccine, by suppressing reactivation, may simply remove a chronic insult that the brain accumulates over decades.

The clinical implication is provocative. If even a fraction of the effect is real, the shingles vaccine becomes one of the most cost-effective dementia interventions available — not because it treats Alzheimer''s, but because it may prevent a contributing cause. Several follow-up studies are now under way to test the result in other countries with different vaccine schedules.',
  'Scientific American', '◆',
  'Health', '#059669', 7,
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  'https://www.scientificamerican.com/article/shingles-vaccination-may-help-protect-people-from-alzheimers-disease/',
  'curated', 'article',
  array['Alzheimer''s', 'Dementia', 'Vaccines', 'Public Health', 'Neuroscience']::text[]
),

-- 13 ────────────────────────────────────────────────────────────────────────
(
  'The Moment of Implantation, Filmed in 3D for the First Time',
  'A team in Barcelona built an artificial uterine environment that lets a human embryo implant under real-time 3D microscopy. The resulting videos — capturing the choreography of attachment, invasion, and vascular contact — show a process that has resisted direct observation for the entire history of embryology.',
  'Reported in Science Advances in 2025, the work from the Barcelona Institute for Science and Technology produced something obstetricians and developmental biologists had wanted for a century: a direct, real-time, three-dimensional view of a human embryo implanting into uterine tissue. The team built a hydrogel-based artificial endometrium that recapitulates the mechanical and biochemical environment of the real uterus closely enough that embryos engage with it as they would in vivo.

The resulting microscopy reveals a process more violent than textbook drawings suggested. The trophoblast — the outer layer of the embryo — applies measurable mechanical force to invade the endometrium, drawing tissue inward and remodelling it within hours. Cellular interactions visible in the videos are difficult to study any other way and were largely absent from existing models.

The clinical motivation is implantation failure, the silent reason behind roughly half of all unsuccessful IVF cycles. Embryologists can grade an embryo and inspect a uterine lining, but the actual contact event — and why it succeeds or fails — has been a black box. The new platform gives, for the first time, a way to test how drugs, hormonal environments, or genetic variants alter the implantation process itself.

The broader implication is that early human development is becoming progressively more observable. Combined with synthetic embryo models, organoid systems, and in-vivo imaging in primate analogues, the field is closing in on a complete portrait of the first weeks of life — a window that has been almost entirely opaque to research until now.',
  'Scientific American', '◇',
  'Health', '#059669', 7,
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80',
  'https://www.scientificamerican.com/article/human-embryo-implantation-revealed-in-first-ever-3d-images/',
  'curated', 'article',
  array['Embryology', 'IVF', 'Reproductive Medicine', 'Imaging', 'Developmental Biology']::text[]
),

-- 14 ────────────────────────────────────────────────────────────────────────
(
  'A Non-Hormonal Male Contraceptive Pill Clears Its First Human Safety Trial',
  'YCT-529, a small molecule that blocks the binding of a vitamin-A metabolite to a testicular receptor required for sperm production, passed its phase-one trial without significant adverse effects. It is the first credible non-hormonal candidate for a daily oral male contraceptive.',
  'For the entire history of pharmaceutical contraception, the burden has fallen on women. A 2025 phase-one trial of YCT-529 — a small-molecule, non-hormonal male contraceptive developed at the University of Minnesota and licensed to YourChoice Therapeutics — is the most credible attempt yet to change that. The drug cleared its initial safety threshold in human volunteers.

YCT-529 works by inhibiting the retinoic-acid receptor alpha (RAR-α) in the testes. The receptor binds a metabolite of vitamin A that is required for the development of mature sperm; blocking it suppresses spermatogenesis without altering testosterone, libido, or other endocrine variables. Animal studies showed reversible contraception within weeks of dosing and rapid restoration of fertility after stopping.

The phase-one trial dosed sixteen male volunteers across escalating dose levels and found no significant adverse events, no hormonal disruption, and pharmacokinetics compatible with a once-daily oral pill. The trial was not powered to test efficacy — that is the work of phase two — but it cleared the safety bar that has historically tripped male-contraceptive candidates.

The social experiment, if YCT-529 reaches market, will be as interesting as the biology. Surveys consistently find majorities of men in many countries willing in principle to use such a drug; the question is whether stated preferences survive a daily routine and whether female partners trust them to. Pharmaceutical contraception has been a single-sex technology for sixty-five years; that may finally be ending.',
  'Scientific American', '◈',
  'Health', '#059669', 6,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
  'https://www.scientificamerican.com/article/male-birth-control-pill-yct-529-passes-human-safety-test/',
  'curated', 'article',
  array['Contraception', 'Pharmacology', 'Clinical Trial', 'Reproductive Health']::text[]
),

-- 15 ────────────────────────────────────────────────────────────────────────
(
  'Coffee Cultivates a Specific Bacterium in the Human Gut',
  'A large microbiome study found that regular coffee drinkers harbour substantially elevated levels of a single species — Lawsonibacter asaccharolyticus — and that the association is robust across populations and dietary patterns. The bacterium ferments fibre into butyrate, a short-chain fatty acid increasingly linked to metabolic and immune health.',
  'A 2025 multi-cohort microbiome study published in Nature Microbiology found that of the thousands of bacterial species detectable in the human gut, one — Lawsonibacter asaccharolyticus — tracks remarkably closely with coffee consumption. Across nearly 23,000 stool samples from twenty-five countries, regular coffee drinkers showed levels of L. asaccharolyticus roughly 4 to 8 times higher than non-drinkers, with the effect surviving adjustment for age, diet, and geography.

The dose-response curve was clean. The relationship held for caffeinated and decaffeinated coffee equally, suggesting that the active ingredient is something in the bean rather than caffeine itself. Chlorogenic acids, polyphenols, and trigonelline are all candidate substrates that L. asaccharolyticus appears especially well equipped to metabolise.

The reason this matters is what the bacterium produces. L. asaccharolyticus ferments dietary fibre into butyrate, a short-chain fatty acid that strengthens the gut barrier, modulates inflammation, and feeds colonic epithelial cells. Higher butyrate is associated in observational data with lower rates of colorectal cancer, type 2 diabetes, and inflammatory bowel disease — though causality remains hard to pin down.

The broader pattern the study reinforces is that diet shapes the microbiome with surprising specificity. Rather than nebulous "fibre intake" effects, individual foods appear to cultivate identifiable species. Coffee is now one of the cleanest examples — and the bacterium it cultivates is a plausible candidate to mediate some of the disease-protective effects the epidemiology has long associated with the drink.',
  'Scientific American', '◎',
  'Health', '#059669', 6,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  'https://www.scientificamerican.com/article/coffee-boosts-beneficial-gut-bacterium/',
  'curated', 'article',
  array['Microbiome', 'Coffee', 'Gut Health', 'Nutrition', 'Butyrate']::text[]
),

-- 16 ────────────────────────────────────────────────────────────────────────
(
  'Vitamin D Lengthens Telomeres — and the Question of Biological Age Gets Sharper',
  'A sub-study of the large VITAL randomised trial found that daily vitamin-D supplementation slowed the shortening of telomeres — the protective DNA caps on chromosomes — by an amount equivalent to roughly three years of cellular ageing over four years of treatment.',
  'The VITAL trial, originally launched to test vitamin D and omega-3 supplementation against cardiovascular disease and cancer, produced in 2025 a striking secondary result: in the vitamin-D arm, the rate of telomere shortening in white blood cells was meaningfully slower than in the placebo arm. Over four years of treatment, the difference corresponded to roughly three years of preserved cellular age.

Telomeres are the repetitive DNA caps at the ends of chromosomes that shorten with each cell division and with cumulative oxidative stress. They are an imperfect but real proxy for biological ageing — short telomeres are associated with higher mortality, cardiovascular events, and certain cancers in large epidemiological cohorts. The VITAL result is the strongest randomised evidence to date that an intervention can measurably slow that clock.

The size of the effect should be read with care. Telomere length is one biomarker of ageing among many, and the trial did not show parallel reductions in hard clinical endpoints — vitamin D''s effects on heart disease and cancer remained modest in the main VITAL analysis. Whether preserved telomere length translates into longer healthy life is a question telomere biologists have argued about for decades.

What the result does crystallise is that supplementation studies should increasingly be designed to interrogate biological-age biomarkers, not just disease endpoints. Vitamin D, omega-3, and a small set of other interventions now have signals on the ageing axis that are worth testing in dedicated, mechanism-driven trials — rather than as side notes in disease-prevention work.',
  'Scientific American', '◇',
  'Longevity', '#059669', 6,
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
  'https://www.scientificamerican.com/article/three-anti-inflammatory-supplements-can-really-fight-disease-according-to/',
  'curated', 'article',
  array['Vitamin D', 'Telomeres', 'Aging', 'Supplements', 'Biomarkers']::text[]
),

-- 17 ────────────────────────────────────────────────────────────────────────
(
  'Sharks Are Not Silent: A First Recording of Active Sound Production',
  'A study in Royal Society Open Science documented New Zealand''s rig sharks producing deliberate, repetitive clicks by snapping their teeth — the first evidence of active sound production in any shark species. The discovery rewrites a century-old assumption about a famously quiet group of predators.',
  'For more than a century, sharks were classified among the few major vertebrate groups thought to be acoustically silent — possessing the hearing apparatus to detect sound but no documented capacity to produce it. A 2025 paper in Royal Society Open Science overturned that assumption with audio recordings of New Zealand''s rig sharks (Mustelus lenticulatus) producing short, repetitive clicks by snapping their flat-plated teeth together.

The acoustic signature was distinctive. The clicks averaged around 9 kilohertz, lasted milliseconds each, and were produced in patterns correlated with the shark''s behaviour during experimental handling. The team ruled out incidental jaw movements and muscular noise as the source, and verified the tooth-snap origin with high-speed video.

What the clicks are for is unsettled. They occur during stress in the experimental setup, raising the possibility that they are a defensive or startle response — but the researchers caution that field observations of free-swimming sharks producing the same sounds in social or predatory contexts will be needed before any functional interpretation is secure.

The broader implication is methodological. The acoustic search of marine biology has historically focused on cetaceans and bony fish; sharks were classified as silent partly because no one was listening in the right frequency band, with the right hydrophones, at the right moment. If rig sharks click, other species almost certainly do too — and a quiet group of animals may turn out to have been talking all along.',
  'Royal Society Open Science', '◉',
  'Science', '#0E7490', 5,
  'https://images.unsplash.com/photo-1564550974352-92c9351fd6c2?w=1200&q=80',
  'https://royalsocietypublishing.org/doi/10.1098/rsos.242212',
  'curated', 'research',
  array['Marine Biology', 'Sharks', 'Bioacoustics', 'Animal Behaviour']::text[]
),

-- 18 ────────────────────────────────────────────────────────────────────────
(
  'Sydney Cockatoos Have Learned to Operate Public Drinking Fountains',
  'A long-running field study in Sydney documented sulphur-crested cockatoos using both beak and feet to turn handle-style public drinking fountains and drink from them — a complex, learned behaviour that is spreading socially across the urban population.',
  'Sydney''s sulphur-crested cockatoos are already famous for the bin-opening behaviour that spread, lid by lid, across the city''s suburbs in the late 2010s. A 2025 Biology Letters paper documents what may be the next chapter of urban-cockatoo culture: groups of birds learning to manipulate handle-style public drinking fountains, twisting the spring-loaded valve with a combination of beak and foot until water flows.

The behaviour is not trivial. The fountains require simultaneous force application and orientation — a problem most easily solved by either pulling the handle down with the beak while bracing with one foot, or by pushing down with both feet while gripping the spout. Camera-trap and observational data showed that individual birds appear to invent the solution and that nearby cockatoos then acquire it through social learning.

The geographic pattern matched the bin-opening case. Use of fountains clustered in specific suburbs, spreading outward in a slow wave consistent with imitation rather than independent invention. Cockatoos that watched a competent demonstrator solve the fountain rapidly figured it out themselves; those without such exposure tended not to.

The deeper point is that culturally transmitted innovation in non-human animals is not a rare anecdote — it is an ongoing, observable process, especially in urban environments where novel resources accumulate faster than evolution can shape instinct. Sydney''s cockatoos, in this telling, are doing in real time what archaeologists infer for early hominins: inventing tools, sharing them, and gradually rewriting how a population uses its environment.',
  'Royal Society', '◈',
  'Science', '#0E7490', 5,
  'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1200&q=80',
  'https://royalsocietypublishing.org/doi/10.1098/rsbl.2025.0010',
  'curated', 'research',
  array['Animal Cognition', 'Urban Wildlife', 'Cockatoos', 'Social Learning']::text[]
),

-- 19 ────────────────────────────────────────────────────────────────────────
(
  'The 2025 Nobel Prize: The Discovery of the Immune System''s Peacekeepers',
  'The 2025 Nobel Prize in Physiology or Medicine went to Mary Brunkow, Fred Ramsdell, and Shimon Sakaguchi for the discovery of regulatory T cells — the immune lineage that holds the rest of the immune system in check and keeps it from attacking the body it is meant to defend.',
  'The 2025 Nobel Prize in Physiology or Medicine recognised three scientists — Mary E. Brunkow, Fred Ramsdell, and Shimon Sakaguchi — for work that, across two decades, established a previously unsuspected layer of the immune system: regulatory T cells, or Tregs. Their discovery resolved one of immunology''s oldest puzzles: why the immune system, armed with weapons capable of destroying any tissue in the body, does not normally turn on its host.

Sakaguchi''s line of evidence came first. In the 1990s he showed that mice depleted of a specific CD4 T-cell subset developed devastating autoimmune disease, and that returning those cells restored peace. Brunkow and Ramsdell''s contribution, published in 2001, identified the FOXP3 gene as the master regulator of the lineage — and explained, in molecular terms, the rare and fatal IPEX syndrome in which children born with FOXP3 mutations are consumed by autoimmunity.

The clinical reach of the discovery is now extraordinary. Therapies that boost Treg activity are in trial for autoimmune diseases and organ-transplant tolerance. Therapies that suppress Tregs — many already approved — are central to modern cancer immunotherapy, where tumour-infiltrating Tregs blunt the immune response that drugs like checkpoint inhibitors are trying to unleash.

What the prize celebrates, beyond the science, is the long arc of fundamental immunology from the 1990s to today''s checkpoint-inhibitor and cell-therapy era. The Treg story is one of the cleanest cases in modern medicine of basic-research discoveries paying out, decades later, in some of the most important therapies clinicians now wield.',
  'Scientific American', '◆',
  'Science', '#0E7490', 7,
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
  'https://www.scientificamerican.com/article/2025-nobel-prize-in-physiology-or-medicine-awarded-for-discoveries-key-to/',
  'featured', 'research',
  array['Nobel Prize', 'Immunology', 'Regulatory T Cells', 'Autoimmunity', 'Cancer']::text[]
),

-- 20 ────────────────────────────────────────────────────────────────────────
(
  'Finerenone Plus Empagliflozin: A New Standard for Chronic Kidney Disease in Type 2 Diabetes',
  'The CONFIDENCE trial showed that combining finerenone and empagliflozin produced substantially larger reductions in albuminuria than either drug alone in patients with chronic kidney disease and type 2 diabetes — a foundation for redefining first-line therapy in one of the most common and dangerous comorbidities in medicine.',
  'The CONFIDENCE trial, led by Rajiv Agarwal and published in The New England Journal of Medicine, randomised patients with chronic kidney disease and type 2 diabetes to one of three arms: finerenone alone, empagliflozin alone, or both drugs together. The trial''s primary endpoint — the urinary albumin-to-creatinine ratio, the most validated surrogate for progression of diabetic kidney disease — fell substantially further on combination therapy.

The mechanistic rationale is that finerenone (a non-steroidal mineralocorticoid receptor antagonist) and empagliflozin (an SGLT2 inhibitor) act on independent pathways of renal and cardiovascular injury. Combining them, on biology alone, should compound their effects rather than overlap. CONFIDENCE provides the first head-to-head evidence that this is what actually happens in patients.

Safety was the second question. Both drug classes individually carry manageable but distinct adverse effects — hyperkalemia for finerenone, volume-status changes for SGLT2 inhibitors. The combination produced no signal of synergistic toxicity, with adverse-event rates close to additive rather than multiplicative, and no excess in the events nephrologists worried about most.

The clinical implication is that first-line care for diabetic kidney disease may be re-architected around layered, complementary therapies rather than sequential monotherapy. Given that diabetic kidney disease is one of the leading causes of dialysis in every developed health system, a measurable improvement in slowing its progression has enormous downstream economic and human consequences.',
  'New England Journal of Medicine', '◇',
  'Health', '#059669', 7,
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2410659',
  'curated', 'research',
  array['Nephrology', 'Diabetes', 'Cardiometabolic', 'Clinical Trial']::text[]
)

) as v(title, hook, summary, source, source_avatar, category, category_color, read_time,
       image_url, content_url, content_source, content_type, tags)
where not exists (
  select 1 from public.content_items existing where existing.title = v.title
);
