// Authored practice items; page references are printed PDF positions, not a claim of past-paper authorship.
const REVISION_TOPICS = {
  management: 'Management',
  venture: 'Entrepreneurial thinking',
  innovation: 'Innovation & intrapreneurship',
  opportunity: 'Opportunity recognition',
  marketing: 'Markets & promotion',
  feasibility: 'Feasibility studies',
  launch: 'Launching a venture',
  funding: 'Startup finance',
  'ar-intro': 'Greetings & introductions',
  'ar-home': 'At home',
  'ar-school': 'At school',
  'ar-kitchen': 'In the kitchen',
  'ar-clinic': 'At the hospital',
  'ar-bank': 'At the bank',
  'ar-hotel': 'At the hotel',
  'ar-market': 'At the market',
  'ar-grammar': 'Grammar & translation',
};
const REVISIONS = (() => {
  const levels = { f: 'foundation', a: 'applied', c: 'challenge' };
  const rows = (text, source, offset, citation) =>
    text
      .trim()
      .split('\n')
      .map((line, index) => {
        const fields = line.split('|');
        if (fields.length !== 10) throw new Error(`Invalid ${source} row ${index + 1}`);
        const [item, marker, topic, difficulty, textOfQuestion, correct, d1, d2, d3, explanation] =
          fields;
        const number = Number(item);
        const answer = (number - 1) % 4;
        const options = [d1, d2, d3];
        options.splice(answer, 0, correct);
        return {
          id: offset + number,
          number,
          topic,
          level: levels[difficulty],
          text: textOfQuestion,
          options,
          answer,
          explanation,
          origin: citation(Number(marker)),
          sourceType: 'revision',
          sourceTitle: source,
        };
      })
      .sort((a, b) => a.number - b.number);
  return {
    business: rows(
      BUSINESS_REVISION_ROWS,
      'Intro Entrepreneurship',
      1000,
      (n) => `Intro Entrepreneurship · PDF p. ${n}`
    ),
    arabic: rows(
      ARABIC_REVISION_ROWS,
      'Basic Arabic Conversation II',
      2000,
      (n) => `Basic Arabic Conversation II · PDF p. ${n}`
    ),
  };
})();

const STUDY_GUIDES = {
  arabic: [
    {
      title: 'Greetings & introductions',
      pages: 'pp. 2–3',
      body: 'السلام عليكم opens the greeting; وعليكم السلام returns it. Use صباح الخير to say good morning and صباح النور to reply. ما اسمك؟ asks for a name; اسمي … introduces yours. ما جنسيتك؟ asks about nationality.',
    },
    {
      title: 'Home, school & kitchen',
      pages: 'pp. 4–10',
      body: 'Use في (in) to locate someone: هي في غرفة النوم. School nouns include مكتبة (library), جرس (bell) and مسطرة (ruler). At the table, use a ملعقة (spoon), شوكة (fork) or سكين (knife).',
    },
    {
      title: 'Hospital, bank & hotel',
      pages: 'pp. 10–15',
      body: 'In the hospital dialogue بطاقة الصحة means health card. At a bank, distinguish حساب التوفير (savings) from الحساب الجاري (current), and سحب (withdrawal) from إيداع (deposit). Lesson seven is a hotel exchange despite the repeated bank heading; review مفتاح الغرفة (room key) and مصعد (elevator).',
    },
    {
      title: 'Market & grammar',
      pages: 'pp. 16–24',
      body: 'Use بكم to ask a price. بائع is a seller, مشتري a buyer. Review في (in), إلى (to) and من (from). This book is هذا كتاب; this school is هذه مدرسة. هل marks a yes/no question.',
    },
  ],
  business: [
    {
      title: 'Management & the entrepreneur',
      pages: 'pp. 1–7',
      body: 'Management combines planning, organising, leading and controlling. Effectiveness is meeting the goal; efficiency is using resources well. Entrepreneurship starts with an identifiable opportunity and mobilises people, capital and other resources to act under uncertainty.',
    },
    {
      title: 'Innovation & opportunity',
      pages: 'pp. 8–17',
      body: 'Intrapreneurship is entrepreneurial work inside an existing organisation. Look for valuable problems, customer willingness to pay and a feasible way to deliver. Clear goals, communication and feedback support innovation.',
    },
    {
      title: 'Market evidence & feasibility',
      pages: 'pp. 18–27',
      body: 'Ask about both customers and competitors. A sample should represent the target market. Feasibility asks whether the venture is worth pursuing; a business plan describes how to build and operate it. Advertising, promotion, publicity and personal selling are distinct tools.',
    },
    {
      title: 'Launch, growth & financing',
      pages: 'pp. 28–40',
      body: 'Entrepreneurial abilities can develop through learning and feedback. Risks may be calculated, not avoided or taken blindly. Compare savings, partner capital, family funding, trade credit and loans by cost, access, risk and repayment terms.',
    },
  ],
  islamic: [
    {
      title: 'Revelation and legal reasoning',
      pages: 'Past bank concepts',
      body: 'The Qur’an and Sunnah are primary texts in the course. Qiyās is analogy based on a relevant common reason; ijmāʿ is consensus. Distinguish farāʾiḍ, the prescribed shares, from waṣiyyah, a bequest.',
    },
    {
      title: 'Hadith and character',
      pages: 'Past bank concepts',
      body: 'ʿAdālah refers to uprightness and ḍabṭ to precision. A discontinuous chain and a hidden defect are different issues. The bank links righteousness to faith and actual conduct, and emphasises justice, kindness and reconciliation.',
    },
  ],
};
