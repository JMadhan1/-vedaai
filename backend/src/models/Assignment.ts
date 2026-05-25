import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
    },
    subject: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    questionTypes: {
      type: [String],
      enum: ['mcq', 'short', 'long'],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    marksPerQuestion: {
      type: Number,
      required: true,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    additionalInstructions: {
      type: String,
      default: '',
    },
    fileContent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'error'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
