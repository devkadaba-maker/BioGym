import { Resend } from 'resend';

const ADMIN_EMAIL = 'dev.kadaba@gmail.com';

// Lazy initialization or safe check
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
};

export async function sendTrialNotification(userEmail: string | undefined, userId: string) {
    const resend = getResendClient();

    if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email notification.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'BioGym <notifications@biogym.fit>',
            to: ADMIN_EMAIL,
            subject: '🚀 New Free Trial Signup!',
            html: `
        <h1>New Trial Started!</h1>
        <p>A new user has just started a free trial.</p>
        <ul>
          <li><strong>User ID:</strong> ${userId}</li>
          <li><strong>User Email:</strong> ${userEmail || 'Unknown (Check Stripe)'}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Go to your <a href="https://dashboard.stripe.com/">Stripe Dashboard</a> for more details.</p>
      `,
        });

        if (error) {
            console.error('Failed to send trial notification email:', error);
        } else {
            console.log('Trial notification email sent:', data?.id);
        }
    } catch (err) {
        console.error('Error sending email:', err);
    }
}
