// Catalog metadata and stable ID map. Add subjects here without mixing their banks.
const Catalog = (() => {
  const code = 'GNS 203';
  const topics = { ...TOPICS, ...REVISION_TOPICS };
  const raw = {
    arabic: {
      name: 'Basic Arabic Conversation II',
      short: 'Arabic',
      area: 'Language & conversation',
      icon: 'languages',
      tone: 'lilac',
      offset: 0,
      questions: [],
      foundation: [],
      challenge: [],
      description:
        'Build everyday Arabic with greetings, campus dialogue, vocabulary and translation.',
      credit:
        'Basic Arabic Conversation II (GNS 203) · Dr. A.A. Atotileto; edited by Dr. M.J. Dosunmu, Al-Hikmah University.',
    },
    business: {
      name: 'Entrepreneurship',
      short: 'Entrepreneurship',
      area: 'Business & finance',
      icon: 'briefcase',
      tone: 'lime',
      offset: 0,
      legacyPaper: '205',
      questions: GNS205_QUESTIONS,
      description: 'Explore management, innovation, opportunity, markets and startup finance.',
      credit:
        'Past questions credited to Solaahudeen B.A.A Attibyaaniy; new revision from the supplied Intro Entrepreneurship handout.',
      foundation: [1, 2, 3, 6, 7, 9, 10, 17],
      challenge: [4, 5, 12, 13, 16, 18],
    },
    islamic: {
      name: 'Basic Concepts of Islam',
      short: 'Islam',
      area: 'Faith & society',
      icon: 'book',
      tone: 'sand',
      offset: 100,
      legacyPaper: '204',
      questions: GNS204_QUESTIONS,
      description:
        'Revise faith, the Qur’an, Islamic law, worship and the principles of good character.',
      credit: 'Al-Hikmah University General Studies Unit · 2019/2020.',
      foundation: [
        3, 5, 8, 9, 10, 15, 17, 18, 21, 24, 25, 26, 28, 31, 34, 36, 38, 39, 43, 46, 49, 51, 53, 60,
      ],
      challenge: [1, 2, 6, 7, 11, 16, 20, 23, 27, 32, 35, 40, 45, 48, 54, 55, 57, 58],
    },
  };
  const keys = Object.keys(raw);
  const difficulty = { foundation: 'Foundation', applied: 'Applied', challenge: 'Challenge' };
  const courses = Object.fromEntries(
    keys.map((slug) => {
      const { questions, foundation, challenge, offset, ...meta } = raw[slug];
      const original = questions.map((q) =>
        Object.freeze({
          ...q,
          id: q.id + offset,
          number: q.id,
          subject: slug,
          sourceType: 'past',
          origin: `Past question ${q.id} · GNS ${meta.legacyPaper}`,
          level: foundation.includes(q.id)
            ? 'foundation'
            : challenge.includes(q.id)
              ? 'challenge'
              : 'applied',
          options: Object.freeze([...q.options]),
        })
      );
      const bank = [
        ...original,
        ...(REVISIONS[slug] || []).map((q) =>
          Object.freeze({ ...q, subject: slug, options: Object.freeze(q.options) })
        ),
      ];
      return [
        slug,
        Object.freeze({
          slug,
          offset,
          ...meta,
          bank: Object.freeze(bank),
          topics: Object.freeze(H.unique(bank.map((q) => q.topic))),
        }),
      ];
    })
  );
  const all = Object.freeze(keys.flatMap((key) => courses[key].bank));
  const byId = new Map(all.map((q) => [q.id, q]));
  const get = (id) => byId.get(Number(id));
  const isCourse = (slug) => typeof slug === 'string' && Object.hasOwn(courses, slug);
  const isTopic = (slug, value) => isCourse(slug) && courses[slug].topics.includes(value);
  const topicKey = (slug, topic) => `${slug}:${topic}`;
  // Normalise search text only when a keyword search first needs it.
  const terms = new Map();
  const termFor = (q) => {
    if (!terms.has(q.id))
      terms.set(
        q.id,
        H.norm(`${q.text} ${q.options.join(' ')} ${topics[q.topic]} ${courses[q.subject].name}`)
      );
    return terms.get(q.id);
  };
  const search = (q, query) =>
    H.words(query).every((word) =>
      /^#\d+$/.test(word)
        ? q.number === Number(word.slice(1))
        : (/^\d+$/.test(word) && q.number === Number(word)) || termFor(q).includes(word)
    );
  const nav = [
    {
      label: 'WORKSPACE',
      items: [
        ['dashboard', 'Dashboard', 'layout'],
        ['courses', 'My courses', 'books'],
        ['study', 'Study', 'book'],
        ['notes', 'Notes', 'edit'],
      ],
    },
    {
      label: 'EXAM PREP',
      items: [
        ['practice', 'Practice', 'zap'],
        ['exams', 'Examinations', 'clipboard'],
        ['flashcards', 'Flashcards', 'layers'],
        ['bookmarks', 'Bookmarks', 'bookmark'],
      ],
    },
    {
      label: 'OVERVIEW',
      items: [
        ['performance', 'Performance', 'chart'],
        ['announcements', 'Announcements', 'megaphone'],
        ['settings', 'Settings', 'settings'],
      ],
    },
  ];
  const navItems = nav.flatMap((group) => group.items);
  const demos = [
    {
      id: 'mock-guide',
      category: 'Exams',
      icon: 'clipboard',
      title: 'Plan a timed mock',
      summary:
        'Example exam reminder. Add a date from your actual university timetable before scheduling revision.',
      route: '#announcements/reminders',
    },
    {
      id: 'academic-guide',
      category: 'Academic',
      icon: 'cap',
      title: 'Confirm your academic calendar',
      summary:
        'Example academic update. Check the university’s official channels for current notices and approved dates.',
    },
    {
      id: 'course-guide',
      category: 'Courses',
      icon: 'books',
      title: 'Review GNS 203 by subject',
      summary:
        'Example course announcement. Arabic, Entrepreneurship and Islam each have their own revision plan.',
      route: '#courses',
    },
  ];
  return {
    code,
    keys,
    defaultCourse: 'business',
    courses,
    all,
    get,
    isCourse,
    isTopic,
    topicKey,
    search,
    difficulty,
    topics,
    nav,
    navItems,
    demos,
  };
})();
