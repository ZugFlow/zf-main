import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";

const supabase = createClient();

const schema = yup.object().shape({
  code: yup.string().required("Il codice del coupon è obbligatorio."),
  description: yup.string().required("La descrizione è obbligatoria."),
  discount_type: yup
    .string()
    .oneOf(["percent", "fixed"], "Tipo di sconto non valido."),
  discount_value: yup
    .number()
    .min(0, "Il valore dello sconto deve essere almeno 0."),
  usage_limit: yup
    .number()
    .min(1, "Il limite di utilizzo deve essere almeno 1."),
  expiration_date: yup.date().nullable(),
});

async function fetchProfileId() {
  try {
    const { data: user, error } = await supabase.auth.getUser();
    if (error) throw new Error("Errore durante il recupero dell'utente: " + error.message);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user?.user?.id)
      .single();

    if (profileError) throw new Error("Errore durante il recupero del profilo: " + profileError.message);

    return profile?.id || null;
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    return null;
  }
}

async function checkDuplicateCoupon(code: string) {
  try {
    const { data: existingCoupon, error } = await supabase
      .from("discount_coupons")
      .select("id")
      .eq("code", code)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);

    return !!existingCoupon;
  } catch (err) {
    if (err instanceof Error) {
      console.error("Errore durante il controllo del coupon duplicato:", err.message);
    } else {
      console.error("Errore durante il controllo del coupon duplicato:", err);
    }
    return false;
  }
}

export function DiscountCouponModal({
  isOpen,
  setIsOpen,
  coupon,
  onSubmit,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  coupon: any | null;
  onSubmit?: (data: any) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: coupon || {
      code: "",
      description: "",
      discount_type: "percent", // percent or fixed
      discount_value: 0,
      expiration_date: "",
      usage_limit: 1,
      profile_id: null, // Use null by default
    },
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileId() {
      const id = await fetchProfileId();
      setProfileId(id);
    }

    loadProfileId();
  }, []);

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const handleSave = async (data: any) => {
    if (!profileId) {
      toast.error("Errore: Impossibile salvare il coupon senza un profilo associato.");
      console.error("ID profilo mancante.");
      return;
    }

    setLoading(true);

    try {
      const isDuplicate = await checkDuplicateCoupon(data.code);

      if (isDuplicate) {
        toast.error("Errore: Il codice del coupon esiste già. Scegli un altro codice.");
        setLoading(false);
        return;
      }

      const couponData = {
        ...data,
        discount_value: parseFloat(data.discount_value) || 0,
        usage_limit: parseInt(data.usage_limit, 10) || 1,
        profile_id: profileId,
      };

      const { error } = await supabase.from("discount_coupons").insert([couponData]);

      if (error) {
        console.error("Errore durante il salvataggio del coupon:", error);
        toast.error("Errore durante il salvataggio del coupon. Dettagli: " + error.message);
      } else {
        toast.success("Coupon salvato con successo!");
        if (onSubmit) onSubmit(data);
        handleClose();
      }
    } catch (err) {
      console.error("Errore durante l'inserimento:", err);
      toast.error("Errore generale durante il salvataggio. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">
          {coupon ? "Modifica Coupon" : "Crea Nuovo Coupon"}
        </h2>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Codice Coupon</label>
            <Input
              {...register("code")}
              placeholder="es. SCONTO10"
            />
            {errors.code && <p className="text-red-500 text-sm">{String(errors.code.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Descrizione</label>
            <Input
              {...register("description")}
              placeholder="es. 10% di sconto su tutti i prodotti"
            />
            {errors.description && <p className="text-red-500 text-sm">{String(errors.description.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Tipo di Sconto</label>
            <select
              {...register("discount_type")}
              className="w-full border border-gray-300 rounded p-1"
            >
              <option value="percent">Sconto Percentuale (%)</option>
              <option value="fixed">Sconto Fisso (€)</option>
            </select>
            {errors.discount_type && <p className="text-red-500 text-sm">{String(errors.discount_type.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Valore dello Sconto</label>
            <Input
              type="number"
              step="0.01"
              {...register("discount_value")}
              placeholder="es. 10% o €10"
            />
            {errors.discount_value && <p className="text-red-500 text-sm">{String(errors.discount_value.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Data di Scadenza</label>
            <Input
              type="date"
              {...register("expiration_date")}
              placeholder="Data di scadenza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Limite di Utilizzo</label>
            <Input
              type="number"
              step="1"
              {...register("usage_limit")}
              placeholder="es. 1"
            />
            {errors.usage_limit && <p className="text-red-500 text-sm">{String(errors.usage_limit.message)}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={handleClose} variant="outline" disabled={loading}>
              Annulla
            </Button>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? "Salvando..." : "Salva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
