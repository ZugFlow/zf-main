import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSalonId } from "@/utils/getSalonIdServer";
import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  salonName?: string;
  salonAddress?: string;
  salonPhone?: string;
  subject?: string;
  templateType?: 'confirmation' | 'cancellation' | 'modification';
}

export async function POST(req: Request) {
  try {
    const emailData: EmailData = await req.json();
    
    // Validazione dei dati
    if (!emailData.to || !emailData.customerName || !emailData.serviceName || !emailData.appointmentDate || !emailData.appointmentTime) {
      return NextResponse.json({ 
        error: "Dati mancanti per l'invio dell'email" 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Ottieni le informazioni del salone dall'utente corrente
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ 
        error: "Utente non autenticato" 
      }, { status: 401 });
    }

    // Usa getSalonId() per ottenere il salon_id
    const salonId = await getSalonId();
    if (!salonId) {
      return NextResponse.json({ 
        error: "Impossibile determinare il salone" 
      }, { status: 400 });
    }

    // Recupera le impostazioni email del salone
    const { data: emailSettings, error: emailSettingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    if (emailSettingsError || !emailSettings) {
      console.error('Impostazioni email non trovate:', emailSettingsError);
      return NextResponse.json({ 
        error: "Impostazioni email non configurate" 
      }, { status: 400 });
    }

    // Per email reali (non test), verifica che le notifiche siano abilitate
    const isTestEmail = emailData.subject && emailData.subject.includes('Test Connessione');
    if (!isTestEmail && !emailSettings.enabled) {
      console.error('Impostazioni email disabilitate per email reale');
      return NextResponse.json({ 
        error: "Impostazioni email disabilitate" 
      }, { status: 400 });
    }

    // Recupera le informazioni del salone
    let salonInfo = {
      name: "Il nostro salone",
      address: "",
      phone: ""
    };

    // Recupera informazioni del salone se disponibili
    const { data: salon } = await supabase
      .from('salon')
      .select('name')
      .eq('id', salonId)
      .single();
    
    // Recupera le impostazioni web del salone per address e phone
    const { data: webSettings } = await supabase
      .from('salon_web_settings')
      .select('web_address, web_contact_phone')
      .eq('salon_id', salonId)
      .single();
    
    if (salon) {
      salonInfo = {
        name: salon.name || "Il nostro salone",
        address: webSettings?.web_address || "",
        phone: webSettings?.web_contact_phone || ""
      };
    }

    // Determina il tipo di template da utilizzare
    const templateType = emailData.templateType || 'confirmation';

    // Recupera il template personalizzato se disponibile
    let emailTemplate = null;
    if (!isTestEmail) {
      // Prima recupera l'user_id dal salone
      const { data: salonData } = await supabase
        .from('salon')
        .select('user_id')
        .eq('id', salonId)
        .single();
      
      if (salonData?.user_id) {
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('user_id', salonData.user_id)
          .eq('template_type', templateType)
          .eq('is_active', true)
          .single();

        if (!templateError && template) {
          emailTemplate = template;
        }
      }
    }

    // Configurazione del transporter email usando le impostazioni dal database
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.secure || emailSettings.smtp_port === 465, // true per 465, false per altri porti
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_pass,
      },
      // Configurazione TLS
      ...(emailSettings.require_tls && !emailSettings.secure && {
        requireTLS: true,
        ignoreTLS: false,
      }),
    });

    // Prepara i dati per la sostituzione delle variabili
    const templateData = {
      customer_name: emailData.customerName,
      service_name: emailData.serviceName,
      appointment_date: new Date(emailData.appointmentDate).toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      appointment_time: emailData.appointmentTime,
      salon_name: emailData.salonName || salonInfo.name,
      salon_address: emailData.salonAddress || salonInfo.address,
      salon_phone: emailData.salonPhone || salonInfo.phone
    };

    // Funzione per sostituire le variabili nel template
    const replaceTemplateVariables = (content: string, data: any) => {
      let result = content;
      
      // Sostituisci le variabili semplici
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value || ''));
      });

      // Gestisci le condizioni Handlebars semplici
      result = result.replace(/\{\{#if salon_address\}\}(.*?)\{\{\/if\}\}/g, (match, content) => data.salon_address ? content : '');
      result = result.replace(/\{\{#if salon_phone\}\}(.*?)\{\{\/if\}\}/g, (match, content) => data.salon_phone ? content : '');

      return result;
    };

    // Determina il subject e il contenuto dell'email
    let emailSubject: string;
    let emailHtml: string;
    let emailText: string;

    if (emailTemplate) {
      // Usa il template personalizzato
      emailSubject = replaceTemplateVariables(emailTemplate.subject, templateData);
      emailHtml = replaceTemplateVariables(emailTemplate.body, templateData);
      emailText = replaceTemplateVariables(emailTemplate.body, templateData);
    } else {
      // Usa il template di default
      emailSubject = emailData.subject || `✅ Prenotazione Confermata - ${salonInfo.name}`;
      
      // Template email HTML di default
      emailHtml = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Prenotazione Confermata</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #8B5CF6;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #8B5CF6;
              margin-bottom: 10px;
            }
            .title {
              color: #2d3748;
              font-size: 20px;
              margin: 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .booking-details {
              background-color: #f7fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #8B5CF6;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .detail-label {
              font-weight: 600;
              color: #4a5568;
            }
            .detail-value {
              color: #2d3748;
            }
            .salon-info {
              background-color: #edf2f7;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 14px;
            }
            .highlight {
              color: #8B5CF6;
              font-weight: 600;
            }
            .button {
              display: inline-block;
              background-color: #8B5CF6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 10px 0;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              .container {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
                gap: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${salonInfo.name}</div>
              <h1 class="title">Prenotazione Confermata! ✅</h1>
            </div>
            
            <div class="content">
              <p>Ciao <span class="highlight">${emailData.customerName}</span>,</p>
              
              <p>Siamo felici di confermare la tua prenotazione! La tua richiesta è stata approvata e siamo pronti ad accoglierti.</p>
              
              <div class="booking-details">
                <h3 style="margin-top: 0; color: #8B5CF6;">Dettagli della Prenotazione</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Servizio:</span>
                  <span class="detail-value">${emailData.serviceName}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${new Date(emailData.appointmentDate).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Orario:</span>
                  <span class="detail-value">${emailData.appointmentTime}</span>
                </div>
              </div>
              
              <div class="salon-info">
                <h4 style="margin-top: 0; color: #4a5568;">Informazioni del Salone</h4>
                <p style="margin: 5px 0;"><strong>${salonInfo.name}</strong></p>
                ${salonInfo.address ? `<p style="margin: 5px 0;">📍 ${salonInfo.address}</p>` : ''}
                ${salonInfo.phone ? `<p style="margin: 5px 0;">📞 ${salonInfo.phone}</p>` : ''}
              </div>
              
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Ti preghiamo di arrivare 10 minuti prima dell'orario fissato</li>
                <li>In caso di impossibilità, contattaci il prima possibile</li>
                <li>Porta con te un documento d'identità se richiesto</li>
              </ul>
              
              <p>Non vediamo l'ora di vederti! Se hai domande, non esitare a contattarci.</p>
              
              <p>Cordiali saluti,<br>
              <strong>Il team di ${salonInfo.name}</strong></p>
            </div>
            
            <div class="footer">
              <p>Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.</p>
              <p>Per modificare o cancellare la prenotazione, contatta direttamente il salone.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Template email testuale (fallback) di default
      emailText = `
        Prenotazione Confermata - ${salonInfo.name}
        
        Ciao ${emailData.customerName},
        
        Siamo felici di confermare la tua prenotazione!
        
        DETTAGLI PRENOTAZIONE:
        - Servizio: ${emailData.serviceName}
        - Data: ${new Date(emailData.appointmentDate).toLocaleDateString('it-IT')}
        - Orario: ${emailData.appointmentTime}
        
        ${salonInfo.address ? `Indirizzo: ${salonInfo.address}` : ''}
        ${salonInfo.phone ? `Telefono: ${salonInfo.phone}` : ''}
        
        IMPORTANTE:
        - Arriva 10 minuti prima dell'orario fissato
        - In caso di impossibilità, contattaci il prima possibile
        
        Cordiali saluti,
        Il team di ${salonInfo.name}
      `;
    }

    // Invia email tramite nodemailer
    const mailOptions = {
      from: emailSettings.from_email || emailSettings.smtp_user,
      to: emailData.to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log del successo
    console.log(`✅ Email inviata con successo a ${emailData.to}`, info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: "Email inviata con successo",
      messageId: info.messageId,
      templateUsed: emailTemplate ? 'custom' : 'default'
    });

  } catch (error) {
    console.error('Errore generale nell\'invio email:', error);
    return NextResponse.json({ 
      error: "Errore interno del server nell'invio email" 
    }, { status: 500 });
  }
} 