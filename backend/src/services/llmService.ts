import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface GenerateQuestionPaperParams {
  subject: string;
  additionalInstructions: string;
  questionTypes: string[];
  totalQuestions: number;
  marksPerQuestion: number;
  fileContent?: string;
}

interface QuestionData {
  id: string;
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: 'mcq' | 'short' | 'long';
  options: string[] | null;
}

interface SectionData {
  id: string;
  title: string;
  instruction: string;
  questions: QuestionData[];
}

interface AnswerKeyData {
  questionId: string;
  answer: string;
}

export interface QuestionPaperOutput {
  paperTitle: string;
  subject: string;
  class: string;
  maxMarks: number;
  duration: string;
  sections: SectionData[];
  answerKey: AnswerKeyData[];
}

export async function generateQuestionPaper(
  params: GenerateQuestionPaperParams
): Promise<QuestionPaperOutput> {
  const systemPrompt = `You are an expert educator and exam paper creator.
Generate a structured question paper in valid JSON only.
No markdown, no explanation, just JSON matching this exact schema:
{
  "paperTitle": string,
  "subject": string,
  "class": string,
  "maxMarks": number,
  "duration": string,
  "sections": [
    {
      "id": string,
      "title": string,
      "instruction": string,
      "questions": [
        {
          "id": string,
          "number": number,
          "text": string,
          "difficulty": "easy" | "medium" | "hard",
          "marks": number,
          "type": "mcq" | "short" | "long",
          "options": string[] | null
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionId": string,
      "answer": string
    }
  ]
}`;

  const userPrompt = `Create a question paper for:
Subject: ${params.subject}
Topic/Instructions: ${params.additionalInstructions}
Question Types: ${params.questionTypes.join(', ')}
Total Questions: ${params.totalQuestions}
Marks per Question: ${params.marksPerQuestion}
Difficulty Distribution: Easy 30%, Medium 50%, Hard 20%
${params.fileContent ? `Reference Material:\n${params.fileContent}` : ''}

Generate exactly ${params.totalQuestions} questions distributed across sections by type.
Return ONLY valid JSON, nothing else.`;

  try {
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const paperData: QuestionPaperOutput = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (
      !paperData.paperTitle ||
      !paperData.sections ||
      !Array.isArray(paperData.sections)
    ) {
      throw new Error('Invalid paper structure');
    }

    return paperData;
  } catch (error) {
    console.error('LLM Error:', error);
    throw new Error(
      `Failed to generate question paper: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
