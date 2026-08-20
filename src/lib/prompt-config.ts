export type ConfigItem = {
  id: string;
  label_ko: string;
  label_en: string;
  prompt_text: string;
  level: number;
};

export type PromptConfig = Record<string, ConfigItem[]>;

// prompt_config.xlsx (V21.7 STABLE) 원본 값을 그대로 이식한 프롬프트 사전입니다.
export const PROMPT_CONFIG: PromptConfig = {
  "ViewComposition": [
    {
      "id": "VIEW_001",
      "label_ko": "정면 아이레벨 전신",
      "label_en": "Front Eye-Level Full Body",
      "prompt_text": "straight-on eye-level full-body shot, character centered in frame",
      "level": 0
    },
    {
      "id": "VIEW_002",
      "label_ko": "정면 아이레벨 미디엄",
      "label_en": "Front Eye-Level Medium",
      "prompt_text": "straight-on eye-level medium shot, character centered, waist up",
      "level": 0
    },
    {
      "id": "VIEW_003",
      "label_ko": "정면 클로즈업",
      "label_en": "Front Close-Up",
      "prompt_text": "close-up shot, front-facing, focusing on the character's facial expression",
      "level": 0
    },
    {
      "id": "VIEW_004",
      "label_ko": "로우앵글 전신",
      "label_en": "Low Angle Full Body",
      "prompt_text": "low-angle shot looking up at the character, full body visible",
      "level": 0
    },
    {
      "id": "VIEW_005",
      "label_ko": "하이앵글 부감",
      "label_en": "High Angle",
      "prompt_text": "high-angle shot looking down at the character",
      "level": 0
    },
    {
      "id": "VIEW_006",
      "label_ko": "버드아이 와이드",
      "label_en": "Bird's Eye Wide",
      "prompt_text": "bird's eye view wide shot, character and environment visible",
      "level": 0
    },
    {
      "id": "VIEW_007",
      "label_ko": "측면 미디엄",
      "label_en": "Side Profile Medium",
      "prompt_text": "side-profile medium shot",
      "level": 0
    },
    {
      "id": "VIEW_008",
      "label_ko": "더치앵글",
      "label_en": "Dutch Angle",
      "prompt_text": "dutch-angle shot, tilted frame, character centered",
      "level": 0
    },
    {
      "id": "VIEW_101",
      "label_ko": "극저각 오버숄더 (A 포커스)",
      "label_en": "Extreme Low OTS — Focus A",
      "prompt_text": "extreme low-angle shot, over-the-shoulder framing focusing on Figure {focusFig}, with Figure {foregroundFig}'s back in the foreground",
      "level": 0
    },
    {
      "id": "VIEW_102",
      "label_ko": "극저각 오버숄더 (B 포커스)",
      "label_en": "Extreme Low OTS — Focus B",
      "prompt_text": "extreme low-angle shot, over-the-shoulder framing focusing on Figure {focusFig}, with Figure {foregroundFig}'s back in the foreground",
      "level": 0
    },
    {
      "id": "VIEW_103",
      "label_ko": "정면 투샷",
      "label_en": "Front Two-Shot",
      "prompt_text": "straight-on eye-level two-shot, both characters facing the camera, centered in frame",
      "level": 0
    },
    {
      "id": "VIEW_104",
      "label_ko": "맞대면 측면",
      "label_en": "Face-to-Face Side Profile",
      "prompt_text": "side-profile shot, two characters facing each other",
      "level": 0
    },
    {
      "id": "VIEW_105",
      "label_ko": "하이앵글 투샷",
      "label_en": "High Angle Two-Shot",
      "prompt_text": "high-angle shot looking down at both characters",
      "level": 0
    },
    {
      "id": "VIEW_106",
      "label_ko": "클로즈업 반응 (A 포커스)",
      "label_en": "Close-Up Reaction — Focus A",
      "prompt_text": "close-up shot focusing on Figure {focusFig}'s expression, Figure {foregroundFig} partially visible in frame",
      "level": 0
    }
  ],
  "Emotion": [
    {
      "id": "EMO_000",
      "label_ko": "없음 (생략)",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "EMO_001",
      "label_ko": "무표정",
      "label_en": "Neutral",
      "prompt_text": "Expression: neutral, composed.",
      "level": 0
    },
    {
      "id": "EMO_002",
      "label_ko": "놀람",
      "label_en": "Surprised",
      "prompt_text": "Expression: surprised, wide eyes.",
      "level": 0
    },
    {
      "id": "EMO_003",
      "label_ko": "분노",
      "label_en": "Angry",
      "prompt_text": "Expression: angry, tense jaw.",
      "level": 0
    },
    {
      "id": "EMO_004",
      "label_ko": "억누른 분노",
      "label_en": "Suppressed Anger",
      "prompt_text": "Expression: suppressed anger, clenched expression.",
      "level": 0
    },
    {
      "id": "EMO_005",
      "label_ko": "어색한 긴장",
      "label_en": "Awkward Tension",
      "prompt_text": "Expression: awkward tension, stiff posture.",
      "level": 0
    },
    {
      "id": "EMO_006",
      "label_ko": "로맨틱 긴장",
      "label_en": "Romantic Tension",
      "prompt_text": "Expression: restrained romantic tension.",
      "level": 0
    },
    {
      "id": "EMO_007",
      "label_ko": "당황",
      "label_en": "Embarrassed",
      "prompt_text": "Expression: embarrassed, flushed.",
      "level": 0
    },
    {
      "id": "EMO_008",
      "label_ko": "자신감",
      "label_en": "Confident",
      "prompt_text": "Expression: confident, composed.",
      "level": 0
    },
    {
      "id": "EMO_009",
      "label_ko": "불안",
      "label_en": "Anxious",
      "prompt_text": "Expression: anxious, uneasy.",
      "level": 0
    },
    {
      "id": "EMO_010",
      "label_ko": "슬픔",
      "label_en": "Sad",
      "prompt_text": "Expression: sad, downcast eyes.",
      "level": 0
    },
    {
      "id": "EMO_011",
      "label_ko": "기쁨",
      "label_en": "Happy",
      "prompt_text": "Expression: happy, warm smile.",
      "level": 0
    },
    {
      "id": "EMO_012",
      "label_ko": "진지함",
      "label_en": "Serious",
      "prompt_text": "Expression: serious, focused.",
      "level": 0
    },
    {
      "id": "EMO_013",
      "label_ko": "지침",
      "label_en": "Exhausted",
      "prompt_text": "Expression: exhausted, heavy eyelids.",
      "level": 0
    },
    {
      "id": "EMO_014",
      "label_ko": "당혹",
      "label_en": "Flustered",
      "prompt_text": "Expression: flustered, panicked.",
      "level": 0
    },
    {
      "id": "EMO_015",
      "label_ko": "절제된 눈맞춤",
      "label_en": "Restrained Eye Contact",
      "prompt_text": "Expression: restrained eye contact, holding back emotion.",
      "level": 0
    }
  ],
  "PoseStrength": [
    {
      "id": "POS_001",
      "label_ko": "참고만",
      "label_en": "Loose Reference",
      "prompt_text": "loosely inspired by the pose in Figure N",
      "level": 1
    },
    {
      "id": "POS_002",
      "label_ko": "보통",
      "label_en": "General Follow",
      "prompt_text": "follow the general pose and composition of Figure N",
      "level": 2
    },
    {
      "id": "POS_003",
      "label_ko": "강하게",
      "label_en": "Close Replicate",
      "prompt_text": "closely replicate the pose and hand gestures of Figure N",
      "level": 3
    },
    {
      "id": "POS_004",
      "label_ko": "정확히 복제",
      "label_en": "Exact Replicate",
      "prompt_text": "Replicate the exact pose, hand gestures and composition of Figure N",
      "level": 4
    }
  ],
  "BgStrength": [
    {
      "id": "BG_001",
      "label_ko": "참고만",
      "label_en": "Loose Reference",
      "prompt_text": "inspired by the background in Figure N",
      "level": 1
    },
    {
      "id": "BG_002",
      "label_ko": "보통",
      "label_en": "Use Setting",
      "prompt_text": "use the background setting from Figure N",
      "level": 2
    },
    {
      "id": "BG_003",
      "label_ko": "강하게",
      "label_en": "Maintain BG + Lighting",
      "prompt_text": "maintain the background and lighting of Figure N",
      "level": 3
    },
    {
      "id": "BG_004",
      "label_ko": "정확히 복제",
      "label_en": "Exact BG Lock",
      "prompt_text": "maintain the entire background and lighting of Figure N exactly",
      "level": 4
    }
  ],
  "StyleFinish": [
    {
      "id": "STY_001",
      "label_ko": "웹툰 기본",
      "label_en": "Webtoon Default",
      "prompt_text": "Korean commercial webtoon style, clean line art, natural cel shading.",
      "level": 0
    },
    {
      "id": "STY_002",
      "label_ko": "웹툰 + 손맛",
      "label_en": "Webtoon Hand-drawn",
      "prompt_text": "Korean commercial webtoon style, clean hand-drawn line art, natural cel shading.",
      "level": 0
    },
    {
      "id": "STY_003",
      "label_ko": "웹툰 소프트",
      "label_en": "Webtoon Soft",
      "prompt_text": "Korean commercial webtoon style, soft gradient shading, clean line art.",
      "level": 0
    },
    {
      "id": "STY_004",
      "label_ko": "웹툰 플랫셀",
      "label_en": "Webtoon Flat Cel",
      "prompt_text": "Korean commercial webtoon style, flat cel shading, bold clean line art.",
      "level": 0
    },
    {
      "id": "STY_005",
      "label_ko": "일러스트 감성",
      "label_en": "Illustration",
      "prompt_text": "Korean webtoon illustration style, warm color palette, natural shading.",
      "level": 0
    }
  ],
  "CameraAngle": [
    {
      "id": "CAM_A_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "CAM_A_EYE",
      "label_ko": "수평 0도",
      "label_en": "Eye-level shot",
      "prompt_text": "Use an eye-level shot with a neutral viewing angle.",
      "level": 1
    },
    {
      "id": "CAM_A_HIGH_MILD",
      "label_ko": "하이 30도",
      "label_en": "Mild high-angle shot",
      "prompt_text": "Use a mild high-angle shot, camera positioned about 30 degrees above the subject looking down.",
      "level": 2
    },
    {
      "id": "CAM_A_HIGH_STEEP",
      "label_ko": "하이 60도",
      "label_en": "Steep high-angle shot",
      "prompt_text": "Use a steep high-angle shot, camera positioned about 60 degrees above the subject looking down.",
      "level": 3
    },
    {
      "id": "CAM_A_BIRD",
      "label_ko": "탑다운 90도",
      "label_en": "Bird-eye top-down view",
      "prompt_text": "Use a bird-eye top-down view, camera positioned almost directly above the subject.",
      "level": 4
    },
    {
      "id": "CAM_A_LOW_MILD",
      "label_ko": "로우 30도",
      "label_en": "Mild low-angle shot",
      "prompt_text": "Use a mild low-angle shot, camera positioned about 30 degrees below the subject looking upward.",
      "level": 2
    },
    {
      "id": "CAM_A_LOW_STRONG",
      "label_ko": "로우 60도",
      "label_en": "Strong low-angle shot",
      "prompt_text": "Use a strong low-angle shot, camera positioned about 60 degrees below the subject looking upward.",
      "level": 3
    },
    {
      "id": "CAM_A_LOW_EXTREME",
      "label_ko": "로우 80도",
      "label_en": "Extreme low-angle shot",
      "prompt_text": "Use an extreme low-angle shot, camera positioned about 80 degrees below the subject looking upward.",
      "level": 4
    }
  ],
  "CameraDistance": [
    {
      "id": "CAM_D_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "CAM_D_EXTREME_CLOSE",
      "label_ko": "0.3m",
      "label_en": "Extreme close-up",
      "prompt_text": "Camera distance is about 0.3 meters, creating an extreme close-up crop.",
      "level": 4
    },
    {
      "id": "CAM_D_CLOSE",
      "label_ko": "0.7m",
      "label_en": "Close-up",
      "prompt_text": "Camera distance is about 0.7 meters, creating a tight close-up crop.",
      "level": 3
    },
    {
      "id": "CAM_D_MEDIUM_CLOSE",
      "label_ko": "1.5m",
      "label_en": "Medium close-up",
      "prompt_text": "Camera distance is about 1.5 meters, framing the upper body and facial expression.",
      "level": 2
    },
    {
      "id": "CAM_D_MEDIUM",
      "label_ko": "3m",
      "label_en": "Medium shot",
      "prompt_text": "Camera distance is about 3 meters, keeping the main body action readable.",
      "level": 2
    },
    {
      "id": "CAM_D_FULL",
      "label_ko": "5m",
      "label_en": "Full-body shot",
      "prompt_text": "Camera distance is about 5 meters, showing the full body and overall pose.",
      "level": 2
    },
    {
      "id": "CAM_D_LONG",
      "label_ko": "15m",
      "label_en": "Long shot",
      "prompt_text": "Camera distance is about 15 meters, showing the characters within the surrounding scene.",
      "level": 2
    },
    {
      "id": "CAM_D_EXTREME_LONG",
      "label_ko": "100m",
      "label_en": "Extreme long shot",
      "prompt_text": "Camera distance is about 100 meters, emphasizing the environment and scale.",
      "level": 3
    }
  ],
  "CameraPosition": [
    {
      "id": "CAM_P_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "CAM_P_A_FRONT",
      "label_ko": "A 정면",
      "label_en": "Character A front",
      "prompt_text": "Camera is positioned in front of Character A.",
      "level": 1
    },
    {
      "id": "CAM_P_A_BACK",
      "label_ko": "A 후면",
      "label_en": "Character A back",
      "prompt_text": "Camera is positioned behind Character A.",
      "level": 1
    },
    {
      "id": "CAM_P_A_SIDE",
      "label_ko": "A 측면",
      "label_en": "Character A side",
      "prompt_text": "Camera is positioned at Character A's side.",
      "level": 1
    },
    {
      "id": "CAM_P_A_45_FRONT",
      "label_ko": "A 45도 정면",
      "label_en": "Character A 45-degree front",
      "prompt_text": "Camera is positioned at a 45-degree front angle toward Character A.",
      "level": 2
    },
    {
      "id": "CAM_P_A_45_REAR",
      "label_ko": "A 45도 후면",
      "label_en": "Character A 45-degree rear",
      "prompt_text": "Camera is positioned at a 45-degree rear angle behind Character A.",
      "level": 2
    },
    {
      "id": "CAM_P_B_FRONT",
      "label_ko": "B 정면",
      "label_en": "Character B front",
      "prompt_text": "Camera is positioned in front of Character B.",
      "level": 1
    },
    {
      "id": "CAM_P_B_BACK",
      "label_ko": "B 후면",
      "label_en": "Character B back",
      "prompt_text": "Camera is positioned behind Character B.",
      "level": 1
    },
    {
      "id": "CAM_P_B_SIDE",
      "label_ko": "B 측면",
      "label_en": "Character B side",
      "prompt_text": "Camera is positioned at Character B's side.",
      "level": 1
    },
    {
      "id": "CAM_P_B_45_FRONT",
      "label_ko": "B 45도 정면",
      "label_en": "Character B 45-degree front",
      "prompt_text": "Camera is positioned at a 45-degree front angle toward Character B.",
      "level": 2
    },
    {
      "id": "CAM_P_B_45_REAR",
      "label_ko": "B 45도 후면",
      "label_en": "Character B 45-degree rear",
      "prompt_text": "Camera is positioned at a 45-degree rear angle behind Character B.",
      "level": 2
    },
    {
      "id": "CAM_P_OVER_A",
      "label_ko": "A 어깨너머",
      "label_en": "Over Character A shoulder",
      "prompt_text": "Camera is positioned over Character A's shoulder, looking toward Character B.",
      "level": 3
    },
    {
      "id": "CAM_P_OVER_B",
      "label_ko": "B 어깨너머",
      "label_en": "Over Character B shoulder",
      "prompt_text": "Camera is positioned over Character B's shoulder, looking toward Character A.",
      "level": 3
    },
    {
      "id": "CAM_P_BETWEEN",
      "label_ko": "두 인물 사이",
      "label_en": "Between both characters",
      "prompt_text": "Camera is positioned between both characters, emphasizing their spatial relationship.",
      "level": 3
    }
  ],
  "FocusTarget": [
    {
      "id": "FOC_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "FOC_FACE",
      "label_ko": "얼굴",
      "label_en": "Face",
      "prompt_text": "Focus on the face and facial expression.",
      "level": 1
    },
    {
      "id": "FOC_EYES",
      "label_ko": "눈",
      "label_en": "Eyes",
      "prompt_text": "Focus on the eyes and gaze direction.",
      "level": 2
    },
    {
      "id": "FOC_UPPER",
      "label_ko": "상반신",
      "label_en": "Upper body",
      "prompt_text": "Focus on the upper body and facial expression.",
      "level": 1
    },
    {
      "id": "FOC_FULL",
      "label_ko": "전신",
      "label_en": "Full body",
      "prompt_text": "Focus on the full body pose and overall silhouette.",
      "level": 1
    },
    {
      "id": "FOC_LOWER",
      "label_ko": "하반신",
      "label_en": "Lower body",
      "prompt_text": "Focus on the lower-body silhouette and overlapping body position.",
      "level": 2
    },
    {
      "id": "FOC_HANDS",
      "label_ko": "손",
      "label_en": "Hands",
      "prompt_text": "Focus on the hand placement and gesture clarity.",
      "level": 2
    },
    {
      "id": "FOC_CONTACT",
      "label_ko": "접촉점",
      "label_en": "Contact point",
      "prompt_text": "Focus on the physical contact point and body interaction.",
      "level": 3
    },
    {
      "id": "FOC_BODY",
      "label_ko": "실루엣",
      "label_en": "Body silhouette",
      "prompt_text": "Focus on the body silhouette and readable pose.",
      "level": 2
    },
    {
      "id": "FOC_BG",
      "label_ko": "배경",
      "label_en": "Background",
      "prompt_text": "Focus on the background setting and spatial layout.",
      "level": 1
    }
  ],
  "BgStyle": [
    {
      "id": "BGS_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "BGS_MINIMAL",
      "label_ko": "미니멀 배경",
      "label_en": "Minimal background",
      "prompt_text": "Use minimal background detail and keep the focus on the characters and pose.",
      "level": 1
    },
    {
      "id": "BGS_FLAT_WEBTOON",
      "label_ko": "플랫 웹툰 배경",
      "label_en": "Flat webtoon background",
      "prompt_text": "Render the background in flat webtoon style with clean outlines and simple cel shading.",
      "level": 2
    },
    {
      "id": "BGS_SOFT_LIGHT",
      "label_ko": "부드러운 조명 배경",
      "label_en": "Soft-light background",
      "prompt_text": "Use soft background lighting with simple webtoon-style color separation.",
      "level": 2
    },
    {
      "id": "BGS_DRAMATIC",
      "label_ko": "드라마틱 배경",
      "label_en": "Dramatic background",
      "prompt_text": "Use a dramatic background mood while keeping webtoon-style simplified shapes and clean outlines.",
      "level": 3
    }
  ],
  "CostumeMode": [
    {
      "id": "CST_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "CST_REF",
      "label_ko": "레퍼런스 의상",
      "label_en": "Follow reference costume",
      "prompt_text": "Follow the costume structure shown in the character reference.",
      "level": 1
    },
    {
      "id": "CST_SHEET",
      "label_ko": "캐시트 의상",
      "label_en": "Follow character sheet costume",
      "prompt_text": "Use the costume from the character sheet as the costume source.",
      "level": 1
    },
    {
      "id": "CST_CUSTOM",
      "label_ko": "사용자 입력 의상",
      "label_en": "Custom costume",
      "prompt_text": "Follow the costume described in the action or direction text.",
      "level": 2
    },
    {
      "id": "CST_EXPOSURE",
      "label_ko": "노출 모드",
      "label_en": "Exposure mode",
      "prompt_text": "Follow the user's costume and exposure direction while preserving character body proportions from the character sheet.",
      "level": 3
    }
  ],
  "BodySource": [
    {
      "id": "BDY_000",
      "label_ko": "미선택",
      "label_en": "None",
      "prompt_text": "",
      "level": 0
    },
    {
      "id": "BDY_CHARACTER",
      "label_ko": "캐시트 체형 우선",
      "label_en": "Character sheet body priority",
      "prompt_text": "Keep the body proportions, body silhouette, shoulder width, chest size, waist line, hip shape, and limb length from the character references.",
      "level": 1
    },
    {
      "id": "BDY_POSE_ONLY",
      "label_ko": "포즈만 참조",
      "label_en": "Pose reference for pose only",
      "prompt_text": "Use the pose reference only for body position, contact points, camera crop, and framing. Character body shape remains from the character references.",
      "level": 2
    },
    {
      "id": "BDY_POSE_BODY",
      "label_ko": "포즈 체형 참조",
      "label_en": "Pose reference body reference",
      "prompt_text": "Use the pose reference for both body position and general body silhouette, while keeping the face, hair, and identity from the character references.",
      "level": 3
    }
  ]
};
