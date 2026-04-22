const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
export const fetchCategories = () => get<any[]>("/api/v1/categories");
export const createCategory = (body: { name: string; description?: string }) =>
  post<any>("/api/v1/categories", body);
export const updateCategory = (
  id: string,
  body: { name?: string; description?: string }
) => put<any>(`/api/v1/categories/${id}`, body);
export const deleteCategory = (id: string) =>
  del<any>(`/api/v1/categories/${id}`);

export const categoryApi = {
  list: fetchCategories,
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
};

// Brand-specific helpers
export const fetchBrands = () => get<any[]>("/api/v1/brands");
export const createBrand = (body: { name: string }) =>
  post<any>("/api/v1/brands", body);
export const updateBrand = (id: string, body: { name?: string }) =>
  put<any>(`/api/v1/brands/${id}`, body);
export const deleteBrand = (id: string) => del<any>(`/api/v1/brands/${id}`);

export const brandApi = {
  list: fetchBrands,
  create: createBrand,
  update: updateBrand,
  remove: deleteBrand,
};

// Supplier-specific helpers
export const fetchSuppliers = () => get<any[]>("/api/v1/suppliers");
export const createSupplier = (body: any) =>
  post<any>("/api/v1/suppliers", body);
export const updateSupplier = (id: string, body: any) =>
  put<any>(`/api/v1/suppliers/${id}`, body);
export const deleteSupplier = (id: string) =>
  del<any>(`/api/v1/suppliers/${id}`);

export const supplierApi = {
  list: fetchSuppliers,
  create: createSupplier,
  update: updateSupplier,
  remove: deleteSupplier,
};

// Sub-category-specific helpers
export const fetchSubCategories = () => get<any[]>("/api/v1/sub_categories");
export const createSubCategory = (body: {
  name: string;
  description?: string;
  category_id?: string;
}) => post<any>("/api/v1/sub_categories", body);
export const updateSubCategory = (
  id: string,
  body: { name?: string; description?: string; category_id?: string }
) => put<any>(`/api/v1/sub_categories/${id}`, body);
export const deleteSubCategory = (id: string) =>
  del<any>(`/api/v1/sub_categories/${id}`);

export const subCategoryApi = {
  list: fetchSubCategories,
  create: createSubCategory,
  update: updateSubCategory,
  remove: deleteSubCategory,
};

// UOM-specific helpers
export const fetchUoms = () => get<any[]>("/api/v1/uoms");
export const createUom = (body: { name: string; symbol: string }) =>
  post<any>("/api/v1/uoms", body);
export const updateUom = (
  id: string,
  body: { name?: string; symbol?: string }
) => put<any>(`/api/v1/uoms/${id}`, body);
export const deleteUom = (id: string) => del<any>(`/api/v1/uoms/${id}`);

export const uomApi = {
  list: fetchUoms,
  create: createUom,
  update: updateUom,
  remove: deleteUom,
};

// Class Distribution-specific helpers
export const fetchClassDistributions = (params?: {
  class_id?: string;
  session_term_id?: string;
  page?: number;
  limit?: number;
}) => {
  let url = "/api/v1/inventory_transactions/distributions/query";
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
  return get<any>(url);
};
export const createClassDistribution = (body: any) =>
  post<any>("/api/v1/inventory_transactions/distributions", body);
export const updateClassDistribution = (id: string, body: any) =>
  put<any>(`/api/v1/inventory_transactions/distributions/${id}`, body);
export const deleteClassDistribution = (id: string) =>
  del<any>(`/api/v1/inventory_transactions/distributions/${id}`);

export const classDistributionApi = {
  list: fetchClassDistributions,
  create: createClassDistribution,
  update: updateClassDistribution,
  remove: deleteClassDistribution,
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

// Class Entitlements-specific helpers
export const fetchClassEntitlements = (params?: {
  class_id?: string;
  session_term_id?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.class_id) queryParams.append("class_id", params.class_id);
  if (params?.session_term_id)
    queryParams.append("session_term_id", params.session_term_id);
  const queryString = queryParams.toString();
  return get<any[]>(
    `/api/v1/class_inventory_entitlements${
      queryString ? `?${queryString}` : ""
    }`
  );
};

export const createClassEntitlement = (body: {
  class_id: string;
  inventory_item_id: string;
  session_term_id: string;
  quantity: number;
  notes?: string;
}) => post<any>("/api/v1/class_inventory_entitlements", body);

export const bulkUpsertClassEntitlements = (
  body: {
    class_id: string;
    inventory_item_id: string;
    session_term_id: string;
    quantity: number;
    notes?: string;
  }[]
) => post<any>("/api/v1/class_inventory_entitlements/bulk_upsert", body);

export const updateClassEntitlement = (
  id: string,
  body: {
    class_id?: string;
    inventory_item_id?: string;
    session_term_id?: string;
    quantity?: number;
    notes?: string;
  }
) => put<any>(`/api/v1/class_inventory_entitlements/${id}`, body);

export const deleteClassEntitlement = (id: string) =>
  del<any>(`/api/v1/class_inventory_entitlements/${id}`);

export const classEntitlementsApi = {
  list: fetchClassEntitlements,
  create: createClassEntitlement,
  bulkUpsert: bulkUpsertClassEntitlements,
  update: updateClassEntitlement,
  remove: deleteClassEntitlement,
};

// Student Collections-specific helpers
export const fetchStudentCollections = (params?: {
  student_id?: string;
  class_id?: string;
  session_term_id?: string;
  inventory_item_id?: string;
  eligible?: boolean;
  received?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.student_id) queryParams.append("student_id", params.student_id);
  if (params?.class_id) queryParams.append("class_id", params.class_id);
  if (params?.session_term_id)
    queryParams.append("session_term_id", params.session_term_id);
  if (params?.inventory_item_id)
    queryParams.append("inventory_item_id", params.inventory_item_id);
  if (params?.eligible !== undefined)
    queryParams.append("eligible", params.eligible.toString());
  if (params?.received !== undefined)
    queryParams.append("received", params.received.toString());
  const queryString = queryParams.toString();
  return get<any[]>(
    `/api/v1/student_inventory_collection${
      queryString ? `?${queryString}` : ""
    }`
  );
};

export const createStudentCollection = (body: {
  student_id: string;
  class_id: string;
  session_term_id: string;
  inventory_item_id: string;
  qty: number;
  eligible: boolean;
  received: boolean;
}) => post<any>("/api/v1/student_inventory_collection", body);

export const bulkUpsertStudentCollections = (
  body: {
    student_id: string;
    class_id: string;
    session_term_id: string;
    inventory_item_id: string;
    qty: number;
    eligible: boolean;
    received: boolean;
  }[]
) => post<any>("/api/v1/student_inventory_collection/bulk_upsert", body);

export const updateStudentCollection = (
  id: string,
  body: {
    student_id?: string;
    class_id?: string;
    session_term_id?: string;
    inventory_item_id?: string;
    qty?: number;
    eligible?: boolean;
    received?: boolean;
  }
) => put<any>(`/api/v1/student_inventory_collection/${id}`, body);

export const deleteStudentCollection = (id: string) =>
  del<any>(`/api/v1/student_inventory_collection/${id}`);

export const studentCollectionsApi = {
  list: fetchStudentCollections,
  create: createStudentCollection,
  bulkUpsert: bulkUpsertStudentCollections,
  update: updateStudentCollection,
  remove: deleteStudentCollection,
};

// Inventory-specific helpers
export const fetchInventoryItems = () => get<any[]>("/api/v1/inventory_items");
export const createInventoryItem = (body: any) =>
  post<any>("/api/v1/inventory_items", body);
export const updateInventoryItem = (id: string, body: any) =>
  put<any>(`/api/v1/inventory_items/${id}`, body);
export const deleteInventoryItem = (id: string) =>
  del<any>(`/api/v1/inventory_items/${id}`);

export const inventoryApi = {
  list: fetchInventoryItems,
  create: createInventoryItem,
  update: updateInventoryItem,
  remove: deleteInventoryItem,
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

// Student-specific helpers
export const fetchStudents = (params?: {
  status?: "active" | "inactive" | "graduated";
  class_id?: string;
  gender?: "male" | "female" | "other";
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.class_id) queryParams.append("class_id", params.class_id);
  if (params?.gender) queryParams.append("gender", params.gender);
  const queryString = queryParams.toString();
  return get<any[]>(`/api/v1/students${queryString ? `?${queryString}` : ""}`);
};
export const createStudent = (body: {
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: "male" | "female" | "other";
  date_of_birth?: string;
  class_id?: string;
  guardian_name: string;
  guardian_contact: string;
  address?: string;
  status: "active" | "inactive" | "graduated";
}) => post<any>("/api/v1/students", body);
export const updateStudent = (
  id: string,
  body: {
    admission_number?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    gender?: "male" | "female" | "other";
    date_of_birth?: string;
    class_id?: string;
    guardian_name?: string;
    guardian_contact?: string;
    address?: string;
    status?: "active" | "inactive" | "graduated";
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
export const fetchClasses = () => get<any[]>("/api/v1/school_classes");
export const createClass = (body: {
  name: string;
  status: "active" | "inactive" | "archived";
}) => post<any>("/api/v1/school_classes", body);
export const updateClass = (
  id: string,
  body: {
    name?: string;
    status?: "active" | "inactive" | "archived";
  }
) => put<any>(`/api/v1/school_classes/${id}`, body);
export const deleteClass = (id: string) =>
  del<any>(`/api/v1/school_classes/${id}`);

export const classApi = {
  list: fetchClasses,
  create: createClass,
  update: updateClass,
  remove: deleteClass,
};

// Users API
export const fetchUsers = () => get<any[]>("/api/v1/users");

export const usersApi = {
  list: fetchUsers,
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

export const distributionCollectionApi = {
  query: async (params?: {
    inventory_item_id?: string;
    class_id?: string;
    session_term_id?: string;
    teacher_id?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.inventory_item_id)
      queryParams.append("inventory_item_id", params.inventory_item_id);
    if (params?.class_id) queryParams.append("class_id", params.class_id);
    if (params?.session_term_id)
      queryParams.append("session_term_id", params.session_term_id);
    if (params?.teacher_id) queryParams.append("teacher_id", params.teacher_id);

    const response = await get<any>(
      `/api/v1/inventory_summary/distribution-collection/query?${queryParams.toString()}`
    );
    return response;
  },
};

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
