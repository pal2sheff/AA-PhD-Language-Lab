// IELTS Academic Reading: оригинальный тест (3 текста, 40 вопросов).
// Тексты написаны специально для приложения и немного короче экзаменационных (≈ 450–600 слов против 700–900).
import type { ExamTest } from '../exam-types';

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YNNG = ['YES', 'NO', 'NOT GIVEN'];

export const IELTS_READING_1: ExamTest = {
  id: 'ielts-reading-1',
  exam: 'ielts',
  section: 'reading',
  lang: 'en',
  title: 'IELTS Academic Reading — Test 1',
  minutes: 60,
  fullFormat: true,
  formatNote: '3 текста, 40 вопросов, 60 минут — как на экзамене. Тексты немного короче экзаменационных, поэтому реальный экзамен потребует более быстрого чтения.',
  passages: [
    {
      title: 'Cycling Back into the City',
      paragraphs: [
        { text: 'In the middle of the twentieth century, bicycles almost disappeared from the streets of many European and Asian cities. As incomes rose, families bought cars, and urban planners designed wide roads for motor traffic. In Amsterdam, for example, the share of journeys made by bicycle fell from around 75 per cent in the 1950s to about 25 per cent by the early 1970s.' },
        { text: 'The trend reversed in several places from the 1970s onwards. Rising fuel prices, concern about road deaths — especially among children — and public protests persuaded city authorities to build separate cycle lanes and to reduce speed limits. Today, cycling accounts for roughly a third of all trips in Amsterdam and Copenhagen.' },
        { text: 'Supporters of urban cycling point to a range of benefits. Regular cyclists tend to have lower blood pressure and a lower risk of type 2 diabetes than people who travel by car. A large study in the United Kingdom, which followed more than 260,000 commuters for five years, found that those who cycled to work had a significantly lower risk of heart disease. Cycling also produces no exhaust emissions and requires far less space than driving: one car parking space can hold up to ten bicycles.' },
        { text: 'However, the growth of cycling has not been without problems. In cities where cycle lanes are narrow or interrupted, accidents involving cyclists remain common. Some shop owners initially opposed the removal of parking spaces, fearing that they would lose customers. Research in several cities later showed that cyclists visit local shops more often than drivers, although they usually spend less on each visit.' },
        { text: 'Electric bicycles have changed the picture further. Because the motor assists the rider, e-bikes make longer journeys and hilly routes manageable for older people and for those who are less fit. In some northern European countries, e-bikes now account for more than half of all new bicycles sold. Critics argue that e-bike users take less exercise than ordinary cyclists, but studies suggest that they tend to ride more often and for longer distances, so the overall amount of physical activity is similar.' },
        { text: 'Experts agree that infrastructure is the key factor. Painting a line on the road is not enough; people start cycling in large numbers only when they feel safe. Cities that have invested in continuous, physically separated lanes have usually seen the number of cyclists grow within a few years.' },
      ],
      groups: [
        {
          title: 'Questions 1–6',
          instructions: 'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
          type: 'tfng',
          options: TFNG,
          questions: [
            { n: 1, prompt: 'In Amsterdam, the proportion of journeys made by bicycle fell sharply between the 1950s and the early 1970s.', answers: ['TRUE'], explain: 'Абзац 1: «fell from around 75 per cent in the 1950s to about 25 per cent by the early 1970s» — резкое падение.' },
            { n: 2, prompt: 'Copenhagen was the first city to build separate cycle lanes.', answers: ['NOT GIVEN'], explain: 'Абзац 2 говорит, что города начали строить велодорожки, но не сообщает, какой город был первым.' },
            { n: 3, prompt: 'The UK study followed commuters for more than ten years.', answers: ['FALSE'], explain: 'Абзац 3: «followed … commuters for five years» — пять лет, а не более десяти.' },
            { n: 4, prompt: 'The space needed to park one car can be used to park up to ten bicycles.', answers: ['TRUE'], explain: 'Абзац 3: «one car parking space can hold up to ten bicycles» — перефразирование.' },
            { n: 5, prompt: 'All shop owners welcomed the removal of parking spaces from the start.', answers: ['FALSE'], explain: 'Абзац 4: «Some shop owners initially opposed the removal of parking spaces».' },
            { n: 6, prompt: 'Most e-bike users are over the age of sixty.', answers: ['NOT GIVEN'], explain: 'Абзац 5 говорит, что e-bike удобны пожилым, но не сообщает возраст большинства пользователей.' },
          ],
        },
        {
          title: 'Questions 7–13',
          instructions: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
          type: 'complete',
          wordLimit: 'NO MORE THAN TWO WORDS',
          questions: [
            { n: 7, prompt: 'In the mid-twentieth century, planners designed wide roads for ______.', answers: ['motor traffic'], explain: 'Абзац 1: «designed wide roads for motor traffic».' },
            { n: 8, prompt: 'Concern about road deaths, particularly among ______, helped to change city policies.', answers: ['children'], explain: 'Абзац 2: «concern about road deaths — especially among children».' },
            { n: 9, prompt: 'People who cycle regularly tend to have a lower risk of type 2 diabetes and lower ______.', answers: ['blood pressure'], explain: 'Абзац 3: «lower blood pressure and a lower risk of type 2 diabetes».' },
            { n: 10, prompt: 'Cyclists visit local shops more ______ than drivers do.', answers: ['often', 'frequently'], explain: 'Абзац 4: «cyclists visit local shops more often than drivers».' },
            { n: 11, prompt: 'In some northern European countries, more than ______ of new bicycles sold are electric.', answers: ['half'], explain: 'Абзац 5: «more than half of all new bicycles sold».' },
            { n: 12, prompt: 'E-bike users tend to ride more often and cover longer ______.', answers: ['distances'], explain: 'Абзац 5: «ride more often and for longer distances».' },
            { n: 13, prompt: 'According to experts, people only start cycling in large numbers when they feel ______.', answers: ['safe'], explain: 'Абзац 6: «only when they feel safe».' },
          ],
        },
      ],
    },
    {
      title: 'Sleep and Metabolic Health',
      paragraphs: [
        { label: 'A', text: 'For most of human history, people slept when it was dark and woke with the sun. Artificial light, shift work and, more recently, smartphones have changed this pattern. Surveys in several countries suggest that the average adult now sleeps between half an hour and one hour less per night than adults did fifty years ago, although the reliability of the older data is debated.' },
        { label: 'B', text: 'Laboratory experiments have shown how quickly sleep loss affects the body. In one well-known study, healthy young men were allowed only four hours of sleep for six nights. By the end of the week, their bodies processed glucose much less efficiently, and their insulin response resembled that seen in people at an early stage of diabetes. When the participants were allowed to sleep normally again, these changes disappeared.' },
        { label: 'C', text: 'Sleep also influences appetite. Two hormones are particularly important: ghrelin, which stimulates hunger, and leptin, which signals that the body has enough energy. After short sleep, ghrelin levels tend to rise while leptin levels fall. Participants in sleep-restriction studies often report stronger cravings for sweet and starchy foods, and some studies have recorded an increase in the number of calories eaten.' },
        { label: 'D', text: 'Large population studies support the laboratory findings. Adults who regularly sleep less than six hours are more likely to become obese and to develop type 2 diabetes. However, these studies cannot prove that short sleep is the cause. People who sleep poorly may also have stressful jobs, less time for exercise or other health problems that affect their weight.' },
        { label: 'E', text: 'Interestingly, sleeping too long is also associated with poor health. Several studies have found that people who sleep more than nine hours a night have a higher risk of diabetes and heart disease. Most researchers believe that long sleep is usually a sign of an existing illness rather than its cause.' },
        { label: 'F', text: 'What can be done? Sleep specialists recommend keeping a regular schedule, avoiding screens for an hour before bed and limiting caffeine in the afternoon. For shift workers, such as doctors and nurses, the advice is harder to follow, and some hospitals are beginning to design rotas that allow more recovery time between night shifts.' },
      ],
      groups: [
        {
          title: 'Questions 14–19',
          instructions: 'The passage has six paragraphs, A–F. Choose the correct heading for each paragraph from the list of headings below.',
          type: 'heading',
          options: [
            'i. The difficulty of proving cause and effect',
            'ii. Practical recommendations for better sleep',
            'iii. A rapid but reversible effect on blood sugar',
            'iv. How modern life has shortened sleep',
            'v. The hormones that control hunger',
            'vi. Why children need more sleep',
            'vii. The risks at the other end of the scale',
            'viii. The cost of sleep disorders to the economy',
          ],
          questions: [
            { n: 14, prompt: 'Paragraph A', answers: ['iv'], explain: 'A — искусственный свет, смены, смартфоны сократили сон: «How modern life has shortened sleep».' },
            { n: 15, prompt: 'Paragraph B', answers: ['iii'], explain: 'B — за неделю ухудшился обмен глюкозы, а после нормального сна изменения исчезли: быстрый, но обратимый эффект.' },
            { n: 16, prompt: 'Paragraph C', answers: ['v'], explain: 'C — гормоны грелин и лептин, регулирующие голод.' },
            { n: 17, prompt: 'Paragraph D', answers: ['i'], explain: 'D — «these studies cannot prove that short sleep is the cause».' },
            { n: 18, prompt: 'Paragraph E', answers: ['vii'], explain: 'E — риски слишком долгого сна, «другой конец шкалы».' },
            { n: 19, prompt: 'Paragraph F', answers: ['ii'], explain: 'F — практические рекомендации специалистов.' },
          ],
        },
        {
          title: 'Questions 20–23',
          instructions: 'Choose the correct letter, A, B, C or D.',
          type: 'mcq',
          questions: [
            { n: 20, prompt: 'In the experiment described in paragraph B, the participants’ ability to process glucose', options: ['A improved after six nights.', 'B was already abnormal before the study.', 'C returned to normal when they slept normally again.', 'D did not change significantly.'], answers: ['C'], explain: 'B: «When the participants were allowed to sleep normally again, these changes disappeared.»' },
            { n: 21, prompt: 'According to paragraph C, after a short night’s sleep', options: ['A ghrelin rises and leptin falls.', 'B both ghrelin and leptin rise.', 'C leptin rises and ghrelin falls.', 'D both hormones fall.'], answers: ['A'], explain: 'C: «ghrelin levels tend to rise while leptin levels fall».' },
            { n: 22, prompt: 'Why can population studies not prove that short sleep causes obesity?', options: ['A The samples are too small.', 'B People do not report their sleep honestly.', 'C The studies were carried out in laboratories.', 'D Other factors may explain the link.'], answers: ['D'], explain: 'D: стресс, нехватка времени на спорт и другие проблемы со здоровьем могут объяснять связь.' },
            { n: 23, prompt: 'What do most researchers believe about long sleep?', options: ['A It is a direct cause of diabetes.', 'B It is often a sign of an existing illness.', 'C It protects against heart disease.', 'D It is rare among adults.'], answers: ['B'], explain: 'E: «long sleep is usually a sign of an existing illness rather than its cause».' },
          ],
        },
        {
          title: 'Questions 24–26',
          instructions: 'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
          type: 'complete',
          wordLimit: 'ONE WORD ONLY',
          questions: [
            { n: 24, prompt: 'Sleep specialists advise people to keep a regular ______ …', answers: ['schedule'], explain: 'F: «keeping a regular schedule».' },
            { n: 25, prompt: '… and to limit ______ in the afternoon.', answers: ['caffeine'], explain: 'F: «limiting caffeine in the afternoon».' },
            { n: 26, prompt: 'Some hospitals are designing rotas that allow more ______ time between night shifts.', answers: ['recovery'], explain: 'F: «rotas that allow more recovery time».' },
          ],
        },
      ],
    },
    {
      title: 'Telemedicine: Promise and Limits',
      paragraphs: [
        { label: 'A', text: 'Before 2020, telemedicine — the delivery of health care at a distance using video, telephone or online messaging — was used mainly in specialist services and in countries with large, sparsely populated regions, such as Australia and Canada. During the COVID-19 pandemic, however, the number of remote consultations increased dramatically. In some health systems, more than half of all outpatient appointments took place online for several months.' },
        { label: 'B', text: 'The advantages for patients are clear. People living far from hospitals no longer need to travel for hours to attend a short follow-up appointment. Patients with chronic conditions can have their blood glucose, blood pressure or weight checked remotely, using devices that send data directly to their doctors. In my view, this continuous monitoring is the most valuable aspect of telemedicine, because problems can be detected before they become emergencies.' },
        { label: 'C', text: 'Nevertheless, it would be a mistake to assume that remote care is suitable for every situation. A doctor examining a diabetic foot through a camera cannot feel the temperature of the skin or test sensation properly, and small ulcers may be missed if the image quality is poor. Physical examination remains essential for many diagnoses, and I believe that health systems which replace face-to-face appointments entirely are putting patients at risk.' },
        { label: 'D', text: 'There are also concerns about equity. Older people and those on low incomes are less likely to own suitable devices or to feel confident using them. Paradoxically, these groups often have the greatest health needs. Some clinics have responded by lending tablets to patients or by training family members to assist with consultations.' },
        { label: 'E', text: 'The financial picture is mixed. Telemedicine can reduce the cost of transport and missed working days for patients, and it may allow doctors to see more patients in a day. On the other hand, investment in secure software, equipment and staff training is considerable, and early studies disagree about whether health systems actually save money overall.' },
        { label: 'F', text: 'Most experts now recommend a hybrid model in which the type of consultation is chosen according to the patient’s needs. A first appointment, or any visit that requires a physical examination, should take place in person, while routine follow-ups and the review of test results can often be done remotely. Such an approach, I would argue, combines the efficiency of technology with the safety of traditional medicine.' },
      ],
      groups: [
        {
          title: 'Questions 27–31',
          instructions: 'Do the following statements agree with the claims of the writer? Choose YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.',
          type: 'ynng',
          options: YNNG,
          questions: [
            { n: 27, prompt: 'Continuous remote monitoring is the most useful feature of telemedicine.', answers: ['YES'], explain: 'B: «In my view, this continuous monitoring is the most valuable aspect of telemedicine».' },
            { n: 28, prompt: 'A diabetic foot can be examined as effectively by video as in person.', answers: ['NO'], explain: 'C: через камеру нельзя оценить температуру кожи и чувствительность, мелкие язвы можно пропустить.' },
            { n: 29, prompt: 'Health systems that stop all face-to-face appointments put patients in danger.', answers: ['YES'], explain: 'C: «health systems which replace face-to-face appointments entirely are putting patients at risk».' },
            { n: 30, prompt: 'Telemedicine will eventually make most hospital buildings unnecessary.', answers: ['NOT GIVEN'], explain: 'Автор нигде не высказывается о будущем больничных зданий.' },
            { n: 31, prompt: 'A combination of remote and in-person care offers both efficiency and safety.', answers: ['YES'], explain: 'F: «combines the efficiency of technology with the safety of traditional medicine».' },
          ],
        },
        {
          title: 'Questions 32–36',
          instructions: 'The passage has six paragraphs, A–F. Which paragraph contains the following information? You may use any letter more than once.',
          type: 'match',
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          questions: [
            { n: 32, prompt: 'a description of measures taken to help patients who lack technology', answers: ['D'], explain: 'D: клиники выдают планшеты и обучают родственников.' },
            { n: 33, prompt: 'examples of countries that used telemedicine before the pandemic', answers: ['A'], explain: 'A: «such as Australia and Canada».' },
            { n: 34, prompt: 'a reference to disagreement between research findings', answers: ['E'], explain: 'E: «early studies disagree about whether health systems actually save money».' },
            { n: 35, prompt: 'a recommendation about which appointments should take place in person', answers: ['F'], explain: 'F: первый приём и визиты с физикальным осмотром — очно.' },
            { n: 36, prompt: 'an example of a condition that is difficult to assess remotely', answers: ['C'], explain: 'C: диабетическая стопа.' },
          ],
        },
        {
          title: 'Questions 37–40',
          instructions: 'Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
          type: 'short',
          wordLimit: 'NO MORE THAN THREE WORDS',
          questions: [
            { n: 37, prompt: 'What proportion of outpatient appointments took place online in some health systems?', answers: ['more than half'], explain: 'A: «more than half of all outpatient appointments took place online».' },
            { n: 38, prompt: 'What do some clinics lend to patients?', answers: ['tablets'], explain: 'D: «lending tablets to patients».' },
            { n: 39, prompt: 'Who do some clinics train to assist with consultations?', answers: ['family members'], explain: 'D: «training family members to assist with consultations».' },
            { n: 40, prompt: 'Apart from transport, what cost for patients can telemedicine reduce?', answers: ['missed working days'], explain: 'E: «reduce the cost of transport and missed working days».' },
          ],
        },
      ],
    },
  ],
};

export const IELTS_READING_TESTS = [IELTS_READING_1];
