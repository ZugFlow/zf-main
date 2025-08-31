import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import nodemailer from "nodemailer";

interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  message: string;
  salonSubdomain: string;
}

export async function POST(req: Request) {
  try {
    const contactData: ContactFormData = await req.json();
    
    // Validazione dei dati
    if (!contactData.name || !contactData.phone || !contactData.message || !contactData.salonSubdomain) {
      return NextResponse.json({ 
        error: "Dati mancanti per l'invio del messaggio" 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Recupera le informazioni del salone dal subdomain
    const { data: salonWebSettings, error: webSettingsError } = await supabase
      .from('salon_web_settings')
      .select('salon_id, web_title, web_address, web_contact_phone, web_contact_email')
      .eq('web_subdomain', contactData.salonSubdomain)
      .single();

    if (webSettingsError || !salonWebSettings) {
      console.error('Salone non trovato per subdomain:', contactData.salonSubdomain);
      return NextResponse.json({ 
        error: "Salone non trovato" 
      }, { status: 404 });
    }

    const salonId = salonWebSettings.salon_id;

    // Recupera le impostazioni email del salone usando admin client per bypassare RLS
    const { data: emailSettings, error: emailSettingsError } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .eq('salon_id', salonId)
      .single();

    if (emailSettingsError || !emailSettings) {
      console.error('Impostazioni email non trovate per salon_id:', salonId);
      return NextResponse.json({ 
        error: "Impostazioni email non configurate" 
      }, { status: 400 });
    }

    if (!emailSettings.enabled) {
      console.error('Impostazioni email disabilitate per salon_id:', salonId);
      return NextResponse.json({ 
        error: "Impostazioni email disabilitate" 
      }, { status: 400 });
    }

    if (!emailSettings.from_email || emailSettings.from_email.trim() === '') {
      console.error('Email mittente non configurata per salon_id:', salonId);
      return NextResponse.json({ 
        error: "Email mittente non configurata" 
      }, { status: 400 });
    }

    // Recupera le informazioni del salone usando admin client
    const { data: salon } = await supabaseAdmin
      .from('salon')
      .select('name')
      .eq('id', salonId)
      .single();

    const salonName = salon?.name || salonWebSettings.web_title || "Il nostro salone";
    const salonAddress = salonWebSettings.web_address || "";
    const salonPhone = salonWebSettings.web_contact_phone || "";
    const salonEmail = salonWebSettings.web_contact_email || emailSettings.from_email || "";

    // Configura il transporter email
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.secure,
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_pass,
      },
      requireTLS: emailSettings.require_tls,
    });

    // Prepara il contenuto dell'email
    const emailSubject = `Nuovo messaggio da ${contactData.name} - ${salonName}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          Nuovo messaggio dal sito web
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #6366f1; margin-top: 0;">Dettagli del messaggio:</h3>
          
          <p><strong>Nome:</strong> ${contactData.name}</p>
          <p><strong>Telefono:</strong> ${contactData.phone}</p>
          ${contactData.email ? `<p><strong>Email:</strong> ${contactData.email}</p>` : ''}
          
          <div style="margin-top: 20px;">
            <strong>Messaggio:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #6366f1;">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; font-size: 14px; color: #6c757d;">
          <p><strong>Salone:</strong> ${salonName}</p>
          ${salonAddress ? `<p><strong>Indirizzo:</strong> ${salonAddress}</p>` : ''}
          ${salonPhone ? `<p><strong>Telefono:</strong> ${salonPhone}</p>` : ''}
          <p><strong>Data invio:</strong> ${new Date().toLocaleString('it-IT')}</p>
        </div>
      </div>
    `;

    // Invia l'email
    if (!salonEmail || salonEmail.trim() === '') {
      throw new Error('Email del salone non configurata');
    }

    const mailOptions = {
      from: `"${emailSettings.from_name || salonName}" <${emailSettings.from_email || ''}>`,
      to: salonEmail,
      subject: emailSubject,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    // Opzionalmente, invia una conferma al cliente se ha fornito un'email
    if (contactData.email && contactData.email.trim() !== '') {
      const confirmationSubject = `Messaggio ricevuto - ${salonName}`;
      const confirmationContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            Messaggio ricevuto
          </h2>
          
          <p>Gentile ${contactData.name},</p>
          
          <p>Abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #6366f1; margin-top: 0;">Riepilogo del tuo messaggio:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #6366f1;">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <p>Grazie per averci contattato!</p>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; font-size: 14px; color: #6c757d;">
            <p><strong>${salonName}</strong></p>
            ${salonAddress ? `<p>${salonAddress}</p>` : ''}
            ${salonPhone ? `<p>Tel: ${salonPhone}</p>` : ''}
          </div>
        </div>
      `;

      const confirmationMailOptions = {
        from: `"${emailSettings.from_name || salonName}" <${emailSettings.from_email || ''}>`,
        to: contactData.email,
        subject: confirmationSubject,
        html: confirmationContent,
      };

      await transporter.sendMail(confirmationMailOptions);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Messaggio inviato con successo" 
    });

  } catch (error) {
    console.error('Errore nell\'invio del messaggio di contatto:', error);
    return NextResponse.json({ 
      error: "Errore nell'invio del messaggio" 
    }, { status: 500 });
  }
}
