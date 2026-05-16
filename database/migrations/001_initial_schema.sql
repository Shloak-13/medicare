BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    relationship_label TEXT NOT NULL CHECK (relationship_label IN ('mom', 'dad', 'me', 'sister')),
    date_of_birth DATE,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE family_group_members (
    family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (family_group_id, user_id)
);

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL CHECK (
        specialty IN (
            'cardiologist',
            'dentist',
            'chiropractor',
            'neurologist',
            'general_physician',
            'other'
        )
    ),
    clinic_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    record_type TEXT NOT NULL CHECK (
        record_type IN (
            'prescription',
            'xray',
            'ct_scan',
            'blood_report',
            'doctor_note',
            'vaccination',
            'diagnosis',
            'other'
        )
    ),
    title TEXT NOT NULL,
    description TEXT,
    record_date DATE NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    original_filename TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'local',
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0),
    checksum_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prescribed_by_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    route TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    refill_quantity INTEGER CHECK (refill_quantity IS NULL OR refill_quantity >= 0),
    remaining_quantity INTEGER CHECK (remaining_quantity IS NULL OR remaining_quantity >= 0),
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE medication_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    days_of_week SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7],
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'completed', 'cancelled', 'missed')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE health_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measurement_type TEXT NOT NULL CHECK (
        measurement_type IN (
            'blood_pressure_systolic',
            'blood_pressure_diastolic',
            'heart_rate',
            'blood_glucose',
            'weight',
            'temperature',
            'spo2',
            'cholesterol_total',
            'hemoglobin',
            'other'
        )
    ),
    value NUMERIC(12, 3) NOT NULL,
    unit TEXT NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_relationship_label ON users(relationship_label);
CREATE INDEX idx_family_group_members_user ON family_group_members(user_id);
CREATE INDEX idx_doctors_owner ON doctors(owner_user_id);
CREATE INDEX idx_medical_records_patient_date ON medical_records(patient_user_id, record_date DESC);
CREATE INDEX idx_medical_records_type ON medical_records(record_type);
CREATE INDEX idx_file_uploads_patient ON file_uploads(patient_user_id);
CREATE INDEX idx_file_uploads_record ON file_uploads(medical_record_id);
CREATE INDEX idx_medications_patient_active ON medications(patient_user_id, is_active);
CREATE INDEX idx_appointments_patient_time ON appointments(patient_user_id, scheduled_at DESC);
CREATE INDEX idx_health_measurements_patient_type_time ON health_measurements(patient_user_id, measurement_type, measured_at DESC);
CREATE INDEX idx_audit_events_actor_time ON audit_events(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_events_patient_time ON audit_events(patient_user_id, created_at DESC);

INSERT INTO roles (name, description)
VALUES
    ('family_member', 'Standard family member who can manage their own health data and read authorized family group data'),
    ('admin', 'Administrative account for maintenance tasks');

INSERT INTO permissions (name, description)
VALUES
    ('records:read_authorized', 'Read own and authorized family group records'),
    ('records:write_own', 'Create, update, and delete own records'),
    ('files:read_authorized', 'Read own and authorized family group files'),
    ('files:write_own', 'Upload and delete own files'),
    ('analytics:read_authorized', 'Read own and authorized family group analytics');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'family_member';

INSERT INTO family_groups (name, description)
VALUES
    ('parents', 'Mom and Dad shared access group'),
    ('siblings', 'Me and Sister shared access group');

COMMIT;

