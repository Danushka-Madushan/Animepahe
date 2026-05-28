import axios from 'axios';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AUTH_TOKEN } from '../config/config';

interface AxiosRequest {
  server: string;
  endpoint: string;
  method: 'GET' | 'POST';
  data?: object;
}

const useAxios = () => {
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState<object>({});

  const request = async <T>({ server, method, endpoint, data: payload }: AxiosRequest) => {
    setLoading(true);
    try {
      const response = await axios.request<T>({
        method,
        url: `${server}${endpoint}`,
        data: { ...payload, auth: AUTH_TOKEN },
      });
      setData(response.data as object);
      return response.data;
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { data, request, isLoading };
};

export default useAxios;
