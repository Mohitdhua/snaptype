import { Lesson } from '../types';

export interface DayPlan {
  day: number;
  targetWpm: number;
  stages: number[];
  lessonIds: string[];
  title: string;
  minSessions: number;
}

export const LESSONS: Lesson[] = [
  {
    "id": "lesson-1-1",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 1: Anchor Keys F and J",
    "description": "Learn the tactile bumps on F and J using your left and right index fingers.",
    "targetKeys": [
      "f",
      "j",
      " "
    ],
    "minWpm": 10,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "1-1-1",
        "title": "F & J Key Cadence Drill",
        "type": "drill",
        "targetKeys": [
          "f",
          "j",
          " "
        ],
        "text": "f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj f j f j ff jj fj jf fff jjj fjf jfj fj jf f j ff jj f f j j fff jjj fj jf fjf jfj ff jj f j fj jf fff jjj fjf jfj"
      },
      {
        "id": "1-1-2",
        "title": "F & J Rhythm Endurance",
        "type": "drill",
        "targetKeys": [
          "f",
          "j",
          " "
        ],
        "text": "fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf f j ff jj fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f j ff jj fj jf fff jjj fjf jfj f f j j ff jj fj jf fff jjj fjf jfj fff jjj ff jj fj jf"
      },
      {
        "id": "1-1-3",
        "title": "F & J Word Combinations",
        "type": "words",
        "targetKeys": [
          "f",
          "j",
          " "
        ],
        "text": "ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf ffj fjf jjf jjf fjf jfj fjf j fjf j fjf jfj fjf fjf jjf j jfj ffj jjf ffj fjf jfj f fjf jjf j f jjf ffj j j fjf jfj ffj f ffj f jfj j fjf ffj jjf jjf"
      },
      {
        "id": "1-1-4",
        "title": "F & J Muscle Memory Sprint",
        "type": "words",
        "targetKeys": [
          "f",
          "j",
          " "
        ],
        "text": "fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf fjf jfj fff jjj ffj jjf fjf jfj fff jjj ffj jjf fjf jfj f j fjf jfj ffj jjf fjf jfj fff jjj ff jj fj jf ffj jjf fjf jfj ffj jjf fff jjj f j ff jj fj jf"
      }
    ]
  },
  {
    "id": "lesson-1-2",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 2: Middle Keys D and K",
    "description": "Position middle fingers on D (left hand) and K (right hand) alongside F and J anchors.",
    "targetKeys": [
      "d",
      "k",
      "f",
      "j",
      " "
    ],
    "minWpm": 12,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "1-2-1",
        "title": "D & K Middle Finger Reach",
        "type": "drill",
        "targetKeys": [
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk d k df jk fd kj ddf jjk dff jkk fjdk kjdf dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj dkfd kjdk fjdk kfjd d k df jk fd kj d k d k dd kk dk kd df jk fd kj dkfd kjdk"
      },
      {
        "id": "1-2-2",
        "title": "Four-Finger Flow Drill",
        "type": "drill",
        "targetKeys": [
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk kjdf djkf kfjd dkfd kjdk fjdk kfjd d k dd kk dk kd df jk fd kj ddf jjk dff jkk fjdk"
      },
      {
        "id": "1-2-3",
        "title": "Words with D, K, F, J",
        "type": "words",
        "targetKeys": [
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did kid did"
      },
      {
        "id": "1-2-4",
        "title": "Four-Key Mixed Stamina Drill",
        "type": "words",
        "targetKeys": [
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did dkfd kjdk kid did fjdk kjdf kid did kid did djkf kfjd kid did dkfd kjdk kid did kid did fjdk kjdf kid did djkf kfjd kid did kid did dkfd kjdk kid did fjdk kjdf kid did"
      }
    ]
  },
  {
    "id": "lesson-1-3",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 3: Ring Keys S and L",
    "description": "Engage left ring finger on S and right ring finger on L for six-key coordination.",
    "targetKeys": [
      "s",
      "l",
      "d",
      "k",
      "f",
      "j",
      " "
    ],
    "minWpm": 14,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "1-3-1",
        "title": "S & L Ring Finger Cadence",
        "type": "drill",
        "targetKeys": [
          "s",
          "l",
          "d",
          "k"
        ],
        "text": "s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls s l s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls"
      },
      {
        "id": "1-3-2",
        "title": "Six-Key Cross Coordination",
        "type": "drill",
        "targetKeys": [
          "s",
          "l",
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df jk ls sl dk fj jf kd ls sl dfjk lksd fjsl slkd dkls s l ss ll sl ls sdf lkj fds jkl slkd dkls as df"
      },
      {
        "id": "1-3-3",
        "title": "Home Row Word Drill",
        "type": "words",
        "targetKeys": [
          "s",
          "l",
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask silk disk flask"
      },
      {
        "id": "1-3-4",
        "title": "Six-Key Marathon Endurance",
        "type": "words",
        "targetKeys": [
          "s",
          "l",
          "d",
          "k",
          "f",
          "j"
        ],
        "text": "silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls silk disk flask slkd dkls silk disk flask fjsl silk disk flask dfjk lksd silk disk flask dkls"
      }
    ]
  },
  {
    "id": "lesson-1-4",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 4: Pinky Keys A and Semicolon (;)",
    "description": "Complete the home row baseline with left pinky on A and right pinky on Semicolon.",
    "targetKeys": [
      "a",
      ";",
      "s",
      "l",
      "d",
      "k",
      "f",
      "j",
      " "
    ],
    "minWpm": 15,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "1-4-1",
        "title": "A & Semicolon Pinky Anchor",
        "type": "drill",
        "targetKeys": [
          "a",
          ";",
          "s",
          "l"
        ],
        "text": "a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a ; aa ;; a; ;a asdf a ; a ; aa ;; a; ;a asdf ;lkj asdf ;lkj a;sl dkfj a;sl dkfj asdf ;lkj a ; aa ;; a; ;a asdf ;lkj"
      },
      {
        "id": "1-4-2",
        "title": "Eight-Key Full Home Row Drill",
        "type": "drill",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l",
          ";"
        ],
        "text": "all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad all fall dad lad salad flask salsa alfalfa fall"
      },
      {
        "id": "1-4-3",
        "title": "Home Row Extended Vocabulary",
        "type": "words",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l",
          ";"
        ],
        "text": "all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad salad flask salsa alfalfa fall lad all dad all fall dad lad all fall dad lad salad flask salsa alfalfa fall lad all dad salad flask salsa alfalfa all fall dad lad salad flask"
      },
      {
        "id": "1-4-4",
        "title": "Home Row Short Sentences",
        "type": "sentences",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l",
          ";"
        ],
        "text": "dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad. dad had a salad. all lads had a salad. a salad is all dad had. fall lad fall. dad had a flask. a salad fall lad. all lads had salsa. dad had a salad."
      }
    ]
  },
  {
    "id": "lesson-1-5",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 5: Inner Reach Keys G and H",
    "description": "Reach inward with left index finger to G and right index finger to H.",
    "targetKeys": [
      "g",
      "h",
      "f",
      "j",
      "a",
      "s",
      "d",
      "k",
      "l"
    ],
    "minWpm": 16,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "1-5-1",
        "title": "G & H Inner Reaching Drill",
        "type": "drill",
        "targetKeys": [
          "g",
          "h",
          "f",
          "j"
        ],
        "text": "fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj fg jh gf hj fg jh gf hj fgf jhj fghj jhhg dghk sghl agh; gf hj"
      },
      {
        "id": "1-5-2",
        "title": "Words with G, H, and Home Keys",
        "type": "words",
        "targetKeys": [
          "g",
          "h",
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l"
        ],
        "text": "had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala flash glad had half dash glass hash slag flag gala had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala flash glad had half dash glass hash slag flag gala had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala flash glad had half dash glass hash slag flag gala had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala flash glad had half dash glass hash slag flag gala had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala flash glad had half dash glass hash slag flag gala had glad half dash flash glass hash slag flag gala flash glad had half dash flash glass hash slag flag gala half glad had dash flash glass hash slag flag gala"
      },
      {
        "id": "1-5-3",
        "title": "Full Home Row Sentences Part 1",
        "type": "sentences",
        "targetKeys": [
          "g",
          "h",
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l"
        ],
        "text": "a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad. dad had a flash of gladness. a lad had a glass. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. a glad lad had a flag. all lads had half a salad."
      },
      {
        "id": "1-5-4",
        "title": "Full Home Row Sentences Part 2",
        "type": "sentences",
        "targetKeys": [
          "g",
          "h",
          "a",
          "s",
          "d",
          "f",
          "j",
          "k",
          "l"
        ],
        "text": "glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa. glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa. glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa. glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa. glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa. glad lads had flags. a dash of glass had a flash. half a salad is glad. dad had a flash of salsa. a lad had a flag. all glad lads had half a glass. dad had a glad flash. all lads had a dash of salsa."
      }
    ]
  },
  {
    "id": "lesson-1-6",
    "stage": 1,
    "stageTitle": "Stage 1: Home Row Foundation",
    "title": "Lesson 6: Home Row Complete Mastery",
    "description": "Master complete paragraphs and sentences using only the Home Row keys.",
    "targetKeys": [
      "a",
      "s",
      "d",
      "f",
      "g",
      "h",
      "j",
      "k",
      "l",
      ";"
    ],
    "minWpm": 18,
    "minAccuracy": 94,
    "exercises": [
      {
        "id": "1-6-1",
        "title": "Home Row Continuous Flow 1",
        "type": "sentences",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "g",
          "h",
          "j",
          "k",
          "l"
        ],
        "text": "a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. all glad lads had flags. dad had a salad and a flask. a lad had a dash of salsa. a flash of glass had a glad lad. all lads had half a salad and a flag. dad had a glad salad. all lads had a flag and a flash of salsa. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. all glad lads had flags. dad had a salad and a flask. a lad had a dash of salsa. a flash of glass had a glad lad. all lads had half a salad and a flag. dad had a glad salad. all lads had a flag and a flash of salsa. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. all glad lads had flags. dad had a salad and a flask. a lad had a dash of salsa. a flash of glass had a glad lad. all lads had half a salad and a flag. dad had a glad salad. all lads had a flag and a flash of salsa. a glad lad had a salad. all lads had flags. a dash of salsa is glad. dad had a flask. all glad lads had flags. dad had a salad and a flask. a lad had a dash of salsa. a flash of glass had a glad lad. all lads had half a salad and a flag. dad had a glad salad. all lads had a flag and a flash of salsa."
      },
      {
        "id": "1-6-2",
        "title": "Home Row Continuous Flow 2",
        "type": "sentences",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "g",
          "h",
          "j",
          "k",
          "l"
        ],
        "text": "all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad. all lads had flags. a dash of salsa is glad. all lads had flags and salads. a glad lad had a flask. dad had a dash of salsa and a glad flash. a glad lad had half a glass of salad."
      },
      {
        "id": "1-6-3",
        "title": "Home Row Marathon Exam Test",
        "type": "sentences",
        "targetKeys": [
          "a",
          "s",
          "d",
          "f",
          "g",
          "h",
          "j",
          "k",
          "l"
        ],
        "text": "dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag. all glad lads had a dash of salsa and a salad. half a glass of salsa is glad. dad had a flag. a glad lad had a flask. all lads had half a salad. dad had a glad salad. a lad had a flask and a flag."
      }
    ]
  },
  {
    "id": "lesson-2-1",
    "stage": 2,
    "stageTitle": "Stage 2: Top Row & Reach",
    "title": "Lesson 7: Keys E and I",
    "description": "Reach up from middle fingers: left middle to E and right middle to I.",
    "targetKeys": [
      "e",
      "i",
      "d",
      "k",
      "a",
      "s",
      "f",
      "j",
      "l"
    ],
    "minWpm": 18,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "2-1-1",
        "title": "E & I Upward Reach Drill",
        "type": "drill",
        "targetKeys": [
          "e",
          "i",
          "d",
          "k"
        ],
        "text": "de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead de ki ed ik ded kik dei kid did elk die lie ill fill kid die side file like life sail deaf deal fail idle safe leaf lead"
      },
      {
        "id": "2-1-2",
        "title": "Words Containing E and I",
        "type": "words",
        "targetKeys": [
          "e",
          "i",
          "d",
          "k",
          "a",
          "s",
          "f",
          "j",
          "l"
        ],
        "text": "side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle like life side file idea field deaf deal fail idle safe leaf lead safe idle side file like life sail deaf deal side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle like life side file idea field deaf deal fail idle safe leaf lead safe idle side file like life sail deaf deal side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle like life side file idea field deaf deal fail idle safe leaf lead safe idle side file like life sail deaf deal side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle like life side file idea field deaf deal fail idle safe leaf lead safe idle side file like life sail deaf deal side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle like life side file idea field deaf deal fail idle safe leaf lead safe idle side file like life sail deaf deal side file like life sail deaf deal fail idle safe leaf lead idea field life like file side sail leaf lead safe idle"
      },
      {
        "id": "2-1-3",
        "title": "Continuous Sentences Part 1",
        "type": "sentences",
        "targetKeys": [
          "e",
          "i"
        ],
        "text": "she said the file is safe and idle. life is like a field. a safe leaf fell into the side file. lead a life of ease. like a safe deal, the idea is ideal. deal with life easily. the file led to a safe deal. life is like a green leaf. she said the file is safe and idle. life is like a field. a safe leaf fell into the side file. lead a life of ease. like a safe deal, the idea is ideal. deal with life easily. the file led to a safe deal. life is like a green leaf. she said the file is safe and idle. life is like a field. a safe leaf fell into the side file. lead a life of ease. like a safe deal, the idea is ideal. deal with life easily. the file led to a safe deal. life is like a green leaf. she said the file is safe and idle. life is like a field. a safe leaf fell into the side file. lead a life of ease. like a safe deal, the idea is ideal. deal with life easily. the file led to a safe deal. life is like a green leaf. she said the file is safe and idle. life is like a field. a safe leaf fell into the side file. lead a life of ease. like a safe deal, the idea is ideal. deal with life easily. the file led to a safe deal. life is like a green leaf. she said the file is safe and idle. life is like a field."
      },
      {
        "id": "2-1-4",
        "title": "Continuous Sentences Part 2",
        "type": "sentences",
        "targetKeys": [
          "e",
          "i"
        ],
        "text": "lead the field with a safe idea. life is like a wide file. she fell side by side with a safe leaf. feel life easily. idle files lead to failed deals. keep the ideal safe and likeable. a safe file leads to a good life. see the wide field easily. lead the field with a safe idea. life is like a wide file. she fell side by side with a safe leaf. feel life easily. idle files lead to failed deals. keep the ideal safe and likeable. a safe file leads to a good life. see the wide field easily. lead the field with a safe idea. life is like a wide file. she fell side by side with a safe leaf. feel life easily. idle files lead to failed deals. keep the ideal safe and likeable. a safe file leads to a good life. see the wide field easily. lead the field with a safe idea. life is like a wide file. she fell side by side with a safe leaf. feel life easily. idle files lead to failed deals. keep the ideal safe and likeable. a safe file leads to a good life. see the wide field easily. lead the field with a safe idea. life is like a wide file. she fell side by side with a safe leaf. feel life easily. idle files lead to failed deals. keep the ideal safe and likeable. a safe file leads to a good life. see the wide field easily."
      }
    ]
  },
  {
    "id": "lesson-2-2",
    "stage": 2,
    "stageTitle": "Stage 2: Top Row & Reach",
    "title": "Lesson 8: Keys R and U",
    "description": "Reach up with index fingers: left index to R and right index to U.",
    "targetKeys": [
      "r",
      "u",
      "f",
      "j",
      "e",
      "i",
      "d",
      "k",
      "a",
      "s"
    ],
    "minWpm": 20,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "2-2-1",
        "title": "R & U Reach Cadence",
        "type": "drill",
        "targetKeys": [
          "r",
          "u",
          "f",
          "j"
        ],
        "text": "fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude sure dark rush rule fire pure real user fair sail lure silk fr ju rf uj frf juj fur rug run rude rule user rural rude"
      },
      {
        "id": "2-2-2",
        "title": "Vocabulary with R and U",
        "type": "words",
        "targetKeys": [
          "r",
          "u"
        ],
        "text": "sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair rule fire pure real user fair dark rush sure lure silk rural rude user real pure fire rule dark rush sure fair sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair rule fire pure real user fair dark rush sure lure silk rural rude user real pure fire rule dark rush sure fair sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair rule fire pure real user fair dark rush sure lure silk rural rude user real pure fire rule dark rush sure fair sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair rule fire pure real user fair dark rush sure lure silk rural rude user real pure fire rule dark rush sure fair sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair rule fire pure real user fair dark rush sure lure silk rural rude user real pure fire rule dark rush sure fair sure dark rush rule fire pure real user fair sail lure silk user rural rude sure dark rush rule fire pure real fair"
      },
      {
        "id": "2-2-3",
        "title": "Endurance Paragraphs 1",
        "type": "sentences",
        "targetKeys": [
          "r",
          "u"
        ],
        "text": "the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast. run in the dark with pure focus. the rural rule is fair. a real user is sure to rule fairly. dark fire is pure. the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast. run in the dark with pure focus. the rural rule is fair. a real user is sure to rule fairly. dark fire is pure. the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast. run in the dark with pure focus. the rural rule is fair. a real user is sure to rule fairly. dark fire is pure. the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast. run in the dark with pure focus. the rural rule is fair. a real user is sure to rule fairly. dark fire is pure. the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast. run in the dark with pure focus. the rural rule is fair. a real user is sure to rule fairly. dark fire is pure. the user is sure of the dark rule. pure fire is real. a fair rule leads to a rural fire. sure users run fast."
      },
      {
        "id": "2-2-4",
        "title": "Endurance Paragraphs 2",
        "type": "sentences",
        "targetKeys": [
          "r",
          "u"
        ],
        "text": "sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules. a rural user runs far. fair rules lead to pure results. run sure and fair. dark fire burns real and pure. sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules. a rural user runs far. fair rules lead to pure results. run sure and fair. dark fire burns real and pure. sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules. a rural user runs far. fair rules lead to pure results. run sure and fair. dark fire burns real and pure. sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules. a rural user runs far. fair rules lead to pure results. run sure and fair. dark fire burns real and pure. sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules. a rural user runs far. fair rules lead to pure results. run sure and fair. dark fire burns real and pure. sure rural users rule with fair fire. run for the dark field. pure fire burns real dark. the user is sure of fair rules."
      }
    ]
  },
  {
    "id": "lesson-2-3",
    "stage": 2,
    "stageTitle": "Stage 2: Top Row & Reach",
    "title": "Lesson 9: Keys T and Y",
    "description": "Reach upward and inward: left index to T and right index to Y.",
    "targetKeys": [
      "t",
      "y",
      "f",
      "j",
      "r",
      "u",
      "e",
      "i"
    ],
    "minWpm": 20,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "2-3-1",
        "title": "T & Y Inner Reach Drill",
        "type": "drill",
        "targetKeys": [
          "t",
          "y",
          "f",
          "j"
        ],
        "text": "ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady the true artist stays dry. they say early fruit tastes truly great today. ft jy tf yj fty jyt try yet tyre year tie dye stay lady"
      },
      {
        "id": "2-3-2",
        "title": "Words with T and Y",
        "type": "words",
        "targetKeys": [
          "t",
          "y"
        ],
        "text": "they stay your type dirty year early fruit truly today try year truly today try they stay your type dirty early fruit try type today stay they year your early fruit truly dirty today truly fruit early dirty type stay they your try year they stay your type dirty year early fruit truly today try year truly today try they stay your type dirty early fruit try type today stay they year your early fruit truly dirty today truly fruit early dirty type stay they your try year they stay your type dirty year early fruit truly today try year truly today try they stay your type dirty early fruit try type today stay they year your early fruit truly dirty today truly fruit early dirty type stay they your try year they stay your type dirty year early fruit truly today try year truly today try they stay your type dirty early fruit try type today stay they year your early fruit truly dirty today truly fruit early dirty type stay they your try year they stay your type dirty year early fruit truly today try year truly today try they stay your type dirty early fruit try type today stay they year your early fruit truly dirty today truly fruit early dirty type stay they your try year they stay your type dirty year early fruit truly today try"
      },
      {
        "id": "2-3-3",
        "title": "Speed Sentences Part 1",
        "type": "sentences",
        "targetKeys": [
          "t",
          "y"
        ],
        "text": "they say the true artist stays dry today. early fruit tastes truly great. try to stay dry today. your daily type rate is truly steady. the lady says they will try to type faster today. stay ready for the daily test. they try their best today. they say the true artist stays dry today. early fruit tastes truly great. try to stay dry today. your daily type rate is truly steady. the lady says they will try to type faster today. stay ready for the daily test. they try their best today. they say the true artist stays dry today. early fruit tastes truly great. try to stay dry today. your daily type rate is truly steady. the lady says they will try to type faster today. stay ready for the daily test. they try their best today. they say the true artist stays dry today. early fruit tastes truly great. try to stay dry today. your daily type rate is truly steady. the lady says they will try to type faster today. stay ready for the daily test. they try their best today. they say the true artist stays dry today. early fruit tastes truly great. try to stay dry today. your daily type rate is truly steady. the lady says they will try to type faster today. stay ready for the daily test. they try their best today."
      },
      {
        "id": "2-3-4",
        "title": "Speed Sentences Part 2",
        "type": "sentences",
        "targetKeys": [
          "t",
          "y"
        ],
        "text": "early birds try their best today. stay true to your steady speed. they say that today is a great day to type fast and stay dry. your type speed gets truly great every year. try to stay ready. the true test is to stay calm and type smoothly every day. early birds try their best today. stay true to your steady speed. they say that today is a great day to type fast and stay dry. your type speed gets truly great every year. try to stay ready. the true test is to stay calm and type smoothly every day. early birds try their best today. stay true to your steady speed. they say that today is a great day to type fast and stay dry. your type speed gets truly great every year. try to stay ready. the true test is to stay calm and type smoothly every day. early birds try their best today. stay true to your steady speed. they say that today is a great day to type fast and stay dry. your type speed gets truly great every year. try to stay ready. the true test is to stay calm and type smoothly every day. early birds try their best today. stay true to your steady speed. they say that today is a great day to type fast and stay dry. your type speed gets truly great every year. try to stay ready. the true test is to stay calm and type smoothly every day."
      }
    ]
  },
  {
    "id": "lesson-2-4",
    "stage": 2,
    "stageTitle": "Stage 2: Top Row & Reach",
    "title": "Lesson 10: Keys W and O",
    "description": "Reach up with ring fingers: left ring to W and right ring to O.",
    "targetKeys": [
      "w",
      "o",
      "s",
      "l",
      "e",
      "r",
      "t",
      "y",
      "u",
      "i"
    ],
    "minWpm": 22,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "2-4-1",
        "title": "W & O Ring Reach Drill",
        "type": "drill",
        "targetKeys": [
          "w",
          "o",
          "s",
          "l"
        ],
        "text": "sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow wood work world road slow flow grow word show blow floor sw lo ws ol sws lol how who row low sow wool workflow slow"
      },
      {
        "id": "2-4-2",
        "title": "Common Words with W and O",
        "type": "words",
        "targetKeys": [
          "w",
          "o"
        ],
        "text": "work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world world work road floor blow show word grow flow slow wool flow grow word show blow floor road wool work world slow work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world world work road floor blow show word grow flow slow wool flow grow word show blow floor road wool work world slow work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world world work road floor blow show word grow flow slow wool flow grow word show blow floor road wool work world slow work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world world work road floor blow show word grow flow slow wool flow grow word show blow floor road wool work world slow work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world world work road floor blow show word grow flow slow wool flow grow word show blow floor road wool work world slow work world slow flow grow word show blow floor road wool slow flow grow word show blow floor road wool work world"
      },
      {
        "id": "2-4-3",
        "title": "Flow Sentences Part 1",
        "type": "sentences",
        "targetKeys": [
          "w",
          "o"
        ],
        "text": "slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work. the whole world will see how good workflow works smoothly. show the world how slow and steady work wins the race. slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work. the whole world will see how good workflow works smoothly. show the world how slow and steady work wins the race. slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work. the whole world will see how good workflow works smoothly. show the world how slow and steady work wins the race. slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work. the whole world will see how good workflow works smoothly. show the world how slow and steady work wins the race. slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work. the whole world will see how good workflow works smoothly. show the world how slow and steady work wins the race. slow and steady workflow builds a world of real success. who knows how the slow flow grows into a great work."
      },
      {
        "id": "2-4-4",
        "title": "Flow Sentences Part 2",
        "type": "sentences",
        "targetKeys": [
          "w",
          "o"
        ],
        "text": "work on your workflow daily to grow fast in the modern world. who will show how the slow flow of work leads to success. the world needs steady work and solid focus every single day. slow down to speed up and grow your typing flow worldwide. work on your workflow daily to grow fast in the modern world. who will show how the slow flow of work leads to success. the world needs steady work and solid focus every single day. slow down to speed up and grow your typing flow worldwide. work on your workflow daily to grow fast in the modern world. who will show how the slow flow of work leads to success. the world needs steady work and solid focus every single day. slow down to speed up and grow your typing flow worldwide. work on your workflow daily to grow fast in the modern world. who will show how the slow flow of work leads to success. the world needs steady work and solid focus every single day. slow down to speed up and grow your typing flow worldwide. work on your workflow daily to grow fast in the modern world. who will show how the slow flow of work leads to success. the world needs steady work and solid focus every single day. slow down to speed up and grow your typing flow worldwide."
      }
    ]
  },
  {
    "id": "lesson-2-5",
    "stage": 2,
    "stageTitle": "Stage 2: Top Row & Reach",
    "title": "Lesson 11: Keys Q and P",
    "description": "Reach up with pinky fingers: left pinky to Q and right pinky to P.",
    "targetKeys": [
      "q",
      "p",
      "a",
      ";",
      "w",
      "e",
      "r",
      "t",
      "y",
      "u",
      "i",
      "o"
    ],
    "minWpm": 22,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "2-5-1",
        "title": "Q & P Pinky Reach Drill",
        "type": "drill",
        "targetKeys": [
          "q",
          "p",
          "a",
          ";"
        ],
        "text": "aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today. aq ;p qa p; quit play keep drop peak pipe quote equal quick people write words properly. our top team will qualify without worry today."
      },
      {
        "id": "2-5-2",
        "title": "Words with Q and P",
        "type": "words",
        "targetKeys": [
          "q",
          "p"
        ],
        "text": "quick people equal quote proud power place paper practice public proud power place paper practice public quick people equal quote practice public quick people equal quote proud power place paper equal quote proud power place paper practice public quick people quick people equal quote proud power place paper practice public proud power place paper practice public quick people equal quote practice public quick people equal quote proud power place paper equal quote proud power place paper practice public quick people quick people equal quote proud power place paper practice public proud power place paper practice public quick people equal quote practice public quick people equal quote proud power place paper equal quote proud power place paper practice public quick people quick people equal quote proud power place paper practice public proud power place paper practice public quick people equal quote practice public quick people equal quote proud power place paper equal quote proud power place paper practice public quick people quick people equal quote proud power place paper practice public proud power place paper practice public quick people equal quote practice public quick people equal quote proud power place paper"
      },
      {
        "id": "2-5-3",
        "title": "Top Row Fluency Passage 1",
        "type": "sentences",
        "targetKeys": [
          "q",
          "p"
        ],
        "text": "quick people write quality words properly without panic. equal power helps the public qualify for top public posts. keep practicing with proud focus to reach peak speed quickly. quick typing requires proper posture, quiet mind, and equal effort. quick people write quality words properly without panic. equal power helps the public qualify for top public posts. keep practicing with proud focus to reach peak speed quickly. quick typing requires proper posture, quiet mind, and equal effort. quick people write quality words properly without panic. equal power helps the public qualify for top public posts. keep practicing with proud focus to reach peak speed quickly. quick typing requires proper posture, quiet mind, and equal effort. quick people write quality words properly without panic. equal power helps the public qualify for top public posts. keep practicing with proud focus to reach peak speed quickly. quick typing requires proper posture, quiet mind, and equal effort. quick people write quality words properly without panic. equal power helps the public qualify for top public posts. keep practicing with proud focus to reach peak speed quickly. quick typing requires proper posture, quiet mind, and equal effort."
      },
      {
        "id": "2-5-4",
        "title": "Top Row Fluency Passage 2",
        "type": "sentences",
        "targetKeys": [
          "q",
          "p"
        ],
        "text": "the prompt response of the public team proved their peak quality. quit worrying and keep practicing daily for equal opportunities. quality work always produces proud and powerful output. quick and polite people always perform properly in public exams. the prompt response of the public team proved their peak quality. quit worrying and keep practicing daily for equal opportunities. quality work always produces proud and powerful output. quick and polite people always perform properly in public exams. the prompt response of the public team proved their peak quality. quit worrying and keep practicing daily for equal opportunities. quality work always produces proud and powerful output. quick and polite people always perform properly in public exams. the prompt response of the public team proved their peak quality. quit worrying and keep practicing daily for equal opportunities. quality work always produces proud and powerful output. quick and polite people always perform properly in public exams. the prompt response of the public team proved their peak quality. quit worrying and keep practicing daily for equal opportunities. quality work always produces proud and powerful output. quick and polite people always perform properly in public exams."
      }
    ]
  },
  {
    "id": "lesson-3-1",
    "stage": 3,
    "stageTitle": "Stage 3: Bottom Row Foundations",
    "title": "Lesson 12: Keys V and M",
    "description": "Reach down with index fingers: left index to V and right index to M.",
    "targetKeys": [
      "v",
      "m",
      "f",
      "j"
    ],
    "minWpm": 22,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "3-1-1",
        "title": "V & M Downward Reach Drill",
        "type": "drill",
        "targetKeys": [
          "v",
          "m",
          "f",
          "j"
        ],
        "text": "fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move many views make my move calm. every team member must value simple momentum. fv jm vf mj move view form calm view volume stream move"
      },
      {
        "id": "3-1-2",
        "title": "Words with V and M",
        "type": "words",
        "targetKeys": [
          "v",
          "m"
        ],
        "text": "move view calm volume stream member value momentum visit major value momentum visit major move view calm volume stream member calm volume stream member value momentum visit major move view stream member value momentum visit major move view calm volume move view calm volume stream member value momentum visit major value momentum visit major move view calm volume stream member calm volume stream member value momentum visit major move view stream member value momentum visit major move view calm volume move view calm volume stream member value momentum visit major value momentum visit major move view calm volume stream member calm volume stream member value momentum visit major move view stream member value momentum visit major move view calm volume move view calm volume stream member value momentum visit major value momentum visit major move view calm volume stream member calm volume stream member value momentum visit major move view stream member value momentum visit major move view calm volume move view calm volume stream member value momentum visit major value momentum visit major move view calm volume stream member calm volume stream member value momentum visit major move view stream member value momentum visit major move view calm volume"
      },
      {
        "id": "3-1-3",
        "title": "Continuous Sentences Part 1",
        "type": "sentences",
        "targetKeys": [
          "v",
          "m"
        ],
        "text": "many modern views make every move calm and very effective. every team member must value simple momentum and clear view. move with calm focus to view every volume of the daily work. the stream of modern values makes my typing move smoothly. many modern views make every move calm and very effective. every team member must value simple momentum and clear view. move with calm focus to view every volume of the daily work. the stream of modern values makes my typing move smoothly. many modern views make every move calm and very effective. every team member must value simple momentum and clear view. move with calm focus to view every volume of the daily work. the stream of modern values makes my typing move smoothly. many modern views make every move calm and very effective. every team member must value simple momentum and clear view. move with calm focus to view every volume of the daily work. the stream of modern values makes my typing move smoothly. many modern views make every move calm and very effective. every team member must value simple momentum and clear view. move with calm focus to view every volume of the daily work. the stream of modern values makes my typing move smoothly."
      },
      {
        "id": "3-1-4",
        "title": "Continuous Sentences Part 2",
        "type": "sentences",
        "targetKeys": [
          "v",
          "m"
        ],
        "text": "value every minute of your typing practice with calm momentum. a clear view of the target makes every move accurate and fast. members of the team move forward with calm and strong focus. maintain momentum and view your errors with a calm mindset. value every minute of your typing practice with calm momentum. a clear view of the target makes every move accurate and fast. members of the team move forward with calm and strong focus. maintain momentum and view your errors with a calm mindset. value every minute of your typing practice with calm momentum. a clear view of the target makes every move accurate and fast. members of the team move forward with calm and strong focus. maintain momentum and view your errors with a calm mindset. value every minute of your typing practice with calm momentum. a clear view of the target makes every move accurate and fast. members of the team move forward with calm and strong focus. maintain momentum and view your errors with a calm mindset. value every minute of your typing practice with calm momentum. a clear view of the target makes every move accurate and fast. members of the team move forward with calm and strong focus. maintain momentum and view your errors with a calm mindset."
      }
    ]
  },
  {
    "id": "lesson-3-2",
    "stage": 3,
    "stageTitle": "Stage 3: Bottom Row Foundations",
    "title": "Lesson 13: Keys C and Comma (,)",
    "description": "Reach down with middle fingers: left middle to C and right middle to Comma (,).",
    "targetKeys": [
      "c",
      ",",
      "d",
      "k"
    ],
    "minWpm": 24,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "3-2-1",
        "title": "C & Comma Cadence Drill",
        "type": "drill",
        "targetKeys": [
          "c",
          ",",
          "d",
          "k"
        ],
        "text": "dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure, clear, clean code creates calm, reliable results for clients, developers, and users. dc k, cd ,k call, calm, clear, cold, code, cloud, clean, cure,"
      },
      {
        "id": "3-2-2",
        "title": "Punctuated Word Lists",
        "type": "words",
        "targetKeys": [
          "c",
          ","
        ],
        "text": "call, calm, clear, code, cloud, clean, client, count, check, client, count, check, call, calm, clear, code, cloud, clean, clear, code, cloud, clean, client, count, check, call, calm, code, cloud, clean, client, count, check, call, calm, clear, call, calm, clear, code, cloud, clean, client, count, check, client, count, check, call, calm, clear, code, cloud, clean, clear, code, cloud, clean, client, count, check, call, calm, code, cloud, clean, client, count, check, call, calm, clear, call, calm, clear, code, cloud, clean, client, count, check, client, count, check, call, calm, clear, code, cloud, clean, clear, code, cloud, clean, client, count, check, call, calm, code, cloud, clean, client, count, check, call, calm, clear, call, calm, clear, code, cloud, clean, client, count, check, client, count, check, call, calm, clear, code, cloud, clean, clear, code, cloud, clean, client, count, check, call, calm, code, cloud, clean, client, count, check, call, calm, clear, call, calm, clear, code, cloud, clean, client, count, check, client, count, check, call, calm, clear, code, cloud, clean, clear, code, cloud, clean, client, count, check, call, calm, code, cloud, clean, client, count, check, call, calm, clear,"
      },
      {
        "id": "3-2-3",
        "title": "Complex Punctuated Sentences 1",
        "type": "sentences",
        "targetKeys": [
          "c",
          ","
        ],
        "text": "clear, clean code creates calm, reliable results for clients, officers, and clerks. call the office, check the records, and count every single copy carefully. come, check, and confirm the exact details for each case, court, and clerk. calm minds, clean files, and quick fingers create great typing speed. clear, clean code creates calm, reliable results for clients, officers, and clerks. call the office, check the records, and count every single copy carefully. come, check, and confirm the exact details for each case, court, and clerk. calm minds, clean files, and quick fingers create great typing speed. clear, clean code creates calm, reliable results for clients, officers, and clerks. call the office, check the records, and count every single copy carefully. come, check, and confirm the exact details for each case, court, and clerk. calm minds, clean files, and quick fingers create great typing speed. clear, clean code creates calm, reliable results for clients, officers, and clerks. call the office, check the records, and count every single copy carefully. come, check, and confirm the exact details for each case, court, and clerk. calm minds, clean files, and quick fingers create great typing speed."
      },
      {
        "id": "3-2-4",
        "title": "Complex Punctuated Sentences 2",
        "type": "sentences",
        "targetKeys": [
          "c",
          ","
        ],
        "text": "in court, every comma, word, and line carries heavy official weight. check the court orders, clean the old records, and count the total pages. clients, clerks, and officers always prefer clear, concise, and clean text. type with care, pause at commas, and maintain a calm, steady rhythm. in court, every comma, word, and line carries heavy official weight. check the court orders, clean the old records, and count the total pages. clients, clerks, and officers always prefer clear, concise, and clean text. type with care, pause at commas, and maintain a calm, steady rhythm. in court, every comma, word, and line carries heavy official weight. check the court orders, clean the old records, and count the total pages. clients, clerks, and officers always prefer clear, concise, and clean text. type with care, pause at commas, and maintain a calm, steady rhythm. in court, every comma, word, and line carries heavy official weight. check the court orders, clean the old records, and count the total pages. clients, clerks, and officers always prefer clear, concise, and clean text. type with care, pause at commas, and maintain a calm, steady rhythm. in court, every comma, word, and line carries heavy official weight."
      }
    ]
  },
  {
    "id": "lesson-3-3",
    "stage": 3,
    "stageTitle": "Stage 3: Bottom Row Foundations",
    "title": "Lesson 14: Keys X and Period (.)",
    "description": "Reach down with ring fingers: left ring to X and right ring to Period (.).",
    "targetKeys": [
      "x",
      ".",
      "s",
      "l"
    ],
    "minWpm": 24,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "3-3-1",
        "title": "X & Period Precision Drill",
        "type": "drill",
        "targetKeys": [
          "x",
          ".",
          "s",
          "l"
        ],
        "text": "sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy. sx l. xs .l text. next. exact. relax. extra. exit. box. six. extra focus brings excellence. relax and type with exact precision. speed follows accuracy."
      },
      {
        "id": "3-3-2",
        "title": "Words with X and Periods",
        "type": "words",
        "targetKeys": [
          "x",
          "."
        ],
        "text": "next. text. box. six. tax. fix. mix. exact. exist. extra. exam. exit. exact. exist. extra. exam. exit. next. text. box. six. tax. fix. mix. exam. exit. next. text. box. six. tax. fix. mix. exact. exist. extra. tax. fix. mix. exact. exist. extra. exam. exit. next. text. box. six. next. text. box. six. tax. fix. mix. exact. exist. extra. exam. exit. exact. exist. extra. exam. exit. next. text. box. six. tax. fix. mix. exam. exit. next. text. box. six. tax. fix. mix. exact. exist. extra. tax. fix. mix. exact. exist. extra. exam. exit. next. text. box. six. next. text. box. six. tax. fix. mix. exact. exist. extra. exam. exit. exact. exist. extra. exam. exit. next. text. box. six. tax. fix. mix. exam. exit. next. text. box. six. tax. fix. mix. exact. exist. extra. tax. fix. mix. exact. exist. extra. exam. exit. next. text. box. six. next. text. box. six. tax. fix. mix. exact. exist. extra. exam. exit. exact. exist. extra. exam. exit. next. text. box. six. tax. fix. mix. exam. exit. next. text. box. six. tax. fix. mix. exact. exist. extra. tax. fix. mix. exact. exist. extra. exam. exit. next. text. box. six. next. text. box. six. tax. fix. mix. exact. exist. extra. exam. exit. exact. exist. extra. exam. exit. next. text. box. six. tax. fix. mix."
      },
      {
        "id": "3-3-3",
        "title": "Sentence Punctuation Endurance 1",
        "type": "sentences",
        "targetKeys": [
          "x",
          "."
        ],
        "text": "relax and type with exact precision. speed follows accuracy naturally. extra focus during the exam produces excellent and exact results. the next text requires extra attention to punctuation and spacing. exit the exam hall with confidence after typing every single line exactly. relax and type with exact precision. speed follows accuracy naturally. extra focus during the exam produces excellent and exact results. the next text requires extra attention to punctuation and spacing. exit the exam hall with confidence after typing every single line exactly. relax and type with exact precision. speed follows accuracy naturally. extra focus during the exam produces excellent and exact results. the next text requires extra attention to punctuation and spacing. exit the exam hall with confidence after typing every single line exactly. relax and type with exact precision. speed follows accuracy naturally. extra focus during the exam produces excellent and exact results. the next text requires extra attention to punctuation and spacing. exit the exam hall with confidence after typing every single line exactly. relax and type with exact precision. speed follows accuracy naturally. extra focus during the exam produces excellent and exact results."
      },
      {
        "id": "3-3-4",
        "title": "Sentence Punctuation Endurance 2",
        "type": "sentences",
        "targetKeys": [
          "x",
          "."
        ],
        "text": "fix your mistakes immediately. exact typing is better than hasty rushing. relax your hands. excess tension reduces speed and increases errors. the next box contains six exact copies of the official exam text. extra daily practice exists to maximize your ultimate score and accuracy. fix your mistakes immediately. exact typing is better than hasty rushing. relax your hands. excess tension reduces speed and increases errors. the next box contains six exact copies of the official exam text. extra daily practice exists to maximize your ultimate score and accuracy. fix your mistakes immediately. exact typing is better than hasty rushing. relax your hands. excess tension reduces speed and increases errors. the next box contains six exact copies of the official exam text. extra daily practice exists to maximize your ultimate score and accuracy. fix your mistakes immediately. exact typing is better than hasty rushing. relax your hands. excess tension reduces speed and increases errors. the next box contains six exact copies of the official exam text. extra daily practice exists to maximize your ultimate score and accuracy. fix your mistakes immediately. exact typing is better than hasty rushing."
      }
    ]
  },
  {
    "id": "lesson-3-4",
    "stage": 3,
    "stageTitle": "Stage 3: Bottom Row Foundations",
    "title": "Lesson 15: Keys Z and Slash (/)",
    "description": "Reach down with pinky fingers: left pinky to Z and right pinky to Slash (/).",
    "targetKeys": [
      "z",
      "/",
      "a",
      ";"
    ],
    "minWpm": 24,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "3-4-1",
        "title": "Z & Slash Pinky Reach Drill",
        "type": "drill",
        "targetKeys": [
          "z",
          "/",
          "a",
          ";"
        ],
        "text": "az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or the quick brown fox jumps over the lazy dog. sphinx of black quartz, judge my vow. az ;/ za /; zero size zone puzzle maze breeze zoom/in and/or"
      },
      {
        "id": "3-4-2",
        "title": "Z & Vocabulary Word Flow",
        "type": "words",
        "targetKeys": [
          "z",
          "/"
        ],
        "text": "zero size zone quiz buzz prize maze freeze horizon realize organize quiz buzz prize maze freeze horizon realize organize zero size zone prize maze freeze horizon realize organize zero size zone quiz buzz horizon realize organize zero size zone quiz buzz prize maze freeze zero size zone quiz buzz prize maze freeze horizon realize organize quiz buzz prize maze freeze horizon realize organize zero size zone prize maze freeze horizon realize organize zero size zone quiz buzz horizon realize organize zero size zone quiz buzz prize maze freeze zero size zone quiz buzz prize maze freeze horizon realize organize quiz buzz prize maze freeze horizon realize organize zero size zone prize maze freeze horizon realize organize zero size zone quiz buzz horizon realize organize zero size zone quiz buzz prize maze freeze zero size zone quiz buzz prize maze freeze horizon realize organize quiz buzz prize maze freeze horizon realize organize zero size zone prize maze freeze horizon realize organize zero size zone quiz buzz horizon realize organize zero size zone quiz buzz prize maze freeze zero size zone quiz buzz prize maze freeze horizon realize organize quiz buzz prize maze freeze horizon realize organize zero size zone"
      },
      {
        "id": "3-4-3",
        "title": "Full Alphabet Pangrams Part 1",
        "type": "sentences",
        "targetKeys": [
          "z",
          "/"
        ],
        "text": "the quick brown fox jumps over the lazy dog in the quiet park. sphinx of black quartz, judge my very vow with zeal and pride. pack my box with five dozen liquor jugs before we zoom away. crazy fredrick bought many very exquisite opal jewels in Zurich. the quick brown fox jumps over the lazy dog in the quiet park. sphinx of black quartz, judge my very vow with zeal and pride. pack my box with five dozen liquor jugs before we zoom away. crazy fredrick bought many very exquisite opal jewels in Zurich. the quick brown fox jumps over the lazy dog in the quiet park. sphinx of black quartz, judge my very vow with zeal and pride. pack my box with five dozen liquor jugs before we zoom away. crazy fredrick bought many very exquisite opal jewels in Zurich. the quick brown fox jumps over the lazy dog in the quiet park. sphinx of black quartz, judge my very vow with zeal and pride. pack my box with five dozen liquor jugs before we zoom away. crazy fredrick bought many very exquisite opal jewels in Zurich. the quick brown fox jumps over the lazy dog in the quiet park. sphinx of black quartz, judge my very vow with zeal and pride. pack my box with five dozen liquor jugs before we zoom away. crazy fredrick bought many very exquisite opal jewels in Zurich."
      },
      {
        "id": "3-4-4",
        "title": "Full Alphabet Pangrams Part 2",
        "type": "sentences",
        "targetKeys": [
          "z",
          "/"
        ],
        "text": "the crazy wizard jumps quickly over six big lazy red dogs. jackdaws love my big sphinx of quartz when the cold breeze blows. how razorback-jumping frogs can level six piqued gymnasts quickly. the five boxing wizards jump quickly around the frozen zero zone. the crazy wizard jumps quickly over six big lazy red dogs. jackdaws love my big sphinx of quartz when the cold breeze blows. how razorback-jumping frogs can level six piqued gymnasts quickly. the five boxing wizards jump quickly around the frozen zero zone. the crazy wizard jumps quickly over six big lazy red dogs. jackdaws love my big sphinx of quartz when the cold breeze blows. how razorback-jumping frogs can level six piqued gymnasts quickly. the five boxing wizards jump quickly around the frozen zero zone. the crazy wizard jumps quickly over six big lazy red dogs. jackdaws love my big sphinx of quartz when the cold breeze blows. how razorback-jumping frogs can level six piqued gymnasts quickly. the five boxing wizards jump quickly around the frozen zero zone. the crazy wizard jumps quickly over six big lazy red dogs. jackdaws love my big sphinx of quartz when the cold breeze blows. how razorback-jumping frogs can level six piqued gymnasts quickly."
      }
    ]
  },
  {
    "id": "lesson-4-1",
    "stage": 4,
    "stageTitle": "Stage 4: Capitalization & Shift Mastery",
    "title": "Lesson 16: Shift Key Coordination",
    "description": "Hold opposite shift key: Right Shift for left hand keys, Left Shift for right hand keys.",
    "targetKeys": [
      "Shift",
      "A-Z"
    ],
    "minWpm": 26,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "4-1-1",
        "title": "Proper Nouns & State Capitalization",
        "type": "words",
        "targetKeys": [
          "Shift"
        ],
        "text": "India Bharat Delhi Mumbai Haryana Punjab London Paris Tokyo NewYork Google Microsoft Mohit and Rohit traveled across Haryana and Punjab to prepare for their Clerk Examination. Chandigarh is the capital of both Haryana and Punjab in Northern India. The High Court of Punjab and Haryana delivers justice with dignity and honor. India Bharat Delhi Mumbai Haryana Punjab London Paris Tokyo NewYork Google Microsoft Mohit and Rohit traveled across Haryana and Punjab to prepare for their Clerk Examination. Chandigarh is the capital of both Haryana and Punjab in Northern India. The High Court of Punjab and Haryana delivers justice with dignity and honor. India Bharat Delhi Mumbai Haryana Punjab London Paris Tokyo NewYork Google Microsoft Mohit and Rohit traveled across Haryana and Punjab to prepare for their Clerk Examination. Chandigarh is the capital of both Haryana and Punjab in Northern India. The High Court of Punjab and Haryana delivers justice with dignity and honor. India Bharat Delhi Mumbai Haryana Punjab London Paris Tokyo NewYork Google Microsoft Mohit and Rohit traveled across Haryana and Punjab to prepare for their Clerk Examination. Chandigarh is the capital of both Haryana and Punjab in Northern India."
      },
      {
        "id": "4-1-2",
        "title": "Capitalized Continuous Text 1",
        "type": "sentences",
        "targetKeys": [
          "Shift"
        ],
        "text": "Mohit and Rohit prepared diligently for the Haryana State Clerk Examination. The Supreme Court of India is situated on Tilak Marg in New Delhi. Parliament passed the Digital Personal Data Protection Act with strong support. Candidates from Chandigarh, Panchkula, Ambala, and Karnal appeared for the test. Mohit and Rohit prepared diligently for the Haryana State Clerk Examination. The Supreme Court of India is situated on Tilak Marg in New Delhi. Parliament passed the Digital Personal Data Protection Act with strong support. Candidates from Chandigarh, Panchkula, Ambala, and Karnal appeared for the test. Mohit and Rohit prepared diligently for the Haryana State Clerk Examination. The Supreme Court of India is situated on Tilak Marg in New Delhi. Parliament passed the Digital Personal Data Protection Act with strong support. Candidates from Chandigarh, Panchkula, Ambala, and Karnal appeared for the test. Mohit and Rohit prepared diligently for the Haryana State Clerk Examination. The Supreme Court of India is situated on Tilak Marg in New Delhi. Parliament passed the Digital Personal Data Protection Act with strong support. Candidates from Chandigarh, Panchkula, Ambala, and Karnal appeared for the test."
      },
      {
        "id": "4-1-3",
        "title": "Capitalized Continuous Text 2",
        "type": "sentences",
        "targetKeys": [
          "Shift"
        ],
        "text": "Shri Narendra Modi addressed the nation regarding technological innovations in India. The Union Public Service Commission conducts prestigious civil services examinations. The High Court Registrar issued clear guidelines for the English Typing Test. Proper capitalization of names, cities, and statutory bodies is strictly evaluated. Shri Narendra Modi addressed the nation regarding technological innovations in India. The Union Public Service Commission conducts prestigious civil services examinations. The High Court Registrar issued clear guidelines for the English Typing Test. Proper capitalization of names, cities, and statutory bodies is strictly evaluated. Shri Narendra Modi addressed the nation regarding technological innovations in India. The Union Public Service Commission conducts prestigious civil services examinations. The High Court Registrar issued clear guidelines for the English Typing Test. Proper capitalization of names, cities, and statutory bodies is strictly evaluated. Shri Narendra Modi addressed the nation regarding technological innovations in India. The Union Public Service Commission conducts prestigious civil services examinations. The High Court Registrar issued clear guidelines for the English Typing Test."
      }
    ]
  },
  {
    "id": "lesson-4-2",
    "stage": 4,
    "stageTitle": "Stage 4: Capitalization & Shift Mastery",
    "title": "Lesson 17: Official & Legal Capitalization",
    "description": "Master strict legal case headings, statutory section titles, and formal designations.",
    "targetKeys": [
      "Shift",
      "A-Z",
      "Quotes"
    ],
    "minWpm": 28,
    "minAccuracy": 92,
    "exercises": [
      {
        "id": "4-2-1",
        "title": "Legal & Court Heading Drill",
        "type": "words",
        "targetKeys": [
          "Shift"
        ],
        "text": "Section 144 of the Code of Criminal Procedure was promulgated in the district. Article 21 of the Constitution guarantees the fundamental Right to Life and Liberty. The Hon'ble Chief Justice delivered an authoritative judgment on administrative law. All applicants must bring their original Aadhar Card, Admit Card, and Marksheets. Section 144 of the Code of Criminal Procedure was promulgated in the district. Article 21 of the Constitution guarantees the fundamental Right to Life and Liberty. The Hon'ble Chief Justice delivered an authoritative judgment on administrative law. All applicants must bring their original Aadhar Card, Admit Card, and Marksheets. Section 144 of the Code of Criminal Procedure was promulgated in the district. Article 21 of the Constitution guarantees the fundamental Right to Life and Liberty. The Hon'ble Chief Justice delivered an authoritative judgment on administrative law. All applicants must bring their original Aadhar Card, Admit Card, and Marksheets. Section 144 of the Code of Criminal Procedure was promulgated in the district. Article 21 of the Constitution guarantees the fundamental Right to Life and Liberty. The Hon'ble Chief Justice delivered an authoritative judgment on administrative law."
      },
      {
        "id": "4-2-2",
        "title": "Statutory Paragraph Practice 1",
        "type": "sentences",
        "targetKeys": [
          "Shift"
        ],
        "text": "The High Court bench presided over by Justice Sharma heard the urgent writ petition. According to Article 32 of the Constitution, citizens may approach the Supreme Court. The State Government of Haryana announced new recruitment vacancies for Assistants. Every candidate must maintain accurate Shift key coordination for capital letters. The High Court bench presided over by Justice Sharma heard the urgent writ petition. According to Article 32 of the Constitution, citizens may approach the Supreme Court. The State Government of Haryana announced new recruitment vacancies for Assistants. Every candidate must maintain accurate Shift key coordination for capital letters. The High Court bench presided over by Justice Sharma heard the urgent writ petition. According to Article 32 of the Constitution, citizens may approach the Supreme Court. The State Government of Haryana announced new recruitment vacancies for Assistants. Every candidate must maintain accurate Shift key coordination for capital letters. The High Court bench presided over by Justice Sharma heard the urgent writ petition. According to Article 32 of the Constitution, citizens may approach the Supreme Court. The State Government of Haryana announced new recruitment vacancies for Assistants."
      },
      {
        "id": "4-2-3",
        "title": "Statutory Paragraph Practice 2",
        "type": "sentences",
        "targetKeys": [
          "Shift"
        ],
        "text": "The Registrar General notified that the minimum speed requirement is 35 Words Per Minute. The Central Administrative Tribunal passed directions regarding seniority and promotions. General Counsel representing the State submitted the counter-affidavit on Monday. Strict penal deductions apply for uncapitalized proper nouns and missing apostrophes. The Registrar General notified that the minimum speed requirement is 35 Words Per Minute. The Central Administrative Tribunal passed directions regarding seniority and promotions. General Counsel representing the State submitted the counter-affidavit on Monday. Strict penal deductions apply for uncapitalized proper nouns and missing apostrophes. The Registrar General notified that the minimum speed requirement is 35 Words Per Minute. The Central Administrative Tribunal passed directions regarding seniority and promotions. General Counsel representing the State submitted the counter-affidavit on Monday. Strict penal deductions apply for uncapitalized proper nouns and missing apostrophes. The Registrar General notified that the minimum speed requirement is 35 Words Per Minute. The Central Administrative Tribunal passed directions regarding seniority and promotions."
      }
    ]
  },
  {
    "id": "lesson-5-1",
    "stage": 5,
    "stageTitle": "Stage 5: Number Row Mastery",
    "title": "Lesson 18: Numbers 1 through 0",
    "description": "Reach up from the home row to accurately type numerical digits and dates.",
    "targetKeys": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0"
    ],
    "minWpm": 24,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "5-1-1",
        "title": "Number Sequence Cadence Drill",
        "type": "drill",
        "targetKeys": [
          "0-9"
        ],
        "text": "12345 67890 1984 2024 2026 100 250 500 750 1000 35 45 60 72 84 96 in 2024, the clerk exam had 150 questions and required a typing speed of 35 words per minute. the total fee was Rs 1250 for general and Rs 625 for reserved category candidates. serial numbers 101, 102, 103, 104, and 105 were verified by the audit team on 15/08/2024. 12345 67890 1984 2024 2026 100 250 500 750 1000 35 45 60 72 84 96 in 2024, the clerk exam had 150 questions and required a typing speed of 35 words per minute. the total fee was Rs 1250 for general and Rs 625 for reserved category candidates. serial numbers 101, 102, 103, 104, and 105 were verified by the audit team on 15/08/2024. 12345 67890 1984 2024 2026 100 250 500 750 1000 35 45 60 72 84 96 in 2024, the clerk exam had 150 questions and required a typing speed of 35 words per minute. the total fee was Rs 1250 for general and Rs 625 for reserved category candidates. serial numbers 101, 102, 103, 104, and 105 were verified by the audit team on 15/08/2024. 12345 67890 1984 2024 2026 100 250 500 750 1000 35 45 60 72 84 96 in 2024, the clerk exam had 150 questions and required a typing speed of 35 words per minute. the total fee was Rs 1250 for general and Rs 625 for reserved category candidates."
      },
      {
        "id": "5-1-2",
        "title": "Alphanumeric Statistics & Records 1",
        "type": "sentences",
        "targetKeys": [
          "0-9"
        ],
        "text": "in the year 2024, more than 85000 candidates registered for 450 clerk posts. the exam lasted 120 minutes with 100 multiple choice questions worth 2 marks each. page 45 of document 78 contains 12 tables, 34 charts, and 56 numerical figures. the candidate scored 89 out of 100 in the written test and 42 WPM in typing. in the year 2024, more than 85000 candidates registered for 450 clerk posts. the exam lasted 120 minutes with 100 multiple choice questions worth 2 marks each. page 45 of document 78 contains 12 tables, 34 charts, and 56 numerical figures. the candidate scored 89 out of 100 in the written test and 42 WPM in typing. in the year 2024, more than 85000 candidates registered for 450 clerk posts. the exam lasted 120 minutes with 100 multiple choice questions worth 2 marks each. page 45 of document 78 contains 12 tables, 34 charts, and 56 numerical figures. the candidate scored 89 out of 100 in the written test and 42 WPM in typing. in the year 2024, more than 85000 candidates registered for 450 clerk posts. the exam lasted 120 minutes with 100 multiple choice questions worth 2 marks each. page 45 of document 78 contains 12 tables, 34 charts, and 56 numerical figures. the candidate scored 89 out of 100 in the written test and 42 WPM in typing."
      },
      {
        "id": "5-1-3",
        "title": "Alphanumeric Statistics & Records 2",
        "type": "sentences",
        "targetKeys": [
          "0-9"
        ],
        "text": "a total of 1500 seats were distributed across 22 districts in Haryana State. the speed test consists of 2000 key depressions to be typed in 10 minutes. the notification number 05/2024 dated 12th July invited applications for 350 posts. remember that 1 minute equals 60 seconds and 35 WPM equals 175 keystrokes. a total of 1500 seats were distributed across 22 districts in Haryana State. the speed test consists of 2000 key depressions to be typed in 10 minutes. the notification number 05/2024 dated 12th July invited applications for 350 posts. remember that 1 minute equals 60 seconds and 35 WPM equals 175 keystrokes. a total of 1500 seats were distributed across 22 districts in Haryana State. the speed test consists of 2000 key depressions to be typed in 10 minutes. the notification number 05/2024 dated 12th July invited applications for 350 posts. remember that 1 minute equals 60 seconds and 35 WPM equals 175 keystrokes. a total of 1500 seats were distributed across 22 districts in Haryana State. the speed test consists of 2000 key depressions to be typed in 10 minutes. the notification number 05/2024 dated 12th July invited applications for 350 posts. remember that 1 minute equals 60 seconds and 35 WPM equals 175 keystrokes."
      }
    ]
  },
  {
    "id": "lesson-5-2",
    "stage": 5,
    "stageTitle": "Stage 5: Number Row Mastery",
    "title": "Lesson 19: Financial & Mixed Alphanumeric Text",
    "description": "Type percentages, rupee amounts, case numbers, and pin codes seamlessly.",
    "targetKeys": [
      "0-9",
      "%",
      "$",
      "#",
      "-",
      "/",
      "@"
    ],
    "minWpm": 26,
    "minAccuracy": 90,
    "exercises": [
      {
        "id": "5-2-1",
        "title": "Financial & Percentage Cadence",
        "type": "drill",
        "targetKeys": [
          "0-9",
          "%"
        ],
        "text": "10% of 500 is 50; 25% of 1000 is 250; 75% of 200 is 150; 99% accuracy is expected. the budget allocated $5,000,000 for IT infrastructure and 12.5% for staff training. room #402, floor #4, building #18, sector 17-C, Chandigarh - 160017. case no. 4589/2023 was listed at item no. 14 before court hall no. 3 at 10:30 AM. 10% of 500 is 50; 25% of 1000 is 250; 75% of 200 is 150; 99% accuracy is expected. the budget allocated $5,000,000 for IT infrastructure and 12.5% for staff training. room #402, floor #4, building #18, sector 17-C, Chandigarh - 160017. case no. 4589/2023 was listed at item no. 14 before court hall no. 3 at 10:30 AM. 10% of 500 is 50; 25% of 1000 is 250; 75% of 200 is 150; 99% accuracy is expected. the budget allocated $5,000,000 for IT infrastructure and 12.5% for staff training. room #402, floor #4, building #18, sector 17-C, Chandigarh - 160017. case no. 4589/2023 was listed at item no. 14 before court hall no. 3 at 10:30 AM. 10% of 500 is 50; 25% of 1000 is 250; 75% of 200 is 150; 99% accuracy is expected. the budget allocated $5,000,000 for IT infrastructure and 12.5% for staff training. room #402, floor #4, building #18, sector 17-C, Chandigarh - 160017. case no. 4589/2023 was listed at item no. 14 before court hall no. 3 at 10:30 AM."
      },
      {
        "id": "5-2-2",
        "title": "Administrative Alphanumeric Paragraph 1",
        "type": "sentences",
        "targetKeys": [
          "0-9"
        ],
        "text": "on 26-01-1950, India became a Republic with 395 Articles and 8 Schedules. the inflation rate dropped from 6.8% in 2022 to 4.2% in the second quarter of 2024. the speed threshold of 8000 KDPH translates to approximately 26.6 WPM net speed. the clerk processed 145 applications, 68 affidavits, and 290 fee receipts today. on 26-01-1950, India became a Republic with 395 Articles and 8 Schedules. the inflation rate dropped from 6.8% in 2022 to 4.2% in the second quarter of 2024. the speed threshold of 8000 KDPH translates to approximately 26.6 WPM net speed. the clerk processed 145 applications, 68 affidavits, and 290 fee receipts today. on 26-01-1950, India became a Republic with 395 Articles and 8 Schedules. the inflation rate dropped from 6.8% in 2022 to 4.2% in the second quarter of 2024. the speed threshold of 8000 KDPH translates to approximately 26.6 WPM net speed. the clerk processed 145 applications, 68 affidavits, and 290 fee receipts today. on 26-01-1950, India became a Republic with 395 Articles and 8 Schedules. the inflation rate dropped from 6.8% in 2022 to 4.2% in the second quarter of 2024. the speed threshold of 8000 KDPH translates to approximately 26.6 WPM net speed. the clerk processed 145 applications, 68 affidavits, and 290 fee receipts today."
      },
      {
        "id": "5-2-3",
        "title": "Administrative Alphanumeric Paragraph 2",
        "type": "sentences",
        "targetKeys": [
          "0-9"
        ],
        "text": "pin code 134112 corresponds to Sector 5, Panchkula, Haryana, India. the total transaction amount was Rs 45,678.50 with a bank fee of Rs 12.00. an error penalty of 0.5 marks applies for every numerical mismatch in the test. mastering the number row enables swift entry without breaking tactile anchor focus. pin code 134112 corresponds to Sector 5, Panchkula, Haryana, India. the total transaction amount was Rs 45,678.50 with a bank fee of Rs 12.00. an error penalty of 0.5 marks applies for every numerical mismatch in the test. mastering the number row enables swift entry without breaking tactile anchor focus. pin code 134112 corresponds to Sector 5, Panchkula, Haryana, India. the total transaction amount was Rs 45,678.50 with a bank fee of Rs 12.00. an error penalty of 0.5 marks applies for every numerical mismatch in the test. mastering the number row enables swift entry without breaking tactile anchor focus. pin code 134112 corresponds to Sector 5, Panchkula, Haryana, India. the total transaction amount was Rs 45,678.50 with a bank fee of Rs 12.00. an error penalty of 0.5 marks applies for every numerical mismatch in the test. mastering the number row enables swift entry without breaking tactile anchor focus."
      }
    ]
  },
  {
    "id": "lesson-6-1",
    "stage": 6,
    "stageTitle": "Stage 6: Speed Booster & Flow",
    "title": "Lesson 20: Top 100 Most Common Words",
    "description": "Build instantaneous reflex memory for words that constitute 50%+ of written English.",
    "targetKeys": [
      "All"
    ],
    "minWpm": 30,
    "minAccuracy": 95,
    "exercises": [
      {
        "id": "6-1-1",
        "title": "Common Words Sprint Part 1",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part"
      },
      {
        "id": "6-1-2",
        "title": "Common Words Sprint Part 2",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part"
      },
      {
        "id": "6-1-3",
        "title": "Common Words Sprint Part 3",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part"
      }
    ]
  },
  {
    "id": "lesson-6-2",
    "stage": 6,
    "stageTitle": "Stage 6: Speed Booster & Flow",
    "title": "Lesson 21: High-Frequency Bigrams & Trigrams",
    "description": "Train fluid transition speeds on the most frequent letter combinations in English.",
    "targetKeys": [
      "All"
    ],
    "minWpm": 32,
    "minAccuracy": 95,
    "exercises": [
      {
        "id": "6-2-1",
        "title": "Bigram & Trigram Sprint 1",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between"
      },
      {
        "id": "6-2-2",
        "title": "Bigram & Trigram Sprint 2",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between"
      },
      {
        "id": "6-2-3",
        "title": "Bigram & Trigram Sprint 3",
        "type": "words",
        "targetKeys": [
          "All"
        ],
        "text": "th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between th he in er an re nd on en at ou ed is ti or st ar te et ng of al it as is to in the and ing ion tio for that with this from they were have been will would should could there their about which these other great where right through before between"
      }
    ]
  },
  {
    "id": "lesson-6-3",
    "stage": 6,
    "stageTitle": "Stage 6: Speed Booster & Flow",
    "title": "Lesson 22: Paragraph Touch Typing Fluency",
    "description": "Build non-stop stamina across multi-paragraph essays and editorial prose.",
    "targetKeys": [
      "All"
    ],
    "minWpm": 35,
    "minAccuracy": 95,
    "exercises": [
      {
        "id": "6-3-1",
        "title": "Prose & Posture Endurance 1",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy."
      },
      {
        "id": "6-3-2",
        "title": "Prose & Posture Endurance 2",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy."
      },
      {
        "id": "6-3-3",
        "title": "Prose & Posture Endurance 3",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy. The development of touch typing proficiency requires dedicated daily practice, unwavering concentration, and precise finger placement. When an aspiring candidate sits in front of the keyboard, the spine must remain erect, the wrists slightly elevated above the desk surface, and the eyes firmly focused on the text to be transcribed. Never look down at the keyboard caps. Trust the tactile bumps on the F and J keys to guide your index fingers home automatically. Speed is a natural byproduct of impeccable accuracy."
      }
    ]
  },
  {
    "id": "lesson-6-4",
    "stage": 6,
    "stageTitle": "Stage 6: Speed Booster & Flow",
    "title": "Lesson 23: State Clerk & High Court Exam Simulation",
    "description": "Official court deposition and administrative memo passages matching exam standards.",
    "targetKeys": [
      "All"
    ],
    "minWpm": 38,
    "minAccuracy": 95,
    "exercises": [
      {
        "id": "6-4-1",
        "title": "High Court Bench Dictation 1",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed."
      },
      {
        "id": "6-4-2",
        "title": "High Court Bench Dictation 2",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed."
      },
      {
        "id": "6-4-3",
        "title": "High Court Bench Dictation 3",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed. In the High Court of Punjab and Haryana at Chandigarh, the administration of judicial business requires impeccable record-keeping and rapid transcript preparation. Clerks and stenographers are expected to maintain an error rate below five percent while transcribing lengthy depositions, statutory provisions, and judicial pronouncements. A single typing mistake in a legal cause title or decree order can lead to serious jurisdictional ambiguities. Therefore, precision and consistency must take precedence over hurried speed."
      }
    ]
  },
  {
    "id": "lesson-6-5",
    "stage": 6,
    "stageTitle": "Stage 6: Speed Booster & Flow",
    "title": "Lesson 24: Grand 40+ WPM Mastery Championship",
    "description": "Graduation marathon test — sustain 40+ WPM with 95%+ accuracy to qualify with distinction.",
    "targetKeys": [
      "All"
    ],
    "minWpm": 40,
    "minAccuracy": 95,
    "exercises": [
      {
        "id": "6-5-1",
        "title": "Grand Championship Sprint 1",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes."
      },
      {
        "id": "6-5-2",
        "title": "Grand Championship Sprint 2",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes."
      },
      {
        "id": "6-5-3",
        "title": "Grand Championship Sprint 3",
        "type": "sentences",
        "targetKeys": [
          "All"
        ],
        "text": "The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes. The ultimate challenge for a touch typist is to sustain a velocity of forty words per minute across continuous five to ten minute marathon sessions. At this elevated level of mastery, the mind no longer processes individual letters or keys in isolation. Instead, entire words and phrases flow effortlessly from visual recognition directly into synchronized neuromuscular impulses across all ten fingers. Rhythm, cadence, posture, and mental calm are the four pillars of champion keyboard athletes."
      }
    ]
  }
];

export const MASTERY_PLAN: DayPlan[] = [
  {
    "day": 1,
    "targetWpm": 10,
    "stages": [
      1
    ],
    "lessonIds": [
      "lesson-1-1",
      "lesson-1-2",
      "lesson-1-3"
    ],
    "title": "Home Row Left Anchors",
    "minSessions": 6
  },
  {
    "day": 2,
    "targetWpm": 15,
    "stages": [
      1
    ],
    "lessonIds": [
      "lesson-1-4",
      "lesson-1-5",
      "lesson-1-6"
    ],
    "title": "Home Row Complete Fluency",
    "minSessions": 6
  },
  {
    "day": 3,
    "targetWpm": 18,
    "stages": [
      2
    ],
    "lessonIds": [
      "lesson-2-1",
      "lesson-2-2",
      "lesson-2-3"
    ],
    "title": "Top Row E, I, R, U, T, Y",
    "minSessions": 5
  },
  {
    "day": 4,
    "targetWpm": 22,
    "stages": [
      2
    ],
    "lessonIds": [
      "lesson-2-4",
      "lesson-2-5"
    ],
    "title": "Top Row W, O, Q, P Mastery",
    "minSessions": 5
  },
  {
    "day": 5,
    "targetWpm": 24,
    "stages": [
      3
    ],
    "lessonIds": [
      "lesson-3-1",
      "lesson-3-2",
      "lesson-3-3",
      "lesson-3-4"
    ],
    "title": "Bottom Row Complete",
    "minSessions": 5
  },
  {
    "day": 6,
    "targetWpm": 26,
    "stages": [
      4
    ],
    "lessonIds": [
      "lesson-4-1",
      "lesson-4-2"
    ],
    "title": "Shift Key & Capitalization",
    "minSessions": 4
  },
  {
    "day": 7,
    "targetWpm": 28,
    "stages": [
      5
    ],
    "lessonIds": [
      "lesson-5-1",
      "lesson-5-2"
    ],
    "title": "Number Row & Financials",
    "minSessions": 4
  },
  {
    "day": 8,
    "targetWpm": 32,
    "stages": [
      6
    ],
    "lessonIds": [
      "lesson-6-1",
      "lesson-6-2"
    ],
    "title": "Top 100 Common Words Sprint",
    "minSessions": 5
  },
  {
    "day": 9,
    "targetWpm": 36,
    "stages": [
      6
    ],
    "lessonIds": [
      "lesson-6-3",
      "lesson-6-4"
    ],
    "title": "Paragraph & Legal Dictation",
    "minSessions": 5
  },
  {
    "day": 10,
    "targetWpm": 40,
    "stages": [
      6
    ],
    "lessonIds": [
      "lesson-6-5"
    ],
    "title": "Grand 40+ WPM Championship",
    "minSessions": 6
  }
];

export interface NextLessonTarget {
  type: 'EXERCISE' | 'LESSON';
  lessonId: string;
  exerciseIndex: number;
  exerciseTitle: string;
  lessonTitle: string;
  text: string;
  label: string;
}

export const getNextLessonTarget = (
  currentLessonId: string,
  currentExerciseIndex: number = 0
): NextLessonTarget | null => {
  const lesson = LESSONS.find(l => l.id === currentLessonId);
  if (!lesson) return null;

  // 1. Next exercise in the same lesson
  if (currentExerciseIndex < lesson.exercises.length - 1) {
    const nextIdx = currentExerciseIndex + 1;
    const nextEx = lesson.exercises[nextIdx];
    return {
      type: 'EXERCISE',
      lessonId: lesson.id,
      exerciseIndex: nextIdx,
      exerciseTitle: nextEx.title,
      lessonTitle: lesson.title,
      text: nextEx.text,
      label: `Next Part: ${nextEx.title} (${nextIdx + 1}/${lesson.exercises.length}) ➔`,
    };
  }

  // 2. Next lesson in sequence
  const currentIdx = LESSONS.findIndex(l => l.id === currentLessonId);
  if (currentIdx >= 0 && currentIdx < LESSONS.length - 1) {
    const nextLesson = LESSONS[currentIdx + 1];
    const nextEx = nextLesson.exercises[0];
    return {
      type: 'LESSON',
      lessonId: nextLesson.id,
      exerciseIndex: 0,
      exerciseTitle: nextEx.title,
      lessonTitle: nextLesson.title,
      text: nextEx.text,
      label: `Next Lesson: ${nextLesson.title} ➔`,
    };
  }

  return null;
};
