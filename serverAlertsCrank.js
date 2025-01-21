// index.js
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration from environment variables
const {
  MONGODB_URI,
  DB_NAME,
  COLLECTION_NAME,
  ALERT_EMAIL,
  ALERT_TIME_HOURS,
  EMAIL_USER,
  EMAIL_PASSWORD,
  CHECK_INTERVAL_MINUTES,
  MAX_RETRIES,
  RETRY_DELAY_MINUTES
} = process.env;

let retryCount = 0;
let checkInterval;

async function checkAndSendAlert() {
  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    // Get the last document
    const lastDoc = await collection.find().sort({ _id: -1 }).limit(1).toArray();

    if (lastDoc.length > 0) {
      const lastDocDate = lastDoc[0].createdAt;
      const currentTime = new Date();
      const timeDifference = (currentTime - new Date(lastDocDate)) / (1000 * 60 * 60);

      if (timeDifference > Number(ALERT_TIME_HOURS)) {
        await sendAlertEmail(lastDoc[0].createdAt);
        console.log(`Alert sent at ${new Date().toISOString()}`);
        
        // Reset retry count on successful check
        retryCount = 0;
      } else {
        console.log(`Check completed at ${new Date().toISOString()}. No alert needed.`);
        // Reset retry count on successful check
        retryCount = 0;
      }
    }
  } catch (error) {
    console.error('Error checking the collection:', error);
    await handleError(error);
  } finally {
    await client.close();
  }
}

async function sendAlertEmail(lastDocDate) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: ALERT_EMAIL,
    subject: 'Alert: Data not updated',
    text: `The last document in the collection was created more than ${ALERT_TIME_HOURS} hours ago. last data created: ${lastDocDate}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Alert email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    await handleError(error);
  }
}

async function handleError(error) {
  retryCount++;
  
  if (retryCount <= Number(MAX_RETRIES)) {
    console.log(`Attempt ${retryCount} of ${MAX_RETRIES}. Retrying in ${RETRY_DELAY_MINUTES} minutes...`);
    
    // Clear existing interval
    clearInterval(checkInterval);
    
    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, Number(RETRY_DELAY_MINUTES) * 60 * 1000));
    
    // Restart the monitoring
    startMonitoring();
  } else {
    console.error(`Maximum retry attempts (${MAX_RETRIES}) reached. Sending critical error alert.`);
    await sendCriticalErrorAlert(error);
    process.exit(1); // Exit with error code - PM2 will restart the process
  }
}

async function sendCriticalErrorAlert(error) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: ALERT_EMAIL,
    subject: 'CRITICAL: MongoDB Alert System Error',
    text: `The MongoDB alert system has encountered a critical error and will be restarted.\n\nError details:\n${error.message}\n\nStack trace:\n${error.stack}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Critical error alert sent:', info.response);
  } catch (emailError) {
    console.error('Failed to send critical error email:', emailError);
  }
}

function startMonitoring() {
  // Initial check
  checkAndSendAlert();

  // Schedule regular checks
  const intervalMs = Number(CHECK_INTERVAL_MINUTES) * 60 * 1000;
  checkInterval = setInterval(checkAndSendAlert, intervalMs);

  console.log(`Alert system started. Checking every ${CHECK_INTERVAL_MINUTES} minutes.`);
}

// Start the monitoring system
startMonitoring();