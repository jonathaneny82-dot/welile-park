import { useState, useEffect } from 'react';
import { UserRole, User, Vehicle, ParkingSpace, ParkingReservation, VehicleService, InventoryItem, Payment } from './types';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';

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
      const [usrRes, vehRes, parkRes, reserveRes, serviceRes, invRes, payRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/vehicles'),
        fetch('/api/parking/spaces'),
        fetch('/api/parking/reservations'),
        fetch('/api/services'),
        fetch('/api/inventory'),
        fetch('/api/payments'),
      ]);

      if (!usrRes.ok || !vehRes.ok || !parkRes.ok || !reserveRes.ok || !serviceRes.ok || !invRes.ok || !payRes.ok) {
        throw new Error('Failed to synchronize data state from server.');
      }

      const [usrData, vehData, parkData, reserveData, serviceData, invData, payData] = await Promise.all([
        usrRes.json(),
        vehRes.json(),
        parkRes.json(),
        reserveRes.json(),
        serviceRes.json(),
        invRes.json(),
        payRes.json(),
      ]);

      setUsers(usrData);
      setVehicles(vehData);
      setParkingSpaces(parkData);
      setReservations(reserveData);
      setServices(serviceData);
      setInventory(invData);
      setPayments(payData);

      // Keep currentUser synced if user list updated
      if (currentUser) {
        const matched = usrData.find((u: User) => u.id === currentUser.id);
        if (matched) {
          setCurrentUser(matched);
        }
      }

      setError('');
    } catch (err: any) {
      setError(err.message || 'Connecting to integrated server...');
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

  if (showLoginPage || !currentUser) {
    return (
      <LoginPage
        currentUser={currentUser}
        users={users}
        onLogin={handleLoginSuccess}
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

