import { notFound } from "next/navigation";
import { getAnyShopProductById } from "@/lib/shop-service";
import ShopProductForm from "@/components/admin/ShopProductForm";

export default async function EditShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getAnyShopProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Edit Product</h1>
      <p className="mt-1 text-sm text-stone-500">{product.name}</p>
      <div className="mt-6">
        <ShopProductForm productId={id} initial={product} />
      </div>
    </div>
  );
}
