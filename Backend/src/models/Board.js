import mongoose from 'mongoose';

const boardColumnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    cardOrder: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Card',
      default: [],
    },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Please enter board name'],
      trim: true,
      minlength: [2, 'Board name must be at least 2 characters'],
      maxlength: [100, 'Board name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [150, 'Description cannot exceed 150 characters'],
    },
    columns: {
      type: [boardColumnSchema],
      default: [
        { id: 'todo', title: 'To Do', cardOrder: [] },
        { id: 'in-progress', title: 'In Progress', cardOrder: [] },
        { id: 'done', title: 'Done', cardOrder: [] },
      ],
    },
  },
  {
    timestamps: true,
  }
);

boardSchema.index({ teamId: 1 });

export default mongoose.model('Board', boardSchema);
