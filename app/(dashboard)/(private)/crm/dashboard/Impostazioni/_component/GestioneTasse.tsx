/**
 * Gestione Tasse - Info pagina
 *
 * In questa pagina puoi:
 * - Gestire i dati fiscali aziendali (nome, indirizzo, partita IVA, codice fiscale, ecc.)
 * - Impostare la percentuale di tassa e se è inclusa nei prezzi
 * - Scegliere il regime fiscale e la nazione
 * - Applicare le tasse a servizi, prodotti e sconti
 * - Specificare il codice categoria IVA e note fiscali
 * - Personalizzare la visualizzazione dei prezzi:
 *   - Visualizzazione prezzo (lordo, netto, toggle)
 *   - Valuta (EUR, USD, CHF, GBP)
 *   - Formato numerico (it-IT, en-US, fr-FR, de-DE)
 *   - Numero di decimali
 *   - Arrotondamento (round, floor, ceil)
 *   - Mostra simbolo valuta
 *
 * Tutte le impostazioni vengono salvate e lette dal database Supabase (tabella dati_azienda) e sono applicate ai documenti fiscali generati dal sistema.
 */

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Info } from "lucide-react";

const supabase = createClient();

const GestioneTasse = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Errore nel recupero dell'utente:", error?.message);
        return;
      }
      setUserId(user.id);

      // Recupera salon_id dal profilo
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("salon_id")
        .eq("id", user.id)
        .single();
      if (profileError || !profile?.salon_id) {
        console.error("Errore nel recupero del salon_id dal profilo:", profileError?.message);
        return;
      }
      setSalonId(profile.salon_id);

      // Fetch company data usando user_id e salon_id
      const { data, error: fetchError } = await supabase
        .from("dati_azienda")
        .select("*")
        .eq("user_id", user.id)
        .eq("salon_id", profile.salon_id)
        .single();

      if (fetchError) {
        console.error("Errore nel recupero dei dati azienda:", fetchError.message);
      } else {
        setCompanyData(data);
      }
    };

    fetchUserData();
  }, []);

  const validationSchema = Yup.object({
    name: Yup.string().required("Nome azienda obbligatorio"),
    vatnumber: Yup.string().required("Partita IVA obbligatoria"),
    percentualetassa: Yup.number()
      .typeError("Deve essere un numero")
      .min(0, "Non può essere negativo")
      .max(100, "Non può superare 100")
      .required("Percentuale tassa obbligatoria"),
    // Validazione nuovi campi
    visualizzazione_prezzo: Yup.string()
      .oneOf(["lordo", "netto", "toggle"], "Valore non valido")
      .required("Campo obbligatorio"),
    formato_numero: Yup.string().required("Campo obbligatorio"),
    valuta: Yup.string().required("Campo obbligatorio"),
    numero_decimali: Yup.number()
      .typeError("Deve essere un numero")
      .min(0, "Minimo 0")
      .max(5, "Massimo 5")
      .required("Campo obbligatorio"),
    mostra_valuta_simbolo: Yup.boolean(),
    rounding_mode: Yup.string()
      .oneOf(["round", "floor", "ceil"], "Valore non valido")
      .required("Campo obbligatorio"),
  });

  const handleSubmit = async (values: any, { setSubmitting, setStatus }: any) => {
    if (!userId || !salonId) {
      setStatus({ error: "Utente non autenticato o salon_id mancante" });
      return;
    }

    try {
      const dataToUpdate = {
        user_id: userId,
        salon_id: salonId,
        name: values.name,
        address: values.address,
        city: values.city,
        cap: values.cap,
        province: values.province,
        vatnumber: values.vatnumber,
        fiscalcode: values.fiscalcode,
        percentualetassa: values.percentualetassa,
        tassainclusa: values.tassainclusa,
        regimefiscale: values.regimefiscale,
        nazione: values.nazione,
        tasseservizi: values.tasseservizi,
        tasseprodotti: values.tasseprodotti,
        tassesconti: values.tassesconti,
        codicecategoriaiva: values.codicecategoriaiva,
        notefiscali: values.notefiscali,
        // Nuovi campi
        visualizzazione_prezzo: values.visualizzazione_prezzo,
        formato_numero: values.formato_numero,
        valuta: values.valuta,
        numero_decimali: values.numero_decimali,
        mostra_valuta_simbolo: values.mostra_valuta_simbolo,
        rounding_mode: values.rounding_mode,
      };

      // Prova update con user_id e salon_id
      const { data: updateData, error: updateError } = await supabase
        .from('dati_azienda')
        .update(dataToUpdate)
        .eq('user_id', userId)
        .eq('salon_id', salonId)
        .select();

      // Se non esiste ancora, inserisci
      if (!updateData?.length) {
        const { data: insertData, error: insertError } = await supabase
          .from('dati_azienda')
          .insert(dataToUpdate)
          .select();

        if (insertError) throw insertError;
        setCompanyData(insertData?.[0]);
      } else {
        if (updateError) throw updateError;
        setCompanyData(updateData[0]);
      }

      setStatus({ success: "Dati salvati con successo!" });
    } catch (error: any) {
      console.error("Errore:", error);
      setStatus({ error: error.message || "Errore nel salvataggio dei dati" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full mt-6 flex justify-center gap-6">
      {/* Description Section */}
      <div className="hidden md:block w-[300px]">
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-[20px] font-semibold text-[#292d34]">
              Gestione Tasse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-[14px] text-[#292d34]">
              <p className="leading-relaxed">
                In questa sezione puoi gestire:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Dati fiscali aziendali (nome, indirizzo, partita IVA, codice fiscale, ecc.)</li>
                <li>Impostazioni IVA (percentuale, inclusione nei prezzi, codice categoria IVA)</li>
                <li>Regime fiscale e nazione</li>
                <li>Applicazione tasse a servizi, prodotti e sconti</li>
                <li>Note fiscali personalizzate</li>
                <li>Visualizzazione prezzi (lordo, netto, toggle)</li>
                <li>Valuta e simbolo valuta</li>
                <li>Formato numerico e numero di decimali</li>
                <li>Modalità di arrotondamento</li>
              </ul>
              <div className="mt-6 p-4 bg-[#f8f8fa] rounded-md">
                <p className="text-[12px] text-[#666]">
                  Nota: Queste impostazioni verranno applicate a tutti i documenti fiscali generati dal sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm w-full max-w-[600px]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-[16px] font-medium text-[#292d34]">
              Dati Fiscali
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={companyData || {
              name: "",
              address: "",
              city: "",
              cap: "",
              province: "",
              vatnumber: "",
              fiscalcode: "",
              logo: "",
              percentualetassa: 22,
              tassainclusa: false,
              regimefiscale: "",
              nazione: "Italia",
              tasseservizi: true,
              tasseprodotti: true,
              tassesconti: false,
              codicecategoriaiva: "",
              notefiscali: "",
              // Nuovi valori iniziali
              visualizzazione_prezzo: 'lordo',
              formato_numero: 'it-IT',
              valuta: 'EUR',
              numero_decimali: 2,
              mostra_valuta_simbolo: true,
              rounding_mode: 'round',
            }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, status, isSubmitting }) => (
              <Form className="space-y-4">
                <div className="p-4 rounded-md border border-[#e6e8ef] space-y-4">
                  <h3 className="font-medium text-[14px] text-[#292d34] mb-4">Informazioni Aziendali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[12px]">Nome Azienda</Label>
                      <Field name="name" as={Input} className="mt-1" />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Partita IVA</Label>
                      <Field name="vatnumber" as={Input} className="mt-1" />
                      <ErrorMessage name="vatnumber" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Codice Fiscale</Label>
                      <Field name="fiscalcode" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Indirizzo</Label>
                      <Field name="address" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Città</Label>
                      <Field name="city" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">CAP</Label>
                      <Field name="cap" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Provincia</Label>
                      <Field name="province" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Nazione</Label>
                      <Field name="nazione" as={Input} className="mt-1" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-md border border-[#e6e8ef] space-y-4">
                  <h3 className="font-medium text-[14px] text-[#292d34] mb-4">Impostazioni Fiscali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[12px]">Percentuale Tassa (%)</Label>
                      <Field name="percentualetassa" type="number" as={Input} className="mt-1" />
                      <ErrorMessage name="percentualetassa" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Regime Fiscale</Label>
                      <Field name="regimefiscale" as={Input} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Codice Categoria IVA</Label>
                      <Field name="codicecategoriaiva" as={Input} className="mt-1" />
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center space-x-2">
                      <Field type="checkbox" name="tassainclusa" id="tassainclusa" className="rounded border-gray-300" />
                      <Label htmlFor="tassainclusa" className="text-[12px]">Tassa inclusa nei prezzi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Field type="checkbox" name="tasseservizi" id="tasseservizi" className="rounded border-gray-300" />
                      <Label htmlFor="tasseservizi" className="text-[12px]">Applica tasse ai servizi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Field type="checkbox" name="tasseprodotti" id="tasseprodotti" className="rounded border-gray-300" />
                      <Label htmlFor="tasseprodotti" className="text-[12px]">Applica tasse ai prodotti</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Field type="checkbox" name="tassesconti" id="tassesconti" className="rounded border-gray-300" />
                      <Label htmlFor="tassesconti" className="text-[12px]">Applica tasse agli sconti</Label>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-md border border-[#e6e8ef]">
                  <Label className="text-[12px]">Note Fiscali</Label>
                  <Field 
                    name="notefiscali" 
                    as="textarea" 
                    className="w-full min-h-[100px] p-2 border rounded mt-1 text-sm" 
                  />
                </div>

                {/* Nuova sezione: Formato & Visualizzazione */}
                <div className="p-4 rounded-md border border-[#e6e8ef] space-y-4">
                  <h3 className="font-medium text-[14px] text-[#292d34] mb-4">Formato & Visualizzazione</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[12px] flex items-center gap-1">Visualizzazione Prezzo
                        <span title="Scegli se mostrare i prezzi come lordo, netto o permettere all'utente di scegliere."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                      <Field as="select" name="visualizzazione_prezzo" className="mt-1 w-full border rounded p-2 text-sm">
                        <option value="lordo">Lordo</option>
                        <option value="netto">Netto</option>
                        <option value="toggle">Toggle</option>
                      </Field>
                    </div>
                    <div>
                      <Label className="text-[12px] flex items-center gap-1">Valuta
                        <span title="La valuta utilizzata per i prezzi e i documenti."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                      <Field as="select" name="valuta" className="mt-1 w-full border rounded p-2 text-sm">
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="CHF">CHF</option>
                        <option value="GBP">GBP</option>
                      </Field>
                    </div>
                    <div>
                      <Label className="text-[12px] flex items-center gap-1">Formato numerico
                        <span title="Definisce il formato di visualizzazione dei numeri, ad esempio separatore decimale e delle migliaia."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                      <Field as="select" name="formato_numero" className="mt-1 w-full border rounded p-2 text-sm">
                        <option value="it-IT">it-IT</option>
                        <option value="en-US">en-US</option>
                        <option value="fr-FR">fr-FR</option>
                        <option value="de-DE">de-DE</option>
                      </Field>
                    </div>
                    <div>
                      <Label className="text-[12px] flex items-center gap-1">Numero di decimali
                        <span title="Quante cifre decimali mostrare nei prezzi."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                      <Field name="numero_decimali" type="number" as={Input} className="mt-1" min={0} max={6} />
                    </div>
                    <div>
                      <Label className="text-[12px] flex items-center gap-1">Arrotondamento
                        <span title="Scegli come arrotondare i prezzi: normale (round), sempre per difetto (floor), sempre per eccesso (ceil)."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                      <Field as="select" name="rounding_mode" className="mt-1 w-full border rounded p-2 text-sm">
                        <option value="round">Round</option>
                        <option value="floor">Floor</option>
                        <option value="ceil">Ceil</option>
                      </Field>
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Field type="checkbox" name="mostra_valuta_simbolo" id="mostra_valuta_simbolo" className="rounded border-gray-300" />
                      <Label htmlFor="mostra_valuta_simbolo" className="text-[12px] flex items-center gap-1">Mostra simbolo valuta
                        <span title="Se attivo, verrà mostrato il simbolo della valuta accanto ai prezzi."><Info size={14} className="inline ml-1 text-gray-400" /></span>
                      </Label>
                    </div>
                  </div>
                </div>

                {status?.error && (
                  <div className="p-3 rounded bg-red-100 text-red-600 text-sm">
                    {status.error}
                  </div>
                )}
                {status?.success && (
                  <div className="p-3 rounded bg-green-100 text-green-600 text-sm">
                    {status.success}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-black text-white text-sm px-3 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestioneTasse;
