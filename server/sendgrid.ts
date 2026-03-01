import sgMail from '@sendgrid/mail';

// SendGrid service deprecated - now using Twilio for both SMS and email
console.log('SendGrid service disabled - using Twilio for unified communication');

interface ContactEmailParams {
  agentEmail: string;
  agentName: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  message: string;
  propertyTitle?: string;
  propertyLocation?: string;
  contactMethod: string;
  contactTime?: string;
  isPreApproved: boolean;
}

export async function sendContactEmail(params: ContactEmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.error('Invalid SendGrid API key format. Key must start with "SG."');
    return false;
  }

  try {
    const {
      agentEmail,
      agentName,
      inquirerName,
      inquirerEmail,
      inquirerPhone,
      message,
      propertyTitle,
      propertyLocation,
      contactMethod,
      contactTime,
      isPreApproved
    } = params;

    const subject = propertyTitle 
      ? `New Property Inquiry - ${propertyTitle}`
      : `New Contact from ${inquirerName}`;

    const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">New Inquiry</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">TerraNova Land Marketplace</p>
      </div>
      
      <div style="padding: 40px 30px;">
        <div style="background: #f8faff; border: 1px solid #e5e9ff; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px;">Contact Information</h2>
          <div style="display: grid; gap: 12px;">
            <div><strong style="color: #475569;">Name:</strong> ${inquirerName}</div>
            <div><strong style="color: #475569;">Email:</strong> <a href="mailto:${inquirerEmail}" style="color: #667eea; text-decoration: none;">${inquirerEmail}</a></div>
            ${inquirerPhone ? `<div><strong style="color: #475569;">Phone:</strong> <a href="tel:${inquirerPhone}" style="color: #667eea; text-decoration: none;">${inquirerPhone}</a></div>` : ''}
            <div><strong style="color: #475569;">Preferred Contact:</strong> ${contactMethod === 'sms' ? 'SMS & Email' : 'Email'}</div>
            ${contactTime ? `<div><strong style="color: #475569;">Best Contact Time:</strong> ${contactTime}</div>` : ''}
          </div>
        </div>

        ${propertyTitle ? `
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #ea580c; margin: 0 0 15px 0; font-size: 20px;">Property Interest</h2>
          <div style="display: grid; gap: 12px;">
            <div><strong style="color: #9a3412;">Property:</strong> ${propertyTitle}</div>
            ${propertyLocation ? `<div><strong style="color: #9a3412;">Location:</strong> ${propertyLocation}</div>` : ''}
          </div>
        </div>` : ''}

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
          <h2 style="color: #16a34a; margin: 0 0 15px 0; font-size: 20px;">Message</h2>
          <p style="color: #15803d; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>

        ${isPreApproved ? `
        <div style="background: #ecfdf5; border: 2px solid #34d399; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
          <div style="color: #059669; font-weight: 600; font-size: 16px;">✅ Pre-Approved Buyer</div>
          <p style="color: #047857; margin: 8px 0 0 0; font-size: 14px;">This buyer has indicated they are pre-approved for financing</p>
        </div>` : ''}

        <div style="text-align: center; margin: 35px 0;">
          <a href="mailto:${inquirerEmail}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">Reply to ${inquirerName}</a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; text-align: center;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">This inquiry was sent through TerraNova Land Marketplace</p>
          <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">© 2025 TerraNova. All rights reserved.</p>
        </div>
      </div>
    </div>`;

    const textContent = `
New Inquiry from TerraNova Land Marketplace

CONTACT INFORMATION
Name: ${inquirerName}
Email: ${inquirerEmail}
${inquirerPhone ? `Phone: ${inquirerPhone}` : ''}
Preferred Contact: ${contactMethod === 'sms' ? 'SMS & Email' : 'Email'}
${contactTime ? `Best Contact Time: ${contactTime}` : ''}

${propertyTitle ? `
PROPERTY INTEREST
Property: ${propertyTitle}
${propertyLocation ? `Location: ${propertyLocation}` : ''}
` : ''}

MESSAGE
${message}

${isPreApproved ? 'Note: This buyer has indicated they are pre-approved for financing.' : ''}

Reply directly to this email to contact ${inquirerName}.
    `.trim();

    const msg = {
      to: agentEmail,
      from: {
        email: 'noreply@terranova.land',
        name: 'TerraNova Marketplace'
      },
      replyTo: inquirerEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${agentEmail}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error?.response) {
      console.error('SendGrid response:', error.response.body);
    }
    return false;
  }
}

export async function sendConfirmationEmail(
  inquirerEmail: string,
  inquirerName: string,
  agentName: string,
  estimatedResponseTime: number
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.error('Invalid SendGrid API key format. Key must start with "SG."');
    return false;
  }

  try {
    const subject = 'Your inquiry has been sent successfully';

    const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Message Sent!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">TerraNova Land Marketplace</p>
      </div>
      
      <div style="padding: 40px 30px; text-align: center;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
          <h2 style="color: #16a34a; margin: 0 0 15px 0; font-size: 24px;">Successfully Delivered</h2>
          <p style="color: #15803d; margin: 0; font-size: 16px;">Your message has been sent to ${agentName}</p>
        </div>

        <div style="background: #fefbff; border: 1px solid #e5e7ff; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
          <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">What happens next?</h3>
          <div style="text-align: left; max-width: 400px; margin: 0 auto;">
            <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
              <div style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">1</div>
              <div>
                <strong style="color: #475569;">Agent Notification</strong>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">${agentName} has been notified of your inquiry</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
              <div style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">2</div>
              <div>
                <strong style="color: #475569;">Expected Response</strong>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">You should hear back within ${estimatedResponseTime} hours</p>
              </div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 15px;">
              <div style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">3</div>
              <div>
                <strong style="color: #475569;">Direct Contact</strong>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">The agent will contact you directly via your preferred method</p>
              </div>
            </div>
          </div>
        </div>

        <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px;">Thank you for using TerraNova Land Marketplace</p>
      </div>
    </div>`;

    const textContent = `
Your inquiry has been sent successfully!

Your message has been delivered to ${agentName}.

What happens next:
1. Agent Notification - ${agentName} has been notified of your inquiry
2. Expected Response - You should hear back within ${estimatedResponseTime} hours
3. Direct Contact - The agent will contact you directly via your preferred method

Thank you for using TerraNova Land Marketplace.
    `.trim();

    const msg = {
      to: inquirerEmail,
      from: {
        email: 'noreply@terranova.land',
        name: 'TerraNova Marketplace'
      },
      subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Confirmation email sent successfully to ${inquirerEmail}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid confirmation email error:', error);
    return false;
  }
}