import type { Additive, Ingredient, IngredientStatus } from '../types';

// ── Additive (E-number) Database ─────────────────────────────────────────────
// Sources: EFSA, FDA, WHO/JECFA, EU Food Additives Regulation (EC) No 1333/2008
// ─────────────────────────────────────────────────────────────────────────────

type AddDB = Omit<Additive, 'code'>;

export const ADDITIVE_DB: Record<string, AddDB> = {
  // ── E1xx Colors ───────────────────────────────────────────────────────────
  'E100':  { name: 'Curcumin (Turmeric)',       function: 'Color',       severity: 'safe',    description: 'Natural yellow dye from turmeric. Antioxidant properties.' },
  'E101':  { name: 'Riboflavin (B2)',            function: 'Color',       severity: 'safe',    description: 'Vitamin B2 used as yellow colorant.' },
  'E102':  { name: 'Tartrazine',                 function: 'Color',       severity: 'caution', description: 'Synthetic yellow dye. May cause hyperactivity in children. Banned in Norway & Austria.', restricted: 'Norway, Austria' },
  'E104':  { name: 'Quinoline Yellow',           function: 'Color',       severity: 'caution', description: 'Synthetic yellow dye. Part of "Southampton 6" — linked to hyperactivity in children.', adi: '0.5 mg/kg bw/day' },
  'E110':  { name: 'Sunset Yellow FCF',          function: 'Color',       severity: 'caution', description: 'Orange-yellow dye. Southampton 6 — hyperactivity concern. Banned in Norway.', restricted: 'Norway', adi: '4 mg/kg bw/day' },
  'E120':  { name: 'Cochineal / Carmine',        function: 'Color',       severity: 'caution', description: 'Red dye from crushed cochineal insects. Not vegan. Can trigger severe allergic reactions.' },
  'E122':  { name: 'Azorubine / Carmoisine',     function: 'Color',       severity: 'caution', description: 'Red azo dye. Southampton 6 — hyperactivity concern. Banned in USA, Japan, Canada.', restricted: 'USA, Japan, Canada' },
  'E123':  { name: 'Amaranth',                   function: 'Color',       severity: 'risk',    description: 'Red dye. Banned in USA, Russia. Linked to malformations in animal studies.', restricted: 'USA, Russia' },
  'E124':  { name: 'Ponceau 4R',                 function: 'Color',       severity: 'caution', description: 'Red azo dye. Southampton 6. Banned in USA, Canada, Norway.', restricted: 'USA, Canada, Norway' },
  'E127':  { name: 'Erythrosine',                function: 'Color',       severity: 'caution', description: 'Red dye containing iodine. May affect thyroid function. Banned in Norway.', restricted: 'Norway' },
  'E129':  { name: 'Allura Red AC',              function: 'Color',       severity: 'caution', description: 'Red-orange dye. Southampton 6. Banned in Denmark, Belgium, France, Germany, Switzerland.', restricted: 'Denmark, Belgium, France' },
  'E131':  { name: 'Patent Blue V',              function: 'Color',       severity: 'caution', description: 'Blue dye. Banned in Australia, USA, Canada. Allergic reactions reported.', restricted: 'Australia, USA, Canada' },
  'E132':  { name: 'Indigo Carmine',             function: 'Color',       severity: 'caution', description: 'Blue dye. May cause nausea and high blood pressure in high doses.' },
  'E133':  { name: 'Brilliant Blue FCF',         function: 'Color',       severity: 'caution', description: 'Blue dye. Banned in several European countries.', restricted: 'Belgium, France, Germany, Switzerland' },
  'E140':  { name: 'Chlorophyll',                function: 'Color',       severity: 'safe',    description: 'Natural green pigment from plants.' },
  'E150a': { name: 'Caramel Color Plain',        function: 'Color',       severity: 'safe',    description: 'Natural caramel color made by heating sugar.' },
  'E150d': { name: 'Caramel Color Class IV',     function: 'Color',       severity: 'caution', description: 'Contains 4-methylimidazole (4-MEI), potential carcinogen at high doses (California Prop 65).', adi: '200 mg/kg bw/day' },
  'E151':  { name: 'Brilliant Black BN',         function: 'Color',       severity: 'caution', description: 'Black dye. Banned in USA, Canada, Japan, Australia.', restricted: 'USA, Canada, Japan, Australia' },
  'E155':  { name: 'Brown HT',                   function: 'Color',       severity: 'caution', description: 'Brown dye. Banned in USA, Canada, Japan, Australia.', restricted: 'USA, Canada, Japan, Australia' },
  'E160a': { name: 'Beta-Carotene',              function: 'Color',       severity: 'safe',    description: 'Natural orange-yellow pigment, precursor to Vitamin A.' },
  'E160b': { name: 'Annatto (Bixin)',            function: 'Color',       severity: 'caution', description: 'Natural orange dye from achiote seeds. Rare allergic reactions reported.' },
  'E171':  { name: 'Titanium Dioxide',           function: 'Color',       severity: 'risk',    description: 'White pigment. BANNED in EU food products (2022) due to genotoxicity concerns. Still used in cosmetics.', restricted: 'EU (food)' },
  'E172':  { name: 'Iron Oxides / Hydroxides',   function: 'Color',       severity: 'safe',    description: 'Natural mineral pigments (yellow, red, black). Generally safe at approved levels.' },

  // ── E2xx Preservatives ────────────────────────────────────────────────────
  'E200':  { name: 'Sorbic Acid',                function: 'Preservative', severity: 'safe',    description: 'Natural preservative found in berries. Inhibits mold and yeast.' },
  'E202':  { name: 'Potassium Sorbate',          function: 'Preservative', severity: 'safe',    description: 'Salt of sorbic acid. Very common and well-tolerated preservative.', adi: '25 mg/kg bw/day' },
  'E210':  { name: 'Benzoic Acid',               function: 'Preservative', severity: 'caution', description: 'Can react with Vitamin C (E300) to form benzene, a known carcinogen. Avoid with ascorbic acid.', adi: '5 mg/kg bw/day' },
  'E211':  { name: 'Sodium Benzoate',            function: 'Preservative', severity: 'caution', description: 'Most common form of benzoic acid. Benzene risk when combined with ascorbic acid.', adi: '5 mg/kg bw/day' },
  'E212':  { name: 'Potassium Benzoate',         function: 'Preservative', severity: 'caution', description: 'Same concerns as sodium benzoate. Benzene formation risk.' },
  'E213':  { name: 'Calcium Benzoate',           function: 'Preservative', severity: 'caution', description: 'Same concerns as sodium benzoate.' },
  'E218':  { name: 'Methyl Para-hydroxybenzoate (Methylparaben)', function: 'Preservative', severity: 'caution', description: 'Paraben preservative. Weak estrogen-mimicking activity (endocrine disruption concerns).' },
  'E219':  { name: 'Sodium Methylparaben',       function: 'Preservative', severity: 'caution', description: 'Paraben salt. Same endocrine disruption concerns as E218.' },
  'E220':  { name: 'Sulphur Dioxide',            function: 'Preservative', severity: 'caution', description: 'Powerful preservative/antioxidant. Can trigger asthma attacks. Must be declared if >10mg/kg.', adi: '0.7 mg/kg bw/day' },
  'E221':  { name: 'Sodium Sulphite',            function: 'Preservative', severity: 'caution', description: 'Sulphite — same asthma concern as SO₂.' },
  'E222':  { name: 'Sodium Bisulphite',          function: 'Preservative', severity: 'caution', description: 'Sulphite — same asthma concern as SO₂.' },
  'E223':  { name: 'Sodium Metabisulphite',      function: 'Preservative', severity: 'caution', description: 'Sulphite — releases SO₂, can trigger asthma.' },
  'E224':  { name: 'Potassium Metabisulphite',   function: 'Preservative', severity: 'caution', description: 'Sulphite preservative. Asthma risk.' },
  'E230':  { name: 'Biphenyl / Diphenyl',        function: 'Preservative', severity: 'risk',    description: 'Used as fungicide on citrus peel. Banned in food in many countries. Hepatotoxic in animals.', restricted: 'EU, Australia' },
  'E249':  { name: 'Potassium Nitrite',          function: 'Preservative', severity: 'risk',    description: 'Meat preservative. Forms nitrosamines with amines — known carcinogens. Restrict intake.' },
  'E250':  { name: 'Sodium Nitrite',             function: 'Preservative', severity: 'risk',    description: 'Meat preservative (cured meats, bacon, hot dogs). Nitrosamines are IARC Group 2A carcinogens.', adi: '0.07 mg/kg bw/day' },
  'E251':  { name: 'Sodium Nitrate',             function: 'Preservative', severity: 'risk',    description: 'Converted to nitrite in the body. Same nitrosamine cancer concern. Especially concerning for children.' },
  'E252':  { name: 'Potassium Nitrate',          function: 'Preservative', severity: 'risk',    description: 'Converted to nitrite. Nitrosamine formation risk.' },
  'E270':  { name: 'Lactic Acid',                function: 'Preservative', severity: 'safe',    description: 'Natural acid produced by fermentation. Present in yogurt. Generally safe.' },
  'E280':  { name: 'Propionic Acid',             function: 'Preservative', severity: 'safe',    description: 'Natural preservative in cheese. Inhibits mold in bread. Generally safe.' },
  'E282':  { name: 'Calcium Propionate',         function: 'Preservative', severity: 'caution', description: 'Bread preservative. Some studies link to behavior changes and headaches in children.', adi: 'No limit (GRAS)' },
  'E290':  { name: 'Carbon Dioxide',             function: 'Preservative', severity: 'safe',    description: 'Used in carbonated beverages. Generally safe.' },
  'E296':  { name: 'Malic Acid',                 function: 'Acidity Regulator', severity: 'safe', description: 'Natural fruit acid. Safe at normal food levels.' },

  // ── E3xx Antioxidants ────────────────────────────────────────────────────
  'E300':  { name: 'Ascorbic Acid (Vitamin C)',  function: 'Antioxidant', severity: 'safe',    description: 'Vitamin C. Essential nutrient. Antioxidant. Can react with benzoates to form benzene.' },
  'E306':  { name: 'Tocopherol-rich Extract',   function: 'Antioxidant', severity: 'safe',    description: 'Natural Vitamin E from plants. Antioxidant.' },
  'E307':  { name: 'Alpha-Tocopherol (Vitamin E)', function: 'Antioxidant', severity: 'safe',  description: 'Synthetic Vitamin E. Antioxidant. Generally safe.' },
  'E310':  { name: 'Propyl Gallate',             function: 'Antioxidant', severity: 'caution', description: 'Synthetic antioxidant. Possible endocrine disruption. Allergic reactions reported.' },
  'E319':  { name: 'TBHQ (tert-Butylhydroquinone)', function: 'Antioxidant', severity: 'risk', description: 'Synthetic antioxidant in fats/oils. High doses carcinogenic in animals. Banned in Japan.', restricted: 'Japan', adi: '0.7 mg/kg bw/day' },
  'E320':  { name: 'BHA (Butylated Hydroxyanisole)', function: 'Antioxidant', severity: 'risk', description: 'Synthetic antioxidant. IARC Group 2B possible carcinogen. California Prop 65 carcinogen.', adi: '0.5 mg/kg bw/day' },
  'E321':  { name: 'BHT (Butylated Hydroxytoluene)', function: 'Antioxidant', severity: 'caution', description: 'Synthetic antioxidant. Possible carcinogen/endocrine disruptor. Banned in some countries.', adi: '0.3 mg/kg bw/day' },
  'E330':  { name: 'Citric Acid',               function: 'Acidity Regulator', severity: 'safe', description: 'Natural acid in citrus fruits. Very common and safe.' },
  'E331':  { name: 'Sodium Citrates',           function: 'Acidity Regulator', severity: 'safe', description: 'Sodium salts of citric acid. Safe at food levels.' },
  'E334':  { name: 'Tartaric Acid (L(+)-)',     function: 'Acidity Regulator', severity: 'safe', description: 'Natural acid in grapes. Used in wine. Safe.' },
  'E338':  { name: 'Phosphoric Acid',           function: 'Acidity Regulator', severity: 'caution', description: 'Adds tangy flavor. High intake linked to lower bone mineral density (calcium leaching).', adi: '70 mg/kg bw/day (as P)' },
  'E339':  { name: 'Sodium Phosphates',         function: 'Acidity Regulator', severity: 'caution', description: 'Phosphate salt. Excess phosphate harmful to kidneys and bone health.' },

  // ── E4xx Thickeners / Gelling / Stabilizers ──────────────────────────────
  'E400':  { name: 'Alginic Acid',              function: 'Thickener',   severity: 'safe',    description: 'Natural polysaccharide from brown algae.' },
  'E401':  { name: 'Sodium Alginate',           function: 'Thickener',   severity: 'safe',    description: 'Derived from brown seaweed. Generally safe.' },
  'E406':  { name: 'Agar',                      function: 'Gelling Agent', severity: 'safe',  description: 'Natural polysaccharide from red algae. Vegan gelatin substitute.' },
  'E407':  { name: 'Carrageenan',               function: 'Thickener',   severity: 'caution', description: 'From red seaweed. Studies suggest possible inflammatory effects in gut tissue. Degraded carrageenan (poligeenan) is carcinogenic but banned from food.' },
  'E412':  { name: 'Guar Gum',                  function: 'Thickener',   severity: 'safe',    description: 'Natural seed extract. Used as thickener/stabilizer. Generally safe.' },
  'E414':  { name: 'Acacia / Gum Arabic',       function: 'Stabilizer',  severity: 'safe',    description: 'Natural plant gum. Prebiotic fiber properties.' },
  'E415':  { name: 'Xanthan Gum',               function: 'Thickener',   severity: 'safe',    description: 'Fermentation product. Common in gluten-free foods. Generally safe.' },
  'E420':  { name: 'Sorbitol',                  function: 'Sweetener',   severity: 'caution', description: 'Sugar alcohol. May cause bloating and diarrhea in large amounts (>50g/day).' },
  'E421':  { name: 'Mannitol',                  function: 'Sweetener',   severity: 'caution', description: 'Sugar alcohol. Can cause osmotic diarrhea at high doses.' },
  'E422':  { name: 'Glycerol',                  function: 'Humectant',   severity: 'safe',    description: 'Common humectant. Also a natural metabolite. Generally safe.' },
  'E440':  { name: 'Pectins',                   function: 'Gelling Agent', severity: 'safe',  description: 'Natural fiber from fruit peels. Prebiotic properties.' },
  'E450':  { name: 'Diphosphates',              function: 'Emulsifier',  severity: 'caution', description: 'Phosphate additive. Excess phosphate harms kidney function and bone health.' },
  'E451':  { name: 'Triphosphates',             function: 'Emulsifier',  severity: 'caution', description: 'Phosphate. Excess intake linked to kidney damage. Watch with kidney disease.' },
  'E452':  { name: 'Polyphosphates',            function: 'Emulsifier',  severity: 'caution', description: 'Phosphate salt. Same concerns as other phosphates.' },
  'E471':  { name: 'Mono- and Diglycerides of Fatty Acids', function: 'Emulsifier', severity: 'caution', description: 'May contain trans fats. Derived from animal or plant fats. Not always vegan.' },
  'E472e': { name: 'DATEM',                     function: 'Emulsifier',  severity: 'caution', description: 'Diacetyl tartaric acid ester of mono- and diglycerides. May be of animal origin.' },
  'E476':  { name: 'Polyglycerol Polyricinoleate (PGPR)', function: 'Emulsifier', severity: 'safe', description: 'Used to reduce cocoa butter in chocolate. Safe at food levels.', adi: '25 mg/kg bw/day' },
  'E481':  { name: 'Sodium Stearoyl-2-Lactylate (SSL)', function: 'Emulsifier', severity: 'safe', description: 'Dough conditioner. Generally recognized as safe.' },

  // ── E5xx Acidity Regulators / Anti-caking ────────────────────────────────
  'E500':  { name: 'Sodium Carbonates',         function: 'Acidity Regulator', severity: 'safe', description: 'Baking soda and related compounds. Generally safe.' },
  'E501':  { name: 'Potassium Carbonates',      function: 'Acidity Regulator', severity: 'safe', description: 'Potassium salts. Safe at food levels.' },
  'E503':  { name: 'Ammonium Carbonates',       function: 'Leavening Agent', severity: 'safe',  description: 'Baker\'s ammonia. Decomposes fully during baking.' },
  'E509':  { name: 'Calcium Chloride',          function: 'Firming Agent', severity: 'safe',    description: 'Mineral salt. Used to maintain texture in canned vegetables. Safe.' },
  'E516':  { name: 'Calcium Sulphate',          function: 'Firming Agent', severity: 'safe',    description: 'Gypsum. Used as firming agent and calcium source in tofu. Safe.' },
  'E551':  { name: 'Silicon Dioxide (Silica)',  function: 'Anti-caking', severity: 'safe',      description: 'Mineral anti-caking agent. Generally safe at food levels. Nano-form under study.' },
  'E553b': { name: 'Talc',                      function: 'Anti-caking', severity: 'caution',   description: 'Mineral powder. Cosmetic-grade talc historically contaminated with asbestos. Inhaled form is carcinogenic.' },

  // ── E6xx Flavor Enhancers ─────────────────────────────────────────────────
  'E620':  { name: 'Glutamic Acid',             function: 'Flavor Enhancer', severity: 'caution', description: 'Amino acid form of MSG. Can cause "MSG symptom complex" in sensitive individuals.' },
  'E621':  { name: 'Monosodium Glutamate (MSG)', function: 'Flavor Enhancer', severity: 'caution', description: 'Very common umami enhancer. Most people tolerate well. Some experience headaches/flushing (symptom complex). High sodium.' },
  'E622':  { name: 'Monopotassium Glutamate',   function: 'Flavor Enhancer', severity: 'caution', description: 'Same effects as MSG. Lower sodium variant.' },
  'E627':  { name: 'Disodium Guanylate',        function: 'Flavor Enhancer', severity: 'caution', description: 'Synergistic with MSG. May trigger gout flares. Often derived from fish/yeast (not vegan-certified).' },
  'E631':  { name: 'Disodium Inosinate',        function: 'Flavor Enhancer', severity: 'caution', description: 'Synergistic with MSG. Often from meat/fish. May worsen gout. Not suitable for gout patients.' },
  'E635':  { name: 'Disodium 5\'-Ribonucleotides', function: 'Flavor Enhancer', severity: 'caution', description: 'Mixture of E627+E631. Amplifies MSG effect. Gout and allergy concerns.' },
  'E640':  { name: 'Glycine and its Sodium Salt', function: 'Flavor Enhancer', severity: 'safe',  description: 'Non-essential amino acid. Generally considered safe.' },

  // ── E9xx Other (sweeteners, glazing, etc.) ───────────────────────────────
  'E900':  { name: 'Dimethyl Polysiloxane (PDMS)', function: 'Anti-foaming', severity: 'safe',  description: 'Anti-foaming agent in cooking oils and beverages. FDA GRAS.' },
  'E901':  { name: 'Beeswax',                   function: 'Glazing Agent', severity: 'caution', description: 'Beeswax coating. Not vegan. Generally safe for consumption.' },
  'E903':  { name: 'Carnauba Wax',              function: 'Glazing Agent', severity: 'safe',    description: 'Plant-based wax from carnauba palm. Vegan. Safe.' },
  'E905':  { name: 'Microcrystalline Wax',      function: 'Glazing Agent', severity: 'caution', description: 'Petroleum-derived wax. Indigestible. Safety concerns at high doses.' },
  'E950':  { name: 'Acesulfame Potassium (Ace-K)', function: 'Sweetener', severity: 'caution',  description: 'Artificial sweetener. 200× sweeter than sugar. Some studies suggest potential carcinogenicity at very high doses. Controversial.', adi: '9 mg/kg bw/day' },
  'E951':  { name: 'Aspartame',                 function: 'Sweetener',   severity: 'caution',   description: 'Artificial sweetener. IARC classified as "possibly carcinogenic to humans" (Group 2B, 2023). Avoid if PKU. Contains phenylalanine.', adi: '40 mg/kg bw/day' },
  'E952':  { name: 'Cyclamate',                 function: 'Sweetener',   severity: 'risk',      description: 'Artificial sweetener. BANNED in USA and Japan due to bladder cancer concerns in rats.', restricted: 'USA, Japan' },
  'E954':  { name: 'Saccharin',                 function: 'Sweetener',   severity: 'caution',   description: 'Oldest artificial sweetener. Previously listed as possible carcinogen, delisted in 2000. Some gut microbiome concerns.', adi: '5 mg/kg bw/day' },
  'E955':  { name: 'Sucralose',                 function: 'Sweetener',   severity: 'caution',   description: 'Chlorinated sugar. 600× sweeter than sugar. Some studies suggest gut microbiome disruption at high doses.', adi: '15 mg/kg bw/day' },
  'E960':  { name: 'Steviol Glycosides (Stevia)', function: 'Sweetener', severity: 'safe',      description: 'Natural sweetener from stevia plant. Generally well-tolerated. Approved worldwide.', adi: '4 mg/kg bw/day' },
  'E961':  { name: 'Neotame',                   function: 'Sweetener',   severity: 'caution',   description: 'Aspartame derivative, 7000–13000× sweeter. Limited long-term safety data.', adi: '2 mg/kg bw/day' },
  'E967':  { name: 'Xylitol',                   function: 'Sweetener',   severity: 'caution',   description: 'Sugar alcohol from birch bark. Tooth-friendly. Toxic to dogs. May cause diarrhea in humans at high doses.' },
  'E968':  { name: 'Erythritol',                function: 'Sweetener',   severity: 'safe',      description: 'Sugar alcohol naturally found in some fruits. Well-tolerated. Lower GI effects than other sugar alcohols.' },
  'E999':  { name: 'Quillaia Extract',          function: 'Foaming Agent', severity: 'caution', description: 'From soapbark tree. Used in root beer/cola. High doses harmful. Limited data.', adi: '1 mg/kg bw/day' },

  // ── Extended / Cosmetic additives ─────────────────────────────────────────
  'E1400': { name: 'Dextrin',                   function: 'Thickener',   severity: 'safe',    description: 'Starch derivative. Used as thickener. Safe.' },
  'E1412': { name: 'Distarch Phosphate',        function: 'Thickener',   severity: 'safe',    description: 'Modified starch. Generally safe.' },
  'E1422': { name: 'Acetylated Distarch Adipate', function: 'Thickener', severity: 'safe',    description: 'Modified starch. Generally considered safe.' },
  'E1450': { name: 'Starch Sodium Octenyl Succinate', function: 'Emulsifier', severity: 'safe', description: 'Modified starch emulsifier. Generally safe.' },
};

// ── Ingredient Name → Safety Database ────────────────────────────────────────
// Keywords matching (lowercase, partial match)
// ─────────────────────────────────────────────────────────────────────────────

type IngredDB = {
  status:      IngredientStatus;
  function:    string;
  description: string;
  ewgScore?:   number;
  isAllergen?: boolean;
  vegan?:      boolean;
};

export const INGREDIENT_DB: Record<string, IngredDB> = {
  // ── Risky / Banned ingredients ──────────────────────────────────────────
  'paraben':             { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Endocrine disruptors (estrogen mimics). Linked to breast tumor tissue and reproductive toxicity. EU restricts usage.' },
  'methylparaben':       { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Paraben — weak estrogen mimic. Found in breast tumor tissue in studies.' },
  'propylparaben':       { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Paraben — strongest endocrine-disrupting paraben. Restricted in EU cosmetics.' },
  'butylparaben':        { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Paraben — strong endocrine disruptor. Restricted in EU.' },
  'phenolphthalein':     { status: 'risk',    ewgScore: 10, function: 'Laxative',    description: 'BANNED. Known carcinogen (IARC Group 2B). Illegal in food and drugs in most countries.' },
  'sibutramine':         { status: 'risk',    ewgScore: 10, function: 'Weight loss', description: 'BANNED drug. Cardiac risks (heart attack, stroke). Withdrawn worldwide in 2010.' },
  'mercury':             { status: 'risk',    ewgScore: 10, function: 'Preservative/Skin lightener', description: 'Neurotoxic heavy metal. Banned in cosmetics at >1ppm. Severe brain/kidney damage.' },
  'hydroquinone':        { status: 'risk',    ewgScore: 9,  function: 'Skin lightener', description: 'Possible carcinogen (IARC Group 3). Banned in EU cosmetics >0.3%. Ochronosis risk with long-term use.' },
  'formaldehyde':        { status: 'risk',    ewgScore: 10, function: 'Preservative', description: 'IARC Group 1 carcinogen. Released by some preservatives (DMDM hydantoin, quaternium-15, etc.).' },
  'dmdm hydantoin':      { status: 'risk',    ewgScore: 8,  function: 'Preservative', description: 'Formaldehyde-releasing preservative. Linked to hair loss and scalp irritation lawsuits.' },
  'quaternium-15':       { status: 'risk',    ewgScore: 8,  function: 'Preservative', description: 'Formaldehyde releaser. IARC Group 1 carcinogen concern.' },
  'asbestos':            { status: 'risk',    ewgScore: 10, function: 'Contaminant',  description: 'IARC Group 1 carcinogen. No safe level of exposure. Causes mesothelioma and lung cancer.' },
  'lead':                { status: 'risk',    ewgScore: 10, function: 'Contaminant',  description: 'Neurotoxic heavy metal. No safe blood level in children. Impairs cognitive development.' },
  'arsenic':             { status: 'risk',    ewgScore: 10, function: 'Contaminant',  description: 'IARC Group 1 carcinogen. Neurotoxic. Found in some rice products and contaminated water.' },
  'cadmium':             { status: 'risk',    ewgScore: 10, function: 'Contaminant',  description: 'IARC Group 1 carcinogen. Nephrotoxic. Accumulates in kidneys.' },

  // ── Caution ingredients ────────────────────────────────────────────────
  'high fructose corn syrup': { status: 'caution', ewgScore: 6, function: 'Sweetener', description: 'Metabolized differently from glucose. Linked to obesity, fatty liver, and insulin resistance at high consumption.' },
  'corn syrup':              { status: 'caution', ewgScore: 5, function: 'Sweetener',  description: 'Refined sugar. Empty calories. Contributes to blood sugar spikes.' },
  'sodium lauryl sulfate':   { status: 'caution', ewgScore: 4, function: 'Surfactant', description: 'SLS — strong detergent. Can disrupt skin barrier, cause irritation and mouth ulcers.' },
  'sodium laureth sulfate':  { status: 'caution', ewgScore: 4, function: 'Surfactant', description: 'SLES — milder than SLS but may be contaminated with 1,4-dioxane (potential carcinogen).' },
  'fragrance':               { status: 'caution', ewgScore: 5, function: 'Fragrance',  description: '"Fragrance" can hide 3000+ chemicals. Common allergen. Can cause respiratory and skin reactions.' },
  'parfum':                  { status: 'caution', ewgScore: 5, function: 'Fragrance',  description: 'Same as "fragrance" — opaque umbrella term for undisclosed chemical cocktails.' },
  'artificial flavor':       { status: 'caution', ewgScore: 4, function: 'Flavoring',  description: 'Synthetic flavoring chemicals. May contain allergens or petrochemical derivatives.' },
  'artificial color':        { status: 'caution', ewgScore: 4, function: 'Color',      description: 'Synthetic azo or coal-tar dyes. Some linked to hyperactivity in children (Southampton 6).' },
  'aspartame':               { status: 'caution', ewgScore: 6, function: 'Sweetener',  description: 'IARC 2B "possibly carcinogenic" (2023). Contains phenylalanine — harmful to PKU patients.' },
  'acesulfame':              { status: 'caution', ewgScore: 5, function: 'Sweetener',  description: 'Ace-K artificial sweetener. Limited long-term safety data. Some carcinogenicity concerns in animal studies.' },
  'sucralose':               { status: 'caution', ewgScore: 4, function: 'Sweetener',  description: 'Chlorinated sugar. 600× sweeter. Some gut microbiome disruption studies.' },
  'saccharin':               { status: 'caution', ewgScore: 5, function: 'Sweetener',  description: 'Oldest artificial sweetener. Some gut microbiome concerns. Previously carcinogen-listed.' },
  'propylene glycol':        { status: 'caution', ewgScore: 4, function: 'Humectant',  description: 'Common cosmetic/food humectant. May cause skin irritation at high concentrations. Found in antifreeze.' },
  'polyethylene glycol':     { status: 'caution', ewgScore: 4, function: 'Humectant',  description: 'PEG compounds enhance skin absorption of other chemicals. May contain 1,4-dioxane contaminant.' },
  'titanium dioxide':        { status: 'caution', ewgScore: 5, function: 'Color/Opacifier', description: 'BANNED in EU food (2022). Still in cosmetics. Nano-form concerns (inhaled form is carcinogenic).' },
  'talc':                    { status: 'caution', ewgScore: 6, function: 'Anti-caking/Absorbent', description: 'Historical asbestos contamination risk. Inhaled talc is lung carcinogen. FDA warned about baby powder.' },
  'mineral oil':             { status: 'caution', ewgScore: 5, function: 'Moisturizer',description: 'Petroleum derivative. Untreated/mildly treated mineral oils are IARC Group 1 carcinogens. Cosmetic grade is refined.' },
  'petrolatum':              { status: 'caution', ewgScore: 4, function: 'Moisturizer',description: 'Refined petroleum jelly (Vaseline). EU restricts non-food grade. Generally safe when fully refined.' },
  'bha':                     { status: 'risk',    ewgScore: 8, function: 'Antioxidant', description: 'Butylated hydroxyanisole — IARC Group 2B possible carcinogen. Endocrine disruptor.' },
  'bht':                     { status: 'caution', ewgScore: 6, function: 'Antioxidant', description: 'Butylated hydroxytoluene — possible carcinogen and endocrine disruptor.' },
  'monosodium glutamate':    { status: 'caution', ewgScore: 4, function: 'Flavor Enhancer', description: 'MSG — very high sodium. Some people experience "MSG symptom complex" (headache, flushing). GRAS in USA.' },
  'sodium nitrate':          { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Forms nitrosamines — IARC Group 2A carcinogens. Linked to colorectal cancer. In processed meats.' },
  'sodium nitrite':          { status: 'risk',    ewgScore: 7, function: 'Preservative', description: 'Nitrosamine formation. WHO: processed meat (containing nitrites) is Group 1 carcinogen for colorectal cancer.' },
  'carrageenan':             { status: 'caution', ewgScore: 4, function: 'Thickener',  description: 'From red seaweed. GI inflammation studies in animals. Some people avoid due to IBD concerns.' },
  'palm oil':                { status: 'caution', ewgScore: 3, function: 'Fat',         description: 'High in saturated fat. Major driver of deforestation and biodiversity loss. RSPO certification available.' },
  'palm kernel oil':         { status: 'caution', ewgScore: 4, function: 'Fat',         description: 'Higher saturated fat than palm oil. Same deforestation concerns.' },
  'trans fat':               { status: 'risk',    ewgScore: 9, function: 'Fat',         description: 'Partially hydrogenated oils. WHO target: eliminate from global food supply. Linked to heart disease.' },
  'partially hydrogenated':  { status: 'risk',    ewgScore: 9, function: 'Fat',         description: 'Source of artificial trans fat. FDA banned in USA (2015). Raises LDL, lowers HDL cholesterol.' },
  'hydrogenated fat':        { status: 'caution', ewgScore: 6, function: 'Fat',         description: 'Fully hydrogenated fats are trans-fat free but high in saturated fat.' },
  'bromated flour':          { status: 'risk',    ewgScore: 8, function: 'Flour treatment', description: 'Potassium bromate — possible carcinogen (IARC Group 2B). Banned in UK, EU, Canada, China. Still legal in USA.' },
  'sodium benzoate':         { status: 'caution', ewgScore: 5, function: 'Preservative', description: 'Reacts with Vitamin C to form benzene (carcinogen). Can cause hyperactivity in children.' },
  'tbhq':                    { status: 'risk',    ewgScore: 8, function: 'Antioxidant', description: 'tert-Butylhydroquinone — carcinogenic in animals at high doses. Banned in Japan.' },

  // ── Safe but notable ingredients ─────────────────────────────────────────
  'water':                   { status: 'safe', ewgScore: 1, function: 'Solvent',      description: 'Purified water base.' },
  'glycerin':                { status: 'safe', ewgScore: 1, function: 'Humectant',    description: 'Natural humectant derived from plant or animal fats. Excellent moisturizer.' },
  'glycerol':                { status: 'safe', ewgScore: 1, function: 'Humectant',    description: 'Same as glycerin. Common in foods and cosmetics. Safe.' },
  'cetyl alcohol':           { status: 'safe', ewgScore: 1, function: 'Emollient',    description: 'Fatty alcohol (not drying). Softens and conditions skin. Not an irritating alcohol.' },
  'stearic acid':            { status: 'safe', ewgScore: 1, function: 'Emollient',    description: 'Common saturated fatty acid. Used in moisturizers and soaps.' },
  'niacinamide':             { status: 'safe', ewgScore: 1, function: 'Active',       description: 'Vitamin B3. Improves skin barrier, reduces hyperpigmentation, anti-inflammatory.' },
  'hyaluronic acid':         { status: 'safe', ewgScore: 1, function: 'Humectant',    description: 'Naturally occurring in the body. Excellent moisturizer. Holds 1000× its weight in water.' },
  'retinol':                 { status: 'caution', ewgScore: 4, function: 'Active',    description: 'Vitamin A derivative. Very effective but can cause irritation, sun sensitivity. Avoid in pregnancy.' },
  'vitamin c':               { status: 'safe', ewgScore: 1, function: 'Antioxidant',  description: 'Ascorbic acid. Potent antioxidant. Brightens skin. Boosts collagen production.' },
  'ascorbic acid':           { status: 'safe', ewgScore: 1, function: 'Antioxidant',  description: 'Vitamin C. Note: can react with sodium benzoate to form benzene.' },
  'tocopherol':              { status: 'safe', ewgScore: 1, function: 'Antioxidant',  description: 'Vitamin E. Natural antioxidant. Protects cell membranes.' },
  'zinc oxide':              { status: 'safe', ewgScore: 2, function: 'UV Filter/Active', description: 'Mineral sunscreen. Broad-spectrum UVA/UVB protection. Soothing for inflamed skin.' },
  'snail secretion filtrate': { status: 'safe', ewgScore: 1, function: 'Active',     description: 'Snail mucin. Contains glycoprotein enzymes, hyaluronic acid. Promotes skin regeneration.' },
  'aloe vera':               { status: 'safe', ewgScore: 1, function: 'Soothing',    description: 'Aloe barbadensis gel. Soothing, anti-inflammatory. Hydrating.' },
  'centella asiatica':       { status: 'safe', ewgScore: 1, function: 'Active',      description: 'Cica. Promotes wound healing, anti-inflammatory. Popular in K-beauty.' },
  'green tea':               { status: 'safe', ewgScore: 1, function: 'Antioxidant', description: 'Camellia sinensis extract. Antioxidant polyphenols (EGCG). Anti-inflammatory.' },
  'salicylic acid':          { status: 'caution', ewgScore: 4, function: 'Exfoliant/Keratolytic', description: 'Beta hydroxy acid. Effective for acne. Can cause irritation. Avoid in pregnancy at high concentrations.' },
  'lactic acid':             { status: 'safe', ewgScore: 2, function: 'Exfoliant/pH adjuster', description: 'Alpha hydroxy acid. Mild exfoliant. Hydrating. Derived from fermentation.' },

  // ── Common Allergens ──────────────────────────────────────────────────────
  'gluten':          { status: 'caution', ewgScore: 3, function: 'Protein',    isAllergen: true, description: 'Protein in wheat/rye/barley. Toxic for celiac disease. Sensitivity in many others.' },
  'wheat':           { status: 'caution', ewgScore: 3, function: 'Cereal',     isAllergen: true, description: 'Common allergen. Contains gluten. Major trigger for celiac disease.' },
  'milk':            { status: 'caution', ewgScore: 3, function: 'Dairy',      isAllergen: true, vegan: false, description: 'Common allergen. Contains lactose and casein. Lactose intolerance very common.' },
  'egg':             { status: 'caution', ewgScore: 2, function: 'Binder',     isAllergen: true, vegan: false, description: 'Common allergen. Egg white (albumin) is the main allergen component.' },
  'soy':             { status: 'caution', ewgScore: 3, function: 'Protein',    isAllergen: true, description: 'Common allergen. Phytoestrogens may affect hormone levels at high intake.' },
  'peanut':          { status: 'caution', ewgScore: 4, function: 'Nut',        isAllergen: true, description: 'One of the most common severe allergens. Anaphylaxis risk.' },
  'tree nuts':       { status: 'caution', ewgScore: 4, function: 'Nut',        isAllergen: true, description: 'Common severe allergens. Includes almonds, cashews, walnuts, pecans, etc.' },
  'fish':            { status: 'caution', ewgScore: 3, function: 'Protein',    isAllergen: true, vegan: false, description: 'Common allergen. Contains finfish proteins (parvalbumin).' },
  'shellfish':       { status: 'caution', ewgScore: 3, function: 'Protein',    isAllergen: true, vegan: false, description: 'Common allergen. Includes crustaceans and mollusks.' },
  'sesame':          { status: 'caution', ewgScore: 3, function: 'Seed',       isAllergen: true, description: '9th major allergen (US since 2023). Sesamin and sesamolin are major allergens.' },
  'sulphite':        { status: 'caution', ewgScore: 4, function: 'Preservative', isAllergen: true, description: 'Sulphite/sulfite compounds can trigger severe asthma attacks.' },
  'sulfite':         { status: 'caution', ewgScore: 4, function: 'Preservative', isAllergen: true, description: 'Same as sulphite. Asthma and anaphylaxis risk in sensitive individuals.' },
  'celery':          { status: 'caution', ewgScore: 2, function: 'Vegetable',  isAllergen: true, description: 'EU-listed allergen. Can cause severe reactions in sensitive individuals.' },
  'mustard':         { status: 'caution', ewgScore: 2, function: 'Spice',      isAllergen: true, description: 'EU-listed allergen. Contains sinigrin and sinalbin allergens.' },
  'lupin':           { status: 'caution', ewgScore: 3, function: 'Legume',     isAllergen: true, description: 'EU-listed allergen. Cross-reactive with peanut allergy. Increasingly used in GF products.' },
};

// ── Lookup Functions ─────────────────────────────────────────────────────────

export function lookupAdditive(eCode: string): Additive | null {
  const key = eCode.toUpperCase().replace('EN:', '').trim();
  const entry = ADDITIVE_DB[key];
  if (!entry) return null;
  return { code: key, ...entry };
}

export function lookupIngredient(name: string): Partial<IngredDB> | null {
  const lc = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(INGREDIENT_DB)) {
    if (lc.includes(key)) return val;
  }
  return null;
}

export function parseAdditiveTag(tag: string): string {
  // "en:e102" → "E102"
  return tag.replace('en:', '').replace('fr:', '').toUpperCase();
}

export function buildAdditives(additiveTags: string[]): Additive[] {
  return additiveTags
    .map(tag => lookupAdditive(parseAdditiveTag(tag)))
    .filter(Boolean) as Additive[];
}

export function analyzeIngredient(rawName: string): Partial<IngredDB> {
  const found = lookupIngredient(rawName);
  return found ?? { status: 'safe', function: 'Ingredient', description: 'ส่วนประกอบทั่วไป ไม่พบข้อมูลความเสี่ยงในฐานข้อมูล' };
}

// Daily Value reference amounts (for nutrition bar calculations)
export const DAILY_VALUES = {
  calories: 2000,    // kcal
  protein: 50,       // g
  fat: 78,           // g
  saturatedFat: 20,  // g
  carbs: 275,        // g
  sugar: 50,         // g (added sugar)
  fiber: 28,         // g
  sodium: 2300,      // mg
  cholesterol: 300,  // mg
  potassium: 4700,   // mg
  calcium: 1300,     // mg
  iron: 18,          // mg
  vitaminC: 90,      // mg
  vitaminA: 900,     // µg
  vitaminD: 20,      // µg
  vitaminE: 15,      // mg
  vitaminK: 120,     // µg
  vitaminB1: 1.2,    // mg
  vitaminB2: 1.3,    // mg
  vitaminB3: 16,     // mg
  vitaminB6: 1.7,    // mg
  vitaminB9: 400,    // µg
  vitaminB12: 2.4,   // µg
  magnesium: 420,    // mg
  phosphorus: 1250,  // mg
  zinc: 11,          // mg
  selenium: 55,      // µg
};
