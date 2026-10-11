import nodemailer from 'nodemailer';


/**
 * Generates the HTML content for the internal team notification email
 * With improved styling and data presentation
 */
export function generateInternalNotificationEmail(customerInfo, sessionId, items) {
    // Calculate total values properly taking into account offer ranges for all items
    const totalItems = items.length;
    
    // Calculate total market value (only for internal team viewing)
    const totalMarketValue = items.reduce((sum, item) => {
        // Use marketValue directly if available
        if (item.marketValue && typeof item.marketValue === 'number') {
            return sum + item.marketValue;
        }
        // If market value range is available, use the middle value
        if (item.marketValueRange) {
            return sum + ((item.marketValueRange.low + item.marketValueRange.high) / 2);
        }
        // If we have raw pricing data, extract from there
        if (item.raw?.pricingData?.marketValue) {
            return sum + item.raw.pricingData.marketValue;
        }
        return sum;
    }, 0);
    
    // Format total market value for display
    const formattedMarketValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(totalMarketValue);

    // Calculate the estimated offer range consistently
    let totalLowerOffer = 0;
    let totalUpperOffer = 0;
    
    items.forEach(item => {
        // Check for explicit offer amount range first
        if (item.offerAmountRange) {
            totalLowerOffer += item.offerAmountRange.low;
            totalUpperOffer += item.offerAmountRange.high;
        } 
        // Check raw pricing data next
        else if (item.raw?.pricingData?.offerAmountRange) {
            totalLowerOffer += item.raw.pricingData.offerAmountRange.low;
            totalUpperOffer += item.raw.pricingData.offerAmountRange.high;
        }
        // Fall back to percentage of market value
        else {
            const itemMarketValue = item.marketValue || 
                ((item.marketValueRange?.low + item.marketValueRange?.high) / 2) || 
                item.raw?.pricingData?.marketValue || 0;
                
            totalLowerOffer += itemMarketValue * 0.6; // 60% of market value
            totalUpperOffer += itemMarketValue * 0.7; // 70% of market value
        }
    });

    const formattedLowerOffer = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(totalLowerOffer);

    const formattedUpperOffer = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(totalUpperOffer);

    // Generate item rows with better formatting, prioritizing match data
    const itemRows = items.map(item => {
        // Extract data with proper order of precedence
        const brand = item.match?.brand ||
            item.match?.structuredAttributes?.brand ||
            item.cleaned?.brand ||
            item.raw?.dynamicFields?.brand || '';

        const model = item.match?.model ||
            item.match?.structuredAttributes?.model ||
            item.match?.modelName ||
            item.match?.structuredAttributes?.modelName ||
            item.cleaned?.model ||
            item.raw?.dynamicFields?.model ||
            item.raw?.dynamicFields?.modelName || '';

        const category = item.match?.category ||
            item.cleaned?.category ||
            item.raw?.category || '';

        const condition = item.match?.condition ||
            item.match?.structuredAttributes?.condition ||
            item.raw?.condition ||
            item.raw?.dynamicFields?.condition || '';

        // Format confidence as a readable value
        let confidenceDisplay = 'N/A';
        if (item.raw?.pricingData?.confidence) {
            confidenceDisplay = item.raw.pricingData.confidence;
        } else if (item.cleaned?.confidence) {
            const confidenceValue = parseFloat(item.cleaned.confidence);
            if (!isNaN(confidenceValue)) {
                confidenceDisplay = (confidenceValue * 100).toFixed(0) + '%';
            } else {
                confidenceDisplay = item.cleaned.confidence;
            }
        }

        // Format market value - only for internal team view
        const marketValue = item.marketValue ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(item.marketValue) : 'N/A';

        // Create a clean item title - First try match title
        let itemTitle = item.match?.title || `${brand} ${model}`.trim();

        // Remove duplicates like "Goyard Goyard"
        itemTitle = itemTitle.replace(/(\w+)\s+\1/gi, '$1');

        // Remove "in Not specified" and similar phrases
        itemTitle = itemTitle.replace(/\s+in\s+not\s+specified/gi, '');

        return `
          <tr>
            <td>${itemTitle}</td>
            <td>${category}</td>
            <td>${condition}</td>
            <td>${confidenceDisplay}</td>
            <td class="item-value">${marketValue}</td>
          </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Auricore Application Submitted</title>
        <style>
            body {
                font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f7fafc;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .email-header {
                text-align: center;
                margin-bottom: 30px;
                background-color: #2b6cb0;
                padding: 20px;
                border-radius: 12px 12px 0 0;
            }
            .logo {
                max-width: 180px;
                height: auto;
                margin: 0 auto;
                display: block;
            }
            .email-content {
                background-color: #ffffff;
                padding: 40px 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            h1 {
                color: #2b6cb0;
                margin-top: 0;
                margin-bottom: 24px;
                font-size: 26px;
                font-weight: 700;
            }
            p {
                margin-bottom: 16px;
                color: #4a5568;
            }
            .customer-info {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #ebf8ff;
                border-left: 4px solid #4299e1;
                border-radius: 4px;
            }
            .customer-info h2 {
                margin-top: 0;
                color: #2c5282;
                font-size: 20px;
                font-weight: 600;
            }
            .customer-info p {
                margin: 8px 0;
                font-size: 15px;
            }
            .customer-info strong {
                color: #2d3748;
            }
            .application-meta {
                background-color: #f9fafb;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 24px;
                display: flex;
                flex-wrap: wrap;
            }
            .application-meta p {
                margin: 0 24px 0 0;
                font-size: 15px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 15px;
            }
            th {
                text-align: left;
                padding: 12px 15px;
                background-color: #edf2f7;
                border-bottom: 2px solid #cbd5e0;
                color: #2d3748;
                font-weight: 600;
            }
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #e2e8f0;
                color: #4a5568;
            }
            tr:nth-child(even) {
                background-color: #f7fafc;
            }
            .item-value {
                text-align: right;
                font-weight: 500;
                color: #2d3748;
            }
            .total-row {
                background-color: #edf2f7 !important;
                font-weight: bold;
                color: #2d3748;
            }
            .total-row td {
                padding: 15px;
            }
            .review-button {
                display: inline-block;
                background-color: #3182ce;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                text-align: center;
            }
            .review-button:hover {
                background-color: #2c5282;
            }
            .next-steps {
                margin-top: 30px;
                padding: 20px;
                background-color: #fffaf0;
                border-left: 4px solid #ed8936;
                border-radius: 4px;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .email-content {
                    padding: 25px 15px;
                }
                table {
                    font-size: 14px;
                }
                td, th {
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-header">
                <img src="https://www.auricore.ai/logo-white.png" alt="Auricore Logo" class="logo" />
            </div>
            
            <div class="email-content">
                <h1>🔔 New Application Submitted</h1>
                
                <div class="application-meta">
                    <p><strong>Session ID:</strong> ${sessionId}</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="customer-info">
                    <h2>Customer Information</h2>
                    <p><strong>Name:</strong> ${customerInfo.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> ${customerInfo.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${customerInfo.phone || 'Not provided'}</p>
                    <p><strong>Address:</strong> ${customerInfo.address || 'Not provided'}</p>
                </div>
                
                <h2 style="font-size: 20px; color: #2b6cb0; margin-bottom: 16px;">Items Summary</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Condition</th>
                            <th>Confidence</th>
                            <th>Est. Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                        <tr class="total-row">
                            <td colspan="4">Total Estimated Value</td>
                            <td class="item-value">${formattedMarketValue}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="4">Potential Funding Amount (60-70%)</td>
                            <td class="item-value">${formattedLowerOffer} - ${formattedUpperOffer}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="next-steps">
                    <p style="margin-top: 0;"><strong>Next Steps:</strong> This application needs manual review. Please verify item details and arrange authentication.</p>
                    <p style="margin-bottom: 0;">For high-value items or unusual configurations, consider scheduling an expert appraisal.</p>
                </div>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://admin.auricore.ai/applications/${sessionId}" class="review-button">Review in Admin Panel</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generates the HTML content for the customer confirmation email.
 * Now with customization based on customer use case.
 */
export function generateCustomerConfirmationEmail(customerName, customerEmail, sessionId, items = [], useCase = 'loan') {
  const totalItems = items.length;

  // Calculate total market value 
  let totalMarketValue = 0;
  
  items.forEach(item => {
      // Use marketValue if available
      if (item.marketValue && typeof item.marketValue === 'number') {
          totalMarketValue += item.marketValue;
      }
      // If market value range is available, use the middle value
      else if (item.marketValueRange) {
          totalMarketValue += ((item.marketValueRange.low + item.marketValueRange.high) / 2);
      }
      // Check if data is in raw pricing
      else if (item.raw?.pricingData?.marketValue) {
          totalMarketValue += item.raw.pricingData.marketValue;
      }
  });
  
  // Format market value for display
  const formattedMarketValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
  }).format(totalMarketValue);

  // Calculate total funding amount by summing each item's offerAmountRange correctly
  let estimatedLowerOffer = 0;
  let estimatedUpperOffer = 0;
  
  items.forEach(item => {
      // Check for explicit offer amount range first
      if (item.offerAmountRange) {
          estimatedLowerOffer += item.offerAmountRange.low;
          estimatedUpperOffer += item.offerAmountRange.high;
      } 
      // Check raw pricing data next
      else if (item.raw?.pricingData?.offerAmountRange) {
          estimatedLowerOffer += item.raw.pricingData.offerAmountRange.low;
          estimatedUpperOffer += item.raw.pricingData.offerAmountRange.high;
      }
      // Fall back to disbursedAmount or percentage calculation
      else {
          const baseValue = item.disbursedAmount || 
              item.raw?.pricingData?.disbursedAmount ||
              (item.marketValue || 
               ((item.marketValueRange?.low + item.marketValueRange?.high) / 2) || 
               item.raw?.pricingData?.marketValue || 0);
               
          estimatedLowerOffer += baseValue * 0.6; // 60% of base value
          estimatedUpperOffer += baseValue * 0.7; // 70% of base value
      }
  });

  const formattedLowerOffer = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
  }).format(estimatedLowerOffer);

  const formattedUpperOffer = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
  }).format(estimatedUpperOffer);

  // Build HTML for each item with email-client compatible table-based layout
  const itemListHTML = items.map(item => {
      // Extract data with proper order of precedence
      const brand = (item.match && item.match.brand) ||
          (item.match && item.match.structuredAttributes && item.match.structuredAttributes.brand) ||
          (item.cleaned && item.cleaned.brand) ||
          (item.raw && item.raw.dynamicFields && item.raw.dynamicFields.brand) || '';

      const model = (item.match && item.match.model) ||
          (item.match && item.match.structuredAttributes && item.match.structuredAttributes.model) ||
          (item.match && item.match.title) ||
          (item.cleaned && item.cleaned.model) ||
          (item.raw && item.raw.dynamicFields && (item.raw.dynamicFields.model || item.raw.dynamicFields.modelName)) || '';

      const category = (item.match && item.match.category) ||
          (item.raw && item.raw.category) || '';

      const condition = (item.match && item.match.condition) ||
          (item.match && item.match.structuredAttributes && item.match.structuredAttributes.condition) ||
          (item.raw && item.raw.condition) ||
          (item.raw && item.raw.dynamicFields && item.raw.dynamicFields.condition) || '';

      // Clean up the title
      let itemTitle = (item.match && item.match.title) || `${brand} ${model}`.trim();
      itemTitle = itemTitle.replace(/(\w+)\s+\1/gi, '$1');
      itemTitle = itemTitle.replace(/\s+in\s+not\s+specified/gi, '');

      // Check if it's a precious metal to apply higher percentages
      const isPreciousMetal = item.category === 'preciousMetals' || 
                              (item.raw && item.raw.category === 'preciousMetals') ||
                              typeof item.metalType !== 'undefined' ||
                              typeof item.raw?.pricingData?.metalType !== 'undefined';

      // Format the offer amount for the item - now using consistent logic
      let itemOfferLow = 0;
      let itemOfferHigh = 0;
      
      // Get the appropriate offer range values
      if (item.offerAmountRange) {
          itemOfferLow = item.offerAmountRange.low;
          itemOfferHigh = item.offerAmountRange.high;
      } else if (item.raw?.pricingData?.offerAmountRange) {
          itemOfferLow = item.raw.pricingData.offerAmountRange.low;
          itemOfferHigh = item.raw.pricingData.offerAmountRange.high;
      } else {
          // Fall back to calculating from market value
          const baseValue = item.disbursedAmount || 
              item.raw?.pricingData?.disbursedAmount ||
              (item.marketValue || item.raw?.pricingData?.marketValue || 0);
                               
          if (isPreciousMetal) {
              itemOfferLow = baseValue * 0.7;  // 70% for precious metals
              itemOfferHigh = baseValue * 0.8; // 80% for precious metals
          } else {
              itemOfferLow = baseValue * 0.6;  // 60% for regular items
              itemOfferHigh = baseValue * 0.7; // 70% for regular items
          }
      }
      
      // Get item market value
      const itemMarketValue = item.marketValue || 
          ((item.marketValueRange?.low + item.marketValueRange?.high) / 2) || 
          item.raw?.pricingData?.marketValue || 0;
      
      const formattedItemMarketValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
      }).format(itemMarketValue);
      
      const itemOffer = `${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
      }).format(itemOfferLow)} - ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
      }).format(itemOfferHigh)}`;

      // Use a colored box with item initial instead of trying to load external images
      // This ensures consistent display across all email clients
      const itemInitial = itemTitle.charAt(0).toUpperCase();

      return `
    <tr>
      <td style="padding: 16px; vertical-align: middle; border-bottom: 1px solid #e5e7eb;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="70" style="vertical-align: middle;">
              <!-- Item image replaced with colored initial box for reliability -->
              <table cellpadding="0" cellspacing="0" border="0" width="60" height="60" style="min-width: 60px; border-radius: 6px; background-color: #0f3c78; margin-right: 16px;">
                <tr>
                  <td align="center" valign="middle" style="text-align: center; vertical-align: middle;">
                    <div style="font-family: Arial, sans-serif; font-size: 24px; color: white; font-weight: bold;">${itemInitial}</div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: middle;">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 16px; font-family: Arial, sans-serif;">${itemTitle}</div>
              <div style="font-size: 14px; color: #6b7280; font-family: Arial, sans-serif;">
                ${isPreciousMetal ? `Purity: ${item.raw?.dynamicFields?.purity || 'N/A'}` : `${[category, condition].filter(Boolean).join(', ')}`}
              </div>
              <div style="font-size: 14px; color: #374151; margin-top: 8px; font-family: Arial, sans-serif;">
                <span style="font-weight: 500; color: #4b5563;">Est. Market Value: ${formattedItemMarketValue}</span>
              </div>
              <div style="font-size: 14px; color: #374151; margin-top: 4px; font-family: Arial, sans-serif;">
                <span style="font-weight: 500; color: #047857;">Auricore Offer: ${itemOffer}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');

  // Content customization based on use case
  let headerTitle = 'Your Items Have Been Valued!';
  let introText = 'Great news! We\'ve reviewed your items and prepared a preliminary valuation.';
  let secondaryText = 'Your luxury assets have excellent potential for unlocking liquidity while remaining in your possession.';
  let highlightBoxTitle = 'Application Summary';
  let highlightBoxOffer = `
  <p><strong>Estimated Market Value:</strong> ${formattedMarketValue}</p>
  <p><strong>Estimated Funding Amount:</strong> ${formattedLowerOffer} - ${formattedUpperOffer}</p>
`;
  
  // Customize promotional content based on use case
  let promotionalContent = '';
  let nextStepsContent = '';
  let emailSubject = 'Your Auricore Valuation';
  
  if (useCase === 'loan' || useCase === 'auricore' || !useCase) {
    // Loan use case changes
    nextStepsContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-top: 32px;">
          <tr>
            <td style="padding: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; font-weight: 600; color: #0f3c78; margin-top: 0; margin-bottom: 16px; font-family: Arial, sans-serif;">What Happens Next?</h2>
                  </td>
                </tr>
                
                <!-- Step 1 -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="30" valign="top">
                          <div style="width: 28px; height: 28px; background-color: #0f3c78; border-radius: 50%; color: white; font-weight: 600; font-size: 14px; text-align: center; line-height: 28px; margin-right: 16px; font-family: Arial, sans-serif;">1</div>
                        </td>
                        <td valign="top" style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5;">
                          Our authentication specialists will contact you within 24 hours to schedule verification.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Step 2 -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="30" valign="top">
                          <div style="width: 28px; height: 28px; background-color: #0f3c78; border-radius: 50%; color: white; font-weight: 600; font-size: 14px; text-align: center; line-height: 28px; margin-right: 16px; font-family: Arial, sans-serif;">2</div>
                        </td>
                        <td valign="top" style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5;">
                          Once authenticated, you'll receive your final offer within 48 hours.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Step 3 -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="30" valign="top">
                          <div style="width: 28px; height: 28px; background-color: #0f3c78; border-radius: 50%; color: white; font-weight: 600; font-size: 14px; text-align: center; line-height: 28px; margin-right: 16px; font-family: Arial, sans-serif;">3</div>
                        </td>
                        <td valign="top" style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5;">
                          After accepting, funding can be in your account in as little as one business day.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-top: 24px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #0f3c78; border-radius: 6px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Learn More About Our Process</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      
} else if (useCase === 'price') {
    // Price use case changes
    promotionalContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ebf7ff; border-radius: 8px; margin: 32px 0;">
          <tr>
            <td style="padding: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; font-weight: 600; color: #0f3c78; margin-top: 0; margin-bottom: 12px; font-family: Arial, sans-serif;">Need Cash But Want To Keep Your Items?</h2>
                  </td>
                </tr>
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5; padding-bottom: 16px;">
                    With Auricore's asset-backed loans, you can:
                    <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Get up to 70% of your items' value in cash</li>
                      <li style="margin-bottom: 8px;">Keep ownership of your valuable items</li>
                      <li style="margin-bottom: 8px;">Enjoy competitive rates and flexible terms</li>
                      <li>Receive funds in as little as 24 hours</li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #0f3c78; border-radius: 6px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Learn About Our Loans</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      
    nextStepsContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-top: 32px;">
          <tr>
            <td style="padding: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; font-weight: 600; color: #0f3c78; margin-top: 0; margin-bottom: 16px; font-family: Arial, sans-serif;">What You Can Do Next</h2>
                  </td>
                </tr>
                
                <tr>
                  <td valign="top" style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5; padding-bottom: 16px;">
                    Your valuation is based on current market data and the information you provided. If you're considering selling, consigning, or using your items as collateral for a loan, our experts can provide more detailed advice.
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #0f3c78; border-radius: 6px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Contact Our Experts</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      
} else if (useCase === 'resell') {
    // Resell use case changes
    promotionalContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ebf7ff; border-radius: 8px; margin: 32px 0;">
          <tr>
            <td style="padding: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; font-weight: 600; color: #0f3c78; margin-top: 0; margin-bottom: 12px; font-family: Arial, sans-serif;">Have You Considered Borrowing Instead?</h2>
                  </td>
                </tr>
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5; padding-bottom: 16px;">
                    When you sell, you lose your items forever. With Auricore's asset-backed loans, you can get cash now while keeping ownership of your valuable items.
                  </td>
                </tr>
                
                <!-- Comparison Table -->
                <tr>
                  <td style="padding: 16px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: separate; border-spacing: 0; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb;">
                      <tr style="background-color: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; font-family: Arial, sans-serif; font-weight: 600; border-bottom: 1px solid #e5e7eb; width: 33%;"></th>
                        <th style="padding: 12px; text-align: center; font-family: Arial, sans-serif; font-weight: 600; border-bottom: 1px solid #e5e7eb; color: #0f3c78; width: 33%;">Reselling</th>
                        <th style="padding: 12px; text-align: center; font-family: Arial, sans-serif; font-weight: 600; border-bottom: 1px solid #e5e7eb; background-color: #dbeafe; color: #0f3c78; width: 33%;">Auricore Loan</th>
                      </tr>
                      <tr>
                        <td style="padding: 12px; text-align: left; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">Keep your items</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">❌</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb; background-color: #f0f9ff;">✅</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; text-align: left; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">Get immediate cash</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">✅</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb; background-color: #f0f9ff;">✅</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; text-align: left; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">Benefit from future appreciation</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb;">❌</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; border-bottom: 1px solid #e5e7eb; background-color: #f0f9ff;">✅</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px; text-align: left; font-family: Arial, sans-serif;">Time to get funds</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif;">Varies</td>
                        <td style="padding: 12px; text-align: center; font-family: Arial, sans-serif; background-color: #f0f9ff;">As fast as 24 hours</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #0f3c78; border-radius: 6px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Compare Options</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
      
    nextStepsContent = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-top: 32px;">
          <tr>
            <td style="padding: 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="font-size: 18px; font-weight: 600; color: #0f3c78; margin-top: 0; margin-bottom: 16px; font-family: Arial, sans-serif;">Resale Options</h2>
                  </td>
                </tr>
                
                <tr>
                  <td valign="top" style="font-family: Arial, sans-serif; font-size: 15px; color: #4a5568; line-height: 1.5; padding-bottom: 16px;">
                    While reselling can be profitable, it often comes with challenges like finding buyers, negotiating prices, and dealing with fees. Before selling your items, consider all your options to maximize their value.
                  </td>
                </tr>
                
                <!-- CTA Buttons -->
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #047857; border-radius: 6px; margin-right: 16px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Selling Guide</a>
                        </td>
                        <td width="16"></td>
                        <td align="center" style="background-color: #0f3c78; border-radius: 6px;">
                          <a href="https://www.auricore.ai" style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif;">Explore Loan Options</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
}

  // Always show both market value and offer amount in the highlight box
  highlightBoxOffer = `
      <p><strong>Estimated Market Value:</strong> ${formattedMarketValue}</p>
      <p><strong>Estimated Funding Amount:</strong> ${formattedLowerOffer} - ${formattedUpperOffer}</p>
  `;

  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailSubject}</title>
      <style>
          /* Base styles with fallbacks */
          body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.5;
              color: #374151;
              background-color: #f9fafb;
              -webkit-font-smoothing: antialiased;
          }
          
          /* Responsive container */
          .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 0;
              background-color: #ffffff;
          }
          
          /* Improved header with embedded logo */
          .email-header {
              background-color: #0f3c78;
              background-image: linear-gradient(135deg, #0f3c78 0%, #1a56db 100%);
              padding: 28px 0;
              text-align: center;
              border-radius: 0;
          }
          
          /* Main content area */
          .email-content {
              padding: 32px 24px;
              background-color: #ffffff;
          }
          
          /* Typography */
          h1 {
              color: #111827;
              font-size: 24px;
              font-weight: 700;
              margin-top: 0;
              margin-bottom: 24px;
              line-height: 1.2;
          }
          
          p {
              margin-top: 0;
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.5;
          }
          
          /* Highlight box */
          .highlight-box {
              background-color: #f0f9ff;
              border-left: 4px solid #0ea5e9;
              border-radius: 6px;
              padding: 20px;
              margin-bottom: 24px;
          }
          
          .highlight-box p {
              margin: 8px 0;
              font-size: 15px;
          }
          
          .highlight-box strong {
              color: #0c4a6e;
              font-weight: 600;
          }
          
          /* Item list table */
          .items-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 32px;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
              border-radius: 8px;
              overflow: hidden;
          }
          
          /* Steps section */
          .steps-section {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 24px;
              margin-top: 32px;
          }
          
          .steps-section h2 {
              font-size: 18px;
              font-weight: 600;
              color: #0f3c78;
              margin-top: 0;
              margin-bottom: 16px;
          }
          
          .step {
              display: flex;
              margin-bottom: 16px;
              align-items: flex-start;
          }
          
          .step-number {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              background-color: #0f3c78;
              color: white;
              border-radius: 50%;
              font-weight: 600;
              font-size: 14px;
              margin-right: 16px;
              flex-shrink: 0;
          }
          
          .step-content {
              flex: 1;
          }
          
          /* Enhanced buttons */
          .button {
              display: inline-block;
              background-color: #0f3c78;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              margin-top: 8px;
              transition: background-color 0.2s;
          }
          
          .button-primary {
              background-color: #0f3c78;
          }
          
          .button-secondary {
              background-color: #059669;
          }
          
          .button-center {
              display: block;
              width: 100%;
              max-width: 300px;
              margin: 24px auto 0;
          }
          
          /* Footer */
          .email-footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              padding: 24px;
              background-color: #f9fafb;
          }
          
          .email-footer p {
              margin: 4px 0;
              font-size: 14px;
          }
          
          /* Social links */
          .social-links {
              margin-top: 16px;
              margin-bottom: 16px;
          }
          
          .social-icon {
              display: inline-block;
              margin: 0 8px;
          }
          
          /* Responsive adjustments */
          @media (max-width: 600px) {
              .email-content {
                  padding: 24px 16px;
              }
              
              h1 {
                  font-size: 22px;
              }
              
              .button {
                  width: 100%;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="email-header" style="background-color: #0f3c78; background-image: linear-gradient(135deg, #0f3c78 0%, #1a56db 100%); padding: 28px 0; text-align: center; border-radius: 0;">
              <!-- Simple text logo as most reliable solution for all email clients -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%">
                <tr>
                  <td align="center">
                    <div style="font-family: 'Inter', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                      AURICORE
                    </div>
                    <div style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #ffffff; opacity: 0.8; margin-top: 4px;">
                      Asset-Backed Lending
                    </div>
                  </td>
                </tr>
              </table>
          </div>
          
          <div class="email-content">
              <h1>${headerTitle}</h1>
              
              <p>Hello ${customerName},</p>
              
              <p>${introText} ${secondaryText}</p>
              
              <div class="highlight-box">
                  <p><strong>Application ID:</strong> ${sessionId}</p>
                  <p><strong>Items Submitted:</strong> ${totalItems}</p>
                  ${highlightBoxOffer}
                  <p style="font-size: 13px; margin-top: 8px; color: #64748b; font-style: italic;">Final offer subject to authentication</p>
              </div>
              
              <!-- Email-client compatible table structure -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: separate; border-spacing: 0; margin-bottom: 32px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                  <tbody>
                      ${itemListHTML}
                  </tbody>
              </table>
              
              <!-- Email-client compatible centered button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #059669; border-radius: 6px;">
                            <a href="https://www.auricore.ai/confirmation?applicationId=${sessionId}&email=${encodeURIComponent(customerEmail)}"
                             style="display: inline-block; color: white; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; font-family: Arial, sans-serif;">
                            View Complete Valuation
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Promotional content based on use case -->
              ${promotionalContent}
              
              <!-- Next steps content based on use case -->
              ${nextStepsContent}
          </div>
          
          <div class="email-footer">
              <p style="margin-bottom: 2px;">&copy; 2025 Auricore. All rights reserved.</p>
              <p style="margin-top: 2px;">20 Broad St, New York, NY 10005</p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                  This email was sent to you because you submitted items for valuation with Auricore.
                </p>
          </div>
      </div>
  </body>
  </html>
  `;
  }

/**
 * Simplified function for sending emails
 */
export async function sendEmail(to, subject, htmlContent) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,           // mail.privateemail.com
      port: Number(process.env.EMAIL_PORT),   // 465 or 587
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,         // info@auricore.ai
        pass: process.env.EMAIL_PASS          // your Private Email password
      }
    })
  
    const mailOptions = {
      from: 'Auricore <info@auricore.ai>',
      to,
      subject,
      html: htmlContent,
    }
  
    return transporter.sendMail(mailOptions)
      .then(info => ({ success: true, messageId: info.messageId }))
      .catch(err  => ({ success: false, error: err.message }))
}

/**
 * Confirmation email sent to a new lender.
 */
export function generateLenderConfirmationEmail(firstName, lastName, lenderEmail, commitmentAmount, isRateBoosted = false) {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(commitmentAmount);
    
    // Different return rates based on whether they have the boost
    const returnRate = isRateBoosted ? "12–15%" : "8–10%";
    
    // Different subject line for boosted accounts
    const emailSubject = isRateBoosted ? 
      "Welcome to Auricore Premium Lending" : 
      "Welcome to Auricore Lending";
  
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${emailSubject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background-color: #f9fafb;
          color: #374151;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .email-header {
          background-color: #0f3c78;
          padding: 24px;
          text-align: center;
        }
        .email-header .logo-text {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .email-content {
          padding: 32px 24px;
        }
        h1 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-top: 0;
          margin-bottom: 16px;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        .highlight-box {
          background-color: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .highlight-box p {
          margin: 8px 0;
          font-size: 15px;
        }
        .premium-badge {
          display: inline-block;
          background-color: #fef3c7;
          color: #92400e;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          margin-left: 8px;
        }
        .button-center {
          text-align: center;
          margin-top: 24px;
        }
        .button {
          display: inline-block;
          background-color: #059669;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
        }
        .email-footer {
          padding: 24px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          background-color: #f9fafb;
        }
        @media (max-width: 600px) {
          .email-content { padding: 24px 16px; }
          h1 { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-header">
          <div class="logo-text">AURICORE</div>
          ${isRateBoosted ? '<div style="color: #FFD700; margin-top: 8px; font-size: 16px;">Premium Investor</div>' : ''}
        </div>
        <div class="email-content">
          <h1>Welcome, Lender! ${isRateBoosted ? '<span class="premium-badge">PREMIUM</span>' : ''}</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for joining Auricore's lending platform. We've received your commitment of:</p>
          <div class="highlight-box">
            <p><strong>${formattedAmount}</strong></p>
            ${isRateBoosted ? '<p style="color: #92400e; font-weight: 600;">Your rate boost has been applied!</p>' : ''}
          </div>
          <p>We'll be in touch shortly with instructions on how to deploy your funds and start earning <strong>${returnRate}</strong> fixed annual returns, backed by real, physical assets.</p>
          <div class="button-center">
            <a href="https://www.auricore.ai/lenders/how-it-works" class="button">Learn About Next Steps</a>
          </div>
        </div>
        <div class="email-footer">
          &copy; 2025 Auricore. All rights reserved.<br/>
          <a href="https://www.auricore.ai">auricore.ai</a>
        </div>
      </div>
    </body>
    </html>
    `;
}
  
/**
 * Internal notification to Auricore when a lender signs up.
 */
export function generateInternalLenderNotificationEmail(firstName, lastName, lenderEmail, commitmentAmount, isRateBoosted = false, promoCode) {
const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
}).format(commitmentAmount);
const timestamp = new Date().toLocaleString();

// Return rate info
const standardRate = "8-10%";
const boostedRate = "12-15%";
const appliedRate = isRateBoosted ? boostedRate : standardRate;

return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Lender Signup</title>
    <style>
    body {
        margin: 0;
        padding: 0;
        font-family: 'Arial', sans-serif;
        background-color: #f7fafc;
        color: #333333;
    }
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    .email-header {
        background-color: ${isRateBoosted ? '#92400e' : '#2b6cb0'};
        padding: 20px;
        text-align: center;
        color: #ffffff;
        border-radius: 8px 8px 0 0;
    }
    .email-header h1 {
        margin: 0;
        font-size: 24px;
    }
    .email-content {
        background-color: #ffffff;
        padding: 30px;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
    }
    th, td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
        font-size: 15px;
    }
    th {
        background-color: #edf2f7;
        font-weight: 600;
        color: #2d3748;
    }
    .premium-badge {
        display: inline-block;
        background-color: #fffbeb;
        color: #92400e;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
    }
    .footer {
        margin-top: 24px;
        font-size: 14px;
        color: #6b7280;
        text-align: center;
    }
    @media (max-width: 600px) {
        .container { padding: 10px; }
        .email-content { padding: 20px; }
    }
    </style>
</head>
<body>
    <div class="container">
    <div class="email-header">
        <h1>${isRateBoosted ? '🔥 New Premium Lender Signup' : '🚀 New Lender Signup'}</h1>
    </div>
    <div class="email-content">
        <p>A new lender has committed funds:</p>
        <table>
        <tr><th>Name</th><td>${firstName} ${lastName}</td></tr>
        <tr>
            <th>Email</th>
            <td>${lenderEmail}</td>
        </tr>
        <tr>
            <th>Amount</th>
            <td>${formattedAmount}</td>
        </tr>
        <tr>
            <th>Rate Type</th>
            <td>
                ${isRateBoosted ? `<span class="premium-badge">PREMIUM</span> ${boostedRate}` : standardRate}
            </td>
        </tr>
        ${isRateBoosted && promoCode ? `
        <tr>
            <th>Promo Code</th>
            <td>${promoCode}</td>
        </tr>
        ` : ''}
        <tr>
            <th>Signed Up At</th>
            <td>${timestamp}</td>
        </tr>
        </table>
    </div>
    <div class="footer">
        This notification was generated automatically by Auricore.
    </div>
    </div>
</body>
</html>
`;
}