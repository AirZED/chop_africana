import { notFound } from "next/navigation";
import { getMenuItemById } from "@/lib/menu-service";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMenuItemById(id);
  if (!item) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Edit Item</h1>
      <p className="mt-1 text-sm text-stone-500">{item.name}</p>
      <div className="mt-6">
        <ProductForm itemId={id} initial={item} />
      </div>
    </div>
  );
}
