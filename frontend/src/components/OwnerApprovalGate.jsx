import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../utils/api';
import { clearAuth } from '../utils/auth';

function OwnerApprovalGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotel, setHotel] = useState(null);
  const [checking, setChecking] = useState(false);

  return null;
}

export default OwnerApprovalGate;