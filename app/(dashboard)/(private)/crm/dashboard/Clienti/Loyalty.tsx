import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { DiscountCouponModal } from "./_component/DiscountCouponModal";
import { EditCouponModal } from "./_component/EditCouponModal";

const supabase = createClient();

const LoyaltyCoupons = () => {
  interface Coupon {
    id: number;
    code: string;
    description: string;
    discount_type: string;
    discount_value: number;
    usage_limit: number;
    expiration_date: string | null;
  }

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [userId, setUserId] = useState(""); // State for user ID

  const fetchCoupons = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Utente non autenticato.");
      return;
    }
    setUserId(user.id); // Set the user ID

    const { data, error } = await supabase
      .from("discount_coupons")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Errore nel recupero dei coupon:", error.message);
    } else {
      setCoupons(data || []);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  };

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = async (id: number) => {
    const confirmDelete = confirm("Sei sicuro di voler eliminare questo coupon?");
    if (confirmDelete) {
      const { error } = await supabase.from("discount_coupons").delete().eq("id", id);

      if (error) {
        console.error("Errore nella cancellazione del coupon:", error.message);
      } else {
        fetchCoupons();
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Gestione Coupon</h1>
      <Separator />
      <div className="mt-4 flex justify-end mb-4">
        <Button onClick={handleAddCoupon} className="bg-black hover:bg-gray-800 text-white">
          Aggiungi Coupon
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <Card key={coupon.id} className="shadow-md">
              <CardHeader>
                <CardTitle>{coupon.code}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">
                  <strong>Descrizione:</strong> {coupon.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `€${coupon.discount_value}`}
                  </Badge>
                  <Badge variant="outline">Uso massimo: {coupon.usage_limit}</Badge>
                  {coupon.expiration_date && (
                    <Badge variant="outline">Scadenza: {coupon.expiration_date}</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCoupon(coupon)}
                >
                  Modifica
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCoupon(coupon.id)}
                >
                  Elimina
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="text-gray-600">Nessun coupon disponibile.</p>
        )}
      </div>
      {isModalOpen && (
        <DiscountCouponModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          coupon={selectedCoupon}
          onSubmit={() => {
            fetchCoupons();
          }}
        />
      )}
      {isEditModalOpen && (
        <EditCouponModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          coupon={selectedCoupon}
          onSubmit={() => {
            fetchCoupons();
          }}
        />
      )}
    </div>
  );
};

export default LoyaltyCoupons;
