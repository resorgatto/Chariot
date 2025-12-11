const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

type Tokens = {
  access: string | null;
  refresh: string | null;
};

export const getTokens = (): Tokens => ({
  access: localStorage.getItem(ACCESS_TOKEN_KEY),
  refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
});

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("auth");
  localStorage.removeItem("is_staff");
  localStorage.removeItem("is_superuser");
  localStorage.removeItem("is_driver");
  window.dispatchEvent(new Event("auth-changed"));
};

export type LoginResult = {
  access: string;
  refresh: string;
  me?: MeResponse;
};

export async function loginRequest(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Falha ao autenticar.");
  }

  const data = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  localStorage.setItem("auth", "true");
  // reset flags before preencher
  localStorage.setItem("is_staff", "false");
  localStorage.setItem("is_superuser", "false");
  localStorage.setItem("is_driver", "false");
  // Fetch role info
  let me: MeResponse | undefined;
  try {
    me = await fetch(`${API_URL}/api/me/`, {
      headers: { Authorization: `Bearer ${data.access}` },
    }).then((r) => r.json());
    localStorage.setItem("is_staff", String(me.is_staff ?? false));
    localStorage.setItem("is_superuser", String(me.is_superuser ?? false));
    localStorage.setItem("is_driver", String(me.is_driver ?? false));
  } catch {
    // Se falhar, garante que flags anteriores nao ficam penduradas
    localStorage.setItem("is_staff", "false");
    localStorage.setItem("is_superuser", "false");
    localStorage.setItem("is_driver", "false");
  }
  window.dispatchEvent(new Event("auth-changed"));
  return { access: data.access, refresh: data.refresh, me };
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  const response = await fetch(`${API_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  return data.access as string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const tokens = getTokens();
  if (!skipAuth && tokens.access) {
    headers.Authorization = `Bearer ${tokens.access}`;
  }

  const doRequest = async (token?: string) => {
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const resp = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    return resp;
  };

  let response = await doRequest();

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doRequest(newToken);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro na chamada da API.");
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export type Vehicle = {
  id: number;
  plate: string;
  model: string;
  capacity_kg: number;
  type: string;
  status?: string;
  garage?: number | null;
  image?: string | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
};

export type Garage = {
  id: number;
  name: string;
  address: string;
  capacity: number;
  postal_code?: string;
  street_number?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type DeliveryOrder = {
  id: number;
  client_name: string;
  status: string;
  deadline: string;
  driver?: number | null;
  driver_name?: string | null;
  vehicle?: number | null;
  vehicle_plate?: string | null;
  pickup_location?: any;
  dropoff_location?: any;
};

export type DashboardSummary = {
  vehicles: number;
  drivers: number;
  delivery_orders: number;
  in_transit_orders: number;
  garages: number;
};

export const fetchDashboardSummary = () =>
  apiFetch<DashboardSummary>("/api/dashboard-summary/");

export type UserNotification = {
  id: number;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
  order_id?: number | null;
  target_url?: string | null;
};

export type NotificationList = {
  results: UserNotification[];
  count?: number;
};

export type CoverageArea = {
  id: number;
  name: string;
  centroid_latitude?: number | null;
  centroid_longitude?: number | null;
  estimated_radius_km?: number | null;
};

export const fetchVehicles = () =>
  apiFetch<{ results: Vehicle[]; count: number }>("/api/vehicles/");

export const createVehicle = (
  payload: Partial<Vehicle> & { image_file?: File | null }
) => {
  const formData = new FormData();
  if (payload.plate) formData.append("plate", payload.plate);
  if (payload.model) formData.append("model", payload.model);
  if (payload.capacity_kg !== undefined)
    formData.append("capacity_kg", String(payload.capacity_kg));
  if (payload.type) formData.append("type", payload.type);
  if (payload.garage) formData.append("garage", String(payload.garage));
  if (payload.image_file) formData.append("image", payload.image_file);
  if (payload.set_latitude !== undefined)
    formData.append("set_latitude", String(payload.set_latitude));
  if (payload.set_longitude !== undefined)
    formData.append("set_longitude", String(payload.set_longitude));
  if (payload.status) formData.append("status", payload.status);

  return apiFetch<Vehicle>(
    "/api/vehicles/",
    {
      method: "POST",
      body: formData,
    },
    false
  );
};

export const updateVehicle = (
  id: number,
  payload: Partial<Vehicle> & { image_file?: File | null }
) => {
  const formData = new FormData();
  if (payload.plate) formData.append("plate", payload.plate);
  if (payload.model) formData.append("model", payload.model);
  if (payload.capacity_kg !== undefined)
    formData.append("capacity_kg", String(payload.capacity_kg));
  if (payload.type) formData.append("type", payload.type);
  if (payload.garage) formData.append("garage", String(payload.garage));
  if (payload.image_file) formData.append("image", payload.image_file);
  if (payload.set_latitude !== undefined)
    formData.append("set_latitude", String(payload.set_latitude));
  if (payload.set_longitude !== undefined)
    formData.append("set_longitude", String(payload.set_longitude));
  if (payload.status) formData.append("status", payload.status);

  return apiFetch<Vehicle>(
    `/api/vehicles/${id}/`,
    {
      method: "PATCH",
      body: formData,
    },
    false
  );
};

export const fetchGarages = () =>
  apiFetch<{ results: Garage[]; count: number }>("/api/garages/");

export const createGarage = (payload: Partial<Garage>) =>
  apiFetch<Garage>("/api/garages/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateGarage = (
  id: number,
  payload: Partial<Garage> & { capacity?: number }
) =>
  apiFetch<Garage>(`/api/garages/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteGarage = (id: number) =>
  apiFetch<void>(`/api/garages/${id}/`, {
    method: "DELETE",
  });

export type CepLookupResponse = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

export const lookupCep = (cep: string) =>
  apiFetch<CepLookupResponse>(
    `/api/cep-lookup/?cep=${encodeURIComponent(cep)}`,
    {},
    true
  );

export const fetchDeliveries = () =>
  apiFetch<{ results: DeliveryOrder[]; count: number }>(
    "/api/delivery-orders/"
  );

// Users (admin only)
export type AppUser = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
};

export type Driver = {
  id: number;
  user: number;
  license_number: string;
  current_status: string;
};

export const fetchUsers = () =>
  apiFetch<{ results: AppUser[]; count: number }>("/api/users/");

export const createUser = (payload: {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}) =>
  apiFetch<AppUser>("/api/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateUser = (
  id: number,
  payload: Partial<{
    username: string;
    password: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    is_active?: boolean;
  }>
) =>
  apiFetch<AppUser>(`/api/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteUser = (id: number) =>
  apiFetch<void>(`/api/users/${id}/`, { method: "DELETE" });

export type MeResponse = {
  id: number;
  username: string;
  email?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_driver: boolean;
  assigned_orders: Array<{
    id: number;
    client_name: string;
    status: string;
    vehicle?: number | null;
    vehicle_plate?: string | null;
    vehicle_model?: string | null;
    garage?: number | null;
    garage_name?: string | null;
  }>;
};

export const fetchMe = () => apiFetch<MeResponse>("/api/me/");

export const fetchNotifications = () =>
  apiFetch<NotificationList | UserNotification[]>("/api/notifications/");

export const markNotificationRead = (id: number) =>
  apiFetch<UserNotification>(`/api/notifications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: true }),
  });

export const markAllNotificationsRead = () =>
  apiFetch<{ updated: number }>("/api/notifications/mark-all-read/", {
    method: "POST",
  });

export const getPushPublicKey = () =>
  apiFetch<{ public_key: string }>("/api/push-subscriptions/public-key/");

export const savePushSubscription = (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  if (!json?.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Assinatura de push invalida.");
  }
  return apiFetch(`/api/push-subscriptions/`, {
    method: "POST",
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    }),
  });
};

// Drivers
export const fetchDrivers = () =>
  apiFetch<{ results: Driver[]; count: number }>("/api/drivers/");

export const createDriver = (payload: {
  user: number;
  license_number: string;
  current_status?: string;
}) =>
  apiFetch<Driver>("/api/drivers/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Delivery orders
export const fetchDeliveryOrders = () =>
  apiFetch<{ results: DeliveryOrder[]; count: number }>(
    "/api/delivery-orders/"
  );

export const createDeliveryOrder = (payload: {
  client_name: string;
  status?: string;
  deadline: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  driver?: number | null;
  vehicle?: number | null;
  garage?: number | null;
}) =>
  apiFetch<DeliveryOrder>("/api/delivery-orders/", {
    method: "POST",
    body: JSON.stringify({
      client_name: payload.client_name,
      status: payload.status || "pending",
      deadline: payload.deadline,
      driver: payload.driver ?? null,
      vehicle: payload.vehicle ?? null,
      garage: payload.garage ?? null,
      pickup_location: {
        type: "Point",
        coordinates: [payload.pickup_longitude, payload.pickup_latitude],
      },
      dropoff_location: {
        type: "Point",
        coordinates: [payload.dropoff_longitude, payload.dropoff_latitude],
      },
    }),
  });

export const updateDeliveryOrder = (
  id: number,
  payload: Partial<{
    status: string;
    driver: number | null;
    vehicle: number | null;
    deadline: string;
    client_name: string;
    garage: number | null;
  }>
) =>
  apiFetch<DeliveryOrder>(`/api/delivery-orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteDeliveryOrder = (id: number) =>
  apiFetch<void>(`/api/delivery-orders/${id}/`, {
    method: "DELETE",
  });

// Coverage check
export const checkCoverage = (payload: { latitude: number; longitude: number }) =>
  apiFetch<{ covered: boolean; areas: any[] }>("/api/coverage-check/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchCoverageAreas = () =>
  apiFetch<{ results: CoverageArea[]; count: number }>("/api/delivery-areas/");

export const createCoverageArea = (payload: {
  name: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
}) =>
  apiFetch<CoverageArea>("/api/delivery-areas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
