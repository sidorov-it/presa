import mongoose from 'mongoose';
import { IPresentation } from '@/types';

// Extended for MongoDB
interface MongoPresentation extends Omit<IPresentation, 'id'> {
  userId: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

const PresentationSchema = new mongoose.Schema<MongoPresentation>(
    {
        title: {
            type: String,
            required: [true, 'Please provide a title'],
        },
        description: {
            type: String,
        },
        slides: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: [],
        },
        userId: {
            type: String,
            required: [true, 'User ID is required'],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        createdAt: {
            type: Number,
            default: Date.now,
        },
        updatedAt: {
            type: Number,
            default: Date.now,
        },
    },
    {
        timestamps: false, // We're managing timestamps manually
    }
);

// Convert MongoDB _id to id when converting to JSON
PresentationSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.models.Presentation || mongoose.model<MongoPresentation>('Presentation', PresentationSchema); 