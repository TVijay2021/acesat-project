/**
 * Hand-authored Reading and Writing items.
 *
 * Reading questions can't be generated from a template the way math can — the
 * judgement is the question. These are written by hand, with original passages
 * on public-domain subject matter (federal science reporting, general history,
 * original prose). No third-party text.
 *
 * Passage lengths and stem wording follow the format conventions of the
 * published SAT Suite: ~48 words for Words in Context, ~84 for Command of
 * Evidence, ~129 for Cross-Text Connections.
 *
 * `answer` is the 0-based index of the correct choice; the build script
 * converts it to a letter label.
 */

export const AUTHORED = [
  // ── Craft and Structure · Words in Context ───────────────────────────────
  {
    key: "wic-tidepool",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Easy",
    passage:
      "Marine ecologist Dana Oyola calls the tide pool a ______ laboratory: twice a day the water drains away, exposing every organism to heat, air, and predators, and twice a day it returns. Species that persist there must tolerate a range of conditions far wider than anything their offshore relatives encounter.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["sheltered", "punishing", "artificial", "vanishing"],
    answer: 1,
    explanation:
      "The passage defines the blank itself: heat, air, predators, and a range of conditions wider than relatives face. That is a punishing environment, not a sheltered one.",
  },
  {
    key: "wic-cartography",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Medium",
    passage:
      "Early modern mapmakers were rarely ______ about the gaps in their knowledge. Where surveys ran out, they drew coastlines with a confident line and filled the interior with mountains no traveller had reported, presenting conjecture in exactly the same ink as measurement.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["forthcoming", "mistaken", "enthusiastic", "systematic"],
    answer: 0,
    explanation:
      "They concealed the gaps by drawing conjecture as though it were measurement — that is a failure to be forthcoming, not a failure of accuracy or method.",
  },
  {
    key: "wic-birdsong",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Medium",
    passage:
      "The sparrow's song is not fixed at hatching but ______ over a first year of listening. A nestling raised in silence produces only a rough approximation of its species' song; one raised within earshot of adults reproduces the local dialect, down to its regional flourishes.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["deteriorates", "acquired", "assembled", "inherited"],
    answer: 2,
    explanation:
      "The contrast is between a rough approximation and a full local dialect built up by listening — the song is assembled over time. \"Inherited\" contradicts the passage, and the blank needs a present-tense verb.",
  },
  {
    key: "wic-restoration",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Hard",
    passage:
      "The conservator's decision to leave the crack visible was ______ rather than negligent. A seamless repair would have told viewers that the panel had survived four centuries untouched, a claim the object itself could not support.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["principled", "hesitant", "economical", "conventional"],
    answer: 0,
    explanation:
      "\"Rather than negligent\" signals the blank must name a deliberate reason, and the reason given is honesty about the object's history — a principled choice.",
  },
  {
    key: "wic-archive",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Easy",
    passage:
      "For decades the ledgers sat ______ in a courthouse basement, catalogued under a heading so vague that no researcher thought to request them. Their contents were never restricted; they were simply impossible to find.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["forbidden", "damaged", "unnoticed", "disputed"],
    answer: 2,
    explanation:
      "The last sentence rules out restriction, and nothing suggests damage or dispute. The problem was that no one knew they were there.",
  },
  {
    key: "wic-alloy",
    domain: "Craft and Structure",
    skill: "Words in Context",
    difficulty: "Medium",
    passage:
      "The alloy's usefulness is ______ its impurity. Pure copper bends under load, but copper mixed with a few percent of tin holds an edge, which is why the transition shows up in the archaeological record as a sudden abundance of tools rather than ornaments.",
    stem: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: ["unrelated to", "inseparable from", "diminished by", "mistaken for"],
    answer: 1,
    explanation:
      "The example shows the impurity is what creates the usefulness, so the two cannot be separated. \"Diminished by\" reverses the relationship.",
  },

  // ── Expression of Ideas · Transitions ────────────────────────────────────
  {
    key: "trans-permafrost",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "Medium",
    passage:
      "Thawing permafrost releases carbon that has been locked in frozen soil for millennia, which accelerates warming. That same thaw, ______ allows shrubs to colonise ground that was previously bare, and the shrubs draw carbon back out of the air.",
    stem: "Which choice completes the text with the most logical transition?",
    choices: ["however,", "therefore,", "likewise,", "in short,"],
    answer: 0,
    explanation:
      "The second sentence gives an opposing effect of the same process — carbon coming back out rather than going in. That is a contrast.",
  },
  {
    key: "trans-telescope",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "Easy",
    passage:
      "The observatory was built at high altitude to sit above the densest part of the atmosphere. Thin air scatters less light and holds less water vapour. ______ the site receives fewer than sixty clouded nights a year.",
    stem: "Which choice completes the text with the most logical transition?",
    choices: ["Nevertheless,", "In addition,", "For example,", "By contrast,"],
    answer: 1,
    explanation:
      "Cloud cover is a further advantage of the site, added to the two already given. Nothing is being contrasted or exemplified.",
  },
  {
    key: "trans-manuscript",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "Medium",
    passage:
      "Radiocarbon dating placed the manuscript's parchment in the eleventh century, and the script matched that period. The ink, ______ contained a pigment not manufactured until the fifteenth, suggesting the text was added to older material.",
    stem: "Which choice completes the text with the most logical transition?",
    choices: ["accordingly,", "similarly,", "however,", "indeed,"],
    answer: 2,
    explanation:
      "Two lines of evidence agree on the eleventh century; the ink disagrees. The transition has to carry that reversal.",
  },
  {
    key: "trans-fermentation",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "Easy",
    passage:
      "Sourdough cultures are mixtures of wild yeast and bacteria whose balance shifts with temperature. A culture kept warm ferments quickly and turns sharply sour. ______ the same culture kept cool works slowly and yields a milder loaf.",
    stem: "Which choice completes the text with the most logical transition?",
    choices: ["Consequently,", "Conversely,", "Moreover,", "For instance,"],
    answer: 1,
    explanation:
      "The sentence pairs warm-and-sour against cool-and-mild — a direct inversion of the previous case.",
  },
  {
    key: "trans-census",
    domain: "Expression of Ideas",
    skill: "Transitions",
    difficulty: "Hard",
    passage:
      "Historians once treated the 1890 municipal census as authoritative because it was the only complete count of the district. Its enumerators, ______ were paid by the household rather than by the hour, an arrangement that rewarded speed over accuracy.",
    stem: "Which choice completes the text with the most logical transition?",
    choices: ["for example,", "though,", "as a result,", "in particular,"],
    answer: 1,
    explanation:
      "The second sentence undercuts the authority granted in the first. \"Though\" carries that concession; \"as a result\" would wrongly make the pay structure a consequence of being authoritative.",
  },

  // ── Information and Ideas · Command of Evidence ──────────────────────────
  {
    key: "coe-kelp",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "Medium",
    passage:
      "Sea otters eat urchins, and urchins eat kelp. Ecologist Priya Raman hypothesised that otter populations control kelp forest extent indirectly, by suppressing urchins, rather than through any direct effect on the kelp itself. To test this, her team surveyed twelve coastal sites over six years, recording otter density, urchin density, and kelp cover at each.",
    stem: "Which finding from the surveys, if true, would most strongly support Raman's hypothesis?",
    choices: [
      "Sites with the densest kelp cover also had the densest otter populations.",
      "Kelp cover rose at sites where otters arrived, but only after urchin density had fallen.",
      "Otters at every site fed on species other than urchins during winter.",
      "Urchin density and kelp cover were both higher in the final year than the first.",
    ],
    answer: 1,
    explanation:
      "The hypothesis is specifically about an indirect path: otters → fewer urchins → more kelp. Only the ordering — kelp recovering after urchins decline — shows the middle step doing the work. A choice pairing dense kelp with dense otters shows only correlation, with no sign of the middle step.",
  },
  {
    key: "coe-literacy",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "Hard",
    passage:
      "Reading researcher Tomás Bello argues that the benefit of reading aloud to young children comes less from the words on the page than from the conversation the book prompts — the pauses, the questions, the pointing. He predicts that two children hearing the same number of words will differ in later vocabulary according to how much dialogue surrounded the reading.",
    stem: "Which finding would most directly support Bello's prediction?",
    choices: [
      "Children read to daily had larger vocabularies at age five than children read to weekly.",
      "Among children hearing equal numbers of words, those whose caregivers paused to ask questions scored higher on later vocabulary tests.",
      "Caregivers who read aloud frequently also owned more books.",
      "Children who asked more questions during reading sessions enjoyed reading more as adults.",
    ],
    answer: 1,
    explanation:
      "Bello's claim holds word count constant and varies dialogue. Only this choice does the same. A choice comparing daily with weekly reading varies quantity, which is exactly the factor he says is not doing the work.",
  },
  {
    key: "coe-bridge",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "Medium",
    passage:
      "The pedestrian bridge began to sway noticeably on its opening day, and engineers proposed that the motion was self-reinforcing: a slight sideways movement caused walkers to adjust their step in unison, and the synchronised stepping amplified the movement further. The bridge was closed and instrumented for a series of controlled crossings.",
    stem: "Which result from the controlled crossings would most strongly support the engineers' proposal?",
    choices: [
      "Sway increased sharply once the number of walkers passed a threshold, and walkers' footfalls grew more synchronised as it did.",
      "The bridge swayed more on windy days than on calm ones.",
      "Sway was greatest at the midpoint of the span and least at the supports.",
      "Walkers reported feeling unsteady whenever the bridge moved.",
    ],
    answer: 0,
    explanation:
      "The proposal is a feedback loop between sway and synchronised stepping. Only this option observes both halves rising together. The others describe sway without linking it to walker behaviour.",
  },
  {
    key: "coe-glaze",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "Medium",
    passage:
      "Potters at the site produced a distinctive blue glaze for roughly a century, then abandoned it. Archaeologist Wen Li proposed that the change reflects a broken supply line rather than a change in taste, since the cobalt that produced the colour was imported from a single distant source.",
    stem: "Which finding would most strongly support Li's proposal?",
    choices: [
      "Vessels made after the change were smaller than those made before.",
      "Blue-glazed vessels appear in graves of every status level throughout the century.",
      "The glaze disappears from the record in the same decade that a conflict closed the overland route to the cobalt source.",
      "Later potters at the site experimented with several green glazes.",
    ],
    answer: 2,
    explanation:
      "Li's claim is about supply, so the support has to tie the disappearance to the supply line specifically. The timing coincidence with the closed route does that; continued demand across status levels is suggestive but does not identify the cause.",
  },
  {
    key: "coe-sleepdrug",
    domain: "Information and Ideas",
    skill: "Command of Evidence",
    difficulty: "Hard",
    passage:
      "A compound that improves memory consolidation in mice also increases the time they spend in deep sleep. Neuroscientist Ada Fenn suspects the memory benefit is a downstream consequence of the extra deep sleep, not a separate action of the drug on memory circuits.",
    stem: "Which experimental result would most strongly support Fenn's interpretation?",
    choices: [
      "Mice given the compound outperformed untreated mice on a maze task.",
      "The compound's effect on memory disappeared in mice that were woken whenever deep sleep began.",
      "The compound bound to receptors found in both sleep and memory regions of the brain.",
      "Higher doses of the compound produced both longer deep sleep and better memory scores.",
    ],
    answer: 1,
    explanation:
      "To show memory depends on the sleep, you have to remove the sleep and watch the benefit vanish. Dose-response and receptor binding are equally consistent with two independent effects.",
  },

  // ── Information and Ideas · Central Ideas and Details ────────────────────
  {
    key: "cid-seedbank",
    domain: "Information and Ideas",
    skill: "Central Ideas and Details",
    difficulty: "Easy",
    passage:
      "The seed vault is cut into permafrost so that it stays frozen without power. Its designers assumed that even a total failure of the building's systems would leave the collection intact for decades, because the mountain itself does the cooling. Recent thaw at the entrance tunnel has forced the operators to add mechanical refrigeration — the first admission that the site's passive design is no longer sufficient on its own.",
    stem: "Which choice best states the main idea of the text?",
    choices: [
      "The seed vault's collection has been damaged by warming temperatures.",
      "A design that relied on the surrounding climate has had to be supplemented as that climate changed.",
      "Mechanical refrigeration is more reliable than passive cooling for long-term storage.",
      "The vault's entrance tunnel was poorly constructed.",
    ],
    answer: 1,
    explanation:
      "The passage moves from the passive design, to its assumption, to the need to supplement it. Nothing says the seeds were damaged or the tunnel was poorly built.",
  },
  {
    key: "cid-pidgin",
    domain: "Information and Ideas",
    skill: "Central Ideas and Details",
    difficulty: "Medium",
    passage:
      "A pidgin is a simplified language that arises when groups without a common tongue need to trade. It has no native speakers and little grammatical machinery. When children grow up hearing a pidgin, though, they do not simply learn it — they regularise it, supplying tense markers and fixed word order that the adults never used. Within a generation the pidgin has become a creole, a full language with native speakers.",
    stem: "Which choice best states the main idea of the text?",
    choices: [
      "Pidgins are inadequate for trade until they become creoles.",
      "Children learn languages more quickly than adults do.",
      "Children transform a pidgin into a fully grammatical language rather than merely reproducing it.",
      "Creoles and pidgins differ mainly in the number of people who speak them.",
    ],
    answer: 2,
    explanation:
      "The pivot is \"they do not simply learn it — they regularise it.\" The distinction drawn is grammatical completeness, not speaker numbers or speed of learning.",
  },
  {
    key: "cid-lighthouse",
    domain: "Information and Ideas",
    skill: "Central Ideas and Details",
    difficulty: "Medium",
    passage:
      "Before the Fresnel lens, a lighthouse threw most of its lamplight uselessly into the sky and the sea. Fresnel's design used concentric rings of glass to bend nearly all of that scattered light into a single horizontal beam. The lamp was no brighter; the light was merely aimed. Range roughly tripled at many stations, and the change is often cited as the largest single improvement in the history of coastal navigation.",
    stem: "Which choice best states the main idea of the text?",
    choices: [
      "Fresnel's lens extended lighthouse range by redirecting existing light rather than by producing more of it.",
      "Lighthouses were ineffective before the nineteenth century.",
      "Fresnel's lens required brighter lamps to achieve its full effect.",
      "Coastal navigation improved steadily throughout the nineteenth century.",
    ],
    answer: 0,
    explanation:
      "\"The lamp was no brighter; the light was merely aimed\" is the sentence the whole passage turns on.",
  },
  {
    key: "cid-riverbend",
    domain: "Information and Ideas",
    skill: "Central Ideas and Details",
    difficulty: "Hard",
    passage:
      "A meander does not wander at random. Water moving around a bend travels faster on the outside, where it erodes the bank, and slower on the inside, where it drops sediment. Each bend therefore deepens its own curvature over time. Eventually the loop doubles back far enough that the river cuts across the neck, abandoning the bend as an oxbow lake and beginning the process again on a straighter channel.",
    stem: "Which choice best states the main idea of the text?",
    choices: [
      "Oxbow lakes form wherever rivers flow across flat ground.",
      "Erosion and deposition are opposite processes that cancel each other out in a river.",
      "A meander's own flow pattern drives it through a predictable cycle of curving and cutting off.",
      "Rivers move faster on the outside of bends than on the inside.",
    ],
    answer: 2,
    explanation:
      "The claim that water moves faster on the outside of a bend is a supporting detail, not the main idea. The passage's arc is the self-reinforcing cycle: curve deepens, neck is cut, process restarts.",
  },

  // ── Information and Ideas · Inferences ───────────────────────────────────
  {
    key: "inf-antibiotic",
    domain: "Information and Ideas",
    skill: "Inferences",
    difficulty: "Medium",
    passage:
      "Resistant bacteria usually pay a price: the mutations that defeat an antibiotic tend to make the cell less efficient at everything else. Where the drug is withdrawn, susceptible strains outcompete resistant ones and resistance fades. Yet in several hospital systems, resistance has held steady for years after a drug was retired. Researchers studying these cases therefore suspect that ______",
    stem: "Which choice most logically completes the text?",
    choices: [
      "resistant bacteria are more dangerous than susceptible ones.",
      "some resistant strains have acquired changes that offset the usual cost.",
      "the antibiotics in question were never effective to begin with.",
      "hospitals reintroduced the retired drugs without recording it.",
    ],
    answer: 1,
    explanation:
      "The puzzle is that resistance persists although the cost model predicts it should fade. The inference has to explain the missing cost, not question the drug's effectiveness.",
  },
  {
    key: "inf-canopy",
    domain: "Information and Ideas",
    skill: "Inferences",
    difficulty: "Medium",
    passage:
      "Seedlings on the forest floor receive perhaps two percent of full sunlight and grow only a few centimetres a year. When a mature tree falls and opens a gap, some of those seedlings shoot upward within a single season. Their sudden growth cannot come from new root systems, which take years to establish. Botanists studying gap dynamics therefore conclude that ______",
    stem: "Which choice most logically completes the text?",
    choices: [
      "seedlings compete with one another for space rather than light.",
      "falling trees deposit nutrients that seedlings absorb immediately.",
      "the seedlings had already built reserves they could not previously spend.",
      "gaps in the canopy close more slowly than they open.",
    ],
    answer: 2,
    explanation:
      "Growth that is too fast to be explained by new roots must draw on something already present. The passage rules out the root explanation explicitly.",
  },
  {
    key: "inf-coinhoard",
    domain: "Information and Ideas",
    skill: "Inferences",
    difficulty: "Hard",
    passage:
      "Coin hoards are often read as evidence of danger: people bury savings when armies approach and fail to return for them. But a hoard from the eastern valley contains coins spanning two centuries, added in small groups at regular intervals, and was buried beneath the floor of a building in continuous use. Archaeologists studying it have argued that ______",
    stem: "Which choice most logically completes the text?",
    choices: [
      "the valley was more peaceful than neighbouring regions during this period.",
      "not every hoard represents an emergency deposit made in a single moment.",
      "the coins were counterfeit and therefore never spent.",
      "burial beneath floors was the standard practice of the period.",
    ],
    answer: 1,
    explanation:
      "The details — accumulated slowly, under an occupied building — contradict the single-moment emergency model. The inference is about the model's limits, not about regional peace.",
  },
  {
    key: "inf-echolocation",
    domain: "Information and Ideas",
    skill: "Inferences",
    difficulty: "Medium",
    passage:
      "Bats hunting in open air emit long, low calls that carry far but resolve detail poorly. The same individuals, pursuing prey among dense branches, switch to short, high calls that fade within a few metres but distinguish objects centimetres apart. No bat uses both call types at once. Researchers take this to indicate that ______",
    stem: "Which choice most logically completes the text?",
    choices: [
      "bats in cluttered habitats hunt less successfully than those in open air.",
      "range and resolution cannot both be maximised in a single call.",
      "high-frequency calls require more energy to produce.",
      "bats learn their call type from others in the roost.",
    ],
    answer: 1,
    explanation:
      "Each call type trades one property for the other, and no bat gets both — that is a trade-off. Energy cost and learning are never mentioned.",
  },

  // ── Craft and Structure · Text Structure and Purpose ─────────────────────
  {
    key: "tsp-quarantine",
    domain: "Craft and Structure",
    skill: "Text Structure and Purpose",
    difficulty: "Medium",
    passage:
      "It is tempting to read the port's forty-day detention of arriving ships as an early grasp of contagion. The number, though, came from scripture rather than observation, and the same authorities who imposed it also blamed foul air and unfavourable planetary alignments. The practice worked — but it worked for reasons its designers would not have recognised, and treating it as early epidemiology reads our own understanding backwards into theirs.",
    stem: "Which choice best states the main purpose of the text?",
    choices: [
      "To argue that quarantine was ineffective until its mechanism was understood.",
      "To describe the religious origins of a public health measure.",
      "To caution against interpreting a historical practice through modern understanding.",
      "To compare competing theories of disease transmission.",
    ],
    answer: 2,
    explanation:
      "The passage grants that the practice worked and still warns against the interpretation — the final clause names the error being cautioned against.",
  },
  {
    key: "tsp-notation",
    domain: "Craft and Structure",
    skill: "Text Structure and Purpose",
    difficulty: "Hard",
    passage:
      "Musical notation records pitch and duration precisely and almost everything else badly. A score can specify a note's length to a sixty-fourth but has no standard symbol for the degree of swing that defines an entire idiom. Performers fill the gap from tradition, which is why a written page yields recognisably different music in different hands — and why recordings, not scores, are the primary sources for repertoires built on that unwritten remainder.",
    stem: "Which choice best describes the overall structure of the text?",
    choices: [
      "It defines a limitation of notation and then draws out a consequence for how certain music must be studied.",
      "It contrasts two competing systems of musical notation.",
      "It traces the historical development of notation from its origins.",
      "It argues that notation should be reformed to capture more detail.",
    ],
    answer: 0,
    explanation:
      "The structure is limitation → consequence. No second system is described, no history is traced, and no reform is proposed.",
  },
  {
    key: "tsp-fieldnote",
    domain: "Craft and Structure",
    skill: "Text Structure and Purpose",
    difficulty: "Medium",
    passage:
      "Her published monograph on the delta settlements runs to four hundred pages of measured argument. *The field notebooks tell a less orderly story.* Entries break off mid-sentence when a storm arrives; a hypothesis is proposed on one page and struck through two pages later; whole weeks record nothing but weather and the price of transport. The finished book gives no sign that its conclusions were ever in doubt.",
    stem: "Which choice best describes the function of the italicised sentence in the text as a whole?",
    choices: [
      "It concedes a weakness in the monograph's argument.",
      "It introduces the contrast that the rest of the passage develops.",
      "It summarises the contents of the notebooks.",
      "It questions whether the notebooks are authentic.",
    ],
    answer: 1,
    explanation:
      "The sentence sets \"less orderly\" against the measured monograph, and everything after it fills in that disorder. It opens the contrast rather than summarising it.",
  },
  {
    key: "tsp-standard",
    domain: "Craft and Structure",
    skill: "Text Structure and Purpose",
    difficulty: "Medium",
    passage:
      "The metre was first defined as one ten-millionth of the distance from the equator to the pole, a definition that required an expedition to measure and that turned out to be slightly wrong. It was then redefined against a platinum bar, which was accurate but could be destroyed. It is now defined by the distance light travels in a fixed fraction of a second — a definition anyone with the right equipment can reproduce, and no one can lose.",
    stem: "Which choice best describes the overall structure of the text?",
    choices: [
      "It presents a sequence of definitions, each addressing a shortcoming of the last.",
      "It argues that the modern definition of the metre is still inadequate.",
      "It explains why the original definition of the metre was mistaken.",
      "It compares metric and imperial systems of measurement.",
    ],
    answer: 0,
    explanation:
      "Three definitions in order, each fixing the previous problem: hard to measure, then destructible, then reproducible. That progression is the structure.",
  },

  // ── Expression of Ideas · Rhetorical Synthesis ───────────────────────────
  {
    key: "rs-lichen",
    domain: "Expression of Ideas",
    skill: "Rhetorical Synthesis",
    difficulty: "Medium",
    notes: [
      "Lichens are composite organisms of a fungus and an alga or cyanobacterium.",
      "The fungus provides structure and retains water.",
      "The photosynthetic partner supplies sugars.",
      "Lichens colonise bare rock where neither partner could survive alone.",
      "They are used as air quality indicators because they absorb pollutants directly.",
    ],
    stem:
      "The student wants to emphasise how the partnership extends where the organisms can live. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      "Lichens absorb pollutants directly, which makes them useful indicators of air quality.",
      "A lichen is a composite organism formed from a fungus and a photosynthetic partner such as an alga.",
      "Because the fungus retains water and the alga supplies sugars, lichens can colonise bare rock where neither partner could survive alone.",
      "The fungus in a lichen provides structure, and the photosynthetic partner provides sugars.",
    ],
    answer: 2,
    explanation:
      "The goal is the range the partnership makes possible. Only this choice pairs the two contributions with the habitat neither could occupy alone.",
  },
  {
    key: "rs-ferry",
    domain: "Expression of Ideas",
    skill: "Rhetorical Synthesis",
    difficulty: "Easy",
    notes: [
      "The island's ferry ran twice daily until 1974.",
      "Service was cut to three days a week after the bridge opened.",
      "The bridge cannot carry freight vehicles over twelve tonnes.",
      "Island farms ship produce by ferry because of the weight limit.",
      "Ferry ridership has risen every year since 2009.",
    ],
    stem:
      "The student wants to explain why the ferry remains necessary despite the bridge. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      "The ferry ran twice daily until 1974, when the bridge opened.",
      "Because the bridge cannot carry vehicles over twelve tonnes, island farms still ship produce by ferry.",
      "Ferry ridership has risen every year since 2009.",
      "Ferry service was reduced to three days a week after the bridge opened.",
    ],
    answer: 1,
    explanation:
      "Only this choice gives a reason the bridge cannot substitute for the ferry. Rising ridership shows the ferry is used but not why it is needed.",
  },
  {
    key: "rs-mural",
    domain: "Expression of Ideas",
    skill: "Rhetorical Synthesis",
    difficulty: "Medium",
    notes: [
      "Elena Marsh painted twelve public murals between 1968 and 1981.",
      "Nine were painted on buildings later demolished.",
      "Photographs survive of all twelve.",
      "Her 1974 mural Harbour Work is the only one still on its original wall.",
      "A 2019 exhibition reconstructed three murals at full scale from photographs.",
    ],
    stem:
      "The student wants to emphasise how Marsh's work survives despite the loss of the buildings. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      "Marsh painted twelve public murals between 1968 and 1981, nine of them on buildings later demolished.",
      "Harbour Work, painted in 1974, is the only Marsh mural still on its original wall.",
      "Though nine of the buildings were demolished, photographs of all twelve murals survive, and a 2019 exhibition rebuilt three at full scale.",
      "A 2019 exhibition reconstructed three of Marsh's murals at full scale.",
    ],
    answer: 2,
    explanation:
      "The goal requires both the loss and the survival. This choice names the demolitions and then the two things that outlasted them.",
  },
  {
    key: "rs-tide",
    domain: "Expression of Ideas",
    skill: "Rhetorical Synthesis",
    difficulty: "Hard",
    notes: [
      "Tide mills use the flow of water in and out of an estuary to drive machinery.",
      "They operate on a lunar schedule rather than a solar one.",
      "Working hours therefore shift by about fifty minutes each day.",
      "Millers and their workers lived on site to match the changing schedule.",
      "Most tide mills were replaced by steam power in the nineteenth century.",
    ],
    stem:
      "The student wants to explain how the mills' power source shaped the lives of the people who worked them. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    choices: [
      "Tide mills were largely replaced by steam power during the nineteenth century.",
      "Because tide mills followed the lunar cycle, working hours shifted about fifty minutes a day, and workers lived on site to keep pace.",
      "Tide mills used water flowing in and out of an estuary to drive their machinery.",
      "Tide mills operated on a lunar rather than a solar schedule.",
    ],
    answer: 1,
    explanation:
      "The goal links the power source to workers' lives. Only this choice carries the chain all the way from lunar schedule to living on site.",
  },

  // ── Craft and Structure · Cross-Text Connections ─────────────────────────
  {
    key: "ctc-urbanheat",
    domain: "Craft and Structure",
    skill: "Cross-Text Connections",
    difficulty: "Hard",
    passage:
      "Text 1: Planners have long held that tree cover is the most effective way to cool a city district. Shade lowers surface temperature directly, and transpiration removes heat from the air, so the argument runs that increasing canopy is the surest route to a cooler street.\n\nText 2: Over four summers, Ines Okafor's team measured street-level temperature across sixty blocks with varying canopy. Canopy predicted cooling well on wide streets, but on narrow streets with tall buildings the effect nearly vanished: the trees shaded surfaces that were already shaded and trapped warm air beneath the canopy, offsetting the gains.",
    stem:
      "Based on the texts, how would Okafor's team (Text 2) most likely respond to the argument presented in Text 1?",
    choices: [
      "By agreeing with it fully, since their measurements confirmed cooling on wide streets.",
      "By rejecting it, since their measurements showed canopy raised temperatures overall.",
      "By noting that it holds under some street geometries but not others.",
      "By arguing that surface temperature is the wrong measure of urban heat.",
    ],
    answer: 2,
    explanation:
      "The measurements confirm Text 1 on wide streets and undercut it on narrow ones, so the response is a qualification, not agreement or rejection. Text 2 never disputes the measure itself.",
  },
  {
    key: "ctc-memory",
    domain: "Craft and Structure",
    skill: "Cross-Text Connections",
    difficulty: "Hard",
    passage:
      "Text 1: The standard account of expertise holds that experts remember more because they have stored more. A chess master recognises a position instantly, the argument goes, because decades of play have filled memory with positions to match against.\n\nText 2: Alia Ferrand presented masters and novices with boards holding pieces placed at random. The masters' advantage in recall disappeared entirely; they performed no better than beginners. Ferrand argues that what experts store is not a catalogue of positions but a grammar of the game, useless when the arrangement obeys no grammar.",
    stem: "Based on the texts, Ferrand would most likely characterise the standard account in Text 1 as",
    choices: [
      "correct about the size of experts' memory but wrong about what it contains.",
      "entirely mistaken, since experts showed no memory advantage in her study.",
      "applicable only to games with fewer possible positions than chess.",
      "unverifiable, because expertise cannot be measured experimentally.",
    ],
    answer: 0,
    explanation:
      "Ferrand keeps the claim that experts store a great deal and disputes its character — structure rather than catalogue. Their advantage vanished only on random boards, so \"no advantage\" overstates it.",
  },
  {
    key: "ctc-restoration-ecology",
    domain: "Craft and Structure",
    skill: "Cross-Text Connections",
    difficulty: "Medium",
    passage:
      "Text 1: The aim of ecological restoration, on the traditional view, is to return a damaged site to the state it held before disturbance. Historical records and undisturbed reference sites supply the target, and success is measured by how closely the restored site resembles it.\n\nText 2: Restoration ecologist Joon-ho Pak points out that many target states depended on climates that no longer exist at those locations. A wetland restored to its 1850 species mix may need continuous intervention to persist. Pak proposes measuring success by whether a site sustains its functions unaided, whatever species end up performing them.",
    stem: "Which choice best describes the relationship between the two texts?",
    choices: [
      "Text 2 supplies historical evidence supporting the approach described in Text 1.",
      "Text 2 proposes a different measure of success from the one described in Text 1.",
      "Text 2 argues that the goal described in Text 1 has already been achieved.",
      "Text 2 disputes the accuracy of the historical records mentioned in Text 1.",
    ],
    answer: 1,
    explanation:
      "Text 1 measures success by resemblance to a past state; Pak measures it by self-sustaining function. The disagreement is about the criterion, not about record accuracy.",
  },

  // ── Standard English Conventions · Boundaries ────────────────────────────
  {
    key: "bnd-migration",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    difficulty: "Medium",
    passage:
      "The reason arctic terns cover more distance each year than any other ______ is that they follow a looping route shaped by prevailing winds rather than flying directly between their breeding and wintering grounds.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["animal,", "animal:", "animal;", "animal"],
    answer: 3,
    explanation:
      "The subject is \"The reason … animal\" and the verb is \"is.\" No punctuation belongs between a subject and its verb.",
  },
  {
    key: "bnd-volcano",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    difficulty: "Medium",
    passage:
      "The 1783 eruption released enough sulphur to cool the northern hemisphere for two ______ crops failed as far away as the Nile valley, and the resulting famines killed more people than the eruption itself.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["years,", "years:", "years and", "years"],
    answer: 1,
    explanation:
      "Two independent clauses need a stronger break than a comma, and the second explains the first — a colon fits. A comma alone would splice them.",
  },
  {
    key: "bnd-typeface",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    difficulty: "Hard",
    passage:
      "Designed for road signs read at speed, the typeface uses open letterforms and generous ______ it remains legible at distances where more decorative faces blur into a grey smear.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["spacing,", "spacing;", "spacing and", "spacing being"],
    answer: 1,
    explanation:
      "Both halves are independent clauses, so they need a semicolon or a period. A comma splices them, and \"and\" without a comma joins them incorrectly here.",
  },

  // ── Standard English Conventions · Form, Structure, and Sense ────────────
  {
    key: "fss-observatory",
    domain: "Standard English Conventions",
    skill: "Form, Structure, and Sense",
    difficulty: "Hard",
    passage:
      "Built on a ridge chosen for its unusually still air, ______ has produced sharper images than instruments twice its size.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "the observatory's small telescope",
      "the small telescope at the observatory",
      "astronomers at the observatory find that its small telescope",
      "it is the observatory's small telescope that",
    ],
    answer: 1,
    explanation:
      "The opening phrase describes what was built on the ridge, so the noun it modifies must follow the comma. Only this choice puts \"telescope\" in that position without a possessive shifting the subject.",
  },
  {
    key: "fss-ledger",
    domain: "Standard English Conventions",
    skill: "Form, Structure, and Sense",
    difficulty: "Medium",
    passage:
      "Each of the four ledgers recovered from the wreck ______ a different clerk's handwriting, which has allowed historians to reconstruct the ship's chain of command.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["show", "shows", "have shown", "are showing"],
    answer: 1,
    explanation:
      "The subject is \"Each,\" which is singular; \"of the four ledgers\" is a prepositional phrase and cannot control the verb.",
  },
  {
    key: "fss-expedition",
    domain: "Standard English Conventions",
    skill: "Form, Structure, and Sense",
    difficulty: "Medium",
    passage:
      "Having spent three winters mapping the coastline, ______ that the inlet marked on earlier charts did not exist.",
    stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    choices: [
      "the survey concluded",
      "it was concluded by the surveyors",
      "the surveyors concluded",
      "the conclusion of the surveyors was",
    ],
    answer: 2,
    explanation:
      "The people who spent three winters mapping must be the subject. A survey and a conclusion cannot spend winters; the passive construction buries the actor.",
  },
];
