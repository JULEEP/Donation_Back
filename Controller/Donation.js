import express from 'express'
import Donation from '../Model/Donate.js'
import {generateReceiptPDF} from '../Helper/generateReceiptPDF.js'
import QRCode from 'qrcode';  // Make sure qrcode package is installed
import axios from 'axios';
import dotenv from 'dotenv';  // Import dotenv package
import Stripe from 'stripe';  // Import Stripe package
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';


dotenv.config();  // Load environment variables

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);  // Load your Stripe Secret Key
const upiId = 'juleeperween@ybl';  // Your PhonePe or other UPI ID

export const createDonation = async (req, res) => {
  try {
    const { amount } = req.body;  // Amount entered by the user in INR

    // Validate the donation amount
    if (amount < 0.50) {
      return res.status(400).send({
        error: 'The donation amount must be at least ₹0.50'
      });
    }

    // Create a UPI payment link (example format)
    const upiLink = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;

    // Generate the QR code for the UPI link
    QRCode.toDataURL(upiLink, async (err, qrCodeUrl) => {
      if (err) {
        return res.status(500).send('Error generating UPI QR code');
      }

      // Save the donation in the database with initial status set to 'pending'
      const donation = new Donation({
        amount,
        upiLink,
        qrCodeUrl,  // Save the generated QR code URL
        status: 'pending',  // Initial status
      });

      // Save the donation to the database
      await donation.save();

      // Send the response to the frontend with the QR code and UPI link
      res.send({
        success: true,
        qr_code: qrCodeUrl,  // Send the QR code as base64 image URL
        upiLink: upiLink,    // Send the UPI link
        donationId: donation._id,  // Send the donation ID for tracking
      });
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).send({ error: error.message });
  }
};
// Function to create a Stripe payment link and save paymentIntentId
const createStripePaymentLink = async (amount, currency = 'INR') => {
  try {
    // Create a Stripe Checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['upi'],  // UPI is supported in India by Stripe Checkout
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Donation Payment',
            },
            unit_amount: amount * 100,  // Convert amount to paise (for INR)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,  // Redirect on success
      cancel_url: 'http://localhost:3000/payment-cancel', // Redirect on cancel
    });

    // Save the paymentIntentId in the database for the donation record
    const donation = new Donation({
      paymentIntentId: session.payment_intent,  // Stripe Payment Intent ID
      amount,
      status: 'pending',  // Initial status, can be updated later
    });

    // Save donation to DB
    await donation.save();
    console.log(donation);
    

    // Return the session URL and paymentIntentId
    return {
      success: true,
      paymentLink: session.url,  // Stripe checkout session URL
      paymentIntentId: session.payment_intent,  // Payment Intent ID for future reference
    };
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};



export const updatePaymentStatus = async (req, res) => {
  const { donationId } = req.params;

  try {
    // Find the donation by ID
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Update the status to 'paid'
    donation.status = 'paid';
    await donation.save();

    return res.status(200).json({
      success: true,
      message: 'Donation status updated to paid',
      donation,
    });
  } catch (error) {
    console.error('Error updating donation status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update donation status' });
  }
};



// Function to handle payment success and send PDF receipt
export const handlePaymentSuccess = (req, res) => {
  try {
    // Assuming donation details are available after successful payment
    const { donorID, donorName, spouseName, amount, donationDate, amountInWords, paymentMethod } = req.body;

    const donation = {
      donorID,
      donorName,
      spouseName,
      amount,
      donationDate,
      amountInWords,
      paymentMethod,
    };

    // Generate the PDF receipt for the donation
    const receiptPath = generateReceiptPDF(donation);

    // Send the generated PDF as a response (you can also choose to send it as an attachment)
    res.download(receiptPath, 'donation_receipt.pdf', (err) => {
      if (err) {
        console.error('Error sending receipt:', err);
        return res.status(500).json({ success: false, message: 'Error sending receipt PDF' });
      }
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({ success: false, message: 'Error processing payment' });
  }
};



// Get all donations with specific fields and handle missing data (set to null)
export const getDonations = async (req, res) => {
  try {
    // Retrieve donations with only the specified fields
    const donations = await Donation.find().select(
      'amount status donorName donationDate paymentMethod donationType relation'
    );

    // Map through donations to set missing fields as null
    const donationsWithNullFields = donations.map(donation => {
      return {
        amount: donation.amount || null,
        status: donation.status || null,
        donorName: donation.donorName || null,
        donationDate: donation.donationDate || null,
        paymentMethod: donation.paymentMethod || null,
        donationType: donation.donationType || null,
        relation: donation.relation || null,
        donationId: donation._id
      };
    });

    res.status(200).json({
      success: true,
      donations: donationsWithNullFields,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations.',
    });
  }
};


// Update Donation Controller
export const updateDonation = async (req, res) => {
  const { donationId } = req.params; // Get the donationId from params
  const updateData = req.body;       // Get the data to update from the request body

  try {
    // Find the donation by ID and update it
    const updatedDonation = await Donation.findByIdAndUpdate(
      donationId,                     // Find the donation by ID
      { $set: updateData },            // Set the new data
      { new: true }                    // Return the updated donation
    );

    if (!updatedDonation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    res.status(200).json({
      success: true,
      donation: updatedDonation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation.',
    });
  }
};

// Delete Donation Controller
export const deleteDonation = async (req, res) => {
  const { donationId } = req.params;  // Get the donationId from params

  try {
    // Find the donation by ID and remove it
    const deletedDonation = await Donation.findByIdAndDelete(donationId);

    if (!deletedDonation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting donation.',
    });
  }
};




// Get donation by donor ID
export const getDonationByID = async (req, res) => {
  try {
    const { donorID } = req.params; // Extract donorID from the URL parameters
    const donation = await Donation.findOne({ donorID });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation by ID.',
    });
  }
};

// Payment success handler
export const PaymentSuccess = async (req, res) => {
  const sessionId = req.query.session_id;

  // Check if session ID is provided
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required.' });
  }

  try {
    // Retrieve the Stripe session using the provided session ID
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    if (session.payment_status === 'paid') {
      // Payment is successful, generate the receipt
      const receiptPath = await generateReceiptPDF({
        donorID: session.metadata.donorID,
        donorName: session.metadata.donorName,
        spouseName: session.metadata.spouseName,
        amount: session.amount_total / 100,  // Convert from paise to INR
        donationDate: new Date(),
        amountInWords: session.metadata.amountInWords,
        paymentMethod: 'Stripe',
      });

      // Send the receipt in the response
      res.json({
        success: true,
        message: 'Thank you for your donation! Your payment was successful.',
        receiptPath: receiptPath,  // Path to the generated PDF receipt
      });
    } else {
      // Payment failed or was canceled
      res.status(400).json({ success: false, message: 'Payment was not successful or was canceled.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'There was an error verifying your payment. Please try again later.' });
  }
};


export const getDonationDetails = async (req, res) => {
  try {
    // Get the donation ID from the URL parameter
    const { id } = req.params;

    // Fetch the donation details from the database
    const donation = await Donation.findById(id);

    // If no donation is found with the provided ID, return an error
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Return the donation details
    return res.json({
      success: true,
      message: 'Donation details fetched successfully.',
      donation: {
        id: donation._id,
        donorID: donation.donorID,
        donorName: donation.donorName,
        spouseName: donation.spouseName,
        donationDate: donation.donationDate,
        amount: donation.amount,
        amountInWords: donation.amountInWords,
        message: donation.message,
        paymentMethod: donation.paymentMethod,
        status: donation.status,  // Status like 'pending', 'paid'
        paymentLink: donation.paymentLink,  // If Stripe payment link exists
        upiLink: donation.upiLink,  // If UPI link exists
        qrCode: donation.qrCode,  // If QR code exists
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error. Unable to fetch donation details.',
    });
  }
};

export const generateInvoice = async (req, res) => {
  try {
    const { donationId } = req.params;

    if (!donationId) {
      return res.status(400).send({ error: 'Donation ID is required.' });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).send({ error: 'Donation not found.' });
    }

    const pdfDoc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=donation_receipt_${donation.donorID}.pdf`);
    pdfDoc.pipe(res);

    // Define the border and content area
    const borderX = 30, borderY = 30, borderWidth = 550, borderHeight = 750;
    pdfDoc.rect(borderX, borderY, borderWidth, borderHeight).stroke();

    // Add Header
    pdfDoc.fontSize(16).text('श्री गोपाळ गणपती देवस्थान ट्रस्ट', 50, 100);
    pdfDoc.fontSize(14).text('फर्मागुडी बांदिवडे फोंडा - गोवा', 50, 120);
    pdfDoc.fontSize(12).text('Reg. No. PON-4-10-2020', 50, 140);
    pdfDoc.fontSize(12).text('Seva Receipt', 50, 160);

    pdfDoc.moveDown(2);

    // Receipt Info
    pdfDoc.text(`Receipt Number: ${donation.donorID}`, 400, 200);
    pdfDoc.text(`Date: ${new Date(donation.donationDate).toLocaleDateString()}`, 400, 220);

    pdfDoc.moveDown(2);

    // Donor Info
    pdfDoc.text(`Donor: Shri. ${donation.donorName}`, 50, 250);
    pdfDoc.text(`Message: ${donation.message || 'No message'}`, 50, 270);

    pdfDoc.moveDown(2);

    // Table Header
    pdfDoc.fontSize(12).text('S.No', 50, 300);
    pdfDoc.text('Spouse', 150, 300);
    pdfDoc.text('Amount', 250, 300);
    pdfDoc.lineWidth(0.5).moveTo(50, 310).lineTo(400, 310).stroke();

    // Table Row
    pdfDoc.text('1', 50, 320);
    pdfDoc.text(`Smt. ${donation.spouseName}`, 150, 320);
    pdfDoc.text(`₹${donation.amount}`, 250, 320);

    pdfDoc.moveDown(2);

    // Amount in Words
    pdfDoc.text(`Amount in Words: ${donation.amountInWords}`, 50, 350);

    // Total and Payment Info
    pdfDoc.text('Total', 250, 380);
    pdfDoc.text(`₹${donation.amount}`, 300, 380);

    pdfDoc.moveDown(2);

    pdfDoc.text('Payment Method:', 50, 420);
    pdfDoc.text(donation.paymentMethod, 150, 420);

    pdfDoc.text('Date:', 250, 420);
    pdfDoc.text(new Date(donation.donationDate).toLocaleDateString(), 300, 420);

    pdfDoc.moveDown(2);

    // Final Message
    pdfDoc.fontSize(10).text('Thank you for your generous contribution!', { align: 'center' });

    pdfDoc.end();
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    res.status(500).send({ error: 'Error generating receipt PDF.' });
  }
};


export const getDonationById = async (req, res) => {
  try {
    const { donationId } = req.params;  // Get the donationId from the request parameters

    // Find the donation by its ID in the database
    const donation = await Donation.findById(donationId);

    // If no donation is found, return a 404 error
    if (!donation) {
      return res.status(404).send({
        error: 'Donation not found'
      });
    }

    // Return the donation data in the response
    res.send({
      success: true,
      donation: donation
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).send({ error: error.message });
  }
};
