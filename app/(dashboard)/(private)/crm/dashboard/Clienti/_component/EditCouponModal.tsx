import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";

const supabase = createClient();

const schema = yup.object().shape({
  code: yup.string().required("Coupon code is required."),
  description: yup.string().required("Description is required."),
  discount_type: yup
    .string()
    .oneOf(["percent", "fixed"], "Invalid discount type."),
  discount_value: yup
    .number()
    .min(0, "Discount value must be at least 0."),
  usage_limit: yup
    .number()
    .min(1, "Usage limit must be at least 1."),
  expiration_date: yup.date().nullable(),
});

export function EditCouponModal({
  isOpen,
  setIsOpen,
  coupon,
  onSubmit,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  coupon: any | null;
  onSubmit?: () => void;
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
      discount_type: "percent",
      discount_value: 0,
      expiration_date: "",
      usage_limit: 1,
    },
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coupon) {
      reset(coupon);
    }
  }, [coupon, reset]);

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const handleSave = async (data: any) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("discount_coupons")
        .update(data)
        .eq("id", coupon.id);

      if (error) {
        console.error("Error updating coupon:", error);
        toast.error("Error updating the coupon. Details: " + error.message);
      } else {
        toast.success("Coupon successfully updated!");
        if (onSubmit) onSubmit();
        handleClose();
      }
    } catch (err) {
      console.error("Error during update:", err);
      toast.error("General error during update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Modifica Coupon</h2>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Coupon Code</label>
            <Input {...register("code")} placeholder="e.g., DISCOUNT10" />
            {errors.code && <p className="text-red-500 text-sm">{String(errors.code.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <Input {...register("description")} placeholder="e.g., 10% discount on all products" />
            {errors.description && <p className="text-red-500 text-sm">{String(errors.description.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Discount Type</label>
            <select
              {...register("discount_type")}
              className="w-full border border-gray-300 rounded p-1"
            >
              <option value="percent">Percentage Discount (%)</option>
              <option value="fixed">Fixed Discount (€)</option>
            </select>
            {errors.discount_type && <p className="text-red-500 text-sm">{String(errors.discount_type.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Discount Value</label>
            <Input
              type="number"
              step="0.01"
              {...register("discount_value")}
              placeholder="e.g., 10% or €10"
            />
            {errors.discount_value && <p className="text-red-500 text-sm">{String(errors.discount_value.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Expiration Date</label>
            <Input type="date" {...register("expiration_date")} placeholder="Expiration date" />
          </div>

          <div>
            <label className="block text-sm font-medium">Usage Limit</label>
            <Input
              type="number"
              step="1"
              {...register("usage_limit")}
              placeholder="e.g., 1"
            />
            {errors.usage_limit && <p className="text-red-500 text-sm">{String(errors.usage_limit.message)}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" onClick={handleClose} variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
