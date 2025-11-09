// signature-trader/app/api/send-bulk-email/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const formData = body.formData;
    
    // Environment variables se credentials lein
    const { 
      EMAIL_SERVER_HOST, 
      EMAIL_SERVER_PORT, 
      EMAIL_SERVER_USER, 
      EMAIL_SERVER_PASS, 
      EMAIL_FROM 
    } = process.env;

    if (!EMAIL_SERVER_USER || !EMAIL_SERVER_PASS) {
      return NextResponse.json({ message: "Email credentials missing" }, { status: 500 });
    }

    // Nodemailer transporter banayein
    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER_HOST,
      port: Number(EMAIL_SERVER_PORT),
      secure: true, // true for 465
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASS,
      },
    });

    // Email content banayein
    const emailSubject = `NEW BULK ORDER INQUIRY: ${formData.fullName} (${formData.companyName || 'Individual'})`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Bulk/Corporate Order Request Received</h2>
        <p>A customer has submitted a bulk order inquiry through the website. Please review the details below and respond within 48 hours.</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px;">Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Full Name:</td><td style="padding: 5px;">${formData.fullName}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Company Name:</td><td style="padding: 5px;">${formData.companyName || 'N/A'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Email:</td><td style="padding: 5px;"><a href="mailto:${formData.email}">${formData.email}</a></td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Phone:</td><td style="padding: 5px;">${formData.phone || 'N/A'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Shipping Country:</td><td style="padding: 5px;">${formData.country}</td></tr>
        </table>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px;">Inquiry Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Category:</td><td style="padding: 5px;">${formData.category}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Required Quantity:</td><td style="padding: 5px; font-weight: bold; color: #D32F2F;">${formData.quantity}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Target Date:</td><td style="padding: 5px;">${formData.targetDate || 'Flexible'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Desired Product(s):</td><td style="padding: 5px; white-space: pre-wrap;">${formData.products || 'N/A'}</td></tr>
        </table>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px;">Additional Notes</h3>
        <p style="white-space: pre-wrap; padding: 5px; border: 1px solid #ddd; background-color: #f9f9f9;">${formData.notes || 'None'}</p>

        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
          Reply to this email directly to contact the customer.
        </p>
      </div>
    `;

    // Mail options (Email store owner/sales)
    const mailOptions = {
      from: EMAIL_FROM,
      // NOTE: EMAIL_SERVER_USER ko istemal karein taake woh sales inquiry receive karein
      to: EMAIL_SERVER_USER, 
      subject: emailSubject,
      html: emailHtml,
      replyTo: formData.email, // Customer ko seedha reply kar sakein
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Bulk email sent' }, { status: 200 });

  } catch (error) {
    console.error("Bulk email sending error:", error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to send bulk email', error: errorMessage }, { status: 500 });
  }
}