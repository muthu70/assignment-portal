import mongoose from 'mongoose';
import crypto from 'crypto';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Course title is required'], trim: true },
    code: { type: String, required: [true, 'Course code is required'], trim: true, uppercase: true },
    semester: { type: String, trim: true, default: '' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    joinCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(3).toString('hex').toUpperCase(),
    },
  },
  { timestamps: true }
);

courseSchema.index({ teacher: 1 });
courseSchema.index({ students: 1 });

export default mongoose.model('Course', courseSchema);
