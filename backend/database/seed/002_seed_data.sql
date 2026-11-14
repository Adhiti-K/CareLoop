-- CareLoop Seed Data for initial roles, departments and sample patients
-- 002_seed_data.sql

INSERT INTO departments (department_id, department_name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Cardiology', 'Department specializing in heart diseases and post-cardiac surgery recovery'),
('22222222-2222-2222-2222-222222222222', 'Orthopedics', 'Department dealing with bone fractures, joint replacements and physical rehab'),
('33333333-3333-3333-3333-333333333333', 'General Surgery', 'Post-operative care and surgical wound healing'),
('44444444-4444-4444-4444-444444444444', 'Internal Medicine', 'Management of chronic conditions and metabolic stabilization')
ON CONFLICT (department_name) DO NOTHING;
