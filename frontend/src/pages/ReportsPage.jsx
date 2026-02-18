import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Calendar, TrendingUp, Package, CreditCard } from 'lucide-react';
import { reportsService } from '../services/api';

export default function ReportsPage() {
  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [dateRange, setDateRange] = useState('week'); // week, month, year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Cargar datos de reportes
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ventasRes, productosRes, pagosRes, resumenRes] = await Promise.all([
          reportsService.getSalesReport(dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365),
          reportsService.getTopProducts(10),
          reportsService.getPaymentMethodsReport(dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365),
          reportsService.getDailySummary()
        ]);

        // Procesar datos de ventas (ordenar por fecha)
        if (ventasRes.data.data.length > 0) {
          const processedSales = ventasRes.data.data.map(item => ({
            fecha: new Date(item.FechaVenta).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
            total: parseFloat(item.TotalVentas),
            cantidad: item.CantidadTransacciones
          })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
          setSalesData(processedSales);
        }

        // Procesar datos de productos top
        if (productosRes.data.data.length > 0) {
          const processedProducts = productosRes.data.data.map(item => ({
            name: item.ProductName.substring(0, 15),
            cantidad: item.TotalVendido,
            monto: parseFloat(item.MontoTotal)
          }));
          setProductsData(processedProducts);
        }

        // Procesar datos de métodos de pago
        if (pagosRes.data.data.length > 0) {
          const processedPayments = pagosRes.data.data.map(item => ({
            name: item.MetodoPago,
            value: parseFloat(item.Monto),
            percentage: parseFloat(item.Porcentaje)
          }));
          setPaymentMethodsData(processedPayments);
        }

        // Procesar resumen diario
        if (resumenRes.data.data) {
          setDailyReport(resumenRes.data.data);
        }
      } catch (err) {
        setError('Error al cargar reportes: ' + err.message);
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes de Venta</h1>

        {/* Selector de rango de fechas */}
        <div className="flex gap-3">
          {['week', 'month', 'year'].map(range => (
             <button
               key={range}
               onClick={() => setDateRange(range)}
               className={`px-6 py-2 rounded-lg font-medium transition ${
                 dateRange === range
                   ? 'bg-blue-700 text-white'
                   : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
               }`}
            >
              {range === 'week' ? 'Esta Semana' : range === 'month' ? 'Este Mes' : 'Este Año'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {dailyReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
             <div>
                 <p className="text-gray-700 text-sm">Total Ventas</p>
                 <p className="text-2xl font-bold text-gray-900">
                  S/. {parseFloat(dailyReport.TotalVentas || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
             <div>
                 <p className="text-gray-700 text-sm">Transacciones</p>
                 <p className="text-2xl font-bold text-gray-900">
                  {dailyReport.CantidadTransacciones || 0}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
             <div>
                 <p className="text-gray-700 text-sm">Promedio Venta</p>
                 <p className="text-2xl font-bold text-gray-900">
                  S/. {(dailyReport.CantidadTransacciones > 0
                    ? parseFloat(dailyReport.TotalVentas || 0) / dailyReport.CantidadTransacciones
                    : 0).toFixed(2)
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
             <div>
                 <p className="text-gray-700 text-sm">Productos Vendidos</p>
                 <p className="text-2xl font-bold text-gray-900">
                  {dailyReport.TotalItems || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ventas por Día */}
        {salesData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Ventas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="fecha" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `S/. ${value.toFixed(2)}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Métodos de Pago */}
        {paymentMethodsData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Métodos de Pago</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `S/. ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Productos Top */}
      {productsData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top 10 Productos Vendidos</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={productsData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#6B7280"
              />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="cantidad" fill="#3B82F6" name="Cantidad Vendida" radius={[8, 8, 0, 0]} />
              <Bar dataKey="monto" fill="#10B981" name="Monto (S/.)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
