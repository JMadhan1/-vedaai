import mongoose from 'mongoose';

const answerKeySchema = new mongoose.Schema({
  questionId: String,
  answer: String,
});

const questionSchema = new mongoose.Schema({
  id: String,
  number: Number,
  text: String,
  difficulty: String,
  marks: Number,
  type: String,
  options: [String],
});

const sectionSchema = new mongoose.Schema({
  id: String,
  title: String,
  instruction: String,
  questions: [questionSchema],
});

const generatedPaperSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    paperTitle: String,
    subject: String,
    class: String,
    maxMarks: Number,
    duration: String,
    sections: [sectionSchema],
    answerKey: [answerKeySchema],
  },
  { timestamps: true }
);

export default mongoose.model('GeneratedPaper', generatedPaperSchema);
