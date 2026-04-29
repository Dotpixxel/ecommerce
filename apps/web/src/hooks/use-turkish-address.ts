import { useQuery } from "@tanstack/react-query";

export const API_BASE_URL = "https://api.turkiyeapi.dev/v1";

export interface Province {
	id: number;
	name: string;
}

export interface District {
	id: number;
	name: string;
	provinceId: number;
}

export interface Neighborhood {
	id: number;
	name: string;
	districtId: number;
}

export function useProvinces() {
	return useQuery({
		queryKey: ["provinces"],
		queryFn: async () => {
			const res = await fetch(`${API_BASE_URL}/provinces`);
			const data = await res.json();
			return data.data as Province[];
		},
	});
}

export function useDistricts(provinceId?: string | number | null) {
	return useQuery({
		queryKey: ["districts", provinceId],
		queryFn: async () => {
			if (!provinceId) return [];
			const res = await fetch(
				`${API_BASE_URL}/districts?provinceId=${provinceId}`,
			);
			const data = await res.json();
			return data.data as District[];
		},
		enabled: !!provinceId,
	});
}

export function useNeighborhoods(districtId?: string | number | null) {
	return useQuery({
		queryKey: ["neighborhoods", districtId],
		queryFn: async () => {
			if (!districtId) return [];
			const res = await fetch(
				`${API_BASE_URL}/neighborhoods?districtId=${districtId}`,
			);
			const data = await res.json();
			return data.data as Neighborhood[];
		},
		enabled: !!districtId,
	});
}
