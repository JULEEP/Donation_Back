import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Function to generate a donation receipt PDF
export const generateReceiptPDF = (donation, res) => {
  // Manually define the full path to the 'receipts' folder
  const receiptsFolderPath = 'C:\\Users\\hi\\Downloads\\Charity-Donation-main\\Charity-Donation-main\\backend\\receipts'; // Full path to the 'receipts' folder

  // Log the path for debugging
  console.log('Receipts Folder Path:', receiptsFolderPath);

  // Check if the 'receipts' folder exists
  if (!fs.existsSync(receiptsFolderPath)) {
    console.log("Receipts folder does not exist, creating folder...");

    // Create the folder if it doesn't exist
    try {
      fs.mkdirSync(receiptsFolderPath, { recursive: true });
      console.log('Receipts folder created successfully');
    } catch (err) {
      console.error('Error creating receipts folder:', err);
      return res.status(500).send('Error creating receipts folder');
    }
  }

  // Define the receipt file path
  const receiptFileName = `donation_receipt_${donation.donorID}.pdf`;
  const receiptPath = path.join(receiptsFolderPath, receiptFileName); // Full path for the receipt

  // Debugging: Log the full receipt path
  console.log('Receipt Path:', receiptPath);

  // Create a new PDF document with margin
  const pdfDoc = new PDFDocument({ margin: 30 });

  // Pipe the PDF output to the file system
  pdfDoc.pipe(fs.createWriteStream(receiptPath));

  // Define the border coordinates (all four sides)
  const borderX = 30; // Left and Right margin for the border
  const borderY = 30; // Top and Bottom margin for the border
  const borderWidth = 550; // Width of the border
  const borderHeight = 750; // Height of the border

  // Draw the border around the content
  pdfDoc.rect(borderX, borderY, borderWidth, borderHeight).stroke(); // Draw border rectangle

  // Add content inside the border

  // 1. Text inside the border
  pdfDoc.fontSize(16).text('श्री गोपाळ गणपती देवस्थान ट्रस्ट', 50, 100);
  pdfDoc.fontSize(14).text('फर्मागुडी बांदिवडे फोंडा - गोवा', 50, 120);
  pdfDoc.fontSize(12).text('Reg. No. PON-4-10-2020', 50, 140);
  pdfDoc.fontSize(12).text('Seva Receipt', 50, 160);

  // Add space
  pdfDoc.moveDown(2); // Add space for the next section

  // 2. Donor ID and Date at the top-right
  pdfDoc.text(`Receipt Number: ${donation.donorID}`, 400, 200);
  pdfDoc.text(`Date: ${new Date(donation.donationDate).toLocaleDateString()}`, 400, 220);

  pdfDoc.moveDown(2); // Add space for the next section

  // 3. Donor name and message
  pdfDoc.text(`Donor: Shri. ${donation.donorName}`, 50, 250);
  pdfDoc.text(`Message: ${donation.message || 'No message'}`, 50, 270);

  pdfDoc.moveDown(2); // Add space for the table

  // 4. Table with S.No, Spouse, Amount columns
  pdfDoc.fontSize(12).text('S.No', 50, 300);
  pdfDoc.text('Spouse', 150, 300);
  pdfDoc.text('Amount', 250, 300);

  pdfDoc.lineWidth(0.5).moveTo(50, 310).lineTo(400, 310).stroke(); // Table header separator

  pdfDoc.text('1', 50, 320);
  pdfDoc.text(`Smt. ${donation.spouseName}`, 150, 320);
  pdfDoc.text(`₹${donation.amount}`, 250, 320);

  pdfDoc.moveDown(2); // Add space after the table

  // 5. Amount in Words
  pdfDoc.text(`Amount in Words: ${donation.amountInWords}`, 50, 350);

  // 6. Total and Payment Method
  pdfDoc.text('Total', 250, 380);
  pdfDoc.text(`₹${donation.amount}`, 300, 380);

  pdfDoc.moveDown(2); // Add space for the next section

  pdfDoc.text('Payment Method:', 50, 420);
  pdfDoc.text(donation.paymentMethod, 150, 420);

  pdfDoc.text('Date:', 250, 420);
  pdfDoc.text(new Date(donation.donationDate).toLocaleDateString(), 300, 420);

  pdfDoc.moveDown(2); // Final thank you message
  pdfDoc.fontSize(10).text('Thank you for your generous contribution!', { align: 'center' });

  // Finalize the PDF document
  pdfDoc.end();

  // Return the path where the PDF is saved
  return receiptPath;
};
