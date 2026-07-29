import { useState, useEffect } from 'react';
import { UserRole, User, Vehicle, ParkingSpace, ParkingReservation, VehicleService, InventoryItem, Payment } from './types';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { ConfirmEmailPage } from './components/ConfirmEmailPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ugpark_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('ugpark_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.role || UserRole.CUSTOMER;
      }
    } catch {}
    return UserRole.CUSTOMER;
  });

  const [showLoginPage, setShowLoginPage] = useState<boolean>(() => !localStorage.getItem('ugpark_current_user'));

  // Dedicated Confirm Email Page state
  const [showConfirmPage, setShowConfirmPage] = useState<boolean>(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    return (
      path === '/confirm-email' ||
      search.includes('confirm=') ||
      search.includes('token=') ||
      search.includes('code=') ||
      search.includes('token_hash=') ||
      hash.includes('access_token') ||
      hash.includes('type=signup')
    );
  });

  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [reservations, setReservations] = useState<ParkingReservation[]>([]);
  const [services, setServices] = useState<VehicleService[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulated IoT/System Notifications list
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchAllData = async () => {
    try {
      const [usrRes, vehRes, parkRes, reserveRes, serviceRes, invRes, payRes] = await Promise.allSettled([
        fetch('/api/users'),
        fetch('/api/vehicles'),
        fetch('/api/parking/spaces'),
        fetch('/api/parking/reservations'),
        fetch('/api/services'),
        fetch('/api/inventory'),
        fetch('/api/payments'),
      ]);

      const getJson = async (res: PromiseSettledResult<Response>) => {
        if (res.status === 'fulfilled' && res.value.ok) {
          return await res.value.json().catch(() => null);
        }
        return null;
      };

      const [usrData, vehData, parkData, reserveData, serviceData, invData, payData] = await Promise.all([
        getJson(usrRes),
        getJson(vehRes),
        getJson(parkRes),
        getJson(reserveRes),
        getJson(serviceRes),
        getJson(invRes),
        getJson(payRes),
      ]);

      if (usrData && Array.isArray(usrData)) setUsers(usrData);
      
      // Load and merge local vehicles
      let combinedVehicles: Vehicle[] = Array.isArray(vehData) ? [...vehData] : [];
      try {
        const savedVeh = localStorage.getItem('ugpark_local_vehicles');
        if (savedVeh) {
          const localVehs: Vehicle[] = JSON.parse(savedVeh);
          localVehs.forEach((lv) => {
            if (!combinedVehicles.some((v) => v.id === lv.id || v.registrationNumber === lv.registrationNumber)) {
              combinedVehicles.push(lv);
            }
          });
        }
      } catch {}

      if (combinedVehicles.length > 0) {
        setVehicles(combinedVehicles);
      } else if (Array.isArray(vehData)) {
        setVehicles(vehData);
      }

      if (parkData && Array.isArray(parkData)) setParkingSpaces(parkData);
      if (reserveData && Array.isArray(reserveData)) setReservations(reserveData);
      if (serviceData && Array.isArray(serviceData)) setServices(serviceData);
      if (invData && Array.isArray(invData)) setInventory(invData);
      if (payData && Array.isArray(payData)) setPayments(payData);

      // Keep currentUser synced if user list updated
      if (currentUser && usrData && Array.isArray(usrData)) {
        const matched = usrData.find((u: User) => u.id === currentUser.id);
        if (matched) {
          setCurrentUser(matched);
        }
      }

      setError('');
    } catch (err: any) {
      console.warn('Sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll data state every 8 seconds to reflect background attendant/technician simulation adjustments instantly!
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== UserRole.ADMINISTRATOR) {
      if (currentRole !== currentUser.role) {
        setCurrentRole(currentUser.role);
      }
    }
  }, [currentUser, currentRole]);

  const handleClearNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleTriggerSimulatedNotification = (text: string, type: string = 'info') => {
    const newNotif = {
      id: Date.now(),
      text,
      type,
      time: 'Just now',
    };
    setNotifications([newNotif, ...notifications].slice(0, 5));
  };

  const handleRoleChange = (role: UserRole) => {
    // Only Administrators can switch view modes across portals
    if (currentUser?.role === UserRole.ADMINISTRATOR) {
      setCurrentRole(role);
      handleTriggerSimulatedNotification(`View mode updated to ${role}.`, 'info');
    } else if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('ugpark_current_user');
    } catch {}
    setCurrentUser(null);
    setShowLoginPage(true);
    handleTriggerSimulatedNotification('Signed out from account session.', 'info');
  };

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem('ugpark_current_user', JSON.stringify(user));
    } catch {}
    setCurrentUser(user);
    setCurrentRole(user.role);
    setShowLoginPage(false);
    setShowConfirmPage(false);
    setNotifications([]); // Clear any old notifications on new user login
    
    // Optimistically update local users state so it's instantly reflected
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [...prev, user];
    });

    fetchAllData();
  };

  if (showConfirmPage) {
    return (
      <ConfirmEmailPage
        onConfirmSuccess={handleLoginSuccess}
        onGoToLogin={() => {
          setShowConfirmPage(false);
          setShowLoginPage(true);
        }}
      />
    );
  }

  if (showLoginPage || !currentUser) {
    return (
      <LoginPage
        currentUser={currentUser}
        users={users}
        onLogin={handleLoginSuccess}
        onGoToConfirmEmail={() => setShowConfirmPage(true)}
        onCancel={currentUser ? () => setShowLoginPage(false) : undefined}
      />
    );
  }

  return (
    <Dashboard
      currentUser={currentUser}
      users={users}
      currentRole={currentRole}
      onRoleChange={handleRoleChange}
      onOpenLogin={() => setShowLoginPage(true)}
      onSignOut={handleSignOut}
      vehicles={vehicles}
      parkingSpaces={parkingSpaces}
      reservations={reservations}
      services={services}
      inventory={inventory}
      payments={payments}
      onRefreshAll={fetchAllData}
      notifications={notifications}
      onClearNotifications={() => setNotifications([])}
    />
  );
}

