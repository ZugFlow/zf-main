import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaBox, FaTag, FaWarehouse, FaStickyNote, FaMapMarkerAlt, FaBarcode, FaExclamationTriangle, FaDollarSign } from "react-icons/fa";

const supabase = createClient();

const validationSchema = Yup.object({
  name: Yup.string().required("Il nome è obbligatorio"),
  quantity: Yup.number().min(0, "La quantità non può essere negativa").required("La quantità è obbligatoria"),
  category: Yup.string().required("La categoria è obbligatoria"),
  supplier: Yup.string().required("Il fornitore è obbligatorio"),
  unit: Yup.string().required("L'unità è obbligatoria"),
  sku: Yup.string().required("Lo SKU è obbligatorio"),
  notes: Yup.string().optional(),
  location: Yup.string().required("L'ubicazione è obbligatoria"),
  price: Yup.number().min(0, "Il prezzo non può essere negativo").required("Il prezzo è obbligatorio"),
  expiration_date: Yup.date().optional(),
  min_threshold: Yup.number().min(0, "La soglia minima non può essere negativa").required("La soglia minima è obbligatoria"),
  status: Yup.string().required("Lo stato è obbligatorio"),
});

interface FormModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

const FormModal: React.FC<FormModalProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const [initialValues] = useState({
    name: "",
    quantity: 0,
    category: "",
    supplier: "",
    unit: "",
    sku: "",
    notes: "",
    location: "",
    price: 0,
    expiration_date: "",
    min_threshold: 0,
    status: "Disponibile",
  });

  const handleSubmit = async (values: { [key: string]: any }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("Errore: Utente non autenticato.", userError?.message);
        return;
      }

      const { error } = await supabase.from("products").insert({
        ...values,
        user_id: userData.user.id,
        date_added: new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("Errore nell'inserimento del prodotto:", error.message);
      } else {
        setIsDialogOpen(false);
      }
    } catch (e) {
      console.error("Errore generale:", e);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="p-6 rounded-lg w-full max-w-3xl overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>Aggiungi Prodotto</DialogTitle>
        </DialogHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Nome</label>
                  <div className="flex items-center gap-2">
                    <FaBox />
                    <Field name="name" as={Input} placeholder="Nome Prodotto" />
                  </div>
                  <ErrorMessage name="name" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Quantità</label>
                  <div className="flex items-center gap-2">
                    <FaTag />
                    <Field name="quantity" type="number" as={Input} placeholder="Quantità" />
                  </div>
                  <ErrorMessage name="quantity" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Categoria</label>
                  <div className="flex items-center gap-2">
                    <FaWarehouse />
                    <Field name="category" as={Input} placeholder="Categoria" />
                  </div>
                  <ErrorMessage name="category" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Fornitore</label>
                  <div className="flex items-center gap-2">
                    <FaStickyNote />
                    <Field name="supplier" as={Input} placeholder="Fornitore" />
                  </div>
                  <ErrorMessage name="supplier" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Unità</label>
                  <div className="flex items-center gap-2">
                    <FaStickyNote />
                    <Field name="unit" as={Input} placeholder="Unità" />
                  </div>
                  <ErrorMessage name="unit" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">SKU</label>
                  <div className="flex items-center gap-2">
                    <FaBarcode />
                    <Field name="sku" as={Input} placeholder="SKU" />
                  </div>
                  <ErrorMessage name="sku" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Note</label>
                  <div className="flex items-center gap-2">
                    <FaStickyNote />
                    <Field name="notes" as={Input} placeholder="Note" />
                  </div>
                  <ErrorMessage name="notes" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Ubicazione</label>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt />
                    <Field name="location" as={Input} placeholder="Ubicazione" />
                  </div>
                  <ErrorMessage name="location" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Prezzo</label>
                  <div className="flex items-center gap-2">
                    <FaDollarSign />
                    <Field name="price" type="number" as={Input} placeholder="Prezzo" />
                  </div>
                  <ErrorMessage name="price" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Data di Scadenza</label>
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle />
                    <Field name="expiration_date" type="date" as={Input} placeholder="Data di Scadenza" />
                  </div>
                  <ErrorMessage name="expiration_date" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Soglia Minima</label>
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle />
                    <Field name="min_threshold" type="number" as={Input} placeholder="Soglia Minima" />
                  </div>
                  <ErrorMessage name="min_threshold" component="div" className="text-red-500 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Stato</label>
                  <div className="flex items-center gap-2">
                    <FaStickyNote />
                    <Field name="status" as={Input} placeholder="Stato" />
                  </div>
                  <ErrorMessage name="status" component="div" className="text-red-500 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" className="bg-blue-500 text-white">
                  Salva
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default FormModal;
