import { create } from 'zustand';

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  marksPerQuestion: number;
  difficulty: string;
  additionalInstructions: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  createdAt: string;
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  paperTitle: string;
  subject: string;
  class: string;
  maxMarks: number;
  duration: string;
  sections: Section[];
  answerKey: AnswerKey[];
  createdAt: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
}

export interface Question {
  id: string;
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: 'mcq' | 'short' | 'long';
  options: string[] | null;
}

export interface AnswerKey {
  questionId: string;
  answer: string;
}

interface FormState {
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  marksPerQuestion: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  additionalInstructions: string;
  file: File | null;
}

interface AssignmentStore {
  // Dashboard
  assignments: Assignment[];
  fetchAssignments: () => Promise<void>;

  // Creation form
  form: FormState;
  setFormField: (field: keyof FormState, value: any) => void;
  resetForm: () => void;
  submitAssignment: () => Promise<{ assignmentId: string }>;

  // Generation status
  generationStatus: 'idle' | 'queued' | 'processing' | 'completed' | 'error';
  currentAssignmentId: string | null;
  setGenerationStatus: (status: string) => void;
  setCurrentAssignmentId: (id: string | null) => void;

  // Output
  currentPaper: GeneratedPaper | null;
  fetchPaper: (assignmentId: string) => Promise<void>;
}

const defaultForm: FormState = {
  title: '',
  subject: '',
  dueDate: '',
  questionTypes: [],
  totalQuestions: 10,
  marksPerQuestion: 1,
  difficulty: 'mixed',
  additionalInstructions: '',
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  async fetchAssignments() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`);
      const data = await response.json();
      set({ assignments: data });
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  },

  form: defaultForm,
  setFormField(field, value) {
    set((state) => ({
      form: { ...state.form, [field]: value },
    }));
  },
  resetForm() {
    set({ form: defaultForm });
  },
  async submitAssignment() {
    const state = useAssignmentStore.getState();

    const formData = new FormData();
    formData.append('title', state.form.title);
    formData.append('subject', state.form.subject);
    formData.append('dueDate', state.form.dueDate);
    formData.append('questionTypes', JSON.stringify(state.form.questionTypes));
    formData.append('totalQuestions', state.form.totalQuestions.toString());
    formData.append('marksPerQuestion', state.form.marksPerQuestion.toString());
    formData.append('difficulty', state.form.difficulty);
    formData.append('additionalInstructions', state.form.additionalInstructions);

    if (state.form.file) {
      formData.append('file', state.form.file);
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit assignment');
    }

    const data = await response.json();
    set({ currentAssignmentId: data.assignmentId });
    return { assignmentId: data.assignmentId };
  },

  generationStatus: 'idle',
  currentAssignmentId: null,
  setGenerationStatus(status) {
    set({ generationStatus: status as any });
  },
  setCurrentAssignmentId(id) {
    set({ currentAssignmentId: id });
  },

  currentPaper: null,
  async fetchPaper(assignmentId) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/papers/assignment/${assignmentId}`
      );
      if (response.ok) {
        const data = await response.json();
        set({ currentPaper: data });
      }
    } catch (error) {
      console.error('Failed to fetch paper:', error);
    }
  },
}));
