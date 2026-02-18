import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { productService } from '../services/api';

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    productName: '',
    barcode: '',
    categoryId: 1,
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    description: '',
    isActive: true
  });

  // Cargar productos
  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts(page, 10, searchTerm);
      setProducts(response.data.data.data || []);
      setTotalPages(response.data.data.pages || 1);
    } catch (error) {
      console.error('Error cargando productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        productName: product.ProductName,
        barcode: product.Barcode,
        categoryId: product.CategoryID || 1,
        costPrice: product.CostPrice,
        sellingPrice: product.SellingPrice,
        stockQuantity: product.StockQuantity,
        description: product.Description || '',
        isActive: product.IsActive
      });
    } else {
      setEditingProduct(null);
      setFormData({
        productName: '',
        barcode: '',
        categoryId: 1,
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      productName: '',
      barcode: '',
      categoryId: 1,
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = async () => {
    if (!formData.productName || !formData.barcode || !formData.costPrice || !formData.sellingPrice) {
      alert('Completa los campos requeridos');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        productName: formData.productName,
        barcode: formData.barcode,
        categoryId: parseInt(formData.categoryId),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        description: formData.description,
        isActive: formData.isActive
      };

      if (editingProduct) {
        // Actualizar
        await productService.updateProduct(editingProduct.ProductID, payload);
        alert('Producto actualizado exitosamente');
      } else {
        // Crear
        await productService.createProduct(payload);
        alert('Producto creado exitosamente');
      }

      handleCloseModal();
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Error al guardar producto');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Estás seguro que deseas eliminar este producto?')) return;

    setProcessing(true);
    try {
      await productService.deleteProduct(productId);
      alert('Producto eliminado exitosamente');
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Error al eliminar producto');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Producto</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-900">Código</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-900">Precio Costo</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-900">Precio Venta</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-900">Stock</th>
              <th className="text-center py-4 px-6 font-semibold text-gray-900">Margen</th>
              <th className="text-center py-4 px-6 font-semibold text-gray-900">Estado</th>
              <th className="text-center py-4 px-6 font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const margin = ((product.SellingPrice - product.CostPrice) / product.CostPrice * 100).toFixed(2);
                return (
                  <tr key={product.ProductID} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-gray-900">{product.ProductName}</p>
                        <p className="text-xs text-gray-500">{product.Description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-mono">{product.Barcode}</td>
                    <td className="py-4 px-6 text-right text-sm font-semibold">
                      S/. {parseFloat(product.CostPrice).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-semibold text-blue-600">
                      S/. {parseFloat(product.SellingPrice).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        product.StockQuantity > 10 ? 'bg-green-100 text-green-800' :
                        product.StockQuantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.StockQuantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-green-600">
                      {margin}%
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.IsActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.IsActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.ProductID)}
                          className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Código de Barras *
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Código"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Precio de Costo (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Precio de Venta (S/.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Descripción del producto"
                  rows="2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold text-gray-900">Activo</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {processing ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
