import { useEffect, useState } from 'react';
import { Search, Plus, Trash2, DollarSign, Eye } from 'lucide-react';
import usePOSStore from '../stores/posStore';
import { productService, cashDrawerService, salesService } from '../services/api';
import { PaymentModal, ProductDetailsModal } from '../components/Modals';

export default function POSPage() {
  const {
    items,
    subtotal,
    tax,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCashDrawerId,
    cashDrawerId,
  } = usePOSStore();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [cashOpen, setCashOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [processing, setProcessing] = useState(false);
  const [change, setChange] = useState(0);
  
  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cargar productos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productService.getProducts(1, 100);
        setProducts(response.data.data.data);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Verificar si hay caja abierta
  useEffect(() => {
    const checkCashDrawer = async () => {
      try {
        const response = await cashDrawerService.getCurrentCashDrawer();
        setCashOpen(true);
        setCashDrawerId(response.data.data.CashDrawerID);
      } catch (error) {
        setCashOpen(false);
      }
    };

    checkCashDrawer();
  }, [setCashDrawerId]);

  // Calcular cambio
  useEffect(() => {
    const paid = parseFloat(paidAmount) || 0;
    setChange(Math.max(0, paid - total));
  }, [paidAmount, total]);

  const filteredProducts = products.filter((p) =>
    p.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Barcode.includes(searchTerm)
  );

  const handleSale = async (finalAmount) => {
    if (!cashOpen || !cashDrawerId) {
      alert('Debe abrir caja primero');
      return;
    }

    if (items.length === 0) {
      alert('Carrito vacío');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        cashDrawerId,
        items: items.map((item) => ({
          productId: item.ProductID,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
        subtotal,
        tax,
        total,
        paidAmount: finalAmount,
        change: finalAmount - total,
        paymentMethods: [
          {
            metodo: paymentMethod,
            monto: total,
            referencia: null,
          },
        ],
      };

      await salesService.createSale(saleData);
      alert('¡Venta registrada exitosamente!');
      clearCart();
      setPaidAmount('');
      setPaymentMethod('EFECTIVO');
      setShowPaymentModal(false);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Error al registrar venta');
    } finally {
      setProcessing(false);
    }
  };

  if (!cashOpen) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
          <p className="font-semibold">Debe abrir caja para comenzar a vender</p>
          <button className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition">
            Abrir Caja
          </button>
        </div>
      </div>
    );
  }

  return (
        <div className="flex h-full bg-gray-100">
       {/* Productos */}
       <div className="flex-1 p-6 overflow-auto">
         <div className="mb-6">
           <h1 className="text-2xl font-bold text-gray-900 mb-4">Punto de Venta</h1>
           <div className="relative">
             <Search className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.ProductID}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-4"
              >
                <div className="bg-gray-100 rounded h-32 mb-3 flex items-center justify-center">
                  <span className="text-gray-600 text-center text-xs">
                    {product.ProductName.substring(0, 20)}
                  </span>
                </div>
                 <h3 className="font-semibold text-gray-900 text-sm truncate">
                   {product.ProductName}
                 </h3>
                 <p className="text-xs text-gray-700 mt-1">
                  Barcode: {product.Barcode}
                </p>
                <div className="flex items-center justify-between mt-3 mb-3">
                   <span className="text-lg font-bold text-blue-700">
                     S/. {product.SellingPrice.toFixed(2)}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    product.StockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.StockQuantity}
                  </span>
                </div>
                <div className="flex gap-2">
                   <button
                     onClick={() => {
                       setSelectedProduct(product);
                       setShowProductModal(true);
                     }}
                     className="flex-1 bg-blue-700 hover:bg-blue-800 text-white p-2 rounded transition text-xs font-semibold flex items-center justify-center gap-1"
                   >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                   <button
                     onClick={() => addItem(product)}
                     disabled={product.StockQuantity <= 0}
                     className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white p-2 rounded transition"
                   >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrito */}
      <div className="w-96 bg-white shadow-lg p-6 flex flex-col border-l border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Carrito</h2>

        {/* Items */}
        <div className="flex-1 overflow-auto mb-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Carrito vacío</p>
          ) : (
            items.map((item) => (
              <div key={item.ProductID} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {item.ProductName}
                   </h3>
                   <button
                     onClick={() => removeItem(item.ProductID)}
                     className="text-red-700 hover:text-red-800"
                   >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      updateQuantity(item.ProductID, parseInt(e.target.value))
                    }
                    className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">
                    S/. {(item.cantidad * item.precioUnitario).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
               <span className="text-gray-700">Subtotal:</span>
               <span className="font-medium">S/. {subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-700">IGV (18%):</span>
              <span className="font-medium">S/. {tax.toFixed(2)}</span>
            </div>
             <div className="flex justify-between text-lg font-bold bg-blue-50 p-2 rounded">
               <span>Total:</span>
               <span className="text-blue-700">S/. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pago */}
         <div className="space-y-3 mb-4">
           <div>
             <label className="block text-xs font-semibold text-gray-700 mb-2">
               Método de Pago
             </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="TARJETA">💳 Tarjeta</option>
              <option value="YAPE">📱 YAPE (QR)</option>
              <option value="PLIN">📱 PLIN (QR)</option>
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-2">
           <button
             onClick={() => setShowPaymentModal(true)}
             disabled={processing || items.length === 0}
             className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
           >
            <DollarSign className="w-5 h-5" />
            {processing ? 'Procesando...' : 'Registrar Venta'}
          </button>
          <button
            onClick={clearCart}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Limpiar Carrito
          </button>
        </div>
      </div>

      {/* Modales */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        paymentMethod={paymentMethod}
        onConfirm={handleSale}
        loading={processing}
      />

      <ProductDetailsModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProduct}
        onAdd={addItem}
      />
    </div>
  );
}
