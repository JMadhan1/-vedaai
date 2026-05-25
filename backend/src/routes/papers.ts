import express, { Request, Response } from 'express';
import GeneratedPaper from '../models/GeneratedPaper.js';
import Assignment from '../models/Assignment.js';
import { generatePDF } from '../services/pdfService.js';
import { enqueueGeneration } from '../services/queueService.js';

const router = express.Router();

// Get paper by assignment ID
router.get('/assignment/:assignmentId', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const paper = await GeneratedPaper.findOne({ assignmentId });
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(paper);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// Get paper by paper ID
router.get('/:paperId', async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;

    const paper = await GeneratedPaper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(paper);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// Download PDF
router.get('/:paperId/download', async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;

    const paper = await GeneratedPaper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const pdfBuffer = await generatePDF(paperId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${paper.paperTitle || 'question-paper'}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Regenerate paper
router.post('/:assignmentId/regenerate', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Delete old paper if exists
    await GeneratedPaper.deleteOne({ assignmentId });

    // Reset assignment status
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'pending',
      errorMessage: '',
    });

    // Enqueue new generation job
    const jobId = await enqueueGeneration(assignmentId);

    res.json({
      assignmentId,
      jobId,
      message: 'Regeneration queued',
    });
  } catch (error) {
    console.error('Error regenerating paper:', error);
    res.status(500).json({ error: 'Failed to regenerate paper' });
  }
});

export default router;
