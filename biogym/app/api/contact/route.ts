import { NextRequest, NextResponse } from 'next/server';

// Target email configured server-side (not exposed to client)
const TARGET_EMAIL = 'dev.kadaba@gmail.com';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, message } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // For now, we'll log the contact submission
        // In production, you would integrate with an email service like:
        // - SendGrid
        // - Resend
        // - AWS SES
        // - Nodemailer with SMTP

        console.log('=== CONTACT FORM SUBMISSION ===');
        console.log(`To: ${TARGET_EMAIL}`);
        console.log(`From: ${name} <${email}>`);
        console.log(`Message: ${message}`);
        console.log('================================');

        // TODO: Add actual email sending here
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //     from: 'BioGym Contact <noreply@biogym.ai>',
        //     to: TARGET_EMAIL,
        //     subject: `Contact Form: Message from ${name}`,
        //     text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        // });

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully!'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
