import { FingerId } from '../components/HandsGuide';

export type MotorDrillTier = 'patterns' | 'words' | 'sentences';

export type MotorCategory = 'all' | 'coupled' | 'index' | 'cascades' | 'bilateral' | 'perimeter';

export interface FingerMotorModule {
  id: string;
  title: string;
  category: 'coupled' | 'index' | 'cascades' | 'bilateral' | 'perimeter';
  categoryLabel: string;
  anatomicalDigits: string;
  hand: 'left' | 'right' | 'both';
  fingerIds: FingerId[];
  targetKeys: string[];
  biomechanicalFocus: string;
  clinicalRationale: string;
  modes: {
    patterns: {
      title: string;
      description: string;
      text: string;
    };
    words: {
      title: string;
      description: string;
      text: string;
    };
    sentences: {
      title: string;
      description: string;
      text: string;
    };
  };
}

export const FINGER_MOTOR_MODULES: FingerMotorModule[] = [
  {
    id: 'left-ring-pinky',
    title: 'Left Ring & Pinky Independence',
    category: 'coupled',
    categoryLabel: 'Digit Decoupling',
    anatomicalDigits: 'Left Digits IV & V (Ring & Pinky)',
    hand: 'left',
    fingerIds: ['lp', 'lr'],
    targetKeys: ['q', 'a', 'z', 'w', 's', 'x'],
    biomechanicalFocus: 'Juncturae Tendinum Decoupling',
    clinicalRationale: 'The 4th and 5th digits share tendon interconnections. Practicing these clean transitions eliminates involuntary pinky dipping and hesitation between A, S, W, and Z.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Phonemic n-grams and balanced short words activating digits IV & V without repetitive column sliding.',
        text: 'was saw wax swap claws squad sway away slaw swan warp wasp paws sweat dwarf shawl swarm wax was saw swap paws wax squad swan sway claws wasp sweat dwarf swap paws'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Real English vocabulary with concentrated ring-to-pinky and pinky-to-ring transitions.',
        text: 'awake awkward squash squad square squeeze lawsuit backwards glassware catwalk seaward sidewalk workspace lukewarm outward waxwork seawall squabble walkway seaward awkward squeeze squash'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Complete, natural sentences embedding left ring and pinky mechanics in realistic prose.',
        text: 'She was always swift to solve awkward puzzles, drawing quick sketches with wax crayons on the sidewalk. The squad walked past the swamp as the cold autumn wind began to sweep across the small wooden catwalk.'
      }
    }
  },
  {
    id: 'right-ring-pinky',
    title: 'Right Ring & Pinky Independence',
    category: 'coupled',
    categoryLabel: 'Digit Decoupling',
    anatomicalDigits: 'Right Digits IV & V (Ring & Pinky)',
    hand: 'right',
    fingerIds: ['rr', 'rp'],
    targetKeys: ['o', 'l', '.', 'p', ';', '/', '['],
    biomechanicalFocus: 'Metacarpal Branch Decoupling',
    clinicalRationale: 'Decouples deep flexor pathways of digits IV and V, eliminating sluggish responses on common English suffixes (-ple, -ply, -ol, -op) and punctuation.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Fluid right-hand perimeter sequences targeting ring and pinky coordination.',
        text: 'loop pool polo plot spool polyp slip play plus spoil spell apply deploy explore polygon slope plump polar opal pile pop limp pulp pool loop plot polar opal spool'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Authentic words featuring frequent transitions between O, L, and P.',
        text: 'people supply explore policy poplar complex diploma dolphin applaud exploit polymer collapse padlock hopeless pipeline polyp folklore uphold loophole polemic deploy explore supply'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Natural prose exercising the right ring and pinky with realistic punctuation and rhythm.',
        text: 'The company will deploy new policy guidelines to help people explore simple solutions across the complex. Local pilots plot safe loop routes while polar explorers supply food and medical drops near the outpost.'
      }
    }
  },
  {
    id: 'left-middle-ring',
    title: 'Left Middle & Ring Coordination',
    category: 'coupled',
    categoryLabel: 'Digit Decoupling',
    anatomicalDigits: 'Left Digits III & IV (Middle & Ring)',
    hand: 'left',
    fingerIds: ['lm', 'lr'],
    targetKeys: ['e', 'd', 'c', 'w', 's', 'x'],
    biomechanicalFocus: 'Extensor Digitorum Independence',
    clinicalRationale: 'Develops clear neural differentiation between middle (E/D/C) and ring (W/S/X) strokes, mastering English high-frequency digraphs like -ed, -ce, -ws, and -se.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Focused bi-grams and transitions without mindless vertical repetition.',
        text: 'wed dew sew cows news slow drew crew desc west cast cost wide wild weed seed code deck side scale sweet speed sword sweat crowd switch drew slow west cast wide sweet'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'High-frequency words containing alternating middle and ring finger movements.',
        text: 'excuse decide secret switch reduce descend western screen wisdom context deduct witness shadow rescue exclude expand discover desktop wisdom wooden decide secret switch context'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Articulate sentences balancing Left Digits III and IV keystroke cadence.',
        text: 'We decided to reduce excess waste and switch toward wiser decisions across the western district. The secret code was hidden inside a wide wooden desk beside the ancient stone castle.'
      }
    }
  },
  {
    id: 'right-middle-ring',
    title: 'Right Middle & Ring Coordination',
    category: 'coupled',
    categoryLabel: 'Digit Decoupling',
    anatomicalDigits: 'Right Digits III & IV (Middle & Ring)',
    hand: 'right',
    fingerIds: ['rm', 'rr'],
    targetKeys: ['i', 'k', ',', 'o', 'l', '.'],
    biomechanicalFocus: 'Inter-Digit Diphthong Precision',
    clinicalRationale: 'Enhances micro-timing between right middle and ring fingers, optimizing execution of -io, -oi, -ik, -li, -il transitions and comma-period boundaries.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Balanced diphthong patterns focusing on right hand middle and ring fluidity.',
        text: 'oil lion boil foil soil look like silk kiln lock link milk kilo lion void foil loin look like coin join toil silo soil kiln foil coil look lion link milk'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Real words with dense clusters of I, K, O, and L combinations.',
        text: 'billion silicon million collide follicle logic polish online visual motion picnic silken tailor colonial biology boiling looking likely outlook silicon billion collide polish'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Realistic text exercising middle and ring keystrokes in natural discourse.',
        text: 'A billion tiny silicon circuits allow millions of people to link online with visual motion clarity. The quiet librarian likes to polish the antique violin while looking over old folio collections.'
      }
    }
  },
  {
    id: 'left-index-reach',
    title: 'Left Index Lateral Reach & Stability',
    category: 'index',
    categoryLabel: 'Index Extension',
    anatomicalDigits: 'Left Digit II (Index Lateral Range)',
    hand: 'left',
    fingerIds: ['li'],
    targetKeys: ['f', 'r', 'v', 'g', 't', 'b'],
    biomechanicalFocus: 'Carpal Stability & Lateral Abduction',
    clinicalRationale: 'Strengthens index finger horizontal abduction to the central column (T, G, B) while preserving wrist neutrality and preventing adjacent finger displacement.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Dynamic index movements covering home row anchors and center reach keys.',
        text: 'gift grab frog brag verb brav brat raft turf fret twig grub beef draft turf grit brag gift frog raft turf grub verb brat fret gift grab draft grit beef'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Words requiring rapid left index reach from F/R/V to center keys G/T/B.',
        text: 'target bright regret forget fabric budget border fatigue tribute fragment buffer trigger brave robust garbage freight gravity forbid fugitive regretful bright target tribute budget'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Engaging narrative text designed with heavy left index finger range requirements.',
        text: 'The brave traveler began to target great achievements despite the bitter frost and heavy fog. Bright sparks began to trigger the furnace, warming the great craft after a tough winter voyage.'
      }
    }
  },
  {
    id: 'right-index-reach',
    title: 'Right Index Lateral Reach & Stability',
    category: 'index',
    categoryLabel: 'Index Extension',
    anatomicalDigits: 'Right Digit II (Index Lateral Range)',
    hand: 'right',
    fingerIds: ['ri'],
    targetKeys: ['j', 'u', 'm', 'h', 'y', 'n'],
    biomechanicalFocus: 'Radial Range & Center Stretch',
    clinicalRationale: 'Coordinates horizontal index displacement across Y, H, N from the J anchor, avoiding wrist torque and strain across the right carpal tunnel.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Center-column index exercises focusing on clean reaches without home-row loss.',
        text: 'hunt myth jump hymn humor tiny turn harm norm tune mint ruin hunt myth youth jump harm tune norm hymn mint ruin turn hunt hymn myth turn youth norm'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Rich vocabulary exercising right index transitions across U, H, Y, M, and N.',
        text: 'rhythm hungry humor human journey hunting mythic yummy harmony memory normal thorny python hurry hunting runtime symphony human hymnal nymph journey harmony humor'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Fluent, natural sentences that exercise right-hand center-column mobility.',
        text: 'The youth enjoyed the rhythmic hum of the journey as they hiked across the humid northern hills. A tiny hummingbird hovered in gentle harmony above the garden, bringing joy and cheerful humor.'
      }
    }
  },
  {
    id: 'inward-rolls',
    title: 'Inward Motor Cascades (Pinky → Index)',
    category: 'cascades',
    categoryLabel: 'Kinematic Cascades',
    anatomicalDigits: 'Digits V → II (Outer to Inner)',
    hand: 'both',
    fingerIds: ['lp', 'lr', 'lm', 'li', 'rp', 'rr', 'rm', 'ri'],
    targetKeys: ['a', 's', 'd', 'f', ';', 'l', 'k', 'j', 'q', 'w', 'e', 'r', 'p', 'o', 'i', 'u'],
    biomechanicalFocus: 'Physiological Flexor Waves',
    clinicalRationale: 'Harnesses natural intrinsic hand ergonomics: rolling inward from weaker outer digits toward dominant index fingers maximizes burst typing speed.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Smooth inward rolling patterns that cultivate effortless velocity.',
        text: 'safe fast past vast post join kind star sail skim pain rain main scan gain farm calm palm sign join vast fast safe post star gain safe fast past join'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Words engineered with inward rolling sequences on both left and right hands.',
        text: 'safari station plaster joyful kingdom painkiller rainfall standard majestic gainful mainland painter framework saintly mainstream coastline roadmap landslide standard safari plaster'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Inspiring sentences that feel exceptionally smooth due to inward keystroke rolls.',
        text: 'The fast runner moved past the standard marker with calm focus and majestic posture. We reached a safe station just before the heavy rainfall swept across the quiet farming plains.'
      }
    }
  },
  {
    id: 'outward-rolls',
    title: 'Outward Motor Precision (Index → Pinky)',
    category: 'cascades',
    categoryLabel: 'Kinematic Cascades',
    anatomicalDigits: 'Digits II → V (Inner to Outer)',
    hand: 'both',
    fingerIds: ['li', 'lm', 'lr', 'lp', 'ri', 'rm', 'rr', 'rp'],
    targetKeys: ['f', 'd', 's', 'a', 'j', 'k', 'l', ';', 'r', 'e', 'w', 'q', 'u', 'i', 'o', 'p'],
    biomechanicalFocus: 'Antagonist Extensor Decoupling',
    clinicalRationale: 'Outward rolls counteract natural grasp reflexes. Targeted practice trains precise finger release timing so typists do not trigger accidental keystrokes.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Deliberate outward sequencing promoting extensor control and spatial accuracy.',
        text: 'date gate fade trip trap drop step stop flap flip drop trap grip leap rope tape soup soap peak feed date trap drop step tape fade date gate drop trap'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Carefully chosen words featuring outward rolling keystroke mechanics.',
        text: 'gateway deepsea droplet backdrop stepping footpath trapdoor footprint landscape flipbook teardrop rooftop roadster tapdance dropoff backdrop stepwise gateway droplet stepping'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Natural prose demanding precise finger release in outward sequential cascades.',
        text: 'Watch your step along the stone gateway as the morning dew begins to drip down the deep footpath. A sudden drop in temperature made them wrap their wool coats and stop right before the steep ridge.'
      }
    }
  },
  {
    id: 'bilateral-cadence',
    title: 'Bilateral Cadence & Alternating Rhythm',
    category: 'bilateral',
    categoryLabel: 'Bilateral Rhythm',
    anatomicalDigits: 'Both Hands (Inter-Manual Balance)',
    hand: 'both',
    fingerIds: ['li', 'lm', 'lr', 'lp', 'ri', 'rm', 'rr', 'rp'],
    targetKeys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    biomechanicalFocus: 'Inter-Hemispheric Neural Balance',
    clinicalRationale: 'Rhythmic alternation between left and right hands prevents keystroke clustering and muscular tension by synchronizing signals across both cerebral hemispheres.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Alternating left-right cadence drills that promote even keystroke pacing.',
        text: 'problem visual signals modern balance rhythm formal planet authentic suspension panel dynamic problem balance signals modern rhythm visual planet formal problem visual balance rhythm'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Balanced multi-syllabic words that evenly divide typing load across hands.',
        text: 'problem visual signals modern balance rhythm formal planet authentic suspension panel dynamic signature element document identity frequency balance visual rhythm modern'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Coherent sentences calibrated to alternate evenly between left and right hands.',
        text: 'Modern signals provide formal balance to ensure authentic rhythm across dynamic systems. The visual display demonstrated a balanced rhythm, solving the problem without hesitation.'
      }
    }
  },
  {
    id: 'weak-finger-perimeter',
    title: 'Perimeter Power & Weak Finger Agility',
    category: 'perimeter',
    categoryLabel: 'Perimeter Range',
    anatomicalDigits: 'Pinky & Ring Extensors (Perimeter)',
    hand: 'both',
    fingerIds: ['lp', 'lr', 'rp', 'rr'],
    targetKeys: ['q', 'z', 'p', 'x', '-', '\'', '/', ';', '[', ']'],
    biomechanicalFocus: 'Hypothenar Strength & Extension Range',
    clinicalRationale: 'Builds velocity and confidence in the weakest outer digits, eliminating the instinctive error of lifting the palm and wrist off home row to strike perimeter keys.',
    modes: {
      patterns: {
        title: 'Targeted Transitions & Trigrams',
        description: 'Dynamic exercises for outer perimeter keys and punctuation without wrist lifting.',
        text: 'quiz zero prize plaza quota panic pixel pizza quartz apex zip query phase equal quick zone proxy pique zip quartz zero quiz prize quota pixel pizza zip quartz'
      },
      words: {
        title: 'Vocabulary Fluency',
        description: 'Words with heavy reliance on outer keyboard keys (Q, Z, P, X).',
        text: 'puzzling squeeze equip quote topaz squeeze frozen zeroed qualify quartz panoply zip code complex snapshot optimize pinpoint qualify jeopardize squeeze puzzling qualify optimize'
      },
      sentences: {
        title: 'Fluent Context Sentences',
        description: 'Engaging, authentic sentences with rich perimeter letter distribution.',
        text: 'The quick quiz required equal parts patience and zeal to solve every puzzling question correctly. A zero-gravity flight proved to be an exquisite journey, with quiet zones and superb panoramic views.'
      }
    }
  }
];

// Helper to generate dynamic custom drills for any selected finger pair
export const CUSTOM_FINGER_WORD_BANK: Record<FingerId, string[]> = {
  lp: ['quiz', 'aqua', 'plaza', 'equal', 'quick', 'azure', 'apply', 'quartz', 'adapt', 'avail', 'alarm', 'quaint'],
  lr: ['sweet', 'slow', 'waste', 'sword', 'swift', 'water', 'switch', 'shadow', 'swear', 'steam', 'solve', 'storm'],
  lm: ['dance', 'dream', 'decide', 'echo', 'exact', 'craft', 'clean', 'credit', 'elder', 'entry', 'depth', 'drive'],
  li: ['brave', 'fight', 'great', 'frost', 'truth', 'target', 'flight', 'gather', 'front', 'grace', 'trust', 'bright'],
  thumb: ['and', 'the', 'for', 'with', 'from', 'this', 'that', 'have', 'more', 'when', 'will', 'some'],
  ri: ['jump', 'hunt', 'human', 'honor', 'month', 'night', 'youth', 'harmony', 'north', 'major', 'heavy', 'unity'],
  rm: ['kind', 'milk', 'iron', 'icon', 'limit', 'logic', 'pilot', 'silicon', 'knife', 'orbit', 'magic', 'habit'],
  rr: ['look', 'lion', 'polar', 'color', 'solar', 'flood', 'order', 'olive', 'local', 'flock', 'solid', 'loose'],
  rp: ['people', 'paper', 'power', 'point', 'press', 'price', 'peace', 'proof', 'pilot', 'place', 'plant', 'proud']
};

export function generateCustomFingerPairDrill(f1: FingerId, f2: FingerId): {
  title: string;
  text: string;
  targetKeys: string[];
} {
  const words1 = CUSTOM_FINGER_WORD_BANK[f1] || [];
  const words2 = CUSTOM_FINGER_WORD_BANK[f2] || [];
  
  // Interleave and shuffle deterministically for variety
  const combined: string[] = [];
  const maxLen = Math.max(words1.length, words2.length);
  for (let i = 0; i < maxLen; i++) {
    if (words1[i]) combined.push(words1[i]);
    if (words2[i]) combined.push(words2[i]);
  }
  
  // Create a 40-word varied sequence
  const result: string[] = [];
  while (result.length < 35 && combined.length > 0) {
    result.push(...combined);
  }

  return {
    title: `Custom Motor Calibration: ${f1.toUpperCase()} ↔ ${f2.toUpperCase()}`,
    text: result.slice(0, 35).join(' '),
    targetKeys: []
  };
}
