import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stock_quantity: number;
  low_stock_alert: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading products',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.stock_quantity), 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= p.low_stock_alert).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products & Inventory</h1>
          <p className="text-muted-foreground mt-2">Manage gym products and stock</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground font-semibold shadow-premium">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Stock</p>
          <p className="text-2xl font-bold text-primary">
            {products.reduce((sum, p) => sum + p.stock_quantity, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inventory Value</p>
          <p className="text-2xl font-bold text-success">${totalValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Loading products...</p>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No products found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => {
            const isLowStock = product.stock_quantity <= product.low_stock_alert;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-premium transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    {isLowStock && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Low Stock
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground text-lg mb-1">{product.name}</h3>
                  {product.category && (
                    <p className="text-sm text-muted-foreground mb-3">{product.category}</p>
                  )}

                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-lg font-bold text-foreground">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span className={`font-semibold ${isLowStock ? 'text-warning' : 'text-success'}`}>
                        {product.stock_quantity} units
                      </span>
                    </div>
                    {product.sku && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">SKU:</span>
                        <span className="text-sm text-foreground font-mono">{product.sku}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Restock
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
