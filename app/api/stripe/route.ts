import { stripe } from "@/utils/stripe/stripe";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let event;

  const body = await req.text();
  const requestHeaders = new Headers(req.headers);

  // Get the signature sent by Stripe
  const sig = requestHeaders.get("stripe-signature") as string;

  try {
    // Verify the event using the Stripe webhook secret key
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY ?? ""
    );
  } catch (err: any) {
    console.error("Errore durante la verifica dell'evento Stripe:", err.message);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    console.log("Evento ricevuto:", event);

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const subscription = event.data.object as any;

        // Get the customer ID from the subscription
        const customerId = subscription.customer;

        // Retrieve the customer to get their email
        let customerEmail: string | undefined;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as any).email;
          if (!customerEmail) {
            throw new Error("Email del cliente non trovata");
          }
        } catch (customerError) {
          console.error("Errore durante il recupero del cliente da Stripe:", customerError);
          return NextResponse.json({ ok: false, error: "Errore recupero cliente" }, { status: 500 });
        }

        console.log("Email del cliente:", customerEmail);

        // Recupera ulteriori informazioni dalla sottoscrizione
        const planId = subscription.items.data[0].plan.id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Trova l'utente tramite email
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", customerEmail)
          .single();

        if (userError || !userData) {
          console.error("Utente non trovato per email:", customerEmail);
          return NextResponse.json({ ok: false, error: "Utente non trovato" }, { status: 400 });
        }

        console.log("Dati da inserire:", {
          user_id: userData.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          plan_id: planId,
          current_period_end: currentPeriodEnd.toISOString(),
        });

        // Inserimento nella tabella Supabase
        const { data, error } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userData.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            plan_id: planId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          },
          { onConflict: "stripe_subscription_id" }
        );

        if (error) {
          console.error("Errore durante l'upsert nel database Supabase:", error.message);
          return NextResponse.json({ ok: false }, { status: 500 });
        } else {
          console.log("Dati inseriti correttamente nella tabella subscriptions:", data);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        // Recuperare l'ID del cliente dalla sottoscrizione
        const customerId = subscription.customer;

        // Recuperare l'email del cliente
        let customerEmail: string | undefined;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as any).email;
          if (!customerEmail) {
            throw new Error("Email del cliente non trovata");
          }
        } catch (customerError) {
          console.error("Errore durante il recupero del cliente da Stripe per la cancellazione:", customerError);
          return NextResponse.json({ ok: false, error: "Errore recupero cliente" }, { status: 500 });
        }

        console.log("Email del cliente da cancellare:", customerEmail);

        // Recupera il plan_id dalla sottoscrizione
        const planId = subscription.items.data[0].plan.id;

        // Trova l'utente tramite email
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", customerEmail)
          .single();

        if (userError || !userData) {
          console.error("Utente non trovato per email:", customerEmail);
          return NextResponse.json({ ok: false, error: "Utente non trovato" }, { status: 400 });
        }

        // Aggiornamento del cliente nella tabella subscriptions per segnare la sottoscrizione come inattiva
        const { error: errorSub } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userData.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: 'canceled',
            plan_id: planId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: true,
          },
          { onConflict: "stripe_subscription_id" }
        );

        if (errorSub) {
          console.error("Errore durante l'upsert del cliente cancellato nel database Supabase:", errorSub.message);
          return NextResponse.json({ ok: false }, { status: 500 });
        }

        console.log("Sottoscrizione cancellata con successo per il cliente:", customerEmail);

        break;
      }

      default:
        console.log(`Tipo di evento non gestito: ${event.type}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Errore nel gestire l'evento:", err.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
