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

export type Category = {
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive" | string;
  createdAt: string;
  updatedAt: string;
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
    throw new Error(text || res.statusText || `Request failed: ${res.status}`);
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
export const del = <T = any>(path: string) =>
  request<T>(path, { method: "DELETE" });

// Category-specific helpers (thin wrappers)
export const fetchCategories = () =>
  get<ApiResponse<{ categories: Category[]; pagination: Pagination }>>(
    "/api/v1/categories"
  );
export const createCategory = (body: { name: string; description?: string }) =>
  post<ApiResponse<Category>, typeof body>("/api/v1/categories", body);
export const updateCategory = (
  id: string,
  body: { name?: string; description?: string }
) => put<ApiResponse<Category>, typeof body>(`/api/v1/categories/${id}`, body);
export const deleteCategory = (id: string) =>
  del<any>(`/api/v1/categories/${id}`);

export const categoryApi = {
  list: fetchCategories,
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
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
export const fetchTerms = (params?: { page?: number; limit?: number; status?: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
  if (params?.status) queryParams.append("status", params.status);
  const qs = queryParams.toString();
  return get<any>(`/api/v1/terms${qs ? `?${qs}` : ""}`);
};

export const createTerm = (body: { name: string; status: "Active" | "Inactive" }) =>
  post<any>("/api/v1/terms", body);

export const updateTerm = (
  id: string,
  body: Partial<{ name: string; status: "Active" | "Inactive" | string }>
) => put<any>(`/api/v1/terms/${id}`, body);

export const deleteTerm = (id: string) => del<any>(`/api/v1/terms/${id}`);

export const termApi = {
  list: fetchTerms,
  create: createTerm,
  update: updateTerm,
  remove: deleteTerm,
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
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
  student?: {
    id: string;
    admissionNumber?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  createdBy?: { firstName?: string; lastName?: string } | null;
};

// Staff (new API)
export type Staff = {
  id: string;
  StaffNumber?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  status?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: string | null;
  user?: { id: string; email?: string | null; firstName?: string | null; lastName?: string | null } | null;
};

export const fetchStaff = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  const qs = queryParams.toString();
  return get<ApiResponse<{ staff: Staff[]; pagination: Pagination }>>(
    `/api/v1/staff${qs ? `?${qs}` : ""}`
  );
};

export const staffApi = {
  list: fetchStaff,
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
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
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
};

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

export const createDonationsBulk = (body: {
  storeId: string;
  notes?: string;
  transactionDate: string;
  items: { itemId: string; qtyIn: number }[];
}) =>
  post<ApiResponse<DonationRow[]>, typeof body>("/api/v1/donations/bulk", body);

export const deleteDonation = (id: string) =>
  del<ApiResponse<unknown>>(`/api/v1/donations/${id}`);

export const donationsApi = {
  list: fetchDonations,
  bulkCreate: createDonationsBulk,
  remove: deleteDonation,
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
  transactionDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  item?: { name?: string } | null;
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

export const studentCollectionsApi = {
  list: fetchStudentCollections,
  bulkCreate: createStudentCollectionsBulk,
  summary: fetchStudentCollectionsSummary,
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
export const fetchSubClasses = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 20));
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
  createdAt?: string;
  updatedAt?: string;
};

export const fetchUsers = (params?: {
  userType?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params?.page ?? 1));
  queryParams.append("limit", String(params?.limit ?? 100));
  if (params?.userType) queryParams.append("userType", params.userType);
  return get<ApiResponse<{ users: UserRow[]; pagination: Pagination }>>(
    `/api/v1/users?${queryParams.toString()}`
  );
};

export const usersApi = {
  list: fetchUsers,
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

export default {
  request,
  get,
  post,
  put,
  del,
};
