import express from 'express';
const router = express.Router()
import { createDonation, getDonations, getDonationByID, PaymentSuccess, getDonationDetails, updatePaymentStatus, generateInvoice, getDonationById, updateDonation,  deleteDonation} from '../Controller/Donation.js'


// POST route to create a donation
router.post('/create-donations', createDonation);

// GET route to fetch all donations
router.get('/get-donations', getDonations);

// GET route to fetch a donation by donor ID
router.get('/donations/:donorID', getDonationByID);
router.get('/payment-success', PaymentSuccess)
router.put('/update-status/:donationId', updatePaymentStatus)
router.post('/download-invoice/:donationId', generateInvoice)
router.get('/donation/:donationId', getDonationById);
router.get('/donation', getDonationDetails);
router.put('/update-donation/:donationId', updateDonation);
router.delete('/delete-donation/:donationId', deleteDonation);





export default router;
