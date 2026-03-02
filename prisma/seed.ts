import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const questions = [
  // Part 5
  {
    part: 5,
    questionText: "The new software _____ by all employees by the end of the month.",
    options: JSON.stringify(["will be installed", "install", "installing", "to install"]),
    correctAnswer: 0,
    explanation: "未来の受動態 'will be installed' が正解。主語 'software' は動作を受ける側なので受動態を使う。",
    category: "grammar", difficulty: "medium",
  },
  {
    part: 5,
    questionText: "Mr. Tanaka is _____ for the marketing department.",
    options: JSON.stringify(["responsibility", "responsible", "responsibly", "respond"]),
    correctAnswer: 1,
    explanation: "'be responsible for' = 〜の責任者である。",
    category: "grammar", difficulty: "easy",
  },
  {
    part: 5,
    questionText: "The conference will be held _____ the third floor.",
    options: JSON.stringify(["in", "on", "at", "by"]),
    correctAnswer: 1,
    explanation: "階を表す場合は前置詞 'on' を使う。",
    category: "grammar", difficulty: "easy",
  },
  {
    part: 5,
    questionText: "The manager asked the team to _____ the project deadline.",
    options: JSON.stringify(["meet", "reach", "arrive", "achieve"]),
    correctAnswer: 0,
    explanation: "'meet a deadline' = 締め切りに間に合う。",
    category: "vocabulary", difficulty: "medium",
  },
  {
    part: 5,
    questionText: "Despite the heavy rain, _____ employees came to work on time.",
    options: JSON.stringify(["most", "almost", "mostly", "more"]),
    correctAnswer: 0,
    explanation: "'most employees' = ほとんどの従業員。",
    category: "grammar", difficulty: "medium",
  },
  {
    part: 5,
    questionText: "The proposal was _____ accepted by the board of directors.",
    options: JSON.stringify(["unanimously", "unanimous", "unanimity", "unanimousness"]),
    correctAnswer: 0,
    explanation: "動詞を修飾するので副詞 'unanimously'（全会一致で）が正解。",
    category: "vocabulary", difficulty: "hard",
  },
  {
    part: 5,
    questionText: "Employees are _____ to submit their expense reports by Friday.",
    options: JSON.stringify(["required", "requiring", "requirement", "require"]),
    correctAnswer: 0,
    explanation: "'be required to do' = 〜することを求められる。",
    category: "grammar", difficulty: "easy",
  },
  {
    part: 5,
    questionText: "The sales figures _____ significantly since last year.",
    options: JSON.stringify(["have increased", "increased", "increasing", "increase"]),
    correctAnswer: 0,
    explanation: "'since last year' があるので現在完了形が正解。",
    category: "grammar", difficulty: "medium",
  },
  {
    part: 5,
    questionText: "Please _____ the attached document before the meeting.",
    options: JSON.stringify(["review", "reviewing", "reviewed", "to review"]),
    correctAnswer: 0,
    explanation: "命令文なので動詞の原形 'review' が正解。",
    category: "grammar", difficulty: "easy",
  },
  {
    part: 5,
    questionText: "The company's _____ has grown steadily over the past decade.",
    options: JSON.stringify(["revenue", "revue", "review", "revival"]),
    correctAnswer: 0,
    explanation: "'revenue' = 収益・売上高。ビジネス英語の重要単語。",
    category: "vocabulary", difficulty: "medium",
  },
  // Part 6
  {
    part: 6,
    questionText: "_____ we appreciate your loyalty as a customer, we regret to inform you that the store will close.",
    passage: "Dear Valued Customer, Thank you for your continued support over the years. _____ we appreciate your loyalty as a customer, we regret to inform you that our downtown branch will permanently close on December 31st.",
    options: JSON.stringify(["While", "Because", "Since", "Unless"]),
    correctAnswer: 0,
    explanation: "'While' は逆接「〜ではあるが」。感謝しつつ残念なお知らせをする文脈に合う。",
    category: "grammar", difficulty: "medium",
  },
  {
    part: 6,
    questionText: "The renovation is expected to be completed by the _____ of next month.",
    passage: "Notice to all staff: The office renovation project is now underway. The renovation is expected to be completed by the _____ of next month. During this time, please use the temporary workspace on the 5th floor.",
    options: JSON.stringify(["end", "finish", "close", "stop"]),
    correctAnswer: 0,
    explanation: "'by the end of' = 〜の終わりまでに。頻出コロケーション。",
    category: "vocabulary", difficulty: "easy",
  },
  {
    part: 6,
    questionText: "All participants _____ register in advance.",
    passage: "Annual Conference Announcement: This year's annual conference will be held on November 15th at the Grand Hotel. All participants _____ register in advance. Registration can be completed on our website.",
    options: JSON.stringify(["must", "might", "could", "would"]),
    correctAnswer: 0,
    explanation: "'must' = 〜しなければならない（義務）。",
    category: "grammar", difficulty: "easy",
  },
  // Part 7 - Eメール①（ホリデーパーティー）
  {
    part: 7,
    passage: `From: Sarah Johnson <s.johnson@techcorp.com>
To: All Staff
Subject: Office Holiday Party

Dear Team,

I am pleased to announce that our annual holiday party will be held on December 20th from 6:00 PM to 10:00 PM at the Grand Ballroom of the City Hotel.

Please RSVP by December 10th by responding to this email. Dinner and beverages will be provided. Feel free to bring a guest.

Best regards,
Sarah Johnson
HR Manager`,
    questionText: "What is the purpose of this email?",
    options: JSON.stringify(["To announce a company event", "To request a meeting", "To inform about a policy change", "To introduce a new employee"]),
    correctAnswer: 0,
    explanation: "件名「Office Holiday Party」と内容から、社内パーティーのお知らせが目的。",
    category: "reading", difficulty: "easy",
  },
  {
    part: 7,
    passage: `From: Sarah Johnson <s.johnson@techcorp.com>
To: All Staff
Subject: Office Holiday Party

Dear Team,

I am pleased to announce that our annual holiday party will be held on December 20th from 6:00 PM to 10:00 PM at the Grand Ballroom of the City Hotel.

Please RSVP by December 10th by responding to this email. Dinner and beverages will be provided. Feel free to bring a guest.

Best regards,
Sarah Johnson
HR Manager`,
    questionText: "By when should employees respond to the invitation?",
    options: JSON.stringify(["By December 10th", "By December 15th", "By December 20th", "By November 30th"]),
    correctAnswer: 0,
    explanation: "'Please RSVP by December 10th' とあるので12月10日が回答期限。",
    category: "reading", difficulty: "easy",
  },

  // Part 7 - Eメール②（顧客クレーム対応）
  {
    part: 7,
    passage: `From: Mark Davies <m.davies@clientco.com>
To: Customer Service <support@shopzone.com>
Subject: Damaged Item Received — Order #48291

Dear Customer Service Team,

I am writing to report that I received a damaged item in my recent order (#48291). The ceramic vase I ordered arrived with a large crack along the base, making it unusable.

I would appreciate either a full refund or a replacement sent at no additional charge. I have attached photographs of the damage for your reference.

Please let me know how you intend to resolve this matter at your earliest convenience.

Sincerely,
Mark Davies`,
    questionText: "What is the main reason Mr. Davies wrote this email?",
    options: JSON.stringify([
      "To complain about a defective product he received",
      "To cancel his subscription to a service",
      "To ask about the status of his order",
      "To request a product catalog",
    ]),
    correctAnswer: 0,
    explanation: "「damaged item」「large crack」から、破損した商品についてのクレームメールとわかる。",
    category: "reading", difficulty: "easy",
  },
  {
    part: 7,
    passage: `From: Mark Davies <m.davies@clientco.com>
To: Customer Service <support@shopzone.com>
Subject: Damaged Item Received — Order #48291

Dear Customer Service Team,

I am writing to report that I received a damaged item in my recent order (#48291). The ceramic vase I ordered arrived with a large crack along the base, making it unusable.

I would appreciate either a full refund or a replacement sent at no additional charge. I have attached photographs of the damage for your reference.

Please let me know how you intend to resolve this matter at your earliest convenience.

Sincerely,
Mark Davies`,
    questionText: "What does Mr. Davies ask the company to do?",
    options: JSON.stringify([
      "Provide a refund or send a replacement",
      "Send a discount coupon for the next purchase",
      "Arrange a pickup of the damaged item only",
      "Update his delivery address",
    ]),
    correctAnswer: 0,
    explanation: "'either a full refund or a replacement' と明記されている。",
    category: "reading", difficulty: "medium",
  },

  // Part 7 - 広告（セミナー告知）
  {
    part: 7,
    passage: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUSINESS ENGLISH INTENSIVE SEMINAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date:    Saturday, March 15
🕙 Time:    10:00 AM – 4:00 PM
📍 Venue:   Osaka Business Center, Room 3B
💴 Fee:     ¥8,000 (lunch included)
            ¥6,500 for early registration (by March 1)

This one-day intensive seminar is designed for professionals who want to improve their business English communication skills. Topics include:
  • Email writing
  • Presentation techniques
  • Negotiation phrases

Registration: www.biz-english.jp/seminar
Capacity is limited to 30 participants. Reserve your spot today!`,
    questionText: "How much does early registration cost?",
    options: JSON.stringify(["¥6,500", "¥8,000", "¥7,500", "¥5,000"]),
    correctAnswer: 0,
    explanation: "'¥6,500 for early registration (by March 1)' と明記されている。",
    category: "reading", difficulty: "easy",
  },
  {
    part: 7,
    passage: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUSINESS ENGLISH INTENSIVE SEMINAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date:    Saturday, March 15
🕙 Time:    10:00 AM – 4:00 PM
📍 Venue:   Osaka Business Center, Room 3B
💴 Fee:     ¥8,000 (lunch included)
            ¥6,500 for early registration (by March 1)

This one-day intensive seminar is designed for professionals who want to improve their business English communication skills. Topics include:
  • Email writing
  • Presentation techniques
  • Negotiation phrases

Registration: www.biz-english.jp/seminar
Capacity is limited to 30 participants. Reserve your spot today!`,
    questionText: "What is NOT mentioned as a topic at the seminar?",
    options: JSON.stringify([
      "Interview preparation",
      "Email writing",
      "Presentation techniques",
      "Negotiation phrases",
    ]),
    correctAnswer: 0,
    explanation: "トピックとして挙げられているのは Email writing・Presentation・Negotiation の3つ。Interview preparation は含まれていない。",
    category: "reading", difficulty: "medium",
  },

  // Part 7 - お知らせ（オフィス改修）
  {
    part: 7,
    passage: `NOTICE TO ALL EMPLOYEES

Office Renovation — Temporary Workspace Changes
Effective: Monday, April 7 through Friday, April 25

As part of our ongoing facility improvements, the 4th floor will undergo renovation starting April 7. During this period, employees currently working on the 4th floor will be temporarily relocated as follows:

  • Marketing Department  → 2nd floor, Room 201
  • Finance Department    → 3rd floor, Room 305
  • IT Support            → Basement Level 1, Room B102

All departments will return to the 4th floor upon completion of renovations. Access to the 4th floor will be restricted during this period for safety reasons.

If you have any questions, please contact Facilities Management at ext. 4400.

— Facilities Management Team`,
    questionText: "Where will the Finance Department be temporarily located?",
    options: JSON.stringify([
      "Room 305 on the 3rd floor",
      "Room 201 on the 2nd floor",
      "Room B102 in the basement",
      "Room 401 on the 4th floor",
    ]),
    correctAnswer: 0,
    explanation: "表の中に 'Finance Department → 3rd floor, Room 305' と明記されている。",
    category: "reading", difficulty: "easy",
  },
  {
    part: 7,
    passage: `NOTICE TO ALL EMPLOYEES

Office Renovation — Temporary Workspace Changes
Effective: Monday, April 7 through Friday, April 25

As part of our ongoing facility improvements, the 4th floor will undergo renovation starting April 7. During this period, employees currently working on the 4th floor will be temporarily relocated as follows:

  • Marketing Department  → 2nd floor, Room 201
  • Finance Department    → 3rd floor, Room 305
  • IT Support            → Basement Level 1, Room B102

All departments will return to the 4th floor upon completion of renovations. Access to the 4th floor will be restricted during this period for safety reasons.

If you have any questions, please contact Facilities Management at ext. 4400.

— Facilities Management Team`,
    questionText: "Why will the 4th floor be inaccessible during the renovation?",
    options: JSON.stringify([
      "For safety reasons",
      "Because it is being used for storage",
      "Due to a pest control treatment",
      "Because the elevators are being repaired",
    ]),
    correctAnswer: 0,
    explanation: "'Access to the 4th floor will be restricted during this period for safety reasons.' と明記されている。",
    category: "reading", difficulty: "easy",
  },

  // Part 7 - グラフ付き（売上データ）
  {
    part: 7,
    passage: `QUARTERLY SALES REPORT — ZEPHYR ELECTRONICS

Product Category Sales (Units Sold):

         | Q1     | Q2     | Q3     | Q4
---------+--------+--------+--------+--------
Laptops  | 1,200  | 1,450  | 1,380  | 2,100
Tablets  |   800  |   950  | 1,020  |   870
Phones   | 2,300  | 2,150  | 2,400  | 3,200
Headsets |   430  |   510  |   490  |   620
---------+--------+--------+--------+--------
TOTAL    | 4,730  | 5,060  | 5,290  | 6,790

Notes:
- Q4 figures include holiday season sales (Nov–Dec).
- Laptop sales increased significantly in Q4 due to a back-to-school promotion extended into December.
- Phone sales remained the top-selling category throughout the year.`,
    questionText: "Which product category had the highest total sales across all quarters?",
    options: JSON.stringify(["Phones", "Laptops", "Tablets", "Headsets"]),
    correctAnswer: 0,
    explanation: "Phones の合計: 2,300+2,150+2,400+3,200 = 10,050 で最多。",
    category: "reading", difficulty: "medium",
  },
  {
    part: 7,
    passage: `QUARTERLY SALES REPORT — ZEPHYR ELECTRONICS

Product Category Sales (Units Sold):

         | Q1     | Q2     | Q3     | Q4
---------+--------+--------+--------+--------
Laptops  | 1,200  | 1,450  | 1,380  | 2,100
Tablets  |   800  |   950  | 1,020  |   870
Phones   | 2,300  | 2,150  | 2,400  | 3,200
Headsets |   430  |   510  |   490  |   620
---------+--------+--------+--------+--------
TOTAL    | 4,730  | 5,060  | 5,290  | 6,790

Notes:
- Q4 figures include holiday season sales (Nov–Dec).
- Laptop sales increased significantly in Q4 due to a back-to-school promotion extended into December.
- Phone sales remained the top-selling category throughout the year.`,
    questionText: "According to the notes, why did laptop sales increase in Q4?",
    options: JSON.stringify([
      "Because of a back-to-school promotion extended into December",
      "Because a new laptop model was released",
      "Because tablet prices increased sharply",
      "Because of a partnership with a major retailer",
    ]),
    correctAnswer: 0,
    explanation: "Notes に 'due to a back-to-school promotion extended into December' と明記されている。",
    category: "reading", difficulty: "medium",
  },

  // Part 7 - 長文（会社ニュースレター）
  {
    part: 7,
    passage: `NEXAGEN TIMES — Employee Newsletter | Issue 42

COMPANY EXPANDS TO SOUTHEAST ASIA

Nexagen Solutions announced last week that it will open its first overseas office in Singapore by the end of Q2. The new office, located in the Marina Bay Financial Centre, will serve as the company's regional headquarters for Southeast Asian operations.

CEO Linda Park stated in a press conference, "This expansion represents a significant milestone for Nexagen. Southeast Asia is one of the fastest-growing markets for enterprise software, and we are excited to establish a local presence to better serve our clients in the region."

The Singapore office will initially employ approximately 40 staff, including a regional director, sales team, and technical support personnel. Recruitment for these positions is already underway, with priority given to candidates who are fluent in both English and a Southeast Asian language.

Current employees interested in relocation opportunities are encouraged to speak with their department heads by June 1. Relocation assistance will be provided, including housing support for the first six months.`,
    questionText: "Where will Nexagen's new overseas office be located?",
    options: JSON.stringify([
      "Singapore",
      "Bangkok",
      "Kuala Lumpur",
      "Jakarta",
    ]),
    correctAnswer: 0,
    explanation: "'will open its first overseas office in Singapore' と第1段落に明記されている。",
    category: "reading", difficulty: "easy",
  },
  {
    part: 7,
    passage: `NEXAGEN TIMES — Employee Newsletter | Issue 42

COMPANY EXPANDS TO SOUTHEAST ASIA

Nexagen Solutions announced last week that it will open its first overseas office in Singapore by the end of Q2. The new office, located in the Marina Bay Financial Centre, will serve as the company's regional headquarters for Southeast Asian operations.

CEO Linda Park stated in a press conference, "This expansion represents a significant milestone for Nexagen. Southeast Asia is one of the fastest-growing markets for enterprise software, and we are excited to establish a local presence to better serve our clients in the region."

The Singapore office will initially employ approximately 40 staff, including a regional director, sales team, and technical support personnel. Recruitment for these positions is already underway, with priority given to candidates who are fluent in both English and a Southeast Asian language.

Current employees interested in relocation opportunities are encouraged to speak with their department heads by June 1. Relocation assistance will be provided, including housing support for the first six months.`,
    questionText: "What benefit is offered to employees who relocate to Singapore?",
    options: JSON.stringify([
      "Housing support for the first six months",
      "A 20% salary increase",
      "Free language training",
      "An extra week of annual leave",
    ]),
    correctAnswer: 0,
    explanation: "'housing support for the first six months' と最終段落に明記されている。",
    category: "reading", difficulty: "medium",
  },
  {
    part: 7,
    passage: `NEXAGEN TIMES — Employee Newsletter | Issue 42

COMPANY EXPANDS TO SOUTHEAST ASIA

Nexagen Solutions announced last week that it will open its first overseas office in Singapore by the end of Q2. The new office, located in the Marina Bay Financial Centre, will serve as the company's regional headquarters for Southeast Asian operations.

CEO Linda Park stated in a press conference, "This expansion represents a significant milestone for Nexagen. Southeast Asia is one of the fastest-growing markets for enterprise software, and we are excited to establish a local presence to better serve our clients in this region."

The Singapore office will initially employ approximately 40 staff, including a regional director, sales team, and technical support personnel. Recruitment for these positions is already underway, with priority given to candidates who are fluent in both English and a Southeast Asian language.

Current employees interested in relocation opportunities are encouraged to speak with their department heads by June 1. Relocation assistance will be provided, including housing support for the first six months.`,
    questionText: "What is suggested about candidates applying for positions at the Singapore office?",
    options: JSON.stringify([
      "Knowledge of a Southeast Asian language is an advantage",
      "They must have at least five years of experience",
      "They are required to visit the Singapore office before applying",
      "Only internal candidates will be considered",
    ]),
    correctAnswer: 0,
    explanation: "'priority given to candidates who are fluent in both English and a Southeast Asian language' から、東南アジア言語のスキルが優遇されるとわかる。",
    category: "reading", difficulty: "hard",
  },
];

const vocabulary = [
  // Level 1 - 超基礎（TOEIC 400点台）
  { word: "meeting", meaning: "会議・打ち合わせ", example: "We have a meeting at 10 AM.", category: "business", difficulty: "easy", level: 1 },
  { word: "schedule", meaning: "スケジュール・予定", example: "Please check the schedule for next week.", category: "business", difficulty: "easy", level: 1 },
  { word: "office", meaning: "オフィス・事務所", example: "She works in the head office.", category: "business", difficulty: "easy", level: 1 },
  { word: "report", meaning: "報告書・報告する", example: "Please submit the report by Friday.", category: "business", difficulty: "easy", level: 1 },
  { word: "order", meaning: "注文・注文する", example: "We need to order more supplies.", category: "business", difficulty: "easy", level: 1 },
  { word: "deliver", meaning: "配達する・届ける", example: "The package will be delivered tomorrow.", category: "verb", difficulty: "easy", level: 1 },
  { word: "budget", meaning: "予算", example: "We need to stay within the budget.", category: "business", difficulty: "easy", level: 1 },
  { word: "staff", meaning: "スタッフ・従業員", example: "All staff must attend the training.", category: "business", difficulty: "easy", level: 1 },
  { word: "customer", meaning: "顧客・お客様", example: "Customer satisfaction is our priority.", category: "business", difficulty: "easy", level: 1 },
  { word: "product", meaning: "製品・商品", example: "We launched a new product last month.", category: "business", difficulty: "easy", level: 1 },

  // Level 2 - 基礎（TOEIC 500点台）
  { word: "confirm", meaning: "確認する・確かめる", example: "Please confirm your reservation by email.", category: "verb", difficulty: "easy", level: 2 },
  { word: "submit", meaning: "提出する・送る", example: "Please submit the form before the deadline.", category: "verb", difficulty: "easy", level: 2 },
  { word: "update", meaning: "更新する・最新情報", example: "Please update the client on the project status.", category: "verb", difficulty: "easy", level: 2 },
  { word: "expand", meaning: "拡大する・広げる", example: "The company plans to expand its operations.", category: "verb", difficulty: "easy", level: 2 },
  { word: "require", meaning: "必要とする・要求する", example: "This job requires five years of experience.", category: "verb", difficulty: "easy", level: 2 },
  { word: "provide", meaning: "提供する・供給する", example: "We will provide all necessary materials.", category: "verb", difficulty: "easy", level: 2 },
  { word: "increase", meaning: "増加する・増やす", example: "Sales increased by 20% this quarter.", category: "verb", difficulty: "easy", level: 2 },
  { word: "reduce", meaning: "減らす・削減する", example: "We need to reduce operating costs.", category: "verb", difficulty: "easy", level: 2 },
  { word: "announce", meaning: "発表する・告知する", example: "The CEO will announce the new strategy.", category: "verb", difficulty: "easy", level: 2 },
  { word: "approve", meaning: "承認する・賛成する", example: "The manager approved the new project.", category: "verb", difficulty: "easy", level: 2 },

  // Level 3 - 中級（TOEIC 600点台）
  { word: "implement", meaning: "実施する・実行する", example: "We will implement the new system next month.", category: "verb", difficulty: "medium", level: 3 },
  { word: "efficient", meaning: "効率的な", example: "We need a more efficient process.", category: "adjective", difficulty: "medium", level: 3 },
  { word: "negotiate", meaning: "交渉する", example: "We need to negotiate better terms.", category: "verb", difficulty: "medium", level: 3 },
  { word: "priority", meaning: "優先事項・優先度", example: "Customer safety is our top priority.", category: "noun", difficulty: "medium", level: 3 },
  { word: "generate", meaning: "生み出す・発生させる", example: "The new product generated significant revenue.", category: "verb", difficulty: "medium", level: 3 },
  { word: "indicate", meaning: "示す・指摘する", example: "The survey indicates high satisfaction.", category: "verb", difficulty: "medium", level: 3 },
  { word: "obtain", meaning: "得る・取得する", example: "Please obtain approval before purchasing.", category: "verb", difficulty: "medium", level: 3 },
  { word: "revenue", meaning: "収益・売上高", example: "Revenue has grown steadily this year.", category: "noun", difficulty: "medium", level: 3 },
  { word: "relevant", meaning: "関連のある・適切な", example: "Please provide any relevant information.", category: "adjective", difficulty: "medium", level: 3 },
  { word: "transition", meaning: "移行・変遷", example: "The transition to the new system went smoothly.", category: "noun", difficulty: "medium", level: 3 },

  // Level 4 - 上級（TOEIC 700点台）
  { word: "allocate", meaning: "割り当てる・配分する", example: "We will allocate more resources to R&D.", category: "verb", difficulty: "hard", level: 4 },
  { word: "comply", meaning: "従う・応じる", example: "All employees must comply with safety regulations.", category: "verb", difficulty: "hard", level: 4 },
  { word: "comprehensive", meaning: "包括的な・総合的な", example: "We need a comprehensive review of policies.", category: "adjective", difficulty: "hard", level: 4 },
  { word: "facilitate", meaning: "促進する・容易にする", example: "Good communication facilitates teamwork.", category: "verb", difficulty: "hard", level: 4 },
  { word: "incorporate", meaning: "組み込む・取り入れる", example: "We incorporated customer feedback into the design.", category: "verb", difficulty: "hard", level: 4 },
  { word: "mandatory", meaning: "義務的な・必須の", example: "Attendance at the safety training is mandatory.", category: "adjective", difficulty: "hard", level: 4 },
  { word: "reimburse", meaning: "払い戻す・弁償する", example: "The company will reimburse travel expenses.", category: "verb", difficulty: "hard", level: 4 },
  { word: "proficient", meaning: "熟達した・堪能な", example: "She is proficient in three languages.", category: "adjective", difficulty: "hard", level: 4 },
  { word: "sustainable", meaning: "持続可能な", example: "The company is committed to sustainable practices.", category: "adjective", difficulty: "hard", level: 4 },
  { word: "collaborate", meaning: "協力する・共同作業する", example: "Both teams collaborated to finish on time.", category: "verb", difficulty: "hard", level: 4 },

  // Level 5 - 超上級（TOEIC 800点以上）
  { word: "unanimously", meaning: "全会一致で・満場一致で", example: "The proposal was unanimously accepted.", category: "adverb", difficulty: "hard", level: 5 },
  { word: "preliminary", meaning: "予備的な・準備段階の", example: "We conducted a preliminary study first.", category: "adjective", difficulty: "hard", level: 5 },
  { word: "simultaneously", meaning: "同時に", example: "The meetings were held simultaneously.", category: "adverb", difficulty: "hard", level: 5 },
  { word: "consecutively", meaning: "連続して", example: "She won the award consecutively for three years.", category: "adverb", difficulty: "hard", level: 5 },
  { word: "feasible", meaning: "実現可能な・実行可能な", example: "Is it feasible to complete this in two weeks?", category: "adjective", difficulty: "hard", level: 5 },
  { word: "consolidate", meaning: "統合する・強化する", example: "The merger will consolidate our market position.", category: "verb", difficulty: "hard", level: 5 },
  { word: "arbitrate", meaning: "仲裁する・調停する", example: "A neutral party was asked to arbitrate the dispute.", category: "verb", difficulty: "hard", level: 5 },
  { word: "reimbursement", meaning: "払い戻し・弁償", example: "Submit receipts for reimbursement.", category: "noun", difficulty: "hard", level: 5 },
  { word: "procurement", meaning: "調達・購入", example: "The procurement department handles all purchasing.", category: "noun", difficulty: "hard", level: 5 },
  { word: "leverage", meaning: "活用する・てこの原理", example: "We can leverage our existing network.", category: "verb", difficulty: "hard", level: 5 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.userVocabulary.deleteMany();
  await prisma.userAnswer.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.vocabulary.deleteMany();
  await prisma.question.deleteMany();
  await prisma.user.deleteMany();

  // Admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  await prisma.user.create({
    data: { name: "管理者", email: "admin@toeic.com", password: adminPassword, role: "admin", targetScore: 990 },
  });
  console.log("✅ Admin user: admin@toeic.com / admin123456");

  // Demo user
  const demoPassword = await bcrypt.hash("demo12345", 12);
  await prisma.user.create({
    data: { name: "デモユーザー", email: "demo@toeic.com", password: demoPassword, role: "user", targetScore: 700 },
  });
  console.log("✅ Demo user: demo@toeic.com / demo12345");

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }
  console.log(`✅ ${questions.length} questions created`);

  for (const v of vocabulary) {
    await prisma.vocabulary.create({ data: v });
  }
  console.log(`✅ ${vocabulary.length} vocabulary words created (5 levels)`);

  console.log("🎉 Seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
