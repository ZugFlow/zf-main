# Contact Form Email Implementation

## Overview
The contact form email functionality has been implemented in the salon web page to allow customers to send messages directly to salon owners. This implementation leverages the existing email configuration system from the dashboard.

## Components

### 1. Contact Form Component (`DynamicSalonPage.tsx`)
- **Location**: `app/salon/[subdomain]/components/DynamicSalonPage.tsx`
- **Purpose**: Renders the contact form with proper validation and user feedback
- **Features**:
  - Form validation for required fields (name, phone, message)
  - Real-time status feedback (success/error messages)
  - Loading states during submission
  - Form reset after successful submission

### 2. API Endpoint (`/api/contact-form`)
- **Location**: `app/api/contact-form/route.ts`
- **Purpose**: Handles contact form submissions and sends emails
- **Features**:
  - Validates form data
  - Retrieves salon information by subdomain
  - Fetches email settings using admin client (bypasses RLS)
  - Sends email to salon owner
  - Sends confirmation email to customer (if email provided)
  - Proper error handling and responses

## Email Configuration

### Prerequisites
The salon must have email settings configured in the dashboard:
1. Go to **Impostazioni** → **Email**
2. Configure SMTP settings (Gmail, Outlook, Yahoo, or custom)
3. Enable email notifications
4. Test the connection

### Email Settings Table
The system uses the `email_settings` table with the following structure:
- `salon_id`: Links to the salon
- `enabled`: Whether email notifications are active
- `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`: SMTP configuration
- `from_email`, `from_name`: Sender information
- `secure`, `require_tls`: Security settings

## Email Templates

### To Salon Owner
- **Subject**: `Nuovo messaggio da [Customer Name] - [Salon Name]`
- **Content**: Includes customer details, message, and salon information
- **Styling**: Professional HTML template with salon branding

### To Customer (Confirmation)
- **Subject**: `Messaggio ricevuto - [Salon Name]`
- **Content**: Confirmation message with message summary
- **Styling**: Consistent with salon branding

## Security Considerations

### Public Access
- The contact form is publicly accessible (no authentication required)
- Uses admin client to bypass RLS for email settings retrieval
- Validates salon subdomain to ensure proper routing

### Data Validation
- Server-side validation of all form fields
- Sanitization of user input
- Rate limiting considerations (can be added if needed)

## Usage Flow

1. **Customer fills form**: Name, phone, email (optional), message
2. **Form validation**: Client-side validation of required fields
3. **API submission**: POST to `/api/contact-form` with form data and subdomain
4. **Salon lookup**: System finds salon by subdomain
5. **Email settings retrieval**: Gets configured SMTP settings
6. **Email sending**: Sends to salon owner and customer (if email provided)
7. **Response**: Returns success/error status to frontend
8. **User feedback**: Shows appropriate message to customer

## Error Handling

### Common Error Scenarios
- **Salon not found**: Invalid subdomain
- **Email not configured**: Salon hasn't set up email settings
- **Email disabled**: Email notifications turned off
- **SMTP errors**: Connection or authentication issues
- **Network errors**: Client-side connection problems

### Error Messages
- User-friendly error messages in Italian
- Technical details logged for debugging
- Graceful fallbacks for various failure scenarios

## Integration Points

### Existing Systems
- **Email Settings**: Reuses dashboard email configuration
- **Salon Web Settings**: Uses existing salon customization
- **Database**: Leverages existing `salon_web_settings` and `email_settings` tables

### Future Enhancements
- Rate limiting for spam prevention
- CAPTCHA integration
- Email templates customization
- Notification preferences
- Message history/storage

## Testing

### Manual Testing
1. Configure email settings in dashboard
2. Visit salon web page
3. Fill and submit contact form
4. Verify emails are received
5. Test error scenarios (invalid data, disabled email, etc.)

### Automated Testing
- Unit tests for form validation
- Integration tests for API endpoint
- Email delivery testing
- Error handling verification

## Deployment Notes

### Requirements
- Nodemailer package (already installed)
- Supabase admin client access
- Email settings configured per salon
- Proper CORS configuration for API endpoint

### Environment Variables
- Supabase URL and service role key (for admin client)
- SMTP credentials (configured per salon)

## Troubleshooting

### Common Issues
1. **"Impostazioni email non configurate"**: Salon needs to configure email settings
2. **"Impostazioni email disabilitate"**: Email notifications are turned off
3. **SMTP errors**: Check SMTP credentials and settings
4. **RLS errors**: Ensure admin client is properly configured

### Debug Steps
1. Check browser console for client-side errors
2. Review server logs for API errors
3. Verify email settings in dashboard
4. Test SMTP connection manually
5. Check database permissions and RLS policies
