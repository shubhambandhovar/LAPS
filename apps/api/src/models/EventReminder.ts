import { Schema, model, Document, Types } from 'mongoose';

export interface IEventReminderDocument extends Document {
  calendarEventId: Types.ObjectId;
  userId: Types.ObjectId;
  reminderTime: Date;
  channels: ('IN_APP' | 'EMAIL' | 'SMS')[];
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const EventReminderSchema = new Schema<IEventReminderDocument>(
  {
    calendarEventId: {
      type: Schema.Types.ObjectId,
      ref: 'CalendarEvent',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reminderTime: {
      type: Date,
      required: true,
      index: true,
    },
    channels: [
      {
        type: String,
        enum: ['IN_APP', 'EMAIL', 'SMS'],
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  }
);

EventReminderSchema.index({ status: 1, reminderTime: 1 });
EventReminderSchema.index({ userId: 1, calendarEventId: 1 });

export const EventReminder = model<IEventReminderDocument>('EventReminder', EventReminderSchema);
