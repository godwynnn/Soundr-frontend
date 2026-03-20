"use client";
import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import store from '@/store/store';
import { rehydrate } from '@/store/authSlice';

import { GoogleOAuthProvider } from '@react-oauth/google';

function RehydrateWrapper({ children }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(rehydrate());
  }, [dispatch]);

  return children;
}

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <RehydrateWrapper>
          {children}
        </RehydrateWrapper>
      </GoogleOAuthProvider>
    </Provider>
  );
}
