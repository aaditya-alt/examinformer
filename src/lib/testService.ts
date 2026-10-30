import { supabase, isSupabaseConfigured } from './supabase';
import bundledTests from '@/data/mock-tests-bundle.json';

export interface CBTQuestion {
  id: string;
  qno: number;
  questionText: string;
  questionTextHi?: string;
  questionImages?: string[];
  options: {
    id: number;
    text: string;
    textHi?: string;
    imageUrl?: string;
  }[];
  correctOption: number;
  explanation?: string;
  marks: number;
  negativeMarks: number;
  sectionName: string;
}

export interface CBTSection {
  id: string;
  name: string;
  questions: CBTQuestion[];
}

export interface CBTTest {
  id: string;
  title: string;
  examCode: string;
  examFamily: 'ssc' | 'rrb' | 'other';
  type: 'pyq' | 'full_mock' | 'sectional' | 'live';
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  sections: CBTSection[];
  isPublished: boolean;
  hasSectionalTiming?: boolean;
  sectionalTimingMinutes?: number;
  difficulty?: string;
}

// Built-in verified sample mock tests with bilingual content
export const INITIAL_TESTS: CBTTest[] = [
  {
    id: 'ssc-cgl-2024-pyq-shift1',
    title: 'SSC CGL 2024 Tier 1 - Official Paper (Shift 1)',
    examCode: 'ssc-cgl',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 10,
    isPublished: true,
    sections: [
      {
        id: 'sec-reasoning',
        name: 'General Intelligence and Reasoning',
        questions: [
          {
            id: 'q1',
            qno: 1,
            questionText: 'Select the letter-cluster that can replace the question mark (?) in the following series:\nBD, EG, HJ, KM, ?',
            questionTextHi: 'उस अक्षर-समूह का चयन करें जो निम्नलिखित श्रृंखला में प्रश्न चिह्न (?) को प्रतिस्थापित कर सकता है:\nBD, EG, HJ, KM, ?',
            options: [
              { id: 1, text: 'NP', textHi: 'NP' },
              { id: 2, text: 'NP', textHi: 'NP' },
              { id: 3, text: 'NP', textHi: 'NP' },
              { id: 4, text: 'NP', textHi: 'NP' }
            ],
            correctOption: 1,
            explanation: 'Pattern: +3 on each consecutive letter. B(+3)->E(+3)->H(+3)->K(+3)->N. D(+3)->G(+3)->J(+3)->M(+3)->P. Hence, NP.',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'General Intelligence and Reasoning'
          },
          {
            id: 'q2',
            qno: 2,
            questionText: 'Three of the following four letter-clusters are alike in a certain way and one is different. Pick the odd one out.',
            questionTextHi: 'निम्नलिखित चार अक्षर-समूहों में से तीन एक निश्चित तरीके से समान हैं और एक अलग है। बेमेल को चुनें।',
            options: [
              { id: 1, text: 'HJL', textHi: 'HJL' },
              { id: 2, text: 'PRT', textHi: 'PRT' },
              { id: 3, text: 'KMO', textHi: 'KMO' },
              { id: 4, text: 'BDF', textHi: 'BDF' }
            ],
            correctOption: 1,
            explanation: 'All groups have a step difference of +2 between consecutive letters.',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'General Intelligence and Reasoning'
          }
        ]
      },
      {
        id: 'sec-ga',
        name: 'General Awareness',
        questions: [
          {
            id: 'q3',
            qno: 3,
            questionText: 'Which article of the Indian Constitution empowers the President to promulgate Ordinances during the recess of Parliament?',
            questionTextHi: 'भारतीय संविधान का कौन सा अनुच्छेद संसद के विश्रांतिकाल में राष्ट्रपति को अध्यादेश जारी करने का अधिकार देता है?',
            options: [
              { id: 1, text: 'Article 123', textHi: 'अनुच्छेद 123' },
              { id: 2, text: 'Article 213', textHi: 'अनुच्छेद 213' },
              { id: 3, text: 'Article 110', textHi: 'अनुच्छेद 110' },
              { id: 4, text: 'Article 72', textHi: 'अनुच्छेद 72' }
            ],
            correctOption: 1,
            explanation: 'Article 123 grants power to the President to promulgate Ordinances when either of the two Houses of Parliament is not in session.',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'General Awareness'
          }
        ]
      },
      {
        id: 'sec-math',
        name: 'Quantitative Aptitude',
        questions: [
          {
            id: 'q4',
            qno: 4,
            questionText: 'If \\( x + \\frac{1}{x} = 5 \\), find the value of \\( x^2 + \\frac{1}{x^2} \\).',
            questionTextHi: 'यदि \\( x + \\frac{1}{x} = 5 \\) है, तो \\( x^2 + \\frac{1}{x^2} \\) का मान ज्ञात कीजिए।',
            options: [
              { id: 1, text: '23', textHi: '23' },
              { id: 2, text: '25', textHi: '25' },
              { id: 3, text: '27', textHi: '27' },
              { id: 4, text: '21', textHi: '21' }
            ],
            correctOption: 1,
            explanation: 'Formula: \\( (x + 1/x)^2 = x^2 + 1/x^2 + 2 \\implies 5^2 - 2 = 23 \\).',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'Quantitative Aptitude'
          },
          {
            id: 'q5',
            qno: 5,
            questionText: 'A can complete a piece of work in 12 days and B in 18 days. In how many days can both complete it working together?',
            questionTextHi: 'A किसी कार्य को 12 दिनों में और B 18 दिनों में पूरा कर सकता है। दोनों एक साथ काम करते हुए इसे कितने दिनों में पूरा कर सकते हैं?',
            options: [
              { id: 1, text: '7.2 days', textHi: '7.2 दिन' },
              { id: 2, text: '6.5 days', textHi: '6.5 दिन' },
              { id: 3, text: '8 days', textHi: '8 दिन' },
              { id: 4, text: '7.5 days', textHi: '7.5 दिन' }
            ],
            correctOption: 1,
            explanation: 'Work = (12 * 18) / (12 + 18) = 216 / 30 = 7.2 days.',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'Quantitative Aptitude'
          }
        ]
      },
      {
        id: 'sec-english',
        name: 'English Comprehension',
        questions: [
          {
            id: 'q6',
            qno: 6,
            questionText: 'Select the most appropriate synonym of the given word:\nMETICULOUS',
            questionTextHi: 'दिए गए शब्द का सबसे उपयुक्त समानार्थी चुनें:\nMETICULOUS',
            options: [
              { id: 1, text: 'Painstaking', textHi: 'Painstaking (सावधान)' },
              { id: 2, text: 'Careless', textHi: 'Careless (लापरवाह)' },
              { id: 3, text: 'Hasty', textHi: 'Hasty (जल्दबाज)' },
              { id: 4, text: 'Casual', textHi: 'Casual (अनौपचारिक)' }
            ],
            correctOption: 1,
            explanation: 'Meticulous means showing great attention to detail; very careful and precise. Synonym: Painstaking.',
            marks: 2,
            negativeMarks: 0.5,
            sectionName: 'English Comprehension'
          }
        ]
      }
    ]
  },
  {
    id: 'rrb-ntpc-cbt1-mock1',
    title: 'RRB NTPC (CBT-1) All India Live Mock Test',
    examCode: 'rrb-ntpc',
    examFamily: 'rrb',
    type: 'live',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 5,
    isPublished: true,
    sections: [
      {
        id: 'rrb-math',
        name: 'Mathematics',
        questions: [
          {
            id: 'rq1',
            qno: 1,
            questionText: 'The simple interest on a certain sum of money for 3 years at 8% per annum is ₹1200. Find the compound interest for the same period and rate.',
            questionTextHi: 'किसी राशि पर 8% प्रति वर्ष की दर से 3 वर्ष का साधारण ब्याज ₹1200 है। समान अवधि और दर के लिए चक्रवृद्धि ब्याज ज्ञात कीजिए।',
            options: [
              { id: 1, text: '₹1298.56', textHi: '₹1298.56' },
              { id: 2, text: '₹1300.00', textHi: '₹1300.00' },
              { id: 3, text: '₹1250.25', textHi: '₹1250.25' },
              { id: 4, text: '₹1280.00', textHi: '₹1280.00' }
            ],
            correctOption: 1,
            explanation: 'Principal P = (1200 * 100) / (3 * 8) = ₹5000. CI = 5000 * [(1 + 0.08)^3 - 1] = ₹1298.56.',
            marks: 1,
            negativeMarks: 0.33,
            sectionName: 'Mathematics'
          }
        ]
      },
      {
        id: 'rrb-ga',
        name: 'General Awareness',
        questions: [
          {
            id: 'rq2',
            qno: 2,
            questionText: 'Where is the headquarters of Indian Railway situated?',
            questionTextHi: 'भारतीय रेलवे का मुख्यालय कहाँ स्थित है?',
            options: [
              { id: 1, text: 'New Delhi', textHi: 'नई दिल्ली' },
              { id: 2, text: 'Mumbai', textHi: 'मुंबई' },
              { id: 3, text: 'Kolkata', textHi: 'कोलकाता' },
              { id: 4, text: 'Chennai', textHi: 'चेन्नई' }
            ],
            correctOption: 1,
            explanation: 'The Rail Bhavan in New Delhi serves as the headquarters of the Ministry of Railways.',
            marks: 1,
            negativeMarks: 0.33,
            sectionName: 'General Awareness'
          }
        ]
      }
    ]
  }
];

// In-memory tests store (seeded with sample tests + bundled real tests, dynamically grows when answer keys are pushed)
const initialList: CBTTest[] = [
  ...(bundledTests as unknown as CBTTest[]),
  ...INITIAL_TESTS
];

const testsStore = new Map<string, CBTTest>(initialList.map(t => [t.id, t]));

export function getAvailableTests(filterExam?: string): CBTTest[] {
  const all = Array.from(testsStore.values());
  if (filterExam && filterExam !== 'all') {
    return all.filter(t => t.examCode === filterExam || t.examFamily === filterExam);
  }
  return all;
}

export function getTestById(id: string): CBTTest | undefined {
  return testsStore.get(id);
}

export function registerNewTest(test: CBTTest): void {
  testsStore.set(test.id, test);
}
