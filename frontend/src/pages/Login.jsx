import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getDashboardPath, saveAuth } from '../utils/auth';
import api, { getApiError } from '../utils/api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
      try {
    setLoading(true);

    const { data } = await api.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    saveAuth(data.token, data.user);

    const redirectTo =
      location.state?.from && data.user.role === 'customer'
        ? location.state.from
        : getDashboardPath(data.user.role);

    navigate(redirectTo);
  } catch (err) {
    setError(getApiError(err, 'Unable to login right now'));
  } finally {
    setLoading(false);
  }
  };

  return (
    <main>
      <section>
        <div>
          <h1>Hargeisa Hall Finder</h1>
          <h2>Welcome Back</h2>
        </div>
      </section>
    </main>
  );
}

export default Login;