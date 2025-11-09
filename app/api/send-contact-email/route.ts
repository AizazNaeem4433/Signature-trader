import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;
    
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

    // Nodemailer transporter banayein (Same credentials as bulk mail)
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
    const emailSubject = `NEW WEBSITE CONTACT MESSAGE from ${name}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Contact Inquiry Received</h2>
        <p>A customer has submitted a message via the general contact form. Please respond promptly.</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px;">Sender Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px; font-weight: bold;">Name:</td><td style="padding: 5px;">${name}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Email:</td><td style="padding: 5px;"><a href="mailto:${email}">${email}</a></td></tr>
        </table>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px;">Message</h3>
        <p style="white-space: pre-wrap; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">${message}</p>

        <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
          Reply to this email directly to contact the customer.
        </p>
      </div>
    `;

    // Mail options
    const mailOptions = {
      from: EMAIL_FROM,
      to: EMAIL_SERVER_USER, // Sales/Owner email address
      subject: emailSubject,
      html: emailHtml,
      replyTo: email, // Set reply-to to customer's email
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Contact email sent' }, { status: 200 });

  } catch (error) {
    console.error("Contact email sending error:", error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to send contact email', error: errorMessage }, { status: 500 });
  }
}