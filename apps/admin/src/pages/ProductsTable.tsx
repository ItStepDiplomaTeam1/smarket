import React from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

const mockProducts = [
  { id: 'PRD-001', name: 'PlayStation 5 Console', retailer: 'Amazon', price: 499.99, stock: 'In Stock', updated: '10 mins ago' },
  { id: 'PRD-002', name: 'Apple iPhone 15 Pro', retailer: 'BestBuy', price: 999.00, stock: 'Out of Stock', updated: '1 hour ago' },
  { id: 'PRD-003', name: 'Samsung 65" OLED TV', retailer: 'Walmart', price: 1298.00, stock: 'Low Stock', updated: '3 hours ago' },
  { id: 'PRD-004', name: 'Dyson V15 Detect', retailer: 'Target', price: 649.99, stock: 'In Stock', updated: '5 hours ago' },
  { id: 'PRD-005', name: 'Nintendo Switch OLED', retailer: 'Amazon', price: 349.99, stock: 'In Stock', updated: '12 hours ago' },
];

const ProductsTable: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Products Inventory</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-textMuted" />
            </div>
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-surface border border-border hover:bg-secondary text-textMain rounded-lg transition-colors">
            <Filter size={16} />
            <span className="text-sm font-medium hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-textMuted text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4 font-medium">Product ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Retailer</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Last Updated</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-textMuted whitespace-nowrap">{product.id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-textMuted whitespace-nowrap">{product.retailer}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${product.stock === 'In Stock' ? 'bg-accentGreen/10 text-accentGreen border-accentGreen/20' : 
                        product.stock === 'Out of Stock' ? 'bg-accentRed/10 text-accentRed border-accentRed/20' : 
                        'bg-accentYellow/10 text-accentYellow border-accentYellow/20'}`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-textMuted text-right whitespace-nowrap">{product.updated}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1.5 text-textMuted hover:text-textMain hover:bg-secondary rounded-md transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-textMuted">
          <div>Showing 1 to 5 of 12,493 entries</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors" disabled>Previous</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors bg-secondary text-textMain">1</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors">2</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors">3</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
