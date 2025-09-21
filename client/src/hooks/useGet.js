import axios from "axios";
import { auth } from "../firebase";
import { AuthAPi, getResError } from "../utils/fetcher";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";


export default function useGet(url, options) {
    const { onMount = true, defaultData, pagination, paginated } = options ?? {};
    const [data, setData] = useState(defaultData ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paginateOpts, setPaginateOpts] = useState({
        limit: 10,
        page: 0,
        totalPages: 1,
    });

    async function get(token) {
        setLoading(true);
        setError(null);
        console.log("useGet url", url);
        try {
            // const token = await auth.currentUser.getIdToken();
            const response = await axios.get(process.env.NODE_ENV == 'production' ? `https://freedombot.online/${url}` : `http://localhost:8001/${url}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("useGet response", response.data);
            setData(response.data?.data);
            console.log("useGet data", JSON.parse(JSON.stringify(response.data)));


        } catch (error) {
            const err = getResError(error);
            console.log("useGet error", err);
            notifications.show({
                title: "Failed to get data",
                message: err,
                color: "red",
            });
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    }

    const getPaginated = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await AuthAPi.get(pagination?.url ?? url, {
                params: paginateOpts,
            });
            console.log("getPaginated", response.data);
            const data = response.data?.data ?? response.data;
            setData((data?.content) ?? defaultData);
            setPaginateOpts((prev) => ({
                ...prev,
                totalPages: data?.totalPages ?? 0,
            }));
        } catch (error) {
            const err = getResError(error);
            console.log("useGet error", error);
            notifications.show({
                title: "Failed to get data",
                message: err,
                color: "red",
            });
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pagination?.url || paginated) return;
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                if (onMount) get(token);
            }
        });

        // Cleanup the subscription on component unmount
        return () => unsubscribe();
    }, [onMount]);

    useEffect(() => {
        if (pagination?.url || paginated) getPaginated();
    }, [paginateOpts.page, paginateOpts.limit]);

    return {
        data,
        loading,
        error,
        get,
        setData,
        paginateOpts,
        setPaginateOpts,
        getPaginated,
    };
}
