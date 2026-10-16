import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  { originalName: String, filename: String, size: Number, mimetype: String },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    maxMarks: { type: Number, required: true, min: [1, 'Max marks must be at least 1'], default: 100 },
    allowLate: { type: Boolean, default: false },
    allowResubmit: { type: Boolean, default: true },
    attachments: [fileSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
