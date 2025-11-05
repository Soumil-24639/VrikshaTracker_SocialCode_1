import { useState, useCallback, useEffect } from 'react';
import { db } from '../services/db';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  data: { latitude: number; longitude: number; } | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    data: null,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Not an error object, but a string message for simplicity
      console.error("Geolocation is not supported by your browser");
      return;
    }

    setState({ loading: true, error: null, data: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          data: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        setState({ loading: false, error, data: null });
      }
    );
  }, []);

  return { ...state, getLocation };
};


/**
 * A custom hook to subscribe to data changes from the db service.
 * @param getter A function that retrieves the desired data from the db.
 * @returns The reactive data that will update on any db change.
 */
export const useDbData = <T>(getter: () => T) => {
    const [data, setData] = useState(() => getter());

    useEffect(() => {
        // Function to update the component's state with fresh data
        const updateData = () => {
            setData(getter());
        };

        // Subscribe to db changes
        const unsubscribe = db.subscribe(updateData);

        // Initial fetch in case data changed between render and effect
        updateData();

        // Unsubscribe on component unmount
        return () => unsubscribe();
    }, [getter]); // Re-subscribe if the getter function itself changes

    return data;
};
