const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CategoryConsumableAccount = {
  id: number;
  accountNo?: string | null;
  accountDescription: string;
};

export type CategoryType = "Consumable" | "NonConsumable";

export type Category = {
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive" | string;
  categoryType: CategoryType;
  createdAt: string;
  updatedAt: string;
  consumableAccountId?: number | null;
  consumableAccount?: CategoryConsumableAccount | null;
};

export type SubCategory = {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  status: "Active" | "Inactive" | string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
};

export type Uom = {
  id: string;
  name: string;
  symbol: string;
  status: "Active" | "Inactive" | string;
  createdAt: string;
  updatedAt: string;
};

export type Brand = {
  id: string;
  name: string;
  status: "Active" | "Inactive" | string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  sku?: string | null;
  name: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  barcode?: string | null;
  costPrice?: string | number;
  sellingPrice?: string | number;
  lowStockThreshold?: number;
  currentStock?: string | number | null;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Inactive" | string;
  // List responses may include only partial relation objects
  category?: { name?: string } | null;
  subCategory?: { name?: string } | null;
  brand?: { name?: string } | null;
  uom?: { name?: string; symbol?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export type Supplier = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  notes?: string | null;
  status: "Active" | "Inactive" | string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { firstName?: string; lastName?: string };
};

export type Purchase = {
  id: string;
  itemId: string;
  supplierId: string | null;
  receiverId: string | null;
  supplierReceiver: string | null;
  transactionType: "purchase";
  qtyIn: string;
  inCost: string;
  qtyOut: string;
  outCost: string;
  amountPaid: string;
  status: "pending" | "completed" | "cancelled" | string;
  referenceNo: string | null;
  notes: string | null;
  studentId: string | null;
  classId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  classInventoryDistributionId: string | null;
  storeId?: string | null;
  item?: { name?: string } | null;
  supplier?: { name?: string } | null;
  store?: { id: string; name?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export type GroupedPurchaseLineItem = {
  id: string;
  itemId: string;
  item?: { name?: string } | null;
  qtyIn: string;
  inCost: string;
  status: string;
};

export type GroupedPurchase = {
  supplierId: string;
  transactionType: "purchase";
  referenceNo: string;
  storeId: string;
  transactionDate: string;
  status: string;
  amountPaid: string;
  supplier?: { name?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
  store?: { id: string; name?: string } | null;
  notes?: string | null;
  items: GroupedPurchaseLineItem[];
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers || {}) as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text.trim() || res.statusText || `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        message = parsed.message.trim();
      }
    } catch {
      /* not JSON — keep message as body text or status */
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  // Fallback to text when no JSON
  return (await res.text()) as unknown as T;
}

export const get = <T = any>(path: string) =>
  request<T>(path, { method: "GET" });
export const post = <T = any, B = any>(path: string, body?: B) =>
  request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
export const put = <T = any, B = any>(path: string, body?: B) =>
  request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
export const patch = <T = any, B = any>(path: string, body?: B) =>
  request<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
export const del = <T = any>(path: string) =>
  request<T>(path, { method: "DELETE" });

// Category-specific helpers (thin wrappers)
export const fetchCategories = (params?: {
  status?: string;
  categoryType?: CategoryType;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.append("status", params.status);
  if (params?.categoryType) sp.append("categoryType", params.categoryType);
  if (params?.page != null) sp.append("page", String(params.page));
  if (params?.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<ApiResponse<{ categories: Category[]; pagination: Pagination }>>(
    `/api/v1/categories${qs ? `?${qs}` : ""}`
  );
};

export const fetchCategoryById = (id: string) =>
  get<ApiResponse<Category>>(`/api/v1/categories/${id}`);

export const createCategory = (body: {
  name: string;
  description?: string;
  categoryType: CategoryType;
  consumableAccountId?: number | null;
}) => post<ApiResponse<Category>, typeof body>("/api/v1/categories", body);

export const updateCategory = (
  id: string,
  body: {
    name?: string;
    description?: string;
    categoryType?: CategoryType;
    status?: "Active" | "Inactive";
    consumableAccountId?: number | null;
  }
) => put<ApiResponse<Category>, typeof body>(`/api/v1/categories/${id}`, body);

export const deleteCategory = (id: string) =>
  del<any>(`/api/v1/categories/${id}`);

/** Account charts under the consumable expense default subhead (category GL link). */
export const CONSUMABLE_EXPENSE_SETTINGS_ID = "COMSUMABLE_EXPENSE_SUBHEAD";

export type ConsumableExpenseAccountChartsData = {
  settingsId: string;
  subheadId: number;
  accountCharts: AccountChart[];
};

export const fetchConsumableExpenseAccountCharts = () =>
  get<ApiResponse<ConsumableExpenseAccountChartsData>>(
    `/api/v1/default-subhead-settings/${encodeURIComponent(CONSUMABLE_EXPENSE_SETTINGS_ID)}/account-charts`
  );

export const categoryApi = {
  list: fetchCategories,
  getById: fetchCategoryById,
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
  consumableExpenseAccountCharts: fetchConsumableExpenseAccountCharts,
};

// Brand-specific helpers
export const fetchBrands = (params?: { page?: number; limit?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ brands: Brand[]; pagination: Pagination }>>(
    `/api/v1/brands${qs ? `?${qs}` : ""}`
  );
};
export const createBrand = (body: {
  name: string;
  status?: "Active" | "Inactive" | string;
}) => post<ApiResponse<Brand>, typeof body>("/api/v1/brands", body);
export const updateBrand = (id: string, body: { name?: string }) =>
  put<ApiResponse<Brand>, typeof body>(`/api/v1/brands/${id}`, body);
export const deleteBrand = (id: string) =>
  del<ApiResponse<Brand>>(`/api/v1/brands/${id}`);

export const brandApi = {
  list: fetchBrands,
  create: createBrand,
  update: updateBrand,
  remove: deleteBrand,
};

// Supplier-specific helpers
export const fetchSuppliers = (params?: {
  status?: "Active" | "Inactive" | string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ suppliers: Supplier[]; pagination: Pagination }>>(
    `/api/v1/suppliers${qs ? `?${qs}` : ""}`
  );
};
export const createSupplier = (body: {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  notes?: string;
  status?: "Active" | "Inactive" | string;
}) => post<ApiResponse<Supplier>, typeof body>("/api/v1/suppliers", body);
export const updateSupplier = (id: string, body: Partial<Supplier>) =>
  put<ApiResponse<Supplier>, typeof body>(`/api/v1/suppliers/${id}`, body);
export const deleteSupplier = (id: string) =>
  del<ApiResponse<Supplier>>(`/api/v1/suppliers/${id}`);

export const supplierApi = {
  list: fetchSuppliers,
  create: createSupplier,
  update: updateSupplier,
  remove: deleteSupplier,
};

// Sub-category-specific helpers
export const fetchSubCategories = (params?: {
  categoryId?: string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.append("categoryId", params.categoryId);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ subCategories: SubCategory[]; pagination: Pagination }>>(
    `/api/v1/sub-categories${qs ? `?${qs}` : ""}`
  );
};
export const createSubCategory = (body: {
  name: string;
  description?: string;
  categoryId: string;
}) =>
  post<ApiResponse<SubCategory>, typeof body>("/api/v1/sub-categories", body);
export const updateSubCategory = (
  id: string,
  body: { name?: string; description?: string; category_id?: string }
) => put<ApiResponse<SubCategory>, typeof body>(`/api/v1/sub-categories/${id}`, body);
export const deleteSubCategory = (id: string) =>
  del<ApiResponse<SubCategory>>(`/api/v1/sub-categories/${id}`);

export const subCategoryApi = {
  list: fetchSubCategories,
  create: createSubCategory,
  update: updateSubCategory,
  remove: deleteSubCategory,
};

export type FacilityCreatedBy = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Facility = {
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive" | string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  CreatedBy?: FacilityCreatedBy | null;
  _count?: { inventoryTransactions?: number };
};

export const fetchFacilities = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.append("status", params.status);
  if (params?.page != null) sp.append("page", String(params.page));
  if (params?.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<ApiResponse<{ facilities: Facility[]; pagination: Pagination }>>(
    `/api/v1/facilities${qs ? `?${qs}` : ""}`
  );
};

export const fetchFacilityById = (id: string) =>
  get<ApiResponse<Facility>>(`/api/v1/facilities/${id}`);

export const createFacility = (body: { name: string; description?: string }) =>
  post<ApiResponse<Facility>, typeof body>("/api/v1/facilities", body);

export const updateFacility = (
  id: string,
  body: {
    name?: string;
    description?: string;
    status?: "Active" | "Inactive";
  }
) => put<ApiResponse<Facility>, typeof body>(`/api/v1/facilities/${id}`, body);

export const deleteFacility = (id: string) => del<any>(`/api/v1/facilities/${id}`);

export const facilityApi = {
  list: fetchFacilities,
  getById: fetchFacilityById,
  create: createFacility,
  update: updateFacility,
  remove: deleteFacility,
};

// UOM-specific helpers
export const fetchUoms = (params?: { page?: number; limit?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ uoms: Uom[]; pagination: Pagination }>>(
    `/api/v1/uoms${qs ? `?${qs}` : ""}`
  );
};
export const createUom = (body: {
  name: string;
  symbol: string;
  status?: "Active" | "Inactive" | string;
}) => post<ApiResponse<Uom>, typeof body>("/api/v1/uoms", body);
export const updateUom = (
  id: string,
  body: { name?: string; symbol?: string }
) => put<ApiResponse<Uom>, typeof body>(`/api/v1/uoms/${id}`, body);
export const deleteUom = (id: string) =>
  del<ApiResponse<Uom>>(`/api/v1/uoms/${id}`);

export const uomApi = {
  list: fetchUoms,
  create: createUom,
  update: updateUom,
  remove: deleteUom,
};

// Session-specific helpers
export const fetchSessions = (params?: {
  status?: "active" | "inactive" | "archived";
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  const queryString = queryParams.toString();
  return get<any[]>(
    `/api/v1/academic_session_terms${queryString ? `?${queryString}` : ""}`
  );
};
export const createSession = (body: {
  session: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive" | "archived";
}) => post<any>("/api/v1/academic_session_terms", body);
export const updateSession = (
  id: string,
  body: {
    session?: string;
    name?: string;
    start_date?: string;
    end_date?: string;
    status?: "active" | "inactive" | "archived";
  }
) => put<any>(`/api/v1/academic_session_terms/${id}`, body);
export const deleteSession = (id: string) =>
  del<any>(`/api/v1/academic_session_terms/${id}`);

export const sessionApi = {
  list: fetchSessions,
  create: createSession,
  update: updateSession,
  remove: deleteSession,
};

// School Sessions (new endpoint: /api/v1/sessions)
export const fetchSchoolSessions = (params?: { page?: number; limit?: number; status?: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.status) queryParams.append("status", params.status);
  const qs = queryParams.toString();
  return get<any>(`/api/v1/sessions${qs ? `?${qs}` : ""}`);
};

export const createSchoolSession = (body: { name: string; status: "Active" | "Inactive" }) =>
  post<any>("/api/v1/sessions", body);

export const updateSchoolSession = (
  id: string,
  body: Partial<{ name: string; status: "Active" | "Inactive" | string }>
) => put<any>(`/api/v1/sessions/${id}`, body);

export const deleteSchoolSession = (id: string) => del<any>(`/api/v1/sessions/${id}`);

export const schoolSessionApi = {
  list: fetchSchoolSessions,
  create: createSchoolSession,
  update: updateSchoolSession,
  remove: deleteSchoolSession,
};

// School Terms (endpoint: /api/v1/terms)
export const fetchTerms = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  /** When supported, returns terms for this school session */
  sessionId?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.status) queryParams.append("status", params.status);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  const qs = queryParams.toString();
  return get<any>(`/api/v1/terms${qs ? `?${qs}` : ""}`);
};

export const createTerm = (body: {
  name: string;
  status: "Active" | "Inactive";
  sessionId?: string;
}) => post<any>("/api/v1/terms", body);

export const updateTerm = (
  id: string,
  body: Partial<{
    name: string;
    status: "Active" | "Inactive" | string;
    sessionId?: string;
  }>
) => put<any>(`/api/v1/terms/${id}`, body);

export const deleteTerm = (id: string) => del<any>(`/api/v1/terms/${id}`);

export const termApi = {
  list: fetchTerms,
  create: createTerm,
  update: updateTerm,
  remove: deleteTerm,
};

/** Global academic active period (billing/collections context) */
export type ActivePeriod = {
  id: string;
  startDate: string;
  endDate: string;
  sessionId: string;
  termId: string;
  updatedAt?: string;
  session?: { id: string; name: string };
  term?: { id: string; name: string };
};

export const fetchActivePeriod = () =>
  get<ApiResponse<ActivePeriod>>("/api/v1/active-period");

export const upsertActivePeriod = (body: {
  startDate: string;
  endDate: string;
  sessionId: string;
  termId: string;
}) =>
  put<ApiResponse<ActivePeriod>, typeof body>("/api/v1/active-period", body);

export const activePeriodApi = {
  get: fetchActivePeriod,
  upsert: upsertActivePeriod,
};

/** Same shape as active period; used for default student billing window */
export type DefaultBillingPeriod = ActivePeriod;

export const fetchDefaultBillingPeriod = () =>
  get<ApiResponse<DefaultBillingPeriod>>("/api/v1/default-billing-period");

export const upsertDefaultBillingPeriod = (body: {
  startDate: string;
  endDate: string;
  sessionId: string;
  termId: string;
}) =>
  put<ApiResponse<DefaultBillingPeriod>, typeof body>("/api/v1/default-billing-period", body);

export const defaultBillingPeriodApi = {
  get: fetchDefaultBillingPeriod,
  upsert: upsertDefaultBillingPeriod,
};

// Student Collections (new API)
export type StudentCollectionRow = {
  id: string;
  itemId: string;
  transactionType: "student_collection" | string;
  qtyOut: string;
  referenceNo: string | null;
  notes: string | null;
  studentId: string | null;
  classId: string | null;
  sessionId: string | null;
  termId: string | null;
  subclassId: string | null;
  storeId?: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  store?: { id: string; name?: string } | null;
  student?: {
    id: string;
    admissionNumber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

// Staff (new API)
export type StaffPosition =
  | "class_teacher"
  | "assistant_teacher"
  | "subject_teacher"
  | "principal"
  | "vice_principal"
  | "teacher"
  | "admin"
  | "other";

export type StaffStatus = "Active" | "Inactive" | "Archived";

export type Staff = {
  id: string;
  StaffNumber?: string | null;
  email?: string | null;
  name?: string | null;
  position?: StaffPosition | string | null;
  role?: string | null;
  status?: StaffStatus | string | null;
  profileImageUrl?: string | null;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: string | null;
  user?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    isActive?: boolean;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export const fetchStaff = (params?: {
  q?: string;
  position?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  if (params?.q) queryParams.append("q", params.q);
  if (params?.position) queryParams.append("position", params.position);
  if (params?.status) queryParams.append("status", params.status);
  const qs = queryParams.toString();
  return get<ApiResponse<{ staff: Staff[]; pagination: Pagination }>>(
    `/api/v1/staff${qs ? `?${qs}` : ""}`,
  );
};

export const createStaff = (body: {
  StaffNumber: string;
  email: string;
  name: string;
  position: StaffPosition | string;
  status: StaffStatus;
  profileImageUrl?: string;
  password: string;
  phoneNumber?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  appRoleId: string;
  userType: string;
}) => post<ApiResponse<Staff>>("/api/v1/staff", body);

export const updateStaff = (
  id: string,
  body: {
    StaffNumber?: string;
    name?: string;
    position?: StaffPosition | string;
    status?: StaffStatus;
    profileImageUrl?: string;
  },
) => put<ApiResponse<Staff>>(`/api/v1/staff/${id}`, body);

export const staffApi = {
  list: fetchStaff,
  create: createStaff,
  update: updateStaff,
};

// Staff Collections (new API)
export type StaffCollectionRow = {
  id: string;
  itemId: string;
  transactionType: "staff_collection" | string;
  qtyOut: string;
  referenceNo: string | null;
  notes: string | null;
  staffId: string | null;
  sessionId: string | null;
  termId: string | null;
  storeId?: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  store?: { id: string; name?: string } | null;
  staff?: {
    id: string;
    StaffNumber?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export const fetchStaffCollections = (params?: {
  page?: number;
  limit?: number;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  itemId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.staffId) queryParams.append("staffId", params.staffId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.referenceNo) queryParams.append("referenceNo", params.referenceNo);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      staffCollections: StaffCollectionRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/staff-collections?${queryParams.toString()}`);
};

export const createStaffCollectionsBulk = (body: {
  staffId: string;
  storeId: string;
  referenceNo?: string;
  notes?: string;
  transactionDate: string;
  items: { itemId: string; qtyOut: number }[];
}) => post<ApiResponse<StaffCollectionRow[]>, typeof body>(
  "/api/v1/staff-collections/bulk",
  body
);

export const deleteStaffCollection = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/staff-collections/${id}`);

export const staffCollectionsApi = {
  list: fetchStaffCollections,
  bulkCreate: createStaffCollectionsBulk,
  remove: deleteStaffCollection,
};

// Donations (inventory donations)
export type DonationRow = {
  id: string;
  itemId: string;
  transactionType: "donation" | string;
  qtyIn: string;
  referenceNo: string | null;
  notes: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  storeId?: string | null;
  item?: { name?: string } | null;
  store?: { id: string; name?: string } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  acknowledgedByUser?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

export type InventoryReceiveAcknowledgementResult = {
  referenceNo: string;
  storeId: string;
  store?: { id: string; name?: string } | null;
  acknowledgedAt: string;
  acknowledgedBy: string;
  transactionCount: number;
};

export const createInventoryReceiveAcknowledgement = (body: {
  referenceNo: string;
}) =>
  post<
    ApiResponse<InventoryReceiveAcknowledgementResult>,
    typeof body
  >("/api/v1/inventory-receive-acknowledgements", body);

export const fetchDonations = (params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  storeId?: string;
  sessionId?: string;
  termId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.storeId) queryParams.append("storeId", params.storeId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.referenceNo) queryParams.append("referenceNo", params.referenceNo);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      donations: DonationRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/donations?${queryParams.toString()}`);
};

export type DonationGroup = {
  referenceNo: string;
  donations: DonationRow[];
};

export const fetchDonationsGrouped = (params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  storeId?: string;
  sessionId?: string;
  termId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.storeId) queryParams.append("storeId", params.storeId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.referenceNo) queryParams.append("referenceNo", params.referenceNo);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      groups: DonationGroup[];
      pagination: Pagination;
    }>
  >(`/api/v1/donations/grouped?${queryParams.toString()}`);
};

export const createDonationsBulk = (body: {
  storeId: string;
  notes?: string;
  transactionDate: string;
  items: { itemId: string; qtyIn: number }[];
}) =>
  post<ApiResponse<DonationRow[]>, typeof body>("/api/v1/donations/bulk", body);

export const deleteDonation = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/donations/${id}`);

export const inventoryReceiveAcknowledgementsApi = {
  create: createInventoryReceiveAcknowledgement,
};

export const donationsApi = {
  list: fetchDonations,
  listGrouped: fetchDonationsGrouped,
  bulkCreate: createDonationsBulk,
  remove: deleteDonation,
  acknowledgeReceive: createInventoryReceiveAcknowledgement,
};

// Projects
export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  /** API may return PascalCase */
  CreatedBy?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  createdBy?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  inventoryTransactions?: unknown[];
  _count?: { inventoryTransactions?: number };
};

export const fetchProjects = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  return get<ApiResponse<{ projects: Project[]; pagination: Pagination }>>(
    `/api/v1/projects?${queryParams.toString()}`
  );
};

export const createProject = (body: {
  name: string;
  description?: string;
  status?: "Active" | "Inactive" | string;
}) => post<ApiResponse<Project>, typeof body>("/api/v1/projects", body);

export const updateProject = (
  id: string,
  body: Partial<{ name: string; description: string | null; status: string }>
) => put<ApiResponse<Project>, typeof body>(`/api/v1/projects/${id}`, body);

export const deleteProject = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/projects/${id}`);

export const projectApi = {
  list: fetchProjects,
  create: createProject,
  update: updateProject,
  remove: deleteProject,
};

// Project collections (disburse inventory to projects / staff receiver)
export type ProjectCollectionRow = {
  id: string;
  itemId: string;
  transactionType: "project_collection" | string;
  qtyOut: string;
  referenceNo: string | null;
  notes: string | null;
  projectId: string | null;
  staffId: string | null;
  sessionId: string | null;
  termId: string | null;
  storeId?: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  store?: { id: string; name?: string } | null;
  project?: { id: string; name?: string } | null;
  staff?: {
    id: string;
    StaffNumber?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export const fetchProjectCollections = (params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  projectId?: string;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.projectId) queryParams.append("projectId", params.projectId);
  if (params?.staffId) queryParams.append("staffId", params.staffId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      projectCollections: ProjectCollectionRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/project-collections?${queryParams.toString()}`);
};

export const createProjectCollectionsBulk = (body: {
  notes?: string;
  projectId: string;
  staffId: string;
  storeId: string;
  referenceNo?: string;
  transactionDate: string;
  items: { itemId: string; qtyOut: number }[];
}) =>
  post<ApiResponse<ProjectCollectionRow[]>, typeof body>(
    "/api/v1/project-collections/bulk",
    body
  );

export const deleteProjectCollection = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/project-collections/${id}`);

export const projectCollectionsApi = {
  list: fetchProjectCollections,
  bulkCreate: createProjectCollectionsBulk,
  remove: deleteProjectCollection,
};

// Facility collections (distribute inventory to facilities)
export type FacilityCollectionRow = {
  id: string;
  itemId: string;
  transactionType: "facility_collection" | string;
  qtyOut: string;
  referenceNo: string | null;
  notes: string | null;
  facilityId: string | null;
  staffId: string | null;
  storeId: string | null;
  sessionId: string | null;
  termId: string | null;
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  facility?: { id: string; name?: string } | null;
  store?: { id: string; name?: string } | null;
  staff?: {
    id: string;
    StaffNumber?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

export const fetchFacilityCollections = (params?: {
  page?: number;
  limit?: number;
  itemId?: string;
  facilityId?: string;
  staffId?: string;
  sessionId?: string;
  termId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.facilityId) queryParams.append("facilityId", params.facilityId);
  if (params?.staffId) queryParams.append("staffId", params.staffId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      facilityCollections: FacilityCollectionRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/facility-collections?${queryParams.toString()}`);
};

export const createFacilityCollectionsBulk = (body: {
  notes?: string;
  facilityId: string;
  staffId: string;
  storeId: string;
  referenceNo?: string;
  transactionDate: string;
  items: { itemId: string; qtyOut: number }[];
}) =>
  post<ApiResponse<FacilityCollectionRow[]>, typeof body>(
    "/api/v1/facility-collections/bulk",
    body
  );

export const deleteFacilityCollection = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/facility-collections/${id}`);

export const facilityCollectionsApi = {
  list: fetchFacilityCollections,
  bulkCreate: createFacilityCollectionsBulk,
  remove: deleteFacilityCollection,
};

export const fetchStudentCollections = (params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  subclassId?: string;
  sessionId?: string;
  termId?: string;
  itemId?: string;
  referenceNo?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  // Backward-compatible aliases used by older callers/pages
  student_id?: string;
  class_id?: string;
  inventory_item_id?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 50));
  const studentId = params?.studentId ?? params?.student_id;
  const classId = params?.classId ?? params?.class_id;
  const itemId = params?.itemId ?? params?.inventory_item_id;
  if (studentId) queryParams.append("studentId", studentId);
  if (classId) queryParams.append("classId", classId);
  if (params?.subclassId) queryParams.append("subclassId", params.subclassId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (itemId) queryParams.append("itemId", itemId);
  if (params?.referenceNo) queryParams.append("referenceNo", params.referenceNo);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{
      studentCollections: StudentCollectionRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/student-collections?${queryParams.toString()}`);
};

export const createStudentCollectionsBulk = (body: {
  studentId: string;
  storeId: string;
  referenceNo?: string;
  notes?: string;
  transactionDate: string;
  items: { itemId: string; qtyOut: number }[];
}) => post<ApiResponse<StudentCollectionRow[]>, typeof body>(
  "/api/v1/student-collections/bulk",
  body
);

export type StudentCollectionSummaryRow = {
  itemId: string;
  totalQtyOut: string;
  item?: {
    id: string;
    name: string;
    category?: { id: string; name: string } | null;
    subCategory?: { id: string; name: string } | null;
    brand?: { id: string; name: string } | null;
  } | null;
};

export const fetchStudentCollectionsSummary = (params?: {
  itemId?: string;
  studentId?: string;
  classId?: string;
  subclassId?: string;
  sessionId?: string;
  termId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.studentId) queryParams.append("studentId", params.studentId);
  if (params?.classId) queryParams.append("classId", params.classId);
  if (params?.subclassId) queryParams.append("subclassId", params.subclassId);
  if (params?.sessionId) queryParams.append("sessionId", params.sessionId);
  if (params?.termId) queryParams.append("termId", params.termId);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  const qs = queryParams.toString();
  return get<ApiResponse<{ summary: StudentCollectionSummaryRow[] }>>(
    `/api/v1/student-collections/summary${qs ? `?${qs}` : ""}`
  );
};

export const updateStudentCollection = (
  id: string,
  body: Partial<{
    notes: string | null;
    transactionDate: string;
    qtyOut: string | number;
  }>
) => put<ApiResponse<StudentCollectionRow>, typeof body>(
  `/api/v1/student-collections/${id}`,
  body
);

export const deleteStudentCollection = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/student-collections/${id}`);

export type StudentItemsReceivedReportStudentInfo = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  admissionNumber: string;
};

export type StudentItemsReceivedReportItemCell = {
  itemId: string;
  itemName: string;
  qtyReceived: number;
};

export type StudentItemsReceivedReportRow = {
  studentInfo: StudentItemsReceivedReportStudentInfo;
  items: StudentItemsReceivedReportItemCell[];
};

export const fetchStudentItemsReceivedReport = (params: {
  classId: string;
  sessionId: string;
  subclassId?: string;
  termId?: string;
  itemIds: string[];
}) => {
  const queryParams = new URLSearchParams({
    classId: params.classId,
    sessionId: params.sessionId,
  });
  if (params.subclassId) queryParams.append("subclassId", params.subclassId);
  if (params.termId) queryParams.append("termId", params.termId);
  return post<
    ApiResponse<StudentItemsReceivedReportRow[]>,
    { itemIds: string[] }
  >(
    `/api/v1/student-collections/report/items-received?${queryParams.toString()}`,
    { itemIds: params.itemIds }
  );
};

export const studentCollectionsApi = {
  list: fetchStudentCollections,
  bulkCreate: createStudentCollectionsBulk,
  summary: fetchStudentCollectionsSummary,
  itemsReceivedReport: fetchStudentItemsReceivedReport,
  update: updateStudentCollection,
  remove: deleteStudentCollection,
};

// Inventory-specific helpers
export const fetchInventoryItems = (params?: {
  q?: string;
  status?: "Active" | "Inactive" | string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  page?: number;
  limit?: number;
  storeId?: string;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return get<
    ApiResponse<{ inventoryItems: InventoryItem[]; pagination: Pagination }>
  >(`/api/v1/inventory-items${qs ? `?${qs}` : ""}`);
};
export const createInventoryItem = (body: {
  sku?: string;
  name: string;
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  status?: "Active" | "Inactive" | string;
}) => post<ApiResponse<InventoryItem>, typeof body>("/api/v1/inventory-items", body);
export type UpdateInventoryItemBody = {
  sku?: string | null;
  name?: string;
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  uomId?: string;
  barcode?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  lowStockThreshold?: number;
  status?: "Active" | "Inactive" | string;
};
export const updateInventoryItem = (id: string, body: UpdateInventoryItemBody) =>
  put<ApiResponse<InventoryItem>, UpdateInventoryItemBody>(
    `/api/v1/inventory-items/${id}`,
    body
  );
export const deleteInventoryItem = (id: string) =>
  del<ApiResponse<InventoryItem>>(`/api/v1/inventory-items/${id}`);

export type ItemBalanceRow = {
  itemId: string;
  name: string;
  sku: string | null;
  category?: { id: string; name?: string } | null;
  subCategory?: { id: string; name?: string } | null;
  balance: string;
};

export const fetchInventoryItemBalances = (params?: {
  categoryId?: string;
  subCategoryId?: string;
  storeId?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params?.subCategoryId)
    queryParams.append("subCategoryId", params.subCategoryId);
  if (params?.storeId) queryParams.append("storeId", params.storeId);
  const qs = queryParams.toString();
  return get<ApiResponse<{ balances: ItemBalanceRow[] }>>(
    `/api/v1/inventory-items/balances${qs ? `?${qs}` : ""}`
  );
};

export type InventoryTxnLogRow = {
  id: string;
  transactionType: string;
  qtyIn: string;
  qtyOut: string;
  inCost: string;
  outCost: string;
  amountPaid: string;
  status: string;
  referenceNo: string | null;
  notes: string | null;
  transactionDate: string;
  store?: { id: string; name?: string } | null;
  createdBy?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type InventoryTransactionLogData = {
  item: { id: string; name?: string; sku?: string | null };
  transactionDateFrom?: string;
  transactionDateTo?: string;
  storeId?: string | null;
  balanceBeforeFromDate: string;
  transactions: InventoryTxnLogRow[];
};

export const fetchInventoryItemTransactionLog = (params: {
  itemId: string;
  storeId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("itemId", params.itemId);
  if (params.storeId) queryParams.append("storeId", params.storeId);
  if (params.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);
  return get<ApiResponse<InventoryTransactionLogData>>(
    `/api/v1/inventory-items/transaction-log?${queryParams.toString()}`
  );
};

export const inventoryApi = {
  list: fetchInventoryItems,
  create: createInventoryItem,
  update: updateInventoryItem,
  remove: deleteInventoryItem,
  balances: fetchInventoryItemBalances,
  transactionLog: fetchInventoryItemTransactionLog,
};

// Purchase Transaction-specific helpers
export const fetchPurchaseTransactions = (params?: {
  item_id?: string;
  transaction_type?: "purchase" | "sale" | "distribution";
  from_date?: string;
  to_date?: string;
}) => {
  let url = "/api/v1/inventory_transactions";
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return get<any[]>(url);
};
export const createPurchaseTransaction = (body: {
  item_id: string;
  supplier_id?: string;
  supplier_receiver?: string;
  customer_name?: string; // For sales transactions
  transaction_type: "purchase" | "sale";
  qty_in: number;
  in_cost: number;
  qty_out?: number; // For sales transactions
  out_cost?: number; // For sales transactions
  status: "pending" | "completed" | "cancelled" | "deleted";
  reference_no?: string;
  notes?: string;
  transaction_date?: string;
}) => post<any>("/api/v1/inventory_transactions", body);
export const updatePurchaseTransaction = (
  id: string,
  body: {
    item_id?: string;
    supplier_id?: string;
    supplier_receiver?: string;
    customer_name?: string; // For sales transactions
    transaction_type?: "purchase" | "sale";
    qty_in?: number;
    in_cost?: number;
    qty_out?: number; // For sales transactions
    out_cost?: number; // For sales transactions
    status?: "pending" | "completed" | "cancelled" | "deleted";
    reference_no?: string;
    notes?: string;
    transaction_date?: string;
  }
) => put<any>(`/api/v1/inventory_transactions/${id}`, body);
export const deletePurchaseTransaction = (id: string) =>
  del<any>(`/api/v1/inventory_transactions/${id}`);

export const purchaseTransactionApi = {
  list: fetchPurchaseTransactions,
  create: createPurchaseTransaction,
  update: updatePurchaseTransaction,
  remove: deletePurchaseTransaction,
};

// Purchases (new API)
export const fetchPurchases = (params?: {
  itemId?: string;
  supplierId?: string;
  storeId?: string;
  status?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.itemId) searchParams.append("itemId", params.itemId);
  if (params?.supplierId) searchParams.append("supplierId", params.supplierId);
  if (params?.storeId) searchParams.append("storeId", params.storeId);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.transactionDateFrom)
    searchParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    searchParams.append("transactionDateTo", params.transactionDateTo);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ purchases: Purchase[]; pagination: Pagination }>>(
    `/api/v1/purchases${qs ? `?${qs}` : ""}`
  );
};

export const fetchPurchasesGrouped = (params?: {
  supplierId?: string;
  storeId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.supplierId) searchParams.append("supplierId", params.supplierId);
  if (params?.storeId) searchParams.append("storeId", params.storeId);
  if (params?.transactionDateFrom)
    searchParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    searchParams.append("transactionDateTo", params.transactionDateTo);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  const qs = searchParams.toString();
  return get<ApiResponse<{ purchases: GroupedPurchase[]; pagination: Pagination }>>(
    `/api/v1/purchases/grouped${qs ? `?${qs}` : ""}`
  );
};

export const createPurchase = (body: {
  itemId: string;
  supplierId: string;
  qtyIn: string | number;
  inCost: string | number;
  amountPaid?: string | number;
  referenceNo?: string;
  notes?: string;
  transactionDate?: string;
  status?: "pending" | "completed" | "cancelled" | string;
}) => post<ApiResponse<Purchase>, typeof body>("/api/v1/purchases", body);

export const createPurchasesBulk = (body: {
  storeId: string;
  supplierId: string;
  referenceNo?: string;
  notes?: string;
  transactionDate: string;
  amountPaid?: string | number;
  items: { itemId: string; qtyIn: number; inCost: number }[];
}) => post<ApiResponse<Purchase[]>, typeof body>("/api/v1/purchases/bulk", body);

export const updatePurchase = (id: string, body: Partial<{
  itemId: string;
  supplierId: string | null;
  storeId: string | null;
  qtyIn: string | number;
  inCost: string | number;
  amountPaid: string | number;
  referenceNo: string | null;
  notes: string | null;
  transactionDate: string;
  status: "pending" | "completed" | "cancelled" | string;
}>) => put<ApiResponse<Purchase>, typeof body>(`/api/v1/purchases/${id}`, body);

export const deletePurchase = (id: string) =>
  del<ApiResponse<Purchase>>(`/api/v1/purchases/${id}`);

export const purchaseApi = {
  list: fetchPurchases,
  listGrouped: fetchPurchasesGrouped,
  create: createPurchase,
  bulkCreate: createPurchasesBulk,
  update: updatePurchase,
  remove: deletePurchase,
};

// Student-specific helpers
export const fetchStudents = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  /** Filter by school class id (camelCase query param) */
  classId?: string;
  /** Filter by sub class id (camelCase query param) */
  subClassId?: string;
  /** Alias used by older callers */
  class_id?: string;
  gender?: "male" | "female" | "other";
  /** Optional extra filter (backend-dependent) */
  station?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.status) queryParams.append("status", params.status);
  const classId = params?.classId ?? params?.class_id;
  if (classId) queryParams.append("classId", classId);
  if (params?.subClassId) queryParams.append("subClassId", params.subClassId);
  if (params?.gender) queryParams.append("gender", params.gender);
  if (params?.station) queryParams.append("station", params.station);
  const qs = queryParams.toString();
  return get<any>(`/api/v1/students${qs ? `?${qs}` : ""}`);
};
export const createStudent = (body: {
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentEmail?: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;
  classId: string;
  subClassId?: string;
  guardianName: string;
  guardianEmail?: string;
  guardianContact: string;
  address?: string;
}) => post<any>("/api/v1/students", body);
export const updateStudent = (
  id: string,
  body: {
    admissionNumber?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    studentEmail?: string;
    gender?: "male" | "female" | "other";
    dateOfBirth?: string;
    classId?: string;
    subClassId?: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianContact?: string;
    address?: string;
    status?: "Active" | "Inactive" | "Graduated" | string;
  }
) => put<any>(`/api/v1/students/${id}`, body);
export const deleteStudent = (id: string) => del<any>(`/api/v1/students/${id}`);

export const studentApi = {
  list: fetchStudents,
  create: createStudent,
  update: updateStudent,
  remove: deleteStudent,
};

// Class-specific helpers
export const fetchClasses = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  const qs = queryParams.toString();
  return get<any>(`/api/v1/school-classes${qs ? `?${qs}` : ""}`);
};
export const createClass = (body: {
  name: string;
  status: "Active" | "Inactive";
}) => post<any>("/api/v1/school-classes", body);
export const updateClass = (
  id: string,
  body: {
    name?: string;
    status?: "Active" | "Inactive";
  }
) => put<any>(`/api/v1/school-classes/${id}`, body);
export const deleteClass = (id: string) =>
  del<any>(`/api/v1/school-classes/${id}`);

export const classApi = {
  list: fetchClasses,
  create: createClass,
  update: updateClass,
  remove: deleteClass,
};

// SubClass-specific helpers
export const fetchSubClasses = (params?: {
  page?: number;
  limit?: number;
  /** When supported by the API, limits results to one school class */
  classId?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.classId) queryParams.append("classId", params.classId);
  const qs = queryParams.toString();
  return get<any>(`/api/v1/sub-classes${qs ? `?${qs}` : ""}`);
};

export const createSubClass = (body: {
  name: string;
  classId: string;
  status: "Active" | "Inactive";
}) => post<any>("/api/v1/sub-classes", body);

export const updateSubClass = (
  id: string,
  body: Partial<{
    name: string;
    classId: string;
    status: "Active" | "Inactive" | string;
  }>
) => put<any>(`/api/v1/sub-classes/${id}`, body);

export const deleteSubClass = (id: string) => del<any>(`/api/v1/sub-classes/${id}`);

export const subClassApi = {
  list: fetchSubClasses,
  create: createSubClass,
  update: updateSubClass,
  remove: deleteSubClass,
};

// Users API
export type UserPrivilege = {
  id: string;
  name: string;
  description: string;
};

export type UserAppRole = {
  id: string;
  name: string;
  status: string;
};

export type UserRow = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  userType?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  privileges?: UserPrivilege[];
  appRole?: UserAppRole | null;
  appRoles?: UserAppRole[];
};

export const fetchUsers = (params?: {
  userType?: string;
  roleId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  if (params?.userType) queryParams.append("userType", params.userType);
  if (params?.roleId) queryParams.append("roleId", params.roleId);
  if (params?.status) queryParams.append("status", params.status);
  return get<ApiResponse<{ users: UserRow[]; pagination: Pagination }>>(
    `/api/v1/users?${queryParams.toString()}`
  );
};

export const assignUserPrivileges = (userId: string, privilegeIds: string[]) =>
  post<ApiResponse<UserRow>>(`/api/v1/users/${userId}/privileges`, {
    privilegeIds,
  });

export const removeUserPrivilege = (userId: string, privilegeId: string) =>
  del<ApiResponse<UserRow>>(`/api/v1/users/${userId}/privileges/${privilegeId}`);

export const assignUserRole = (userId: string, roleId: string) =>
  post<ApiResponse<UserRow>>(`/api/v1/users/${userId}/roles`, { roleId });

export const removeUserRole = (userId: string, roleId: string) =>
  del<ApiResponse<UserRow>>(`/api/v1/users/${userId}/roles/${roleId}`);

export const usersApi = {
  list: fetchUsers,
  assignPrivileges: assignUserPrivileges,
  removePrivilege: removeUserPrivilege,
  assignRole: assignUserRole,
  removeRole: removeUserRole,
};

// Stores API
export type StoreAccessibleUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  accessGrantedAt?: string;
};

export type StoreRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  managerId: string;
  createdAt?: string;
  updatedAt?: string;
  manager?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
  } | null;
  _count?: { inventoryTransactions?: number };
  accessibleUsers?: StoreAccessibleUser[];
};

/** Stores the current user may operate from (manager / granted access) — `GET /stores/me` */
export type MyStoreRow = StoreRow & {
  isStoreManager?: boolean;
  hasUserStoreAccess?: boolean;
  userStoreAccessGrantedAt?: string | null;
};

export const fetchStores = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  if (params?.status) queryParams.append("status", params.status);
  return get<ApiResponse<{ stores: StoreRow[]; pagination: Pagination }>>(
    `/api/v1/stores?${queryParams.toString()}`
  );
};

export const fetchMyStores = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  return get<ApiResponse<{ stores: MyStoreRow[]; pagination: Pagination }>>(
    `/api/v1/stores/me?${queryParams.toString()}`
  );
};

export const createStore = (body: {
  name: string;
  description?: string;
  status: "Active" | "Inactive" | string;
  managerId: string;
}) => post<ApiResponse<StoreRow>, typeof body>("/api/v1/stores", body);

export const updateStore = (
  id: string,
  body: Partial<{
    name: string;
    description: string | null | undefined;
    status: string;
    managerId: string;
  }>
) => put<ApiResponse<StoreRow>, typeof body>(`/api/v1/stores/${id}`, body);

export const addUserToStore = (storeId: string, body: { userId: string }) =>
  post<ApiResponse<unknown>, typeof body>(
    `/api/v1/stores/${storeId}/users`,
    body
  );

export const removeUserFromStore = (storeId: string, userId: string) =>
  del<ApiResponse<unknown>>(`/api/v1/stores/${storeId}/users/${userId}`);

export const storeApi = {
  list: fetchStores,
  listMine: fetchMyStores,
  create: createStore,
  update: updateStore,
  addUser: addUserToStore,
  removeUser: removeUserFromStore,
};

// Store transfers (inventory between stores)
export type StoreTransferListRow = {
  status: string;
  referenceNo: string;
  notes: string | null;
  quantity: string;
  transactionDate: string;
  item: { id: string; name?: string };
  sourceStore: { id: string; name?: string };
  destStore: { id: string; name?: string };
  createdBy?: { firstName?: string; lastName?: string };
  outTransactionId?: string;
  inTransactionId?: string;
};

export const fetchStoreTransfers = (params?: {
  status?: string;
  sourceStoreId?: string;
  destStoreId?: string;
  itemId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.status) queryParams.append("status", params.status);
  if (params?.sourceStoreId)
    queryParams.append("sourceStoreId", params.sourceStoreId);
  if (params?.destStoreId) queryParams.append("destStoreId", params.destStoreId);
  if (params?.itemId) queryParams.append("itemId", params.itemId);
  if (params?.transactionDateFrom)
    queryParams.append("transactionDateFrom", params.transactionDateFrom);
  if (params?.transactionDateTo)
    queryParams.append("transactionDateTo", params.transactionDateTo);

  return get<
    ApiResponse<{ transfers: StoreTransferListRow[]; pagination: Pagination }>
  >(`/api/v1/store-transfers?${queryParams.toString()}`);
};

export const createStoreTransfer = (body: {
  sourceStoreId: string;
  destStoreId: string;
  items: { itemId: string; qty: number }[];
  notes?: string;
  transactionDate: string;
}) =>
  post<
    ApiResponse<{ referenceNo: string; transactions: unknown[] }>,
    typeof body
  >("/api/v1/store-transfers", body);

export const storeTransferApi = {
  list: fetchStoreTransfers,
  create: createStoreTransfer,
};

// Class Teachers API
export const fetchClassTeachers = (params?: {
  class_id?: string;
  session_term_id?: string;
  status?: "active" | "inactive" | "archived";
  role?: "class_teacher" | "assistant_teacher" | "subject_teacher";
}) => {
  let url = "/api/v1/class_teachers";
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return get<any[]>(url);
};

export const createClassTeacher = (body: {
  class_id: string;
  teacher_id?: string;
  email: string;
  name: string;
  role: "class_teacher" | "assistant_teacher" | "subject_teacher";
  status: "active" | "inactive" | "archived";
}) => post<any>("/api/v1/class_teachers", body);

export const updateClassTeacher = (
  id: string,
  body: {
    class_id?: string;
    teacher_id?: string;
    email?: string;
    name?: string;
    role?: "class_teacher" | "assistant_teacher" | "subject_teacher";
    status?: "active" | "inactive" | "archived";
    unassigned_at?: string;
  }
) => put<any>(`/api/v1/class_teachers/${id}`, body);

export const deleteClassTeacher = (id: string) =>
  del<any>(`/api/v1/class_teachers/${id}`);

export const classTeachersApi = {
  list: fetchClassTeachers,
  create: createClassTeacher,
  update: updateClassTeacher,
  remove: deleteClassTeacher,
};

/** Chart of accounts — account head (parent of subheads) */
export type AccountHead = {
  id: number;
  groupId: number;
  code: string;
  name: string;
  rank: number;
};

export type AccountSubhead = {
  id: number;
  groupId: number;
  headId: number;
  code?: string | null;
  name: string;
  status: string;
  rank: number;
  afs: string | null;
  paymentMethod: string;
  group?: { id: number; name: string; rank: number };
  head?: {
    id: number;
    groupId: number;
    code: string;
    name: string;
    rank: number;
  };
};

export const fetchAccountHeads = (params?: { groupId?: number }) => {
  const sp = new URLSearchParams();
  if (params?.groupId != null) sp.append("groupId", String(params.groupId));
  const qs = sp.toString();
  return get<ApiResponse<{ accountHeads: AccountHead[] }>>(
    `/api/v1/account-heads${qs ? `?${qs}` : ""}`
  );
};

export const fetchAccountSubheads = (params?: {
  headId?: number;
  status?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.headId != null) sp.append("headId", String(params.headId));
  if (params?.status != null && params.status !== "") {
    sp.append("status", params.status);
  }
  const qs = sp.toString();
  return get<ApiResponse<{ accountSubheads: AccountSubhead[]; count: number }>>(
    `/api/v1/account-subheads${qs ? `?${qs}` : ""}`
  );
};

/** System-wide default account subhead per posting context (e.g. student, collection). */
export type DefaultSubheadSetting = {
  settingsId: string;
  settings: string;
  subheadId: number | null;
  subhead?: { id: number; name: string } | null;
};

export const fetchDefaultSubheadSettings = () =>
  get<ApiResponse<DefaultSubheadSetting[]>>("/api/v1/default-subhead-settings");

export const updateDefaultSubheadSetting = (
  settingsId: string,
  body: { subheadId: number }
) =>
  patch<ApiResponse<DefaultSubheadSetting>, typeof body>(
    `/api/v1/default-subhead-settings/${encodeURIComponent(settingsId)}`,
    body
  );

export const defaultSubheadSettingsApi = {
  list: fetchDefaultSubheadSettings,
  update: updateDefaultSubheadSetting,
};

/** System-wide default account chart per posting context (e.g. collection, supplier). */
export type DefaultAccountSetting = {
  settingsId: string;
  settings: string;
  accountId: number | null;
  account?: {
    id: number;
    accountDescription?: string;
    accountNo?: string | null;
  } | null;
};

export const fetchDefaultAccountSettings = () =>
  get<ApiResponse<DefaultAccountSetting[]>>("/api/v1/default-account-settings");

export const updateDefaultAccountSetting = (
  settingsId: string,
  body: { accountId: number }
) =>
  patch<ApiResponse<DefaultAccountSetting>, typeof body>(
    `/api/v1/default-account-settings/${encodeURIComponent(settingsId)}`,
    body
  );

export const defaultAccountSettingsApi = {
  list: fetchDefaultAccountSettings,
  update: updateDefaultAccountSetting,
};

export const createAccountSubhead = (body: {
  headId: number;
  code?: string;
  name: string;
  status: string;
  rank: number;
  paymentMethod: string;
}) =>
  post<ApiResponse<AccountSubhead>, typeof body>(
    "/api/v1/account-subheads",
    body
  );

export const updateAccountSubhead = (
  id: number,
  body: {
    code?: string;
    name?: string;
    status?: string;
    rank?: number;
    paymentMethod?: string;
  }
) =>
  put<ApiResponse<AccountSubhead>, typeof body>(
    `/api/v1/account-subheads/${id}`,
    body
  );

export const deleteAccountSubhead = (id: number) =>
  del<ApiResponse<AccountSubhead>>(`/api/v1/account-subheads/${id}`);

export const accountHeadsApi = {
  list: fetchAccountHeads,
};

export const accountSubheadsApi = {
  list: fetchAccountSubheads,
  create: createAccountSubhead,
  update: updateAccountSubhead,
  remove: deleteAccountSubhead,
};

export type AccountChart = {
  id: number;
  groupId: number;
  headId: number;
  subheadId: number;
  accountNo?: string | null;
  accountRef: string | null;
  accountDescription: string;
  status: string;
  rank: number;
  createdAt: string;
  group?: { id: number; name: string; rank: number };
  head?: {
    id: number;
    groupId: number;
    code: string;
    name: string;
    rank: number;
  };
  subhead?: AccountSubhead;
};

/** Full chart-of-accounts tree: groups with heads, subheads, and nested chart rows. */
export type AccountGroupTree = {
  id: number;
  name: string;
  rank: number;
  heads: AccountHead[];
  subHeads: AccountSubhead[];
  accountCharts?: AccountChart[];
};

export const fetchAccountGroups = () =>
  get<ApiResponse<{ accountGroups: AccountGroupTree[]; count: number }>>(
    "/api/v1/account-groups"
  );

export const fetchAccountCharts = (params?: {
  groupId?: number;
  headId?: number;
  subheadId?: number;
  status?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.groupId != null) sp.append("groupId", String(params.groupId));
  if (params?.headId != null) sp.append("headId", String(params.headId));
  if (params?.subheadId != null) sp.append("subheadId", String(params.subheadId));
  if (params?.status != null && params.status !== "")
    sp.append("status", params.status);
  const qs = sp.toString();
  return get<ApiResponse<{ accountCharts: AccountChart[]; count: number }>>(
    `/api/v1/account-charts${qs ? `?${qs}` : ""}`
  );
};

export const createAccountChart = (body: {
  subheadId: number;
  accountDescription: string;
  accountNo?: string;
  rank: number;
}) =>
  post<ApiResponse<AccountChart>, typeof body>(
    "/api/v1/account-charts",
    body
  );

export const updateAccountChart = (
  id: number,
  body: {
    subheadId?: number;
    accountDescription?: string;
    accountNo?: string;
    status?: string;
    rank?: number;
  }
) =>
  put<ApiResponse<AccountChart>, typeof body>(
    `/api/v1/account-charts/${id}`,
    body
  );

export const deleteAccountChart = (id: number) =>
  del<ApiResponse<AccountChart>>(`/api/v1/account-charts/${id}`);

export const accountGroupsApi = {
  list: fetchAccountGroups,
};

export const accountChartsApi = {
  list: fetchAccountCharts,
  create: createAccountChart,
  update: updateAccountChart,
  remove: deleteAccountChart,
};

/** Single line on the GL transaction log for an account */
export type AccountTransactionLogRow = {
  id: number;
  debit: string;
  credit: string;
  remarks: string | null;
  ref: string;
  manualRef: string | null;
  transactionDate: string;
  postedBy: string;
  createdAt: string;
  project: { id?: string; name?: string } | null;
};

export type AccountTransactionLogData = {
  account: {
    id: number;
    accountNo?: string | null;
    accountRef: string | null;
    accountDescription: string;
    group?: { id: number; name: string };
    head?: { id: number; name: string };
    subhead?: { id: number; name: string };
  };
  transactionDateFrom: string;
  transactionDateTo: string;
  balanceBeforeFromDate: string;
  transactions: AccountTransactionLogRow[];
};

export const fetchAccountTransactionLog = (params: {
  accountId: number;
  transactionDateFrom?: string;
  transactionDateTo?: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("accountId", String(params.accountId));
  if (params.transactionDateFrom)
    sp.append("transactionDateFrom", params.transactionDateFrom);
  if (params.transactionDateTo)
    sp.append("transactionDateTo", params.transactionDateTo);
  return get<ApiResponse<AccountTransactionLogData>>(
    `/api/v1/account-transactions/transaction-log?${sp.toString()}`
  );
};

/** Row for report-by-account (trial balance style: net credit − debit per account). */
export type TrialBalanceReportAccount = {
  id: number;
  groupId: number;
  headId: number;
  subheadId: number;
  rank: number;
  accountNo?: string | null;
  accountRef?: string | null;
  accountDescription: string;
  group?: { id: number; name: string };
  head?: { id: number; code?: string | null; name: string };
  subhead?: { id: number; code?: string | null; name: string; rank?: number };
};

export type TrialBalanceReportRow = {
  accountId: number;
  headId: number;
  subheadId: number;
  sumCreditMinusDebit: string;
  account: TrialBalanceReportAccount;
};

export type TrialBalanceReportData = {
  transactionDateFrom: string | null;
  transactionDateTo: string;
  rows: TrialBalanceReportRow[];
};

export const fetchAccountReportByAccount = (params: {
  transactionDateTo: string;
  transactionDateFrom?: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("transactionDateTo", params.transactionDateTo);
  if (params.transactionDateFrom)
    sp.append("transactionDateFrom", params.transactionDateFrom);
  return get<ApiResponse<TrialBalanceReportData>>(
    `/api/v1/account-transactions/report-by-account?${sp.toString()}`
  );
};

export type BalanceSheetSubheadRow = {
  id: number;
  name: string;
  balance: number;
};

export type BalanceSheetHeadSection = {
  name: string;
  headcode: number;
  subheads: BalanceSheetSubheadRow[];
};

/** API: keyed by strings like headcode11, headcode12, … */
export type BalanceSheetReportData = Record<string, BalanceSheetHeadSection>;

export const fetchAccountReportByHeadSubhead = (params: {
  transactionDateTo: string;
  transactionDateFrom?: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("transactionDateTo", params.transactionDateTo);
  if (params.transactionDateFrom)
    sp.append("transactionDateFrom", params.transactionDateFrom);
  return get<ApiResponse<BalanceSheetReportData>>(
    `/api/v1/account-transactions/report-by-head-subhead?${sp.toString()}`
  );
};

export type StudentBalanceStatus =
  | "Active"
  | "Inactive"
  | "Graduated"
  | "Transferred"
  | "Suspended"
  | "Archived";

export type StudentBalanceRow = {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  status: string;
  classId: string;
  subclassId: string;
  classInfo: { id: string; name: string };
  subclassInfo: { id: string; name: string };
  sumCredit: string | number;
  sumDebit: string | number;
  balance: string | number;
};

export type StudentBalancesReportData = {
  asAtDate: string;
  status: string;
  orderBy: string;
  orderDirection: string;
  rows: StudentBalanceRow[];
  pagination: Pagination;
};

export type ListStudentBalancesParams = {
  asAtDate: string;
  status?: StudentBalanceStatus;
  classId?: string;
  orderBy?: "classId" | "balance";
  orderDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type StudentTransactionLogData = {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    classId: string;
    subClassId: string;
  };
  transactionDateFrom: string;
  transactionDateTo: string;
  balanceBeforeDateFrom: string;
  transactions: AccountTransactionLogRow[];
};

export const fetchStudentTransactionLog = (params: {
  studentId: string;
  datefrom?: string;
  dateTo?: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("studentId", params.studentId);
  if (params.datefrom) sp.append("datefrom", params.datefrom);
  if (params.dateTo) sp.append("dateTo", params.dateTo);
  return get<ApiResponse<StudentTransactionLogData>>(
    `/api/v1/account-transactions/student-transaction-log?${sp.toString()}`
  );
};

export const fetchStudentBalances = (params: ListStudentBalancesParams) => {
  const sp = new URLSearchParams();
  sp.append("asAtDate", params.asAtDate);
  if (params.status) sp.append("status", params.status);
  if (params.classId) sp.append("classId", params.classId);
  if (params.orderBy) sp.append("orderBy", params.orderBy);
  if (params.orderDirection) sp.append("orderDirection", params.orderDirection);
  if (params.page != null) sp.append("page", String(params.page));
  if (params.limit != null) sp.append("limit", String(params.limit));
  return get<ApiResponse<StudentBalancesReportData>>(
    `/api/v1/account-transactions/student-balances?${sp.toString()}`
  );
};

export type StudentJournalTransferTransactionType = "debit" | "credit";

export type StudentJournalTransferEntryInput = {
  amount: number;
  accountId: string | number;
  transactionType: StudentJournalTransferTransactionType;
  remarks?: string;
};

export type StudentJournalTransferPostBody = {
  studentId: string;
  manualRef?: string;
  transactionDate: string;
  entries: StudentJournalTransferEntryInput[];
};

export type StudentJournalTransferPostResult = {
  studentId: string;
  ref: string;
  manualRef: string;
  transactionDate: string;
  postedCount: number;
};

export type StudentJournalTransferRecordLine = {
  account: { id: number; name: string };
  transactionType: string;
  amount: number;
  remarks: string;
};

export type StudentJournalTransferGroup = {
  studentId: string;
  ref: string;
  manualRef: string;
  transactionDate: string;
  record: StudentJournalTransferRecordLine[];
};

export const postStudentJournalTransfer = (body: StudentJournalTransferPostBody) =>
  post<ApiResponse<StudentJournalTransferPostResult>, typeof body>(
    "/api/v1/account-transactions/student-journal-transfer",
    body
  );

export const fetchStudentJournalTransfers = (params: {
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const sp = new URLSearchParams();
  if (params.studentId) sp.append("studentId", params.studentId);
  if (params.dateFrom) sp.append("dateFrom", params.dateFrom);
  if (params.dateTo) sp.append("dateTo", params.dateTo);
  return get<ApiResponse<StudentJournalTransferGroup[]>>(
    `/api/v1/account-transactions/student-journal-transfer?${sp.toString()}`
  );
};

export const accountTransactionsApi = {
  transactionLog: fetchAccountTransactionLog,
  reportByAccount: fetchAccountReportByAccount,
  reportByHeadSubhead: fetchAccountReportByHeadSubhead,
  studentBalances: fetchStudentBalances,
  studentTransactionLog: fetchStudentTransactionLog,
  postStudentJournalTransfer,
  listStudentJournalTransfers: fetchStudentJournalTransfers,
};

export type BillingItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  optional: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  accountId: number;
  account?: {
    id: number;
    accountDescription?: string;
  };
};

export const fetchBillingItemCategories = () =>
  get<ApiResponse<string[]>>("/api/v1/billing-items/categories");

export const fetchBillingItems = (params?: {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.category) sp.append("category", params.category);
  if (params?.status) sp.append("status", params.status);
  if (params?.page != null) sp.append("page", String(params.page));
  if (params?.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<
    ApiResponse<{
      billingItems: BillingItem[];
      pagination: Pagination;
    }>
  >(`/api/v1/billing-items${qs ? `?${qs}` : ""}`);
};

export const createBillingItem = (body: {
  code: string;
  name: string;
  category: string;
  accountId: number;
  optional: boolean;
}) => post<ApiResponse<BillingItem>, typeof body>("/api/v1/billing-items", body);

export const updateBillingItem = (
  id: number,
  body: {
    code?: string;
    name?: string;
    category?: string;
    accountId?: number;
    optional?: boolean;
    status?: string;
  }
) => put<ApiResponse<BillingItem>, typeof body>(`/api/v1/billing-items/${id}`, body);

export const deleteBillingItem = (id: number) =>
  del<ApiResponse<BillingItem>>(`/api/v1/billing-items/${id}`);

export const billingItemsApi = {
  categories: fetchBillingItemCategories,
  list: fetchBillingItems,
  create: createBillingItem,
  update: updateBillingItem,
  remove: deleteBillingItem,
};

/** Posted student fee lines for a session/term */
export type StudentBillingRow = {
  id: number;
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  billingId: number;
  amount: string | number;
  referentId: string;
  isPosted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  createdBy: string;
  postedAt: string | null;
  postedBy: string | null;
  /** Included on list/detail responses when the API embeds the billing item */
  billing?: { id: number; name: string; code: string } | null;
};

export type StudentBillingBulkEntry = {
  billingId: number;
  amount: number;
};

export const bulkCreateStudentBillings = (body: {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  entries: StudentBillingBulkEntry[];
}) =>
  post<
    ApiResponse<{
      referentId: string;
      count: number;
      rows: StudentBillingRow[];
    }>,
    typeof body
  >("/api/v1/student-billings/bulk", body);

export const fetchStudentBillings = (params: {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  sp.append("studentId", params.studentId);
  sp.append("classId", params.classId);
  sp.append("subclassId", params.subclassId);
  sp.append("session", params.session);
  sp.append("term", params.term);
  if (params.page != null) sp.append("page", String(params.page));
  if (params.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<
    ApiResponse<{
      studentBillings: StudentBillingRow[];
      pagination?: Pagination;
    }>
  >(`/api/v1/student-billings?${qs}`);
};

export const updateStudentBilling = (id: number, body: { amount: number }) =>
  put<ApiResponse<StudentBillingRow>, typeof body>(
    `/api/v1/student-billings/${id}`,
    body
  );

export const deleteStudentBilling = (id: number) =>
  del<ApiResponse<unknown>>(`/api/v1/student-billings/${id}`);

export type StudentBillingRecordStatus = "DRAFT" | "APPROVED";

export const bulkPatchStudentBillingStatuses = (body: {
  ids: number[];
  status: StudentBillingRecordStatus;
}) =>
  patch<
    ApiResponse<{ updatedCount: number; status: string }>,
    typeof body
  >("/api/v1/student-billings/status/bulk", body);

export const bulkPostStudentBillings = (body: { ids: number[] }) =>
  patch<
    ApiResponse<{ postedCount: number }>,
    typeof body
  >("/api/v1/student-billings/post/bulk", body);

export type NotifyParentStudentBillingBody = {
  studentId: string;
  classId: string;
  subclassId: string;
  sessionId: string;
  termId: string;
};

export type NotifyParentStudentBillingResult = {
  studentId: string;
  guardianEmail: string;
  sent: boolean;
  messageId: string;
  summary: {
    sessionId: string;
    termId: string;
    classId: string;
    subclassId: string;
    billingCount: number;
    discountCount: number;
    totalBilling: number;
    totalDiscount: number;
    netPayable: number;
  };
};

export const notifyParentStudentBilling = (body: NotifyParentStudentBillingBody) =>
  post<ApiResponse<NotifyParentStudentBillingResult>, typeof body>(
    "/api/v1/student-billings/notify/parent",
    body
  );

/** Per-student totals for session/term/class/subclass (billing summary report). */
export type StudentBillingSummaryReportRow = {
  studentId: string;
  session: string;
  term: string;
  classId: string;
  subclassId: string;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
  };
  sessionInfo: { id: string; name: string };
  termInfo: { id: string; name: string };
  classInfo: { id: string; name: string };
  subclassInfo: { id: string; name: string };
  approvedBillingTotal: number;
  draftBillingTotal: number;
  approvedDiscountTotal: number;
  draftDiscountTotal: number;
};

export const fetchStudentBillingsSummaryReport = (params: {
  session: string;
  term: string;
  /** Omit or empty = all classes (when supported by API). */
  classId?: string;
  /** Omit or empty = all subclasses (when supported by API). */
  subclassId?: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("session", params.session);
  sp.append("term", params.term);
  if (params.classId) sp.append("classId", params.classId);
  if (params.subclassId) sp.append("subclassId", params.subclassId);
  return get<ApiResponse<StudentBillingSummaryReportRow[]>>(
    `/api/v1/student-billings/report/summary?${sp.toString()}`
  );
};

export const studentBillingsApi = {
  bulkCreate: bulkCreateStudentBillings,
  list: fetchStudentBillings,
  update: updateStudentBilling,
  remove: deleteStudentBilling,
  bulkPatchStatuses: bulkPatchStudentBillingStatuses,
  bulkPost: bulkPostStudentBillings,
  notifyParent: notifyParentStudentBilling,
  summaryReport: fetchStudentBillingsSummaryReport,
};

/** Default billing amounts per class / subclass / session / term */
export type ClassDefaultBillingRow = {
  id: number;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  billingId: number;
  amount: string | number;
  billing?: { id: number; name: string; code?: string } | null;
};

export type ClassDefaultBillingBulkItem = {
  billingId: number;
  amount: number;
};

export const bulkCreateClassDefaultBillings = (body: {
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  items: ClassDefaultBillingBulkItem[];
}) =>
  post<
    ApiResponse<{ count: number; rows: ClassDefaultBillingRow[] }>,
    typeof body
  >("/api/v1/class-default-billings/bulk", body);

export const fetchClassDefaultBillings = (params: {
  classId: string;
  subclassId: string;
  session: string;
  term: string;
}) => {
  const sp = new URLSearchParams();
  sp.append("classId", params.classId);
  sp.append("subclassId", params.subclassId);
  sp.append("session", params.session);
  sp.append("term", params.term);
  return get<ApiResponse<ClassDefaultBillingRow[]>>(
    `/api/v1/class-default-billings?${sp.toString()}`
  );
};

export const updateClassDefaultBilling = (id: number, body: { amount: number }) =>
  put<ApiResponse<ClassDefaultBillingRow>, typeof body>(
    `/api/v1/class-default-billings/${id}`,
    body
  );

export const deleteClassDefaultBilling = (id: number) =>
  del<ApiResponse<ClassDefaultBillingRow>>(`/api/v1/class-default-billings/${id}`);

export const classDefaultBillingsApi = {
  bulkCreate: bulkCreateClassDefaultBillings,
  list: fetchClassDefaultBillings,
  update: updateClassDefaultBilling,
  remove: deleteClassDefaultBilling,
};

/** Posted concession/discount amounts per student session/term */
export type StudentConcessionDiscountRow = {
  id: number;
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  concessionDiscountId: number;
  amount: string | number;
  referentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  createdBy: string;
  isPosted: boolean;
  postedAt: string | null;
  postedBy: string | null;
  concessionDiscount?: { id: number; name: string; code: string } | null;
};

export type StudentConcessionDiscountBulkEntry = {
  concessionDiscountId: number;
  amount: number;
};

export const bulkCreateStudentConcessionDiscounts = (body: {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  entries: StudentConcessionDiscountBulkEntry[];
}) =>
  post<
    ApiResponse<{
      referentId: string;
      count: number;
      rows: StudentConcessionDiscountRow[];
    }>,
    typeof body
  >("/api/v1/student-concession-discounts/bulk", body);

export const fetchStudentConcessionDiscounts = (params: {
  studentId: string;
  classId: string;
  subclassId: string;
  session: string;
  term: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  sp.append("studentId", params.studentId);
  sp.append("classId", params.classId);
  sp.append("subclassId", params.subclassId);
  sp.append("session", params.session);
  sp.append("term", params.term);
  if (params.page != null) sp.append("page", String(params.page));
  if (params.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<
    ApiResponse<{
      studentConcessionDiscounts: StudentConcessionDiscountRow[];
      pagination?: Pagination;
    }>
  >(`/api/v1/student-concession-discounts?${qs}`);
};

export const updateStudentConcessionDiscount = (
  id: number,
  body: { amount: number }
) =>
  put<ApiResponse<StudentConcessionDiscountRow>, typeof body>(
    `/api/v1/student-concession-discounts/${id}`,
    body
  );

export const deleteStudentConcessionDiscount = (id: number) =>
  del<ApiResponse<unknown>>(`/api/v1/student-concession-discounts/${id}`);

export type StudentConcessionDiscountRecordStatus = "DRAFT" | "APPROVED";

export const bulkPatchStudentConcessionDiscountStatuses = (body: {
  ids: number[];
  status: StudentConcessionDiscountRecordStatus;
}) =>
  patch<
    ApiResponse<{ updatedCount: number; status: string }>,
    typeof body
  >("/api/v1/student-concession-discounts/status/bulk", body);

export const bulkPostStudentConcessionDiscounts = (body: { ids: number[] }) =>
  patch<
    ApiResponse<{ postedCount: number }>,
    typeof body
  >("/api/v1/student-concession-discounts/post/bulk", body);

export const studentConcessionDiscountsApi = {
  bulkCreate: bulkCreateStudentConcessionDiscounts,
  list: fetchStudentConcessionDiscounts,
  update: updateStudentConcessionDiscount,
  remove: deleteStudentConcessionDiscount,
  bulkPatchStatuses: bulkPatchStudentConcessionDiscountStatuses,
  bulkPost: bulkPostStudentConcessionDiscounts,
};

export type ConcessionDiscountType = "CONCESSION" | "DISCOUNT";

export type ConcessionDiscountCalculationType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT";

export type ConcessionDiscount = {
  id: number;
  code: string;
  name: string;
  type: ConcessionDiscountType;
  calculationType: ConcessionDiscountCalculationType;
  value: string | number;
  accountId: number;
  appliesTo: BillingItem[];
  maxLimit: string | number;
  status: string;
  account?: {
    id: number;
    accountDescription?: string;
  };
};

export const fetchConcessionDiscounts = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.append("status", params.status);
  if (params?.page != null) sp.append("page", String(params.page));
  if (params?.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<ApiResponse<{ concessionDiscounts: ConcessionDiscount[]; pagination: Pagination }>>(
    `/api/v1/concession-discounts${qs ? `?${qs}` : ""}`
  );
};

export const createConcessionDiscount = (body: {
  code: string;
  name: string;
  type: ConcessionDiscountType;
  calculationType: ConcessionDiscountCalculationType;
  value: number;
  accountId: number;
  appliesToIds: number[];
  maxLimit: number;
  status: string;
}) =>
  post<ApiResponse<ConcessionDiscount>, typeof body>(
    "/api/v1/concession-discounts",
    body
  );

export const updateConcessionDiscount = (
  id: number,
  body: {
    code?: string;
    name?: string;
    type?: ConcessionDiscountType;
    calculationType?: ConcessionDiscountCalculationType;
    value?: number;
    accountId?: number;
    appliesToIds?: number[];
    maxLimit?: number;
    status?: string;
  }
) =>
  put<ApiResponse<ConcessionDiscount>, typeof body>(
    `/api/v1/concession-discounts/${id}`,
    body
  );

export const deleteConcessionDiscount = (id: number) =>
  del<ApiResponse<ConcessionDiscount>>(
    `/api/v1/concession-discounts/${id}`
  );

export const concessionDiscountsApi = {
  list: fetchConcessionDiscounts,
  create: createConcessionDiscount,
  update: updateConcessionDiscount,
  remove: deleteConcessionDiscount,
};

export type JournalTransferType = "Debit" | "Credit";
export type BatchStatus = "Pending" | "Processed" | "Failed";

export type TempJournalTransferRow = {
  id: number;
  transType: JournalTransferType;
  accountId: number;
  debit: string | number | null;
  credit: string | number | null;
  status: string;
  batchStatus: BatchStatus;
  referenceNo: string;
  manualReferenceNo: string | null;
  transactionDate: string;
  postedAt: string | null;
  postedBy: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  finalPostedAt?: string | null;
  finalPostedBy?: string | null;
  projectId?: string | null;
  account?: {
    id: number;
    accountDescription?: string;
    accountNo?: string | null;
  } | null;
  project?: any;
};

export type TempJournalTransferGrouped = {
  referenceNo: string;
  batchStatus: BatchStatus;
  totalDebit: string | number;
  totalCredit: string | number;
  count: number;
  latestTransactionDate: string;
  manualReferenceNos: string[];
  postedBy: { id: string; name: string }[];
};

export const createTempJournalTransfersBulk = (body: {
  entries: {
    transType: JournalTransferType;
    accountId: number;
    debit: number | null;
    credit: number | null;
    manualReferenceNo?: string;
    transactionDate: string;
    batchStatus: BatchStatus;
    remarks?: string;
  }[];
}) =>
  post<
    ApiResponse<{
      referenceNo: string;
      rows: TempJournalTransferRow[];
    }>,
    typeof body
  >("/api/v1/temp-journal-transfers/bulk", body);

export const fetchTempJournalTransfersGroupedByReferenceNo = (params?: {
  batchStatus?: BatchStatus;
}) => {
  const sp = new URLSearchParams();
  if (params?.batchStatus) sp.append("batchStatus", params.batchStatus);
  const qs = sp.toString();
  return get<ApiResponse<TempJournalTransferGrouped[]>>(
    `/api/v1/temp-journal-transfers/grouped/reference-no${qs ? `?${qs}` : ""}`
  );
};

export const fetchTempJournalTransfers = (params?: {
  referenceNo?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.referenceNo) sp.append("referenceNo", params.referenceNo);
  if (params?.page != null) sp.append("page", String(params.page));
  if (params?.limit != null) sp.append("limit", String(params.limit));
  const qs = sp.toString();
  return get<
    ApiResponse<{
      tempJournalTransfers: TempJournalTransferRow[];
      pagination: Pagination;
    }>
  >(`/api/v1/temp-journal-transfers${qs ? `?${qs}` : ""}`);
};

export const tempJournalTransfersApi = {
  bulkCreate: createTempJournalTransfersBulk,
  groupedByReferenceNo: fetchTempJournalTransfersGroupedByReferenceNo,
  list: fetchTempJournalTransfers,
};

export type AppRolePrivilege = {
  id: string;
  name: string;
  description: string;
};

export type RoleMenu = {
  id: string;
  roleId: string;
  menuId: string;
  menu?: AppMenu;
};

export type AppRole = {
  id: string;
  name: string;
  status: "active" | "inactive" | string;
  privileges?: AppRolePrivilege[];
  roleMenus?: RoleMenu[];
};

export type Privilege = {
  id: string;
  name: string;
  description: string;
};

export const fetchAppRoles = (params?: { status?: string }) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.append("status", params.status);
  const qs = sp.toString();
  return get<ApiResponse<{ roles: AppRole[] }>>(
    `/api/v1/app-roles${qs ? `?${qs}` : ""}`,
  );
};

export const createAppRole = (body: { name: string; status: "active" | "inactive" }) =>
  post<ApiResponse<AppRole>>("/api/v1/app-roles", body);

export const updateAppRole = (
  id: string,
  body: { name: string; status: "active" | "inactive" },
) => put<ApiResponse<AppRole>>(`/api/v1/app-roles/${id}`, body);

export const assignRolePrivileges = (roleId: string, privilegeIds: string[]) =>
  post<ApiResponse<unknown>>(`/api/v1/app-roles/${roleId}/privileges`, {
    privilegeIds,
  });

export const removeRolePrivilege = (roleId: string, privilegeId: string) =>
  del<ApiResponse<unknown>>(
    `/api/v1/app-roles/${roleId}/privileges/${privilegeId}`,
  );

export const assignRoleMenus = (roleId: string, menuIds: string[]) =>
  post<ApiResponse<{ roleMenus: RoleMenu[] }>>(
    `/api/v1/app-roles/${roleId}/menus`,
    { menuIds },
  );

export const removeRoleMenu = (roleId: string, menuId: string) =>
  del<ApiResponse<unknown>>(`/api/v1/app-roles/${roleId}/menus/${menuId}`);

export const fetchPrivileges = () =>
  get<ApiResponse<{ privileges: Privilege[] }>>("/api/v1/privileges");

export const appRoleApi = {
  list: fetchAppRoles,
  create: createAppRole,
  update: updateAppRole,
  assignPrivileges: assignRolePrivileges,
  removePrivilege: removeRolePrivilege,
  assignMenus: assignRoleMenus,
  removeMenu: removeRoleMenu,
};

export const privilegeApi = {
  list: fetchPrivileges,
};

export type AppMenu = {
  id: string;
  route: string;
  caption: string;
  status: "Active" | "Inactive" | string;
};

export const fetchMenus = (params?: { status?: string }) => {
  const sp = new URLSearchParams();
  if (params?.status) sp.append("status", params.status);
  const qs = sp.toString();
  return get<ApiResponse<{ menus: AppMenu[] }>>(
    `/api/v1/menus${qs ? `?${qs}` : ""}`,
  );
};

export const createMenu = (body: {
  route: string;
  caption: string;
  status: "Active" | "Inactive";
}) => post<ApiResponse<AppMenu>>("/api/v1/menus", body);

export const updateMenu = (
  id: string,
  body: { route: string; caption: string; status: "Active" | "Inactive" },
) => put<ApiResponse<AppMenu>>(`/api/v1/menus/${id}`, body);

export const menuApi = {
  list: fetchMenus,
  create: createMenu,
  update: updateMenu,
};

export const fetchAuthMeMenus = () =>
  get<ApiResponse<{ menus: AppMenu[] }>>("/api/v1/auth/me/menus");

export default {
  request,
  get,
  post,
  put,
  del,
};
