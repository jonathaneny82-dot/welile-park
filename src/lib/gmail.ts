import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse or initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request the specific Gmail send scope
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In helper
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google Access Token from Firebase.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Base64URL-encoding helper that supports UTF-8 characters
function base64UrlEncode(str: string): string {
  const base64 = btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface ReceiptData {
  customerName: string;
  customerEmail: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  date: string;
  type: 'Parking Booking' | 'Workshop Service' | 'Unified Payment for All Rendered Services' | string;
  details: string;
  paymentDetails?: string;
}

// Function to send payment confirmation receipt via Gmail API
export const sendReceiptEmail = async (to: string, data: ReceiptData): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token required. Please sign in with Google first.');
  }

  const subject = `Receipt: Payment of UGX ${data.amount.toLocaleString()} Confirmed - WELILE CAR HUB`;
  const formattedAmount = `UGX ${data.amount.toLocaleString()}`;
  const formattedDate = new Date(data.date).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header {
          background-color: #1e1b4b;
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #c7d2fe;
          font-family: monospace;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 24px;
        }
        .receipt-card {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .receipt-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-top: 8px;
        }
        .receipt-row .label {
          color: #64748b;
          font-weight: 500;
        }
        .receipt-row .value {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }
        .total-row {
          font-size: 16px !important;
        }
        .total-row .value {
          color: #059669;
          font-size: 18px;
          font-weight: 800;
        }
        .footer {
          padding: 24px;
          background-color: #f1f5f9;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WELILE CAR HUB RECEIPT</h1>
          <p>Integrated City Parking & Vehicle Service System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${data.customerName},</div>
          <div class="intro">Thank you for your payment. Your transaction has been processed successfully. Below are your receipt details:</div>
          
          <div class="receipt-card">
            <div class="receipt-row">
              <span class="label">Transaction Reference</span>
              <span class="value" style="font-family: monospace;">${data.transactionId}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Service Category</span>
              <span class="value">${data.type}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Details</span>
              <span class="value">${data.details}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Payment Date</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Payment Channel</span>
              <span class="value">${data.paymentMethod}</span>
            </div>
            ${data.paymentDetails ? `
            <div class="receipt-row" style="background-color: #fef08a; padding: 6px 10px; border-radius: 6px; margin: 4px 0;">
              <span class="label" style="color: #713f12; font-weight: 700;">Gateway Details</span>
              <span class="value" style="color: #713f12; font-family: monospace; font-size: 11px;">${data.paymentDetails}</span>
            </div>
            ` : ''}
            <div class="receipt-row total-row">
              <span class="label" style="font-weight: 700; color: #1e293b;">Total Amount Paid</span>
              <span class="value">${formattedAmount}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
            If you have any questions or require support, please contact our helpline or reply to this message.
          </p>
        </div>
        <div class="footer">
          ICPVSMS Kampala City Smart Operations • Real-time IoT Enabled Services • Automated Ledger Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const emailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ].join('\r\n');

  const rawMessage = base64UrlEncode(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to send Gmail:', errText);
    throw new Error(`Gmail API returned an error: ${response.status} - ${errText}`);
  }

  return true;
};

export interface ServiceBookingData {
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceType: string;
  vehicleDetails: string;
  bookingDate: string;
  cost: number;
}

// Function to send service booking confirmation email
export const sendServiceBookingEmail = async (to: string, data: ServiceBookingData): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token required. Please sign in with Google first.');
  }

  const subject = `Booking Confirmed: Workshop Appointment for ${data.serviceType} - WELILE CAR HUB`;
  const formattedAmount = `UGX ${data.cost.toLocaleString()}`;
  const formattedDate = new Date(data.bookingDate).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Workshop Service Appointment Confirmed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header {
          background-color: #059669;
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #d1fae5;
          font-family: monospace;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 24px;
        }
        .details-card {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .details-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-top: 8px;
        }
        .details-row .label {
          color: #64748b;
          font-weight: 500;
        }
        .details-row .value {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }
        .total-row {
          font-size: 16px !important;
        }
        .total-row .value {
          color: #059669;
          font-size: 18px;
          font-weight: 800;
        }
        .footer {
          padding: 24px;
          background-color: #f1f5f9;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>APPOINTMENT CONFIRMED</h1>
          <p>Integrated City Parking & Vehicle Service System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${data.customerName},</div>
          <div class="intro">Your vehicle service booking has been confirmed! Our master technicians look forward to assisting you on your scheduled date. Below are the appointment details:</div>
          
          <div class="details-card">
            <div class="details-row">
              <span class="label">Appointment ID</span>
              <span class="value" style="font-family: monospace;">${data.serviceId}</span>
            </div>
            <div class="details-row">
              <span class="label">Service Required</span>
              <span class="value">${data.serviceType}</span>
            </div>
            <div class="details-row">
              <span class="label">Vehicle Details</span>
              <span class="value">${data.vehicleDetails}</span>
            </div>
            <div class="details-row">
              <span class="label">Scheduled Time</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="details-row total-row">
              <span class="label" style="font-weight: 700; color: #1e293b;">Estimated Cost</span>
              <span class="value">${formattedAmount}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
            Please ensure you arrive at least 10 minutes prior to your scheduled time. You can track live workshop milestones directly from your Customer Portal.
          </p>
        </div>
        <div class="footer">
          WELILE CAR HUB Smart Operations • Real-time IoT Enabled Services • Automated Ledger Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const emailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ].join('\r\n');

  const rawMessage = base64UrlEncode(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to send Gmail:', errText);
    throw new Error(`Gmail API returned an error: ${response.status} - ${errText}`);
  }

  return true;
};

export interface ServiceUpdateData {
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceType: string;
  vehicleDetails: string;
  status: string;
  diagnosticNotes?: string;
  cost: number;
}

// Function to send service status updates email
export const sendServiceUpdateEmail = async (to: string, data: ServiceUpdateData): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token required. Please sign in with Google first.');
  }

  const subject = `Service Update: ${data.vehicleDetails} is now [${data.status}] - WELILE CAR HUB`;
  const formattedAmount = `UGX ${data.cost.toLocaleString()}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Workshop Service Status Update</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header {
          background-color: #d97706;
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #fef3c7;
          font-family: monospace;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 24px;
        }
        .details-card {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .details-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-top: 8px;
        }
        .details-row .label {
          color: #64748b;
          font-weight: 500;
        }
        .details-row .value {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }
        .notes-box {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          font-size: 12px;
          font-style: italic;
          color: #78350f;
          margin-top: 15px;
          border-radius: 0 8px 8px 0;
        }
        .footer {
          padding: 24px;
          background-color: #f1f5f9;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SERVICE STATUS UPDATE</h1>
          <p>Integrated City Parking & Vehicle Service System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${data.customerName},</div>
          <div class="intro">We have a status update on your vehicle's workshop service. Here is the latest progress report:</div>
          
          <div class="details-card">
            <div class="details-row">
              <span class="label">Service Reference</span>
              <span class="value" style="font-family: monospace;">${data.serviceId}</span>
            </div>
            <div class="details-row">
              <span class="label">Vehicle Details</span>
              <span class="value">${data.vehicleDetails}</span>
            </div>
            <div class="details-row">
              <span class="label">Service Requirement</span>
              <span class="value">${data.serviceType}</span>
            </div>
            <div class="details-row">
              <span class="label">Current Status</span>
              <span class="value" style="color: #d97706; font-weight: 700; text-transform: uppercase;">${data.status}</span>
            </div>
            <div class="details-row">
              <span class="label">Invoice Cost</span>
              <span class="value">${formattedAmount}</span>
            </div>
            
            ${data.diagnosticNotes ? `
            <div class="notes-box">
              <strong>Technician Log:</strong> "${data.diagnosticNotes}"
            </div>
            ` : ''}
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
            You can view complete logs, live milestones, and make online payments directly in your personal Customer Portal dashboard.
          </p>
        </div>
        <div class="footer">
          WELILE CAR HUB Smart Operations • Real-time IoT Enabled Services • Automated Ledger Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const emailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ].join('\r\n');

  const rawMessage = base64UrlEncode(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to send Gmail:', errText);
    throw new Error(`Gmail API returned an error: ${response.status} - ${errText}`);
  }

  return true;
};

export interface ReminderData {
  customerName: string;
  customerEmail: string;
  reminderType: 'Parking Expiry' | 'Service Schedule';
  title: string;
  details: string;
  timeLabel: string;
  timeValue: string;
}

// Function to send custom reminders via Gmail API
export const sendReminderEmail = async (to: string, data: ReminderData): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication token required. Please sign in with Google first.');
  }

  const subject = `Reminder: [${data.reminderType}] ${data.title} - WELILE CAR HUB`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>System Reminder & Alert</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header {
          background-color: #4f46e5;
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #e0e7ff;
          font-family: monospace;
        }
        .content {
          padding: 32px 24px;
        }
        .greeting {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 24px;
        }
        .details-card {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .details-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-top: 8px;
        }
        .details-row .label {
          color: #64748b;
          font-weight: 500;
        }
        .details-row .value {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }
        .footer {
          padding: 24px;
          background-color: #f1f5f9;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SYSTEM REMINDER</h1>
          <p>Integrated City Parking & Vehicle Service System</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${data.customerName},</div>
          <div class="intro">This is a reminder regarding your active smart city parking space or workshop service appointment:</div>
          
          <div class="details-card">
            <div class="details-row">
              <span class="label">Category</span>
              <span class="value" style="font-weight: 700; color: #4f46e5;">${data.reminderType}</span>
            </div>
            <div class="details-row">
              <span class="label">Subject</span>
              <span class="value">${data.title}</span>
            </div>
            <div class="details-row">
              <span class="label">Details</span>
              <span class="value">${data.details}</span>
            </div>
            <div class="details-row">
              <span class="label">${data.timeLabel}</span>
              <span class="value" style="font-weight: 700; color: #0f172a;">${data.timeValue}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
            Thank you for utilizing our integrated operations system. Please check your Customer Portal for live state telemetry.
          </p>
        </div>
        <div class="footer">
          WELILE CAR HUB Smart Operations • Real-time IoT Enabled Services • Automated Ledger Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const emailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlBody,
  ].join('\r\n');

  const rawMessage = base64UrlEncode(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to send Gmail:', errText);
    throw new Error(`Gmail API returned an error: ${response.status} - ${errText}`);
  }

  return true;
};

