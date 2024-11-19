import mongoose from 'mongoose';

// Create a donation schema
const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    trim: true, // Trim spaces
  },
  email: {
    type: String,
    trim: true,
    lowercase: true, // Convert email to lowercase
    validate: {
      validator: function (v) {
        // Simple regex for validating email format
        return /\S+@\S+\.\S+/.test(v);
      },
      message: props => `${props.value} is not a valid email!`,
    },
  },
  amount: {
    type: String,
    enum: [
      '50', '2', '1', '100', '200', '500', '1000', '1500', '2000', '2500', '3000', '5000', '7000', '10000', '15000', '20000', 'other'
    ], // Predefined amounts plus 'other' option for custom amounts
    message: 'Amount must be one of the predefined values: 50, 100, 200, 500, 1000, 1500, 2000, 2500, 3000, 5000, 7000, 10000, 15000, 20000, or "other"',
  },
  customAmount: {
    type: Number,
    required: function() {
      // If 'amount' is 'other', then 'customAmount' is required
      return this.amount === 'other';
    },
    min: [50, 'Amount must be at least 50'],
    max: [20000, 'Amount cannot exceed 20,000'],
  },
  message: {
    type: String,
    trim: true,
    default: 'No message', // Default message if no custom message is provided
  },
  donationDate: {
    type: Date,
    default: Date.now, // Set default to current date and time
  },
  isAnonymous: {
    type: Boolean,
    default: false, // By default, donations are not anonymous
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending', // Default payment status is 'pending'
  },
  amountInWords: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  donationType: {
    type: String,
  },
  relation: {
    type: String
  },
  spouseName: {
    type: String
  },
  paymentIntentId: { type: String },
  amount: { type: Number },
  status: { type: String},
  upiId: { type: String},  // Optional field to store UPI ID

});

// Create and export a Mongoose model for donations
const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
