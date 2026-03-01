import type { Express, Request, Response } from "express";
import { z } from "zod";
import { sendEmail, sendSMS } from "./twilio";

// Validation schemas
const emailContactSchema = z.object({
  to: z.string().email(),
  from: z.string().email(),
  senderName: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  propertyId: z.number().optional(),
  agentId: z.number().optional()
});

const smsContactSchema = z.object({
  to: z.string().min(10), // Phone number
  from: z.string().min(10), // Phone number  
  senderName: z.string().min(1),
  message: z.string().min(1).max(160), // SMS character limit
  propertyId: z.number().optional(),
  agentId: z.number().optional()
});

export function setupContactRoutes(app: Express) {
  
  // Direct Email Sending Route
  app.post('/api/contact/email', async (req: Request, res: Response) => {
    try {
      const validatedData = emailContactSchema.parse(req.body);
      
      // Create professional email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">TerraNova Real Estate</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">New Contact Message</p>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px;">${validatedData.subject}</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #667eea; margin-top: 0;">Contact Information</h3>
              <p><strong>Name:</strong> ${validatedData.senderName}</p>
              <p><strong>Email:</strong> ${validatedData.from}</p>
              ${validatedData.propertyId ? `<p><strong>Property ID:</strong> #${validatedData.propertyId}</p>` : ''}
              ${validatedData.agentId ? `<p><strong>Agent ID:</strong> #${validatedData.agentId}</p>` : ''}
            </div>
            
            <div style="background: #ffffff; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Message</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${validatedData.message}</p>
            </div>
            
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                This message was sent through TerraNova Real Estate Platform
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email using Twilio SendGrid
      const emailResult = await sendEmail({
        to: validatedData.to,
        subject: validatedData.subject,
        html: emailContent,
        from: 'noreply@terranova.com' // Use a verified sender
      });

      if (emailResult.success) {
        res.json({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: emailResult.messageId 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: emailResult.error || 'Failed to send email' 
        });
      }

    } catch (error) {
      console.error('Email contact error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid email data provided',
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Internal server error while sending email' 
        });
      }
    }
  });

  // Direct SMS Sending Route
  app.post('/api/contact/sms', async (req: Request, res: Response) => {
    try {
      const validatedData = smsContactSchema.parse(req.body);
      
      // Create professional SMS content
      const smsContent = `${validatedData.message}

From: ${validatedData.senderName}
Reply: ${validatedData.from}

- TerraNova Real Estate`;

      // Send SMS using Twilio
      const smsResult = await sendSMS({
        to: validatedData.to,
        message: smsContent.substring(0, 160) // Ensure SMS limit
      });

      if (smsResult.success) {
        res.json({ 
          success: true, 
          message: 'SMS sent successfully',
          messageId: smsResult.messageId 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: smsResult.error || 'Failed to send SMS' 
        });
      }

    } catch (error) {
      console.error('SMS contact error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid SMS data provided',
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Internal server error while sending SMS' 
        });
      }
    }
  });

  // Health check route for contact system
  app.get('/api/contact/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Contact system is operational',
      services: {
        email: 'Available',
        sms: 'Available'
      },
      timestamp: new Date().toISOString()
    });
  });
}