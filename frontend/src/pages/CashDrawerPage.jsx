import { useEffect, useState } from 'react';
import {
  Plus, X, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { cashDrawerService } from '../services/api';
import usePOSStore from '../stores/posStore';

export default function CashDrawerPage() {
  const { setCashDrawerId } = usePOSStore();

  const [cashDrawers, setCashDrawers] = useState([]);
  const [currentCashDrawer, setCurrentCashDrawer] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialAmount, setInitialAmount] = useState('');
  const [finalAmount, setFinalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState('current'); // current, history
  const [movements, setMovements] = useState([]);

  // Cargar historial y caja actual
  useEffect(() => {
    fetchCashDrawers();
  }, []);

  const fetchCashDrawers = async () => {
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        cashDrawerService.getCurrentCashDrawer().catch(() => null),
        cashDrawerService.getCashDrawerHistory(1, 100)
      ]);

      if (currentRes?.data?.data) {
        setCurrentCashDrawer(currentRes.data.data);
        setCashDrawerId(currentRes.data.data.CashDrawerID);
      }

      if (historyRes?.data?.data?.data) {
        setCashDrawers(historyRes.data.data.data);
      }
    } catch (error) {
      console.error('Error cargando cajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCashDrawer = async () => {
    if (!initialAmount) {
      alert('Ingresa monto inicial');
      return;
    }

    setProcessing(true);
    try {
      const response = await cashDrawerService.openCashDrawer({
        initialAmount: parseFloat(initialAmount),
        notes
      });

      setCurrentCashDrawer(response.data.data);
      setCashDrawerId(response.data.data.CashDrawerID);
      setShowOpenModal(false);
      setInitialAmount('');
      setNotes('');
      alert('¡Caja abierta exitosamente!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Error al abrir caja');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseCashDrawer = async () => {
    if (!currentCashDrawer) {
      alert('No hay caja abierta');
      return;
    }

    if (!finalAmount) {
      alert('Ingresa monto final de caja');
      return;
    }

    setProcessing(true);
    try {
      const response = await cashDrawerService.closeCashDrawer(currentCashDrawer.CashDrawerID, {
        finalAmount: parseFloat(finalAmount),
        notes
      });

      // Actualizar historial
      await fetchCashDrawers();
      setShowCloseModal(false);
      setFinalAmount('');
      setNotes('');
      alert('¡Caja cerrada exitosamente!');
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Error al cerrar caja');
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadMovements = async (cashDrawerId) => {
    try {
      const response = await cashDrawerService.getCashDrawerMovements(cashDrawerId);
      setMovements(response.data.data || []);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      setMovements([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestión de Caja</h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTab('current')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === 'current'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Caja Actual
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Caja Actual */}
      {tab === 'current' && (
        <div>
          {currentCashDrawer ? (
            <div className="space-y-6">
              {/* Estado de Caja */}
              <div className="bg-white rounded-lg shadow p-8 border-l-4 border-green-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Estado</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">ABIERTA</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Monto Inicial</p>
                    <p className="text-2xl font-bold text-gray-900">
                      S/. {parseFloat(currentCashDrawer.OpeningBalance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Ventas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      S/. {parseFloat(currentCashDrawer.TotalSales || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Saldo Actual</p>
                    <p className="text-2xl font-bold text-green-600">
                      S/. {(parseFloat(currentCashDrawer.OpeningBalance || 0) + 
                            parseFloat(currentCashDrawer.TotalSales || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cerrar Caja
                  </button>
                  <button
                    onClick={() => handleLoadMovements(currentCashDrawer.CashDrawerID)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Ver Movimientos
                  </button>
                </div>
              </div>

              {/* Movimientos de Caja */}
              {movements.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Movimientos de Caja</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Tipo</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Descripción</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movements.map((movement) => (
                          <tr key={movement.CashMovementID} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(movement.CreatedAt).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                movement.Type === 'DEPOSIT' 
                                  ? 'bg-green-100 text-green-800'
                                  : movement.Type === 'WITHDRAWAL'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {movement.Type === 'DEPOSIT' ? 'Depósito' : movement.Type === 'WITHDRAWAL' ? 'Retiro' : 'Venta'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {movement.Description}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-right">
                              <span className={movement.Type === 'DEPOSIT' || movement.Type === 'SALE' ? 'text-green-600' : 'text-red-600'}>
                                {movement.Type === 'WITHDRAWAL' ? '-' : '+'} S/. {Math.abs(parseFloat(movement.Amount || 0)).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No hay caja abierta</h2>
              <p className="text-gray-600 mb-6">
                Abre una caja para comenzar a registrar ventas
              </p>
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Abrir Nueva Caja
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Historial de Cajas</h2>

          {cashDrawers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay historial de cajas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Apertura</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Cierre</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Monto Inicial</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Ventas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Monto Final</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Diferencia</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cashDrawers.map((cashDrawer) => {
                    const inicial = parseFloat(cashDrawer.OpeningBalance || 0);
                    const final = parseFloat(cashDrawer.ClosingBalance || 0);
                    const diferencia = final - (inicial + parseFloat(cashDrawer.TotalSales || 0));

                    return (
                      <tr key={cashDrawer.CashDrawerID} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(cashDrawer.OpenedAt).toLocaleDateString('es-PE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {cashDrawer.ClosedAt
                            ? new Date(cashDrawer.ClosedAt).toLocaleDateString('es-PE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right">
                          S/. {inicial.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-blue-600">
                          S/. {parseFloat(cashDrawer.TotalSales || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right">
                          S/. {final.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right">
                          <span className={diferencia >= -1 && diferencia <= 1 ? 'text-green-600' : 'text-red-600'}>
                            {diferencia >= 0 ? '+' : ''} S/. {diferencia.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            cashDrawer.Status === 'CLOSED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cashDrawer.Status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Abrir Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Abrir Nueva Caja</h2>
              <button
                onClick={() => {
                  setShowOpenModal(false);
                  setInitialAmount('');
                  setNotes('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Monto Inicial (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones al abrir caja..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOpenModal(false);
                  setInitialAmount('');
                  setNotes('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenCashDrawer}
                disabled={processing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {processing ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cerrar Caja */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cerrar Caja</h2>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setFinalAmount('');
                  setNotes('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {currentCashDrawer && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Inicial:</span>
                  <span className="font-semibold">
                    S/. {parseFloat(currentCashDrawer.OpeningBalance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Ventas:</span>
                  <span className="font-semibold text-blue-600">
                    S/. {parseFloat(currentCashDrawer.TotalSales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>Esperado:</span>
                  <span className="text-green-600">
                    S/. {(parseFloat(currentCashDrawer.OpeningBalance || 0) + 
                          parseFloat(currentCashDrawer.TotalSales || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Monto Final Contado (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones al cerrar caja..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setFinalAmount('');
                  setNotes('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCashDrawer}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {processing ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
