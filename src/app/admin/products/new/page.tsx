import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">New Item</h1>
      <p className="mt-1 text-sm text-stone-500">Add a new item to the menu.</p>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
