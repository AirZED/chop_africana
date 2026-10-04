import { notFound } from "next/navigation";
import { getDiscountCode } from "@/lib/discount-service";
import DiscountForm from "@/components/admin/DiscountForm";

export default async function EditDiscountPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const discount = await getDiscountCode(code);
  if (!discount) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Edit Discount Code</h1>
      <p className="mt-1 text-sm text-stone-500">{discount.code}</p>
      <div className="mt-6">
        <DiscountForm initial={discount} />
      </div>
    </div>
  );
}
