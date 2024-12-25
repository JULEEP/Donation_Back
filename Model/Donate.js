import mongoose from 'mongoose';

// Create a donation schema
const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    trim: true, // Trim spaces
  },
  email: {
    type: String,
  },
  phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    purpose: {
      type: String,
      enum: ['Abhishek', 'Donation', 'Annadaan', 'Jeernoddhar'], // Limited to these options
    },
  amount: {
    type: String,
    enum: [
      '50', '2', '1', '10', '20', '100', '200', '500', 
    ], // Predefined amounts plus 'other' option for custom amounts
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
  upiLink: {
    type: String,
  },
  qrCodeUrl: {
    type: String,
  },
  

});

// Create and export a Mongoose model for donations
const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
