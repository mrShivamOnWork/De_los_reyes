# Product Vision — De Los Reyes Doctors

## What We Are Building

A full-stack clinic management web application for **De Los Reyes Doctors**, a private medical clinic in Metro Manila, Philippines. The system digitizes the entire patient lifecycle — from online booking through physical check-in, consultation, and health record management.

## Target Users

| Role | Who They Are | Primary Need |
|------|-------------|--------------|
| **Patient** | Filipino patients, mobile-first, varying tech literacy | Book appointments, track queue position, view health records |
| **Doctor** | Clinic physicians | See live patient queue, run consultations, write EHR notes |
| **Admin / Receptionist** | Front-desk staff | Manage walk-ins, check in patients, track billing, oversee operations |

## Core Problem Being Solved

Traditional clinics in the Philippines run on:
- Physical appointment books
- Chaotic walk-in queues with no visibility
- Paper-based or disconnected medical records
- No patient self-service options

This system replaces that with a unified digital platform.

## Product Goals

1. Give patients real-time queue visibility and self-service booking
2. Give doctors a zero-friction consultation workflow (minimal clicks)
3. Give admins a single dashboard for all clinic operations
4. Support both online-booked and walk-in patients in one merged queue

## Success Metrics

- Patients can book an appointment in under 2 minutes
- Doctors can process a patient queue without leaving the app
- Admins can check in a walk-in patient in under 60 seconds
- Zero appointment data lost due to system failure

## MVP Scope (Current Build)

- Public landing page with clinic information
- Patient Portal: registration, booking, appointment management, EHR viewer
- Doctor Portal: live queue, call-next, EHR entry, schedule view, patient history
- Admin Portal: dashboard, queue management, appointments, billing, doctor management, patient registry
- Supabase backend: authentication, RLS-protected data, real-time polling

## Brand Identity

- **Tagline:** "Professional Care You Can Trust"
- **Primary Colors:** Crimson Red `#D31A22`, Clinical Green `#00A859`
- **Dark Backgrounds:** `#080E14`, `#0C1520`, `#111E2B`
- **Fonts (landing page):** Playfair Display (headings) + Figtree (body)
- **Fonts (portals):** Montserrat (headings) + Open Sans (body)
- **Logo:** `brand_assets/brand_logo.jpg`
