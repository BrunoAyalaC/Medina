import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Home,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', roles: ['Administrador', 'Gerente', 'Cajero'] },
    { icon: ShoppingCart, label: 'POS', href: '/pos', roles: ['Cajero', 'Administrador'] },
    { icon: DollarSign, label: 'Caja', href: '/cash-drawer', roles: ['Cajero', 'Administrador', 'Gerente'] },
    { icon: Package, label: 'Inventario', href: '/inventory', roles: ['Administrador', 'Gerente'] },
    { icon: Package, label: 'Productos', href: '/products', roles: ['Administrador'] },
    { icon: BarChart3, label: 'Reportes', href: '/reports', roles: ['Administrador', 'Gerente'] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.RoleName)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 bg-gray-800 flex items-center justify-between px-4">
          {sidebarOpen && (
            <div>
              <h2 className="font-bold text-lg">Minimarket</h2>
              <p className="text-xs text-gray-400">PRO</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-700 p-1 rounded transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition group"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="h-16 bg-gray-800 px-2 py-2 border-t border-gray-700">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {user?.FullName?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.FullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.RoleName}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Minimarket</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{new Date().toLocaleDateString('es-PE')}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
