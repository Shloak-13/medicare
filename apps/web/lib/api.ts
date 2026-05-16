const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserRead = {
  id: string;
  display_name: string;
  email: string;
  relationship_label: string;
  date_of_birth: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type MedicalRecord = {
  id: string;
  patient_user_id: string;
  patient_display_name: string;
  doctor_id: string | null;
  record_type: string;
  title: string;
  description: string | null;
  record_date: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type MedicalRecordCreate = {
  record_type: string;
  title: string;
  description?: string;
  record_date: string;
};

export type Medication = {
  id: string;
  patient_user_id: string;
  patient_display_name: string;
  prescribed_by_doctor_id: string | null;
  name: string;
  dosage: string;
  frequency: string;
  meal_timing: string | null;
  route: string | null;
  start_date: string;
  end_date: string | null;
  refill_quantity: number | null;
  remaining_quantity: number | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationCreate = {
  name: string;
  dosage: string;
  frequency: string;
  meal_timing?: string;
  route?: string;
  start_date: string;
  end_date?: string;
  refill_quantity?: number;
  remaining_quantity?: number;
  instructions?: string;
};

export type Doctor = {
  id: string;
  owner_user_id: string;
  owner_display_name: string;
  name: string;
  specialty: string;
  clinic_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DoctorCreate = {
  name: string;
  specialty: string;
  clinic_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type Appointment = {
  id: string;
  patient_user_id: string;
  patient_display_name: string;
  doctor_id: string | null;
  doctor_name: string | null;
  scheduled_at: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentCreate = {
  doctor_id?: string;
  scheduled_at: string;
  reason?: string;
  status: string;
  notes?: string;
};

export type FileUploadItem = {
  id: string;
  patient_user_id: string;
  patient_display_name: string;
  medical_record_id: string | null;
  uploaded_by_user_id: string;
  original_filename: string;
  storage_provider: string;
  storage_key: string;
  mime_type: string;
  byte_size: number;
  checksum_sha256: string | null;
  created_at: string;
};

export type HealthMeasurement = {
  id: string;
  patient_user_id: string;
  patient_display_name: string;
  measurement_type: string;
  value: string;
  unit: string;
  measured_at: string;
  notes: string | null;
  created_at: string;
};

export type HealthMeasurementCreate = {
  measurement_type: string;
  value: number;
  unit: string;
  measured_at: string;
  notes?: string;
};

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error("Incorrect email or password");
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<UserRead> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load your profile");
  }

  return response.json();
}

export async function getMedicalRecords(
  token: string,
  scope: "own" | "shared" | "all" = "own"
): Promise<MedicalRecord[]> {
  const response = await fetch(`${API_URL}/api/records?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load medical records");
  }

  return response.json();
}

export async function createMedicalRecord(
  token: string,
  payload: MedicalRecordCreate
): Promise<MedicalRecord> {
  const response = await fetch(`${API_URL}/api/records`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not create medical record");
  }

  return response.json();
}

export async function deleteMedicalRecord(token: string, recordId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/records/${recordId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete medical record");
  }
}

export async function getMedications(
  token: string,
  scope: "own" | "shared" | "all" = "own"
): Promise<Medication[]> {
  const response = await fetch(`${API_URL}/api/medications?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load medications");
  }

  return response.json();
}

export async function createMedication(token: string, payload: MedicationCreate): Promise<Medication> {
  const response = await fetch(`${API_URL}/api/medications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not create medication");
  }

  return response.json();
}

export async function updateMedication(
  token: string,
  medicationId: string,
  payload: Partial<MedicationCreate> & { is_active?: boolean }
): Promise<Medication> {
  const response = await fetch(`${API_URL}/api/medications/${medicationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not update medication");
  }

  return response.json();
}

export async function deleteMedication(token: string, medicationId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/medications/${medicationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete medication");
  }
}

export async function getDoctors(
  token: string,
  scope: "own" | "shared" | "all" = "own"
): Promise<Doctor[]> {
  const response = await fetch(`${API_URL}/api/doctors?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load doctors");
  }

  return response.json();
}

export async function createDoctor(token: string, payload: DoctorCreate): Promise<Doctor> {
  const response = await fetch(`${API_URL}/api/doctors`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not create doctor");
  }

  return response.json();
}

export async function deleteDoctor(token: string, doctorId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/doctors/${doctorId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete doctor");
  }
}

export async function getAppointments(
  token: string,
  scope: "own" | "shared" | "all" = "own"
): Promise<Appointment[]> {
  const response = await fetch(`${API_URL}/api/appointments?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load appointments");
  }

  return response.json();
}

export async function createAppointment(token: string, payload: AppointmentCreate): Promise<Appointment> {
  const response = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not create appointment");
  }

  return response.json();
}

export async function updateAppointment(
  token: string,
  appointmentId: string,
  payload: Partial<AppointmentCreate>
): Promise<Appointment> {
  const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not update appointment");
  }

  return response.json();
}

export async function deleteAppointment(token: string, appointmentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete appointment");
  }
}

export async function getFiles(
  token: string,
  scope: "own" | "shared" | "all" = "own"
): Promise<FileUploadItem[]> {
  const response = await fetch(`${API_URL}/api/files?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load files");
  }

  return response.json();
}

export async function uploadFile(token: string, file: File): Promise<FileUploadItem> {
  const formData = new FormData();
  formData.set("upload", file);

  const response = await fetch(`${API_URL}/api/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Could not upload file");
  }

  return response.json();
}

export function getFileDownloadUrl(fileId: string): string {
  return `${API_URL}/api/files/${fileId}/download`;
}

export async function deleteFile(token: string, fileId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete file");
  }
}

export async function getHealthMeasurements(
  token: string,
  scope: "own" | "shared" | "all" = "own",
  measurementType?: string
): Promise<HealthMeasurement[]> {
  const params = new URLSearchParams({ scope });
  if (measurementType) {
    params.set("measurement_type", measurementType);
  }

  const response = await fetch(`${API_URL}/api/analytics/measurements?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not load health measurements");
  }

  return response.json();
}

export async function createHealthMeasurement(
  token: string,
  payload: HealthMeasurementCreate
): Promise<HealthMeasurement> {
  const response = await fetch(`${API_URL}/api/analytics/measurements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Could not create health measurement");
  }

  return response.json();
}

export async function deleteHealthMeasurement(token: string, measurementId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/analytics/measurements/${measurementId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Could not delete health measurement");
  }
}
