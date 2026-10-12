export interface TemplateBloomQuestion {
  id: string;
  level: number;              // 1-6
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TemplateLesson {
  id: string;
  title: string;
  subtitle?: string;
  code: string;
  explanation: string;
  keyPoints?: string[];
  bloom?: TemplateBloomQuestion[];
}

export interface Template {
  id: string;
  name: string;
  version: string;
  subject: string;
  description?: string;
  lessons: TemplateLesson[];
}