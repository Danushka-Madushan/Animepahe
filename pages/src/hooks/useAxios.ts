import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AUTH_TOKEN } from '../config/config';

interface AxiosRequest {
    server: string
    endpoint: `/${ string }`,
    method: "GET" | "POST",
    data?: object
}

const useAxios = () => {
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState<object>({})

    const request = async <T>({ server, method, endpoint, data: payload }: AxiosRequest) => {
        setLoading(true);
        try {
            const response = await axios.request<T>({
                method,
                url: `${ server }${ endpoint }`,
                data: { ...payload, auth: AUTH_TOKEN }
            });
            setData(response.data as object)
            return response.data
        } catch (error) {
            toast.error("An error occurred")
            return false
        } finally {
            setLoading(false)
        }
    }

    return { data, request, isLoading };
}

export default useAxios
