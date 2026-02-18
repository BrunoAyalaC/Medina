import { useEffect, useState } from 'react';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { reportsService, inventoryService, cashDrawerService } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Obtener resumen ejecutivo
        const summaryResponse = await reportsService.getExecutiveSummary();
        setStats(summaryResponse.data.data);

        // Obtener alertas de inventario
        const alertsResponse = await inventoryService.getStockCritico();
        setAlerts(alertsResponse.data.data.slice(0, 5));
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de minimarket</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* KPIs Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Ventas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  S/. {stats.TotalVentasMoneda?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Transacciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.TotalVentas || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Productos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.TotalProductos || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  S/. {stats.TicketPromedio?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Stock Crítico */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {stats.ProductosCriticos || 0}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Alertas de Stock</h2>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.ProductID}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{alert.ProductName}</p>
                    <p className="text-sm text-gray-600">Stock: {alert.StockActual} / Mínimo: {alert.StockMinimo}</p>
                  </div>
                  <span className="text-red-600 font-semibold">-{alert.FaltanUnidades} unid.</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No hay alertas de stock</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">
              Abrir Caja
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition">
              Nueva Venta
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition">
              Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
