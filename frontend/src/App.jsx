import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout from './layouts/OwnerLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public website/Home';
import VenueDetails from './pages/public website/VenueDetails';
import Hotels from './pages/public website/Hotels';
import HotelDetails from './pages/public website/HotelDetails';
import Contact from './pages/public website/Contact';
import Login from './pages/public website/Login';
import Signup from './pages/public website/Signup';
import CustomerOverview from './pages/customer/CustomerOverview';
import MyBookings from './pages/customer/MyBookings';
import MyAppointments from './pages/customer/MyAppointments';
import CustomerProfile from './pages/customer/CustomerProfile';
import OwnerOverview from './pages/owner/OwnerOverview';
import HotelProfile from './pages/owner/HotelProfile';
import ManageHalls from './pages/owner/ManageHalls';
import HallForm from './pages/owner/HallForm';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerReports from './pages/owner/OwnerReports';
import AdminOverview from './pages/admin/AdminOverview';
import AdminHotels from './pages/admin/AdminHotels';
import AdminVenues from './pages/admin/AdminVenues';
import AdminReports from './pages/admin/AdminReports';
import AdminOperationsReports from './pages/admin/AdminOperationsReports';
import AdminRevenueReports from './pages/admin/AdminRevenueReports';
import AdminPerformanceReports from './pages/admin/AdminPerformanceReports';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#a33a4a', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venues" element={<Navigate to="/hotels" replace />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/customer"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CustomerOverview />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          <Route
            path="/owner"
            element={
              <ProtectedRoute roles={['hotel_owner']}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<OwnerOverview />} />
            <Route path="hotel-profile" element={<HotelProfile />} />
            <Route path="halls" element={<ManageHalls />} />
            <Route path="halls/new" element={<HallForm />} />
            <Route path="halls/:id/edit" element={<HallForm />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="reports" element={<OwnerReports />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="venues" element={<AdminVenues />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="reports/operations" element={<AdminOperationsReports />} />
            <Route path="reports/revenue" element={<AdminRevenueReports />} />
            <Route
              path="reports/performance"
              element={<AdminPerformanceReports />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
