import { useEffect, useState } from 'react';
import { Plus, Edit2, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../services/api';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await inventoryService.getInventory(page, 50, {
          searchTerm,
        });
        setProducts(response.data.data.data);
        setTotalPages(response.data.data.pagination.totalPages);
      } catch (err) {
        setError('Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [page, searchTerm]);

  const getStockStatus = (actual, minimo) => {
    if (actual === 0) return { label: 'AGOTADO', color: 'text-red-600', bg: 'bg-red-50' };
    if (actual <= minimo) return { label: 'CRÍTICO', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'NORMAL', color: 'text-green-600', bg: 'bg-green-50' };
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-2">Gestión de productos y stock</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar producto por nombre o código..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const status = getStockStatus(product.StockActual, product.StockMinimo);
                  return (
                    <tr key={product.ProductID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{product.ProductName}</p>
                          <p className="text-gray-500 text-xs">{product.CategoryName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.Barcode}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{product.StockActual}</p>
                          <p className="text-gray-500 text-xs">Mín: {product.StockMinimo}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1 ${status.bg} ${status.color}`}
                        >
                          {product.StockActual === 0 && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">S/. {product.SellingPrice.toFixed(2)}</p>
                          <p className="text-gray-500 text-xs">Costo: S/. {product.CostPrice.toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-700 p-2 rounded transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
