import { Worker, Job } from 'bullmq';
import { Connection } from 'bullmq';
import Assignment from '../models/Assignment.js';
import GeneratedPaper from '../models/GeneratedPaper.js';
import { generateQuestionPaper } from '../services/llmService.js';
import { broadcast } from '../services/broadcastService.js';

export async function startWorker() {
  const connection: Connection = {
    host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname || 'localhost',
    port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
  };

  const worker = new Worker(
    'paper-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`Processing job ${job.id} for assignment ${assignmentId}`);

      try {
        // Update assignment status to processing
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'processing',
          errorMessage: '',
        });

        // Broadcast processing status
        broadcast(assignmentId, {
          type: 'processing',
          assignmentId,
        });

        // Fetch assignment details
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found');
        }

        // Generate question paper
        const paperData = await generateQuestionPaper({
          subject: assignment.subject,
          additionalInstructions: assignment.additionalInstructions,
          questionTypes: assignment.questionTypes,
          totalQuestions: assignment.totalQuestions,
          marksPerQuestion: assignment.marksPerQuestion,
          fileContent: assignment.fileContent,
        });

        // Calculate total marks
        const totalMarks = assignment.totalQuestions * assignment.marksPerQuestion;

        // Save generated paper to database
        const generatedPaper = new GeneratedPaper({
          assignmentId,
          paperTitle: paperData.paperTitle,
          subject: paperData.subject,
          class: paperData.class,
          maxMarks: totalMarks,
          duration: paperData.duration,
          sections: paperData.sections,
          answerKey: paperData.answerKey,
        });

        await generatedPaper.save();

        // Update assignment status to completed
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'completed',
        });

        // Broadcast completion
        broadcast(assignmentId, {
          type: 'completed',
          assignmentId,
          paperId: generatedPaper._id.toString(),
        });

        console.log(
          `Job ${job.id} completed. Paper saved: ${generatedPaper._id}`
        );
        return { paperId: generatedPaper._id.toString() };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(`Job ${job.id} failed:`, errorMessage);

        // Update assignment status to error
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'error',
          errorMessage,
        });

        // Broadcast error
        broadcast(assignmentId, {
          type: 'error',
          assignmentId,
          message: errorMessage,
        });

        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Worker: Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Worker: Job ${job?.id} failed:`, err.message);
  });

  console.log('Generation worker started');
  return worker;
}
