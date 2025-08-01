import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ['student', 'faculty', 'hod', 'warden', 'guard'], // restrict roles
    },
    subscription: {
      endpoint: {
        type: String,
        required: true,
      },
      keys: {
        auth: {
          type: String,
          required: true,
        },
        p256dh: {
          type: String,
          required: true,
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', subscriptionSchema);
