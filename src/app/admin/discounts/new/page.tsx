import DiscountForm from "@/components/admin/DiscountForm";

export default function NewDiscountPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">New Discount Code</h1>
      <p className="mt-1 text-sm text-stone-500">Create a new promo code for checkout.</p>
      <div className="mt-6">
        <DiscountForm />
      </div>
    </div>
  );
}
