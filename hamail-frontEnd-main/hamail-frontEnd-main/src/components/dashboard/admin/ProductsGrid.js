import DashboardProductCard from "@/components/dashboard/DashboardProductCard";

export default function ProductsGrid({ products = [], onToggleFeatured }) {
  const sortedProducts = [...products].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedProducts.map((product) => (
        <DashboardProductCard
          key={product.id}
          product={product}
          onToggleFeatured={onToggleFeatured}
        />
      ))}
    </div>
  );
}
