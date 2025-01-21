# Crank Server Alerts

A monitoring system that checks MongoDB collections for data updates and sends email alerts if no updates are detected within a specified timeframe.

## Installation

1. Unzip the `CrankServerAlerts.zip` folder
2. Navigate to the extracted directory:
   ```bash
   cd CrankServerAlerts
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration

1. In the extracted folder, locate the `.env` file
2. Update the following configurations with your values:
   ```
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=your_database_name
   COLLECTION_NAME=your_collection_name
   ALERT_EMAIL=alert@example.com
   ALERT_TIME_HOURS=6
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   CHECK_INTERVAL_MINUTES=30
   ```

## Running the Application

Start the application using Node.js:
```bash
node serverAlertsCrank.js
```

The system will:
- Check your MongoDB collection every 30 minutes (configurable in .env)
- Send email alerts if no updates are detected within the specified timeframe
- Log all checks and alerts to the console

## Files Included
- `serverAlertsCrank.js`: Main application file
- `.env`: Configuration file
- `package.json`: Project dependencies

## Troubleshooting

If you encounter any issues:
1. Ensure all dependencies are installed correctly
2. Verify your MongoDB connection string
3. Make sure your email credentials are correct
4. Check console logs for any error messages

## Support

For additional support or to report issues, please contact the development team.
