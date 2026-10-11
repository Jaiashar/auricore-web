export function generateWaitlistConfirmationEmail(customerEmail) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Auricore - Luxury Reseller Platform</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');
            
            body {
                font-family: 'Lato', 'Arial', sans-serif;
                font-weight: 300;
                line-height: 1.6;
                color: #404040;
                margin: 0;
                padding: 0;
                background-color: #fafafa;
                font-size: 16px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .email-header {
                text-align: center;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #0093FF 0%, #0573CC 100%);
                padding: 40px 20px;
                border-radius: 12px 12px 0 0;
            }
            .logo {
                color: white;
                font-size: 32px;
                font-weight: 500;
                margin: 0;
                letter-spacing: 0.1em;
            }
            .email-content {
                background-color: #ffffff;
                padding: 40px 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            h1 {
                color: #262626;
                margin-top: 0;
                margin-bottom: 24px;
                font-size: 28px;
                font-weight: 300;
                text-align: center;
            }
            h2 {
                color: #262626;
                font-size: 20px;
                font-weight: 300;
                margin-top: 0;
                margin-bottom: 16px;
            }
            h3 {
                color: #262626;
                font-size: 18px;
                font-weight: 300;
                margin-top: 0;
                margin-bottom: 12px;
            }
            p {
                margin-bottom: 16px;
                color: #525252;
                font-weight: 300;
            }
            li {
                font-size: 16px;
            }
            .customer-info {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 8px;
            }
            .customer-info p {
                margin: 8px 0;
                font-size: 16px;
            }
            .customer-info strong {
                color: #262626;
                font-weight: 300;
            }
            .waitlist-meta {
                background-color: #fafafa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 24px;
                text-align: center;
            }
            .position-number {
                font-size: 48px;
                font-weight: 500;
                color: #0093FF;
                margin: 10px 0;
            }
            .features-section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 8px;
            }
            .features-list {
                margin: 0;
                padding-left: 0;
                list-style: none;
            }
            .features-list li {
                margin-bottom: 12px;
                color: #525252;
                padding-left: 20px;
                position: relative;
            }
            .features-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #0093FF;
                font-weight: 500;
            }
            .features-list strong {
                color: #262626;
                font-weight: 300;
            }
            .next-steps {
                margin-top: 30px;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 8px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #0093FF 0%, #0573CC 100%);
                color: white !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 300;
                text-align: center;
                margin-top: 10px;
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 147, 255, 0.3);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                color: #737373;
                font-weight: 300;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .email-content {
                    padding: 25px 15px;
                }
                .categories-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .position-number {
                    font-size: 36px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-header">
                <h1 class="logo">AURICORE</h1>
            </div>
            
            <div class="email-content">
                <h1>Welcome to the Future of Luxury Reselling</h1>
                
                <p style="text-align: center; font-size: 18px; color: #525252;">Thank you for joining our exclusive waitlist! You're now part of a select group of luxury resellers who will revolutionize their business with AI-powered insights.</p>
                
                <div class="customer-info">
                    <h2>Your Registration Details</h2>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Registered:</strong> ${currentDate}</p>
                </div>
                
                <div class="features-section">
                    <h2>What You'll Get Access To</h2>
                    <ul class="features-list">
                        <li><strong>Smart Product Discovery:</strong> AI-powered pricing from millions of luxury transactions</li>
                        <li><strong>Comprehensive Analytics:</strong> Track volatility, liquidity scores, and risk assessments</li>
                        <li><strong>Transaction History:</strong> Complete profit analysis and market performance tracking</li>
                        <li><strong>Early Access Pricing:</strong> Exclusive launch discounts for waitlist members</li>
                    </ul>
                </div> 
              
                <div class="next-steps">
                    <h2>What Happens Next?</h2>
                    <ul>
                        <li>Keep an eye on your inbox for exclusive previews and updates</li>
                        <li>Start thinking about which luxury items you'd like to analyze first</li>
                    </ul>
               </div>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://www.auricore.ai" class="cta-button">Visit Our Website</a>
                </p>
                
                <div class="footer">
                    <p>Questions? Simply reply to this email – we'd love to hear from you!</p>
                    <p>© 2025 Auricore. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Internal notification email for new waitlist signups
export function generateInternalWaitlistNotificationEmail(customerEmail, signupSource = "auricore.ai") {
    const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Waitlist Signup - Auricore</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');
            
            body {
                font-family: 'Lato', 'Arial', sans-serif;
                font-weight: 300;
                line-height: 1.6;
                color: #404040;
                margin: 0;
                padding: 0;
                background-color: #fafafa;
            }
            .container {
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
            }
            .email-header {
                text-align: center;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #0093FF 0%, #0573CC 100%);
                padding: 40px 20px;
                border-radius: 12px 12px 0 0;
            }
            .logo {
                color: white;
                font-size: 32px;
                font-weight: 500;
                margin: 0;
                letter-spacing: 0.1em;
            }
            .email-content {
                background-color: #ffffff;
                padding: 40px 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            h1 {
                color: #262626;
                margin-top: 0;
                margin-bottom: 24px;
                font-size: 28px;
                font-weight: 300;
                text-align: center;
            }
            h2 {
                color: #262626;
                font-size: 20px;
                font-weight: 300;
                margin-top: 0;
                margin-bottom: 16px;
            }
            h3 {
                color: #262626;
                font-size: 18px;
                font-weight: 300;
                margin-top: 0;
                margin-bottom: 12px;
            }
            p {
                margin-bottom: 16px;
                color: #525252;
                font-size: 16px;
                font-weight: 300;
            }
            li {
                font-size: 16px;
            }
            .customer-info {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 8px;
            }
            .customer-info p {
                margin: 8px 0;
                font-size: 16px;
            }
            .customer-info strong {
                color: #262626;
                font-weight: 300;
            }
            .signup-meta {
                background-color: #fafafa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 24px;
            }
            .signup-meta p {
                margin: 8px 0;
                font-size: 16px;
                color: #525252;
            }
            .signup-meta strong {
                color: #262626;
                font-weight: 300;
            }
            .footer-note {
                text-align: center;
                margin-top: 20px;
                color: #737373;
                font-size: 16px;
                font-weight: 300;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .email-content {
                    padding: 25px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-header">
                <h1 class="logo">AURICORE</h1>
            </div>
            
            <div class="email-content">
                <h1>New Waitlist Signup</h1>
                
                <div class="signup-meta">
                    <p><strong>Signed up:</strong> ${currentDate}</p>
                    ${signupSource ? `<p><strong>Source:</strong> ${signupSource}</p>` : ''}
                </div>
                
                <div class="customer-info">
                    <h2>New User Information</h2>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                </div>
                
                <p class="footer-note">
                    This notification was automatically generated.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}
