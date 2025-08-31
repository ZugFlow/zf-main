import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function applyCoupon(customerUuid: string, originalPrice: number): Promise<number> {
  try {
    // Verifica nella tabella customer_coupons se il cliente ha un coupon
    const { data: customerCoupons, error: customerCouponsError } = await supabase
      .from("customer_coupons")
      .select("coupon_id")
      .eq("customer_id", customerUuid);

    if (customerCouponsError) {
      throw new Error("Errore nel recupero dei coupon del cliente: " + customerCouponsError.message);
    }

    if (!customerCoupons || customerCoupons.length === 0) {
      console.log("Nessun coupon disponibile per il cliente.");
      return originalPrice;
    }

    // Prendi il primo coupon disponibile (potrebbe essere necessario gestire più coupon)
    const couponId = customerCoupons[0].coupon_id;

    // Verifica nella tabella discount_coupons i dettagli del coupon
    const { data: discountCoupon, error: discountCouponError } = await supabase
      .from("discount_coupons")
      .select("discount_type, discount_value")
      .eq("id", couponId)
      .single();

    if (discountCouponError) {
      throw new Error("Errore nel recupero dei dettagli del coupon: " + discountCouponError.message);
    }

    if (!discountCoupon) {
      console.log("Il coupon non è valido.");
      return originalPrice;
    }

    // Calcola il nuovo prezzo in base al tipo di sconto
    let finalPrice = originalPrice;

    if (discountCoupon.discount_type === "fixed") {
      finalPrice = Math.max(0, originalPrice - discountCoupon.discount_value); // Assicura che non sia negativo
    } else if (discountCoupon.discount_type === "percent") {
      finalPrice = originalPrice - (originalPrice * discountCoupon.discount_value) / 100;
    }

    return finalPrice;
  } catch (error) {
    console.error("Errore durante l'applicazione del coupon:", error);
    return originalPrice; // Ritorna il prezzo originale in caso di errore
  }
}
