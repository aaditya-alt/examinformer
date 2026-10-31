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
  explanationHi?: string;
  marks: number;
  negativeMarks: number;
  sectionName: string;
  examOrigin?: string; // e.g. "SSC CGL 2025 (12 Sep Shift 1)"
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
  type: 'pyq' | 'full_mock' | 'sectional' | 'live' | 'chapter';
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  sections: CBTSection[];
  isPublished: boolean;
  hasSectionalTiming?: boolean;
  sectionalTimingMinutes?: number;
  difficulty?: string;
  positiveMarks?: number;
  negativeMarks?: number;
  isOfficialPYQ?: boolean;
  examYear?: number;
}
