import { PracticePassage } from '../types';

export const PRACTICE_LIBRARY: PracticePassage[] = [
  // ================= COURT & LEGAL (CLERK EXAMS) =================
  {
    id: 'legal-01',
    title: 'Supreme Court on Fundamental Rights & Due Process',
    category: 'legal',
    difficulty: 'Exam',
    wordCount: 185,
    estimatedMinutes: 5,
    description: 'Constitutional law passage formatted specifically for High Court and State Clerk typing assessments.',
    text: `The Constitution of India guarantees to all its citizens fundamental rights under Part III, which form the bedrock of our democratic society. Article 21 guarantees that no person shall be deprived of his life or personal liberty except according to procedure established by law. The Hon'ble Supreme Court has repeatedly held that such procedure must be just, fair, and reasonable, and not arbitrary, fanciful, or oppressive. In exercising judicial review, the High Courts under Article 226 possess wide powers to issue writs for the enforcement of fundamental rights and for any other purpose. The rule of law requires that every executive action must be supported by statutory authority and conform to principles of natural justice, ensuring audi alteram partem is followed before any adverse order is passed.`
  },
  {
    id: 'legal-02',
    title: 'Civil Procedure & Code of Criminal Procedure Standards',
    category: 'legal',
    difficulty: 'Exam',
    wordCount: 168,
    estimatedMinutes: 5,
    description: 'Court clerk typing test passage containing standard legal phraseology, Latin maxims, and statutory terms.',
    text: `In the Court of the District and Sessions Judge, an application under Order XXXIX Rules 1 and 2 read with Section 151 of the Code of Civil Procedure was filed seeking ad-interim temporary injunction. The plaintiff pleaded a prima facie case, balance of convenience, and irreparable injury. The learned counsel for the defendant contended that the suit was barred by limitation under the Limitation Act, 1963. Having perused the pleadings, documentary evidence, and revenue records placed on record, this court is of the considered opinion that status quo must be maintained regarding the suit property pending final adjudication. Notice of motion is issued to the respondents returnable for the next date of hearing.`
  },
  {
    id: 'legal-03',
    title: 'Evidence Act & Burden of Proof in Criminal Trials',
    category: 'legal',
    difficulty: 'Hard',
    wordCount: 154,
    estimatedMinutes: 4,
    description: 'Evidence and prosecution analysis passage with rigorous punctuation and legal vocabulary.',
    text: `Under the Indian Evidence Act, the initial burden of proving guilt lies squarely upon the prosecution beyond reasonable doubt. Circumstantial evidence requires that each link in the chain of circumstances must be firmly established, leading to an inescapable conclusion consistent only with the guilt of the accused. The testimony of an eyewitness cannot be discarded merely due to minor discrepancies, provided the core narrative remains credible. Section 27 enables the discovery of material facts based upon voluntary disclosure statements made in police custody, subject to strict procedural safeguards.`
  },

  // ================= SSC EXAM PASSAGES =================
  {
    id: 'ssc-01',
    title: 'SSC Standard: Economic Growth & Digital Public Infrastructure',
    category: 'ssc',
    difficulty: 'Exam',
    wordCount: 204,
    estimatedMinutes: 6,
    description: 'Official SSC CHSL / CGL typing test style essay on digital infrastructure, governance, and financial inclusion.',
    text: `India has witnessed a remarkable transformation in its economic landscape through the rapid expansion of digital public infrastructure. The convergence of biometric identification, high-speed mobile connectivity, and unified payments interface has democratized financial services across semi-urban and rural areas. Small entrepreneurs and street vendors now transact digitally with minimal transaction costs, fostering formalization of the economy. Government welfare schemes now directly credit benefits into beneficiary accounts, eliminating leakages and intermediaries. However, sustained economic momentum demands continuous investment in digital literacy, cybersecurity architecture, and rural broadband infrastructure. As our national GDP expands towards becoming the third largest economy in the world, sustainable industrial manufacturing and service sector productivity must progress hand in hand to generate inclusive employment opportunities for young professionals.`
  },
  {
    id: 'ssc-02',
    title: 'SSC Standard: Sustainable Urbanization and Climate Resilience',
    category: 'ssc',
    difficulty: 'Medium',
    wordCount: 172,
    estimatedMinutes: 5,
    description: 'Environmental policy essay frequently featured in staff selection commission examinations.',
    text: `Modern cities serve as primary engines of economic innovation and industrial growth, yet they face severe environmental challenges. Rapid urbanization strains municipal resources, leading to water scarcity, traffic congestion, and deteriorating air quality indices. To build resilient urban centers, planners must integrate circular economy principles, renewable energy grids, and decentralized solid waste management. Public transit networks, such as electric bus fleets and metro rails, offer energy-efficient commuting alternatives while curtailing vehicular emissions. Preserving urban wetlands, water reservoirs, and green buffer zones mitigates extreme heat wave effects and prevents seasonal flash flooding in expanding metropolitan zones.`
  },

  // ================= LITERATURE & SPEECHES =================
  {
    id: 'lit-01',
    title: 'Dr. APJ Abdul Kalam: Wings of Fire Reflection',
    category: 'literature',
    difficulty: 'Medium',
    wordCount: 162,
    estimatedMinutes: 4,
    description: 'Inspiring prose by India’s missile man and beloved president on dedication, dreams, and perseverance.',
    text: `Dreams are not that which you see while sleeping, dreams are those which do not let you sleep. If you want to shine like a sun, first burn like a sun. All of us do not have equal talent, but all of us have an equal opportunity to develop our talents. Look at the sky; we are not alone. The whole universe is friendly to us and conspires only to give the best to those who dream and work. To succeed in your mission, you must have single-minded devotion to your goal. When you encounter difficulties, do not lose hope, because even the darkest night will end and the sun will rise again.`
  },
  {
    id: 'lit-02',
    title: 'Steve Jobs: Stay Hungry, Stay Foolish',
    category: 'literature',
    difficulty: 'Easy',
    wordCount: 156,
    estimatedMinutes: 4,
    description: 'Extract from the famous Stanford commencement address about purpose and time.',
    text: `Your time is limited, so do not waste it living someone else's life. Do not be trapped by dogma, which is living with the results of other people's thinking. Do not let the noise of others' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition. They somehow already know what you truly want to become. Everything else is secondary. Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. You are already naked. There is no reason not to follow your heart.`
  },

  // ================= TECH & CODE =================
  {
    id: 'tech-01',
    title: 'Web Engineering: React, Virtual DOM & State',
    category: 'tech',
    difficulty: 'Hard',
    wordCount: 140,
    estimatedMinutes: 4,
    description: 'Technical writing containing programming terms, camelCase tokens, and architectural concepts.',
    text: `React declarative UI architecture relies upon the Virtual DOM to reconcile state changes efficiently. When a component state updates via useState or useReducer hooks, React generates a lightweight virtual representation and computes the minimal diff against the previous fiber tree. Pure functional components paired with useMemo and useCallback prevent unnecessary re-renders in deep component hierarchies. Modern web bundles leverage Vite and Rollup code splitting to ensure fast initial page load metrics and optimal First Contentful Paint times.`
  },

  // ================= NUMBERS & DATA ENTRY =================
  {
    id: 'num-01',
    title: 'Financial Balance Sheet & Account Data Entry',
    category: 'numbers',
    difficulty: 'Hard',
    wordCount: 130,
    estimatedMinutes: 4,
    description: 'Heavy alphanumeric data entry with currency figures, percentages, dates, and account numbers.',
    text: `Invoice No: INV-2026-8941 dated 15/08/2026. Account Holder: Mohit Kumar, GSTIN: 06AAACH7892P1Z4. Total billable amount: Rs. 48,750.00 with CGST @ 9% amounting to Rs. 4,387.50 and SGST @ 9% amounting to Rs. 4,387.50. Net payable: Rs. 57,525.00. Payment due within 30 days via NEFT transaction code TXN98721456 to HDFC Bank A/C No: 50100432198765, IFSC Code: HDFC0001234.`
  },

  // ================= HINDI TYPING PASSAGES (MANGAL & KRUTIDEV) =================
  {
    id: 'hindi-01',
    title: 'हिंदी न्यायपालिका एवं संविधान: मौलिक अधिकार व कर्तव्य',
    category: 'hindi',
    difficulty: 'Exam',
    wordCount: 145,
    estimatedMinutes: 5,
    description: 'उच्च न्यायालय एवं राज्य लिपिक परीक्षा हेतु मानक हिंदी विधिक गद्यांश (मंगल इनस्क्रिप्ट / कृतिदेव)।',
    text: `भारत का संविधान प्रत्येक नागरिक को समता, स्वतंत्रता, और बंधुता का मौलिक अधिकार प्रदान करता है। लोकतांत्रिक व्यवस्था में स्वतंत्र न्यायपालिका संविधान की संरक्षक के रूप में कार्य करती है। उच्च न्यायालय एवं जिला न्यायालयों में न्यायिक आदेशों, निर्णयों तथा दैनिक पत्राचार का शुद्ध एवं त्वरित गति से टंकण करना न्यायालय प्रशासन की सफलता के लिए अनिवार्य है। एक कुशल लिपिक को टंकण करते समय मात्राओं, विराम चिन्हों तथा व्याकरणिक नियमों का विशेष ध्यान रखना चाहिए।`
  },
  {
    id: 'hindi-02',
    title: 'हिंदी प्रशासनिक पत्राचार: ई-गवर्नेंस व कार्यालय ज्ञापन',
    category: 'hindi',
    difficulty: 'Exam',
    wordCount: 135,
    estimatedMinutes: 5,
    description: 'राज्य सचिवालय एवं लिपिकीय भर्ती हेतु आधिकारिक शासकीय कार्यप्रणाली गद्यांश।',
    text: `हरियाणा राज्य सरकार द्वारा समस्त विभागों में ई-ऑफिस एवं डिजिटल कार्यप्रणाली को अनिवार्य रूप से लागू किया गया है। सभी सहायकों एवं लिपिकों से अपेक्षा की जाती है कि वे दैनिक फाइलों, ज्ञापनों एवं शासकीय आदेशों का प्रारूपण समयबद्ध सीमा के भीतर पूर्ण करें। आधुनिक प्रशासनिक व्यवस्था में गति और सटीकता का समन्वय ही सुशासन का आधार है।`
  },
  {
    id: 'hindi-03',
    title: 'हिंदी साहित्य एवं प्रेरणा: कर्मयोग व लक्ष्य साधना',
    category: 'hindi',
    difficulty: 'Medium',
    wordCount: 125,
    estimatedMinutes: 4,
    description: 'मुंशी प्रेमचंद एवं राष्ट्रकवि दिनकर के विचारों से प्रेरित साहित्य गद्यांश।',
    text: `साहित्य मानव जीवन को नई दिशा एवं ऊर्जा प्रदान करता है। जब मनुष्य अपने कर्तव्य पथ पर निष्ठापूर्वक अग्रसर होता है, तब मार्ग की सभी बाधाएं स्वतः समाप्त हो जाती हैं। निरंतर अभ्यास ही कौशल को निखारता है। यदि आप प्रतिदिन एकाग्रचित्त होकर अभ्यास करेंगे, तो सफलता अवश्य आपके कदम चूमेगी।`
  },
  {
    id: 'hindi-04',
    title: 'हिंदी संख्यात्मक व सांख्यिकीय अभिलेख गद्यांश',
    category: 'hindi',
    difficulty: 'Hard',
    wordCount: 120,
    estimatedMinutes: 4,
    description: 'संख्यात्मक तिथियों, प्रतिशत एवं बजट आंकड़ों से युक्त विशेष हिंदी परीक्षा गद्यांश।',
    text: `वर्ष 2024-25 के वार्षिक वित्तीय बजट में तकनीकी शिक्षा हेतु 12,500 करोड़ रुपये का प्रावधान किया गया है। राज्य के 22 जिलों में कुल 85,000 अभ्यर्थियों ने लिपिकीय परीक्षा दी। सफल होने के लिए न्यूनतम 30 शब्द प्रति मिनट की गति तथा 90% शुद्धता आवश्यक है।`
  },

  // ================= FINGER COLLISION & NEIGHBOR DISCRIMINATOR DRILLS =================
  {
    id: 'collision-left-index',
    title: '🎯 Left Index Multi-Reach Isolator (R-T vs F-G vs V-B)',
    category: 'collision',
    difficulty: 'Hard',
    wordCount: 230,
    estimatedMinutes: 5,
    description: 'Specialized drill targeting Left Index spatial overshoot between standard column (R-F-V) and inner column (T-G-B).',
    text: `rt tr rtr trt frt grt vrt brt trf trg trv trb fg gf fgf gfg fvg gvb fbg gbf vb bv vbv bvb. tree rare rate tart rust torn root trap trip rent part start first track trend trust treat trade train trial gift flag frog golf fog fig farm gate graft fight flight front forge guard figure brave view vibe verb above valve bevel behave verbal vibrant bravo cable viable novel vivid. Trust the true track and start the right trial for every smart trend. Fast flights from foreign gates bring great gifts for friendly guests. Brave viewers observe vibrant debates about viable public benefits. Great trainers treat their teams with total respect and rare trust. Faithful figures follow formal fighting guidelines with great focus. Brief verbal briefings above the vibrant harbor give valuable observations. Giving forward gifts fosters good feelings among firm friends. Better behaviour and bold vision provide viable benefits for all citizens. Track the true target before giving greater trust to strange travelers. Very brave guards protect the green valley from foreign threats. Return forty great gifts to the vibrant bridge after the third train departs.`
  },
  {
    id: 'collision-right-index',
    title: '🎯 Right Index Multi-Reach Isolator (U-Y vs J-H vs M-N)',
    category: 'collision',
    difficulty: 'Hard',
    wordCount: 225,
    estimatedMinutes: 5,
    description: 'Decouples Right Index home-column anchors (U-J-M) from deep inner-reach columns (Y-H-N).',
    text: `uy yu uyu yuy juy huy muy nuy yuj yuh yum yun jh hj jhj hjh hjm jhn hnu unh mn nm mnm nmn jmn hmn. your duty ugly ruby busy yarn youth jury unit user young study yummy buyer fully unify lucky join hand jump help just hung judge hero journey human margin normal money month manner name nation night. Your youthful study of unified duties yields truly unique results. Young buyers usually study dynamic yearly output under busy jury scrutiny. Stay truly loyal during your daily study until your duty yields victory. Just join human hands to help hungry neighbors find hope and harmony. Modern men manage money each month with mature minds and noble manners. Many young men join handy journey groups near high northern hills. Happy humans jump with joy when noble youth maintain normal harmony. Young users judge heavy machinery using modern numerical measures. Study yearly journals to understand dynamic monetary movements.`
  },
  {
    id: 'collision-ring-middle-left',
    title: '🎯 Left Ring vs Middle Tendon Disentangler (W-S-X vs E-D-C)',
    category: 'collision',
    difficulty: 'Hard',
    wordCount: 235,
    estimatedMinutes: 5,
    description: 'Eliminates neuro-muscular tendon coupling between Left Ring (W-S-X) and Left Middle (E-D-C).',
    text: `we ew wew ewe swe dewe qwe rwe sew dew few gew sd ds sds dsd asd fsd dsa dsf sed des sid dis xc cx xcx cxc sxc dxe csw xde. west week weep sweat swear sewer wheat vowel sweet tower power lower water where wheel jewel screw said side sand send desk dust dusk shed seed salad slid soda stand sound spend speed exact exit exist extra exam index except excuse exceed echo. Sweet western winds sweep over wet wheat fields every few weeks. We will work with great power whenever water flows west into the town. Wise workers welcome sweet rewards whenever well earned wins show. Send standard desks and side stands to students sitting inside. Sound decisions said during sad days send steady signs of speed. She slid side salads onto solid wooden stands beside the desk. Extra examiners expect exact index records except during scheduled exercise hours. Excellent scholars execute extensive code examples with steady calmness. Sweet dreams descend when wise students dedicate time to study exact science.`
  },
  {
    id: 'collision-middle-index-left',
    title: '🎯 Left Middle vs Index Boundary Filter (E-D-C vs R-F-V)',
    category: 'collision',
    difficulty: 'Medium',
    wordCount: 220,
    estimatedMinutes: 5,
    description: 'Sharpen finger boundary discrimination between Left Middle (E-D-C) and Left Index (R-F-V).',
    text: `ed rf der fer red fed ced ved dec ref cer rev fed der red ced ved drer frcr vred cfer. ever real rare read free peer deer fear refer reform record river order server driver reaper draft drift fever diver cradle cedar craft direct defer defender credit create. Refer every rare report directly to senior leaders for rapid review. Free drivers read clear road records near the river with great care. Reform orders require real energy from every proper worker. Dedicated drivers deliver fresh food every Friday without delay. Craft clever code directly from verified draft blueprints. Defenders defend freedom and create clean credit records for every citizen. Direct every reference to friendly officers for deep verification. Great leaders decide fair decrees after hearing diverse civil cases.`
  },
  {
    id: 'collision-middle-ring-right',
    title: '🎯 Right Middle vs Ring Disentangler (I-K-, vs O-L-.)',
    category: 'collision',
    difficulty: 'Hard',
    wordCount: 230,
    estimatedMinutes: 5,
    description: 'Separates Right Middle (I-K-,) from Right Ring (O-L-.) to prevent neighbor cross-talk during rapid flow.',
    text: `io oi ioi oio kio lio oik oil oki oli poi iop kl lk klk lkl jkl lkj kol lok kil lik kal lak ik ol il ko koi loki ilo kol. iron lion coil foil join coin void soil boil point onion option orbit poison action motion logic look like link lake lock milk silk folk kill walk talk calm clerk black blank flock lucky polite policy pilot kilo solar folio solid liquid. Join the official mission to inspect important options with iron discipline. Lions roam into moist soil looking for solid points on the horizon. Curious citizens notice optical illusions pointing into outer orbit. Skilled clerks look like keen leaders walking slowly along lake locks. Folk like looking into black silk locks with calm and loyal skill. Kind clerks quickly lock all likely links with clear knowledge. Polite pilots follow policy guidelines while locking solid flight plans. Maintain calm logic and solid focus until official solutions appear.`
  },
  {
    id: 'collision-pinky-isolation',
    title: '🎯 Pinky Perimeter & Outer Anchor Shield (Q-A-Z vs W-S-X)',
    category: 'collision',
    difficulty: 'Hard',
    wordCount: 220,
    estimatedMinutes: 5,
    description: 'Builds neuromuscular independence for Left Pinky (Q-A-Z) without dragging the Ring Finger (W-S-X).',
    text: `qa aq qaq aqa za az zaz aza qz zq qzq zqz swa dza xza qws azx sqa wzs. quick quiet quote squad equal aqua award aware admit amaze alias adapt asset zone zero zinc zoom zeal jazz maze gaze hazard frozen plaza prize puzzle. Quick squads adapt quiet quotes with equal zeal and awareness. Amazing athletes acquire awards after zero errors in difficult zones. Always admit quotes from qualified authors into the official Gazette. Puzzle solvers analyze complex hazards with calm zeal and quick wisdom. Zeal for quality and equal access inspires great modern plazas. Liquid zinc and quartz produce quiet sparks inside frozen zones. Always organize and stabilize every difficult task with patience.`
  },

  // ================= RIGHT HAND SPECIAL MODE & DEXTERITY PASSAGES =================
  {
    id: 'rh-01-core',
    title: '✋ Right Hand Core Isolation (J-K-L-; & U-I-O-P)',
    category: 'righthand',
    difficulty: 'Medium',
    wordCount: 195,
    estimatedMinutes: 5,
    description: 'Specialized isolation drill targeting Right Index, Middle, Ring & Pinky key coordination without left hand assistance.',
    text: `jkl; ;lkj uiop poiu juki lopi hjnm mnhj jkl; uiop poiu lkj; yuiop hjkl; nm,./ ;lkj. look loop pool kill silk milk pink jolly monk look milk hill pulp jump onion join loop moon plum hook junk hymn holy oily lion coin foil join look like link pool loop plum pink punk jump monk milk hull lull kill look jolly puppy imply oily pony lion. Looking upon moist soil in July, millions of lively monks imply pure joy. Jolly monks look like joyful souls jumping into oily pools of milk. Only holy monks politely join lively links on high hills. Point out pink plums in jolly July into milk pots. Jump into lively pools looking upon pink lilies with joyful optimism. Milking lively ponies in July looks like joyful play for kind monks. Join jolly monks looking into milk pools on high hills politely.`
  },
  {
    id: 'rh-02-index-reach',
    title: '✋ Right Index Heavy Reach (H-J-Y-U-N-M & 6-7)',
    category: 'righthand',
    difficulty: 'Hard',
    wordCount: 205,
    estimatedMinutes: 5,
    description: 'Calibrates the heavily loaded Right Index finger across 6 distinct alphanumeric targets (H, J, Y, U, N, M, 6, 7).',
    text: `jh hj yu uy mn nm yhn ujm 76 67 hj nm yu jm hy un my nh jy hu mu ny mh ju yn hm jm. human hymn hunter hungry money honey month young youth humor human myth rhythm union mummy tummy funny sunny nylon myth hymn young humor yummy sunny numpy mummy. Young hunters hunt hungry monkeys in sunny months with youthful humor. Many young humans honor human rhythm in July without money. Youthful hunters humming hymns hunt hungry monkeys on sunny mountains. Mummy hums funny hymns in July while making yummy honey muffins. Sunny months bring yummy honey and young humming monkeys to humid hills. Many youthful humans make money by making sunny nylon umbrellas. Hunt hungry monkeys with youthful humor in humid mountain months. Humming hymns in July honors many youthful minds with human warmth.`
  },
  {
    id: 'rh-03-pinky-punct',
    title: '✋ Right Pinky Punctuation & Anchor (; : \' " , . / ? P 0 - =)',
    category: 'righthand',
    difficulty: 'Exam',
    wordCount: 180,
    estimatedMinutes: 5,
    description: 'Exclusively exercises the Right Pinky perimeter keys—semicolons, apostrophes, commas, periods, slashes, and dashes.',
    text: `p; ;p p' 'p p/ /p p- -p p= =p ;' ', '. '. '/ '/ p; p' ;/ ;- ;= p0 0p p[ p] ;: '" ,< .> /? pop's; John's; plan; quote; "point"; input/output; top-down; step-by-step; self-help; co-op; 100%; item-1; item-2; loop; plum; prompt; puppy; reply; paper; polar; proper. John's proposal was clear: "Prepare proper papers; review output; verify input." The clerk's report said: "Point 01: Verify step-by-step; Point 02: Keep proper records; Point 03: File reports promptly." People's primary policy implies: keep calm, type properly, and point out mistakes promptly. Philip's puppy jumped: "Look, Philip! The paper is flying; catch it promptly!" Proper punctuation requires patient practice; feel each key: semicolon, period, apostrophe, and slash.`
  },
  {
    id: 'rh-04-right-flow',
    title: '✋ Right Hand High-Density Flow Mastery',
    category: 'righthand',
    difficulty: 'Hard',
    wordCount: 220,
    estimatedMinutes: 6,
    description: 'Fluency passage where over 70% of characters are struck by the right hand, developing effortless right-hand stamina.',
    text: `You know him politely; look upon his million joyful opinions in July. Holy monks look into plump pink plums with kindly, joyful humor. Millions of people look up into sunny mountain points on jolly mornings. Only you might imply proper policy in your official output; keep smiling kindly. Many young pilgrims look upon high holy mountains in jolly July. You might look into his plump pupil; politely join him in singing hymns. Jolly monks milk plump cows in July, looking upon hills with pure optimism. You know my young cousin Philip; he joyfully prompts kind replies upon official papers. You might easily look up millions of sunny points on popular online maps. Kindly join him on his mission into high holy hills in sunny July.`
  }
];

