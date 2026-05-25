import puppeteer from 'puppeteer';
import GeneratedPaper from '../models/GeneratedPaper.js';

export async function generatePDF(paperId: string): Promise<Buffer> {
  const paper = await GeneratedPaper.findById(paperId);

  if (!paper) {
    throw new Error('Paper not found');
  }

  const htmlContent = generateQuestionPaperHTML(paper.toObject());

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function generateQuestionPaperHTML(paper: any): string {
  const schoolName = 'Delhi Public School';

  let questionsHTML = '';
  let questionNumber = 1;

  for (const section of paper.sections || []) {
    questionsHTML += `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        <p class="section-instruction">${section.instruction}</p>
    `;

    for (const question of section.questions || []) {
      const difficultyColor =
        question.difficulty === 'easy'
          ? '#4CAF50'
          : question.difficulty === 'medium'
            ? '#FF9800'
            : '#F44336';

      questionsHTML += `
        <div class="question">
          <div class="question-header">
            <span class="question-number">${questionNumber}.</span>
            <span class="question-text">${question.text}</span>
            <span class="question-marks">[${question.marks}]</span>
          </div>
          <span class="difficulty" style="background-color: ${difficultyColor};">${question.difficulty.toUpperCase()}</span>
      `;

      if (question.options && question.options.length > 0) {
        questionsHTML += '<div class="options">';
        const optionLetters = ['(a)', '(b)', '(c)', '(d)'];
        for (let i = 0; i < question.options.length; i++) {
          questionsHTML += `<p class="option">${optionLetters[i]} ${question.options[i]}</p>`;
        }
        questionsHTML += '</div>';
      }

      questionsHTML += '</div>';
      questionNumber++;
    }

    questionsHTML += '</div>';
  }

  // Answer key
  let answerKeyHTML = '<div class="answer-key"><h3>Answer Key</h3><div class="answers">';
  for (const answer of paper.answerKey || []) {
    answerKeyHTML += `<p><strong>${answer.questionId}:</strong> ${answer.answer}</p>`;
  }
  answerKeyHTML += '</div></div>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${paper.paperTitle}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; }
        .exam-title { font-size: 18px; margin-top: 10px; }
        .exam-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; font-size: 14px; }
        .meta-item { text-align: center; }
        .student-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; font-size: 14px; }
        .info-field { border-bottom: 1px solid #000; padding: 8px 0; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; }
        .section-instruction { font-size: 12px; font-style: italic; margin-bottom: 15px; color: #666; }
        .question { margin-bottom: 20px; padding: 10px 0; border-bottom: 1px solid #eee; }
        .question-header { display: flex; gap: 10px; align-items: flex-start; }
        .question-number { font-weight: bold; min-width: 30px; }
        .question-text { flex: 1; }
        .question-marks { font-weight: bold; min-width: 50px; text-align: right; }
        .difficulty { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-size: 11px; margin-top: 5px; }
        .options { margin-left: 40px; margin-top: 8px; }
        .option { margin: 5px 0; font-size: 13px; }
        .answer-key { margin-top: 50px; padding-top: 20px; border-top: 2px solid #333; }
        .answer-key h3 { margin-bottom: 15px; }
        .answers { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; }
        .page-break { page-break-after: always; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">${schoolName}</div>
        <div class="exam-title">${paper.paperTitle}</div>
        <div class="exam-meta">
          <div class="meta-item"><strong>Subject:</strong> ${paper.subject}</div>
          <div class="meta-item"><strong>Class:</strong> ${paper.class || 'N/A'}</div>
          <div class="meta-item"><strong>Max Marks:</strong> ${paper.maxMarks}</div>
          <div class="meta-item"><strong>Duration:</strong> ${paper.duration}</div>
        </div>
      </div>

      <div class="student-info">
        <div class="info-field"><span style="font-weight: bold;">Name:</span> ________________</div>
        <div class="info-field"><span style="font-weight: bold;">Roll No:</span> ________________</div>
        <div class="info-field"><span style="font-weight: bold;">Section:</span> ________________</div>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #333;" />

      ${questionsHTML}

      ${answerKeyHTML}
    </body>
    </html>
  `;
}
