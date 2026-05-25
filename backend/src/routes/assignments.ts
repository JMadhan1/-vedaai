import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import Assignment from '../models/Assignment.js';
import { enqueueGeneration, getJobPosition } from '../services/queueService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment
router.post(
  '/',
  upload.single('file'),
  [
    body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
    body('questionTypes')
      .isArray({ min: 1 })
      .withMessage('At least one question type is required'),
    body('totalQuestions')
      .isInt({ min: 1, max: 50 })
      .withMessage('Total questions must be between 1 and 50'),
    body('marksPerQuestion')
      .isInt({ min: 1 })
      .withMessage('Marks per question must be at least 1'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        subject,
        dueDate,
        questionTypes,
        totalQuestions,
        marksPerQuestion,
        difficulty,
        additionalInstructions,
      } = req.body;

      // Validate due date is in future
      const dueDateObj = new Date(dueDate);
      if (dueDateObj <= new Date()) {
        return res.status(400).json({ error: 'Due date must be in the future' });
      }

      let fileContent = '';

      // Extract text from PDF if file is provided
      if (req.file) {
        try {
          const data = await pdf(req.file.buffer);
          fileContent = data.text;
        } catch (error) {
          console.error('PDF parse error:', error);
          return res.status(400).json({ error: 'Failed to parse PDF file' });
        }
      }

      // Create assignment
      const assignment = new Assignment({
        title,
        subject,
        dueDate: dueDateObj,
        questionTypes: JSON.parse(questionTypes),
        totalQuestions: parseInt(totalQuestions),
        marksPerQuestion: parseInt(marksPerQuestion),
        difficulty: difficulty || 'mixed',
        additionalInstructions,
        fileContent,
        status: 'pending',
      });

      await assignment.save();

      // Enqueue generation job
      const jobId = await enqueueGeneration(assignment._id.toString());

      res.status(201).json({
        assignmentId: assignment._id.toString(),
        jobId,
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }
);

// Get job status
router.get('/:assignmentId/job-status', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      assignmentId,
      status: assignment.status,
      errorMessage: assignment.errorMessage || null,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

export default router;
