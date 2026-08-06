import mongoose, { Schema, Document } from 'mongoose';

export interface SequenceDocument extends Document {
  schoolId: mongoose.Types.ObjectId;
  key: string;
  sequenceValue: number;
}

const sequenceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    key: { type: String, required: true },
    sequenceValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sequenceSchema.index({ schoolId: 1, key: 1 }, { unique: true });

export const Sequence = mongoose.model<SequenceDocument>('Sequence', sequenceSchema);
