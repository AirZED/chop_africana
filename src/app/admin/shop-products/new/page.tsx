import ShopProductForm from "@/components/admin/ShopProductForm";

export default function NewShopProductPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">New Product</h1>
      <p className="mt-1 text-sm text-stone-500">Add a new pie to the online shop.</p>
      <div className="mt-6">
        <ShopProductForm />
      </div>
    </div>
  );
}
