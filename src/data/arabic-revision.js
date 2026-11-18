// Original multiple-choice revision based on Basic Arabic Conversation II, Al-Hikmah University.
// Permanent within-course question number | PDF page | topic | difficulty (f/a/c) | prompt | key | 3 distractors | rationale
const ARABIC_REVISION_ROWS = `
1|2|ar-intro|f|Which greeting means “Good morning”?|صباح الخير|مساء الخير|مع السلامة|إلى اللقاء|صباح الخير is the opening morning greeting.
2|2|ar-intro|f|What is the usual reply to صباح الخير in the introduction dialogue?|صباح النور|مساء النور|شكرا لك|أنا بخير|صباح النور answers صباح الخير; both are exchanged in the morning.
3|2|ar-intro|f|Which expression opens the dialogue with “Peace be upon you”?|السلام عليكم|وعليكم السلام|أين تدرس؟|بارك الله فيك|السلام عليكم is the greeting; وعليكم السلام is its reply.
4|2|ar-intro|a|A classmate says السلام عليكم. Which phrase begins the response?|وعليكم السلام|صباح الخير|إلى اللقاء|كيف حالك؟|وعليكم السلام returns the greeting: “And peace be upon you.”
5|2|ar-intro|f|What question does كيف حالك؟ ask?|How are you?|What is your name?|Where do you live?|Where do you study?|حال refers to a person’s state or condition.
6|2|ar-intro|f|How does a speaker say “I am fine”?|أنا بخير|أنا من غانا|أنا في المدرسة|أنا طالب|بخير expresses being well.
7|2|ar-intro|f|Which question asks for someone’s name?|ما اسمك؟|ما جنسيتك؟|أين تدرس؟|من أخوك؟|اسم means name, so ما اسمك؟ asks for the listener’s name.
8|2|ar-intro|a|A new classmate asks ما اسمك؟. Which answer fits?|اسمي أحمد|أنا في الفصل|أدرس القانون|أسكن في كادونا|اسمي أحمد is “My name is Ahmad.”
9|2|ar-intro|a|Which question asks about nationality, not a person’s address?|ما جنسيتك؟|أين تسكن؟|أين تدرس؟|ما اسمك؟|جنسية refers to nationality.
10|2|ar-intro|a|What does أنا غاني communicate?|I am Ghanaian.|I study in Ghana.|I work at the embassy.|I am going to Ghana.|غاني is the nationality adjective, “Ghanaian.”
11|2|ar-intro|a|Which question would the reply أدرس القانون directly answer?|ماذا تدرس؟|أين تسكن؟|متى تذهب؟|ما اسمك؟|ماذا تدرس؟ asks what a person studies, rather than where.
12|2|ar-intro|a|When asked أين تسكن؟, which answer gives a place of residence?|أسكن في إبادن|أدرس اللغة العربية|اسمي إبراهيم|أنا بخير|أسكن في إبادن means “I live in Ibadan.”
13|2|ar-intro|a|In the expression اسمه إبراهيم, whose name is being stated?|A male third person’s|The speaker’s|The listener’s|A female third person’s|The ending ـه in اسمه means “his”; اسمي means “my name.”
14|3|ar-intro|f|Which is a suitable answer to شكرا لك?|عفوا|ماذا تدرس؟|صباح الخير|من أنت؟|عفوا is a conventional “You’re welcome.”
15|3|ar-intro|f|What does إلى اللقاء signal at the end of a conversation?|See you later.|Come inside.|Please sit.|Good morning.|إلى اللقاء is a parting expression, literally “until the meeting.”
16|3|ar-intro|a|Which place does سفارة refer to?|An embassy|A hostel|A classroom|A library|سفارة denotes an embassy, like the workplace in the dialogue.
17|4|ar-home|f|Which expression means “the bedroom”?|غرفة النوم|غرفة الطعام|غرفة الدراسة|غرفة الجلوس|نوم is sleep, so غرفة النوم is the bedroom.
18|4|ar-home|a|Someone asks أين أمنا؟ “Where is our mother?” Which is a location answer?|هي في غرفة النوم|عاد والدي|سأشتري كتبا|الطعام لذيذ|هي في غرفة النوم means “She is in the bedroom.”
19|4|ar-home|a|In the home dialogue, whose house does the father visit?|His uncle’s house|The teacher’s house|The doctor’s house|His classmate’s house|The dialogue says the father went to his uncle’s house.
20|4|ar-home|a|How long before the father was expected to return from his visit in the dialogue?|Two days|Three weeks|Six hours|A month|The home dialogue gives two days as the expected time before his return.
21|4|ar-home|a|Where does the father go to buy books?|The central bookshop|The hospital|The banking hall|The university dining room|He goes to the central bookshop for books he needs.
22|4|ar-home|a|In والدتنا العزيزة, whose mother are the speakers talking about?|Their own mother|A friend’s mother|The father’s mother|The teacher’s mother|والدتنا means “our mother”; ـنا is the “our” ending.
23|4|ar-home|f|Which form of والد means “our father”?|والدنا|والدي|والدها|والدك|The suffix ـنا expresses “our”: والدنا, our father.
24|4|ar-home|a|Student A says ذهب أبي. What happened?|My father went away.|My father is returning tomorrow.|My father will go.|My father has not arrived.|ذهب is a past-tense verb meaning “went.”
25|4|ar-home|f|Which word means “bread” in the kitchen exchange?|خبز|أرز|شاي|فول|خبز is bread; the others include rice, tea and beans.
26|4|ar-home|f|What drink do the speakers refer to in وشربوا الشاي?|شاي|أرز|خبز|ملح|The family drinks tea, شاي.
27|4|ar-home|a|What does الطعام لذيذ say about the meal?|The food is delicious.|The food is cold.|The food is not ready.|The food is expensive.|لذيذ describes something tasty or delicious.
28|4|ar-home|a|Which question asks when the father will return?|متى يرجع أبي؟|أين أبي؟|ماذا أكل أبي؟|من أبي؟|متى asks about time; يرجع means “returns.”
29|5|ar-home|f|What is سُلَّم in the home vocabulary?|Staircase|Dining table|Bedroom|Bookshop|سُلَّم can mean stairs or a ladder; the lesson glosses it as staircase.
30|4|ar-home|a|What is the location meant by في المنزل?|At home|At the bank|At the market|At university|المنزل means home or dwelling; في expresses location.
31|5|ar-home|a|In the exercise following the home dialogue, what should students do with the new words?|Use them in full sentences and translate them.|Arrange them by word length only.|Copy only their English glosses.|List the characters’ names.|The exercise calls for applying new vocabulary in complete sentences and translating those sentences.
32|6|ar-school|a|What kind of reply does من أين جئت؟ request in the school dialogue?|A place of origin|The hour of the first lecture|A classroom object|A number of lectures|The phrase asks “Where did you come from?” and the dialogue answers with a state.
33|6|ar-school|f|What does طالب mean in the university introduction?|A male student|A lecturer|A principal|A classmate specifically|طالب is a male student; طالبة is a female student.
34|6|ar-school|a|Which phrase describes a second-year university level in the dialogue?|المستوى الثاني|المستوى الأول|المستوى الثالث|المستوى الرابع|المستوى الثاني means the second level, corresponding here to 200 level.
35|6|ar-school|a|On which weekday did the student return in حضرت يوم الاثنين؟|Monday|Wednesday|Thursday|Saturday|The student’s answer in the school scene says Monday.
36|7|ar-school|a|When does the first lecture in the school dialogue start?|Eight in the morning|Six in the evening|Noon|Seven in the evening|The timetable exchange puts the first lecture at eight in the morning.
37|7|ar-school|a|In the timetable exchange, how many lectures does سبعة دروس فقط mean?|Seven|Five|Eight|Ten|The reply specifies seven lectures.
38|7|ar-school|a|What time does the student plan to return to the hostel?|Six in the evening|Eight in the morning|One in the afternoon|Midnight|The student says six o’clock in the evening.
39|7|ar-school|c|Which phrase would ask for the whereabouts of the classrooms?|أين الفصول الدراسية؟|كم محاضرة في اليوم؟|متى تبدأ المحاضرة؟|هل أنت طالب؟|أين asks “where,” and الفصول الدراسية names the classrooms.
40|8|ar-school|f|What would you look for if you needed a مكتبة at university?|A library|A lecture|A ruler|An examination|مكتبة is a library in the campus vocabulary.
41|8|ar-school|f|Which Arabic word means “chalk”?|طباشير|مسطرة|قلم رصاص|ملف|طباشير is chalk; مسطرة is a ruler.
42|8|ar-school|f|Which word means “ruler” as a classroom tool?|مسطرة|مروحة|جرس|كتاب|مسطرة is the measuring tool, a ruler.
43|8|ar-school|a|Which phrase refers to the office-holder “Dean of the Faculty”?|عميد الكلية|رئيس القسم|مدير المدرسة|زميل الفصل|عميد الكلية is the dean; رئيس القسم is the head of department.
44|6|ar-school|a|Which role does رئيس القسم identify?|Head of the department|University librarian|Faculty dean|School classmate|رئيس means head; القسم is the department.
45|8|ar-school|f|What classroom object is قلم رصاص?|A pencil|A notebook|A piece of chalk|A desk|قلم رصاص specifically refers to a pencil.
46|8|ar-school|f|Which item would ring between lessons?|جرس|ملف|مسطرة|كرسي|جرس means a bell.
47|9|ar-school|f|Which object helps you look up the meaning of an unfamiliar word?|معجم|سبورة|كرة|كرسي|معجم is a dictionary or lexicon.
48|9|ar-kitchen|f|Which word names a kitchen?|مطبخ|مكتبة|مستشفى|مصرف|مطبخ means kitchen.
49|9|ar-kitchen|a|In the kitchen dialogue, what is the kitchen close to?|The dining room|The market|The library|The school gate|The speaker says the kitchen is close to the dining room.
50|9|ar-kitchen|f|A kitchen has a ثلاجة. What appliance is it?|A refrigerator|An oven|A fan|A coffee cup|ثلاجة is a refrigerator.
51|9|ar-kitchen|a|Which meal in the dialogue is eaten in the morning?|Breakfast|Lunch|Dinner|Supper after Ishāʾ|The dialogue places breakfast in the morning, lunch in the afternoon and dinner in the evening.
52|9|ar-kitchen|a|What does ضع طبقا لكل شخص ask someone to do?|Set a plate for each person.|Put a spoon in the fridge.|Bring one plate for everyone.|Bring a fresh glass of milk.|طبقا is a plate and لكل شخص means “for each person.”
53|10|ar-kitchen|f|Which item is ملعقة?|A spoon|A fork|A knife|A plate|ملعقة means spoon.
54|10|ar-kitchen|f|Which utensil would you use to cut bread?|سكين|ملعقة|كوب|طبق|سكين means a knife.
55|10|ar-kitchen|f|Which word means “fork”?|شوكة|ملعقة|سكين|خبز|شوكة is a fork in the table-setting vocabulary.
56|10|ar-kitchen|f|What is عسل?|Honey|Butter|Salt|Sugar|عسل names honey.
57|10|ar-kitchen|f|Which word means “butter”?|زبدة|حليب|ملح|سكر|زبدة is butter.
58|10|ar-kitchen|a|Which phrase means “a small cup of tea”?|فنجان شاي|طبق أرز|زجاجة حليب|قطعة خبز|فنجان is a small cup, and شاي is tea.
59|10|ar-kitchen|f|What would you use to sweep the kitchen?|مكنسة|صابون|كوب|شوكة|مكنسة is a broom.
60|10|ar-kitchen|f|What does عنب name?|Grapes|Bananas|Oranges|Maize|عنب means grapes.
61|9|ar-kitchen|a|What does عشاء refer to in a list of daily meals?|Dinner|Breakfast|Lunch|Morning tea|عشاء is the evening meal in the lesson’s breakfast–lunch–dinner sequence.
62|10|ar-clinic|f|Which place is a hospital?|مستشفى|مطار|مدرسة|فندق|مستشفى means hospital.
63|11|ar-clinic|a|What does a doctor want to know when asking ما بك؟ in the dialogue?|What is wrong with you?|Where is your home?|What is your nationality?|What is the time?|ما بك؟ asks what is the matter with the patient.
64|11|ar-clinic|a|Which symptom group does Aishah describe in the hospital dialogue?|A runny nose, cough and slight fever|A toothache and rash|A sprained ankle and headache|An earache without fever|The dialogue names catarrh, cough and slight fever as Aishah’s symptoms.
65|11|ar-clinic|a|How old is Aishah in the dialogue?|Seventeen|Fifteen|Twenty|Twelve|She answers that she is seventeen years old.
66|12|ar-clinic|a|When did the illness start, according to Aishah?|Two days earlier|A week earlier|That morning|A month earlier|She reports that the sickness started two days earlier.
67|12|ar-clinic|f|What does سعال mean?|Cough|Fever|Medicine|Treatment|سعال is the noun for a cough.
68|12|ar-clinic|f|Which word means “fever”?|حمى|دواء|ممرض|ورقة|حمى denotes fever.
69|12|ar-clinic|f|What is دواء?|Medicine|An identity card|A nurse|An examination room|دواء means medicine.
70|12|ar-clinic|a|Which phrase describes the card asked for at reception?|بطاقة الصحة|بطاقة مصرفية|بطاقة الطالب|مفتاح الغرفة|بطاقة الصحة means a health card in the lesson.
71|12|ar-clinic|f|Who is a ممرضة?|A female nurse|A female patient|A female doctor|A female teacher|ممرضة is a female nurse; طبيبة is a female doctor.
72|11|ar-clinic|a|What does الشفاء العاجل mean in the request for prayer?|Speedy recovery|A pleasant trip|A successful exam|A happy evening|الشفاء is recovery, qualified here by العاجل, prompt or speedy.
73|12|ar-clinic|c|What does ثلاث مرات في اليوم mean as a time expression in the lesson?|Three times a day|Three days in a row|Once every three days|Three times a week|مرات means times, and في اليوم locates the frequency within each day. This is translation practice.
74|13|ar-bank|a|Which reply says “I want to open an account”?|أريد أن أفتح حسابا|أريد أن أحجز غرفة|أريد أن أشتري كتابا|أريد أن أرى الطبيب|أفتح حسابا means opening an account.
75|13|ar-bank|a|The customer says أريد حسابا جاريا. What type of account do they want?|A current account|A savings account|A loan account|A joint account|The customer chooses a current account when offered savings or current.
76|13|ar-bank|a|How much does the customer propose to deposit in the lesson?|₦7,000|₦5,000|₦4,000|₦10,000|Seven thousand naira is the amount stated in the bank dialogue, not a bank requirement.
77|13|ar-bank|a|What does the customer also ask to receive after opening the account?|A cheque book|A hotel room key|A health card|A new passport|The customer asks for a cheque book.
78|13|ar-bank|a|How long is the wait for the cheque book in the dialogue?|Two weeks|Two days|One month|One hour|The bank employee says the book will be ready after two weeks.
79|14|ar-bank|f|Which phrase means “account number”?|رقم الحساب|رقم الغرفة|رقم الهاتف|رقم الطالب|رقم means number and الحساب means account in a bank context.
80|14|ar-bank|f|Which phrase names a savings account?|حساب التوفير|حساب جار|بطاقة صحية|دفتر الشيكات|التوفير refers to saving, so حساب التوفير is the savings account.
81|14|ar-bank|f|Which label means an application form in the bank vocabulary?|استمارة|حساب|صورة|خطاب|استمارة means a form to fill in.
82|14|ar-bank|f|Which word means “withdrawal” in the bank vocabulary?|سحب|إيداع|فتح|إغلاق|سحب is drawing funds out; إيداع is a deposit.
83|13|ar-bank|a|Who is asked to provide a supporting letter in the account-opening example?|The customer’s employer|The hotel receptionist|The customer’s lecturer as such|The hospital receptionist|A letter from the employer is one of the documents named in the scene.
84|14|ar-bank|f|Which phrase is the Arabic for a travel passport?|جواز السفر|بطاقة العمل|رقم الحساب|عنوان البيت|جواز السفر means passport.
85|13|ar-bank|c|Which action is the opposite of withdrawing money from an account?|Depositing money|Applying for a passport|Changing account type|Asking for identification|A withdrawal takes money out; a deposit puts it in. The dialogue illustrates both concepts.
86|14|ar-hotel|a|What setting fits the dialogue about a vacant room and a nightly price?|A hotel|A bank|A hospital|A market stall|Lesson seven’s dialogue is about hotel accommodation even though its printed heading repeats “At the Bank.”
87|14|ar-hotel|a|Which room does the guest choose?|A room with one bed|A room with three beds|A room with two beds|A room without a bed|The guest chooses the single-bed room.
88|14|ar-hotel|a|What is the nightly room rate quoted in the hotel dialogue?|₦5,000|₦4,000|₦7,000|₦10,000|The hotel quotes five thousand naira per day in this example.
89|14|ar-hotel|c|In the hotel booking, what does لمدة ثلاثة أيام specify?|A stay of three days|A stay of three weeks|An arrival at three o’clock|A booking for three people|لمدة introduces the duration; ثلاثة أيام is three days.
90|15|ar-hotel|a|What room location does the receptionist give the guest?|Room 10 on the third floor|Room 3 on the tenth floor|Room 12 on the first floor|Room 7 on the second floor|The room is identified as number 10, on the third floor.
91|15|ar-hotel|a|Where is the elevator in the hotel dialogue?|On the guest’s right|On the guest’s left|Outside the hotel|Behind the room door|The receptionist tells the guest the elevator is on the right.
92|15|ar-hotel|f|Which phrase means “room key”?|مفتاح الغرفة|باب المطبخ|جواز السفر|بطاقة صحية|مفتاح is a key and الغرفة is the room.
93|15|ar-hotel|f|Which word names an elevator?|مصعد|سرير|غرفة|استقبال|مصعد is an elevator or lift.
94|15|ar-hotel|f|What does سرير mean?|Bed|Room|Chair|Door|سرير names a bed.
95|14|ar-hotel|c|Which question asks whether a room is available?|هل توجد غرفة شاغرة؟|كم سعر الحقيبة؟|متى تبدأ المحاضرة؟|أين حسابك؟|غرفة شاغرة is a vacant room; هل makes the question yes/no.
96|16|ar-market|f|Which word means “market”?|سوق|مصرف|مدرسة|فندق|سوق is a market.
97|16|ar-market|f|What does بائع mean?|A seller|A buyer|A driver|A doctor|A بائع sells; a مشتري buys.
98|16|ar-market|f|Which word refers to the buyer?|مشتري|بائع|ممرض|مدرس|مشتري is a buyer in the lesson’s shopping vocabulary.
99|16|ar-market|a|When does the shopper say they will go to the market?|After Asr|Before sunrise|After Ishāʾ|At noon before prayer|The dialogue says the market trip will take place after Asr.
100|16|ar-market|a|How much does the seller first ask for the bag?|₦5,000|₦4,000|₦7,000|₦3,000|The bag’s opening price in the market dialogue is five thousand naira.
101|16|ar-market|a|What counteroffer does the buyer make for the bag?|₦4,000|₦5,000|₦7,000|₦6,000|The buyer offers four thousand naira after calling the first price too high.
102|16|ar-market|a|Which question asks the seller for the price of the bag?|بكم هذه الحقيبة؟|أين هذه الحقيبة؟|متى تذهب إلى السوق؟|هل عندك قلم؟|بكم asks “for how much,” and الحقيبة names the bag.
103|16|ar-market|f|Which item is a جوال in the shopping list?|Mobile phone|Wristwatch|Shopping bag|Ball|جوال means a mobile phone here, also called هاتف محمول.
104|17|ar-market|f|Which food is ذرة in the market word list?|Maize|Orange|Apple|Rice|ذرة means maize or corn in this context.
105|17|ar-market|f|Which is the Arabic word for an apple?|تفاحة|برتقالة|موزة|كرة|تفاحة means one apple.
106|16|ar-market|c|After the buyer’s new offer, the seller says ما في مشكلة. What does this signal in the conversation?|There is no problem with the offer.|The seller does not understand the price.|The bag has already been sold.|The seller wants a different bag.|ما في مشكلة is a conversational way to say “No problem.”
107|18|ar-grammar|a|Complete the location phrase: الطالب ___ الفصل (“The student is in the classroom”).|في|إلى|من|على|في places the student inside the classroom.
108|18|ar-grammar|a|Complete the sentence: ذهب أحمد ___ السوق (“Ahmad went to the market”).|إلى|من|في|عن|إلى introduces the destination of movement.
109|18|ar-grammar|a|Complete the origin phrase: أنا ___ نيجيريا (“I am from Nigeria”).|من|إلى|على|في|من introduces a place of origin.
110|18|ar-grammar|a|Which word is opposite in meaning to بعيد (far)?|قريب|طويل|صعب|فقير|قريب means near, the opposite of بعيد.
111|19|ar-grammar|a|What does أين تذهب؟ ask?|Where are you going?|When are you going?|Who are you?|What are you studying?|أين asks for a place or destination.
112|19|ar-grammar|a|Which adjective describes a tall brother?|طويل|بعيد|قريب|قديم|طويل means tall or long; it suits this description of a person.
113|20|ar-grammar|a|Choose the translation of هل هذا قلم؟|Is this a pen?|This is a pen.|Is that a book?|That is a pen.|هل turns هذا قلم into a yes/no question.
114|20|ar-grammar|a|Choose “This is a school.”|هذه مدرسة|هذا مدرسة|ذلك مدرسة|هذه كتاب|مدرسة is feminine, so the near demonstrative is هذه.
115|20|ar-grammar|a|Which sentence means “That is a book”?|ذلك كتاب|هذا كتاب|هل هذا كتاب؟|تلك مدرسة|ذلك is the masculine farther-away demonstrative with كتاب.
116|21|ar-grammar|a|What does أنا طالب mean?|I am a student.|Am I a student?|He is a student.|Are you a teacher?|أنا is “I”; the sentence has no question marker.
117|21|ar-grammar|c|Which expression means “in front of the house”?|أمام البيت|داخل البيت|خلف البيت|بعيد عن البيت|أمام locates something in front of a reference point.
118|21|ar-grammar|c|In جلست فاطمة داخل الغرفة, when did the action occur?|In the past|In the future|It is a command|It is habitually happening now|جلست is past-tense: “Fatimah sat inside the room.”
119|23|ar-grammar|c|Which demonstrative completes ___ زهرة to mean “This is a flower”?|هذه|هذا|ذلك|هؤلاء|زهرة is feminine singular. Use the near demonstrative هذه.
120|24|ar-grammar|c|In هو ذو مال, what does ذو مال suggest about the person described?|He is wealthy.|He is a teacher.|He is tired.|He is lazy.|ذو مال describes someone who possesses wealth or money.
`;
