import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  { originalName: String, filename: String, size: Number, mimetype: String },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    files: [fileSchema],
    attempts: { type: Number, default: 1 },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    marks: { type: Number, default: null },
    feedback: { type: String, default: '' },
    released: { type: Boolean, default: false },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date,
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
