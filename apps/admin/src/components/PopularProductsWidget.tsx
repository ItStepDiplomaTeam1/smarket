import React, { useState } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { Star, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PopularProductsWidgetProps {
  products: DashboardData['popularProducts'];
}

const ProductImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(!src);

  if (error) {
    return (
      <div className="w-12 h-12 bg-secondary rounded border border-border flex items-center justify-center shrink-0">
        <ImageIcon className="text-textMuted w-5 h-5" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 bg-white rounded border border-border flex items-center justify-center overflow-hidden shrink-0">
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-contain p-1" 
        onError={() => setError(true)}
      />
    </div>
  );
};

export const PopularProductsWidget: React.FC<PopularProductsWidgetProps> = ({ products }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl flex flex-col shadow-sm mt-6">
      <div className="p-5 pb-3 border-b border-border">
        <h3 className="font-semibold text-lg text-textMain">Популярні товари</h3>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ul className="divide-y divide-border">
          {products.map((product) => (
            <li key={product.id} className="p-4 flex gap-4 hover:bg-background/50 transition-colors">
              <ProductImage src={product.image} alt={product.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-textMain truncate mb-0.5" title={product.name}>
                  {product.name}
                </p>
                <p className="text-xs text-textMuted mb-1">{product.category}</p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center text-accentYellow">
                    <Star size={12} fill="currentColor" />
                    <span className="ml-1 font-semibold text-textMain">{product.rating}</span>
                  </div>
                  <span className="text-textMuted flex items-center gap-1">
                    <span className="w-1 h-1 bg-border rounded-full inline-block"></span>
                    {product.reviews}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <Link 
          to="/products"
          className="w-full block text-center py-2 bg-background border border-border rounded-lg text-sm font-medium text-textMain hover:bg-secondary hover:text-primary transition-colors btn-outline-theme"
        >
          Переглянути всі
        </Link>
      </div>
    </div>
  );
};

