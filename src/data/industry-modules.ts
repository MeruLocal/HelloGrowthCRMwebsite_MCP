/**
 * What each industry vertical actually includes.
 *
 * GENERATED (one-off script, not kept in this repo) from the product's own
 * generated inventory (hellocrm FEATURE_INVENTORY.md, commit 5680f9f0a6, 2026-10-23). Every registered
 * navigation view is assigned to a vertical or to the cross-cutting list; module lists mirror that inventory;
 * re-derive them from a newer inventory when it changes. `highlights` / `not_built` were added by hand after reading the code (2026-10-24).
 *
 * kind: "dedicated" = has its own screens; "alias" = selectable industry that reuses another vertical's
 * screens; "configuration_only" = pipeline, custom fields, scheduler and AI persona seeds, no dedicated screens.
 */

export const INDUSTRY_MODULES_VERIFIED_AT = "2026-10-24";
export const INDUSTRY_MODULES_SOURCE = "hellocrm FEATURE_INVENTORY.md @ 5680f9f0a6 (2026-10-23)";

export interface IndustryModule { id: string; label: string }
export interface IndustryVertical {
  key: string;
  name: string;
  description: string;
  kind: "dedicated" | "alias" | "configuration_only";
  alias_of: string | null;
  modules: IndustryModule[];
  highlights: string[];
  not_built: string[];
}

export const INDUSTRY_VERTICALS: IndustryVertical[] = [
  {
    "key": "agri_inputs",
    "name": "Agri Inputs",
    "description": "Seeds, fertilizers, pesticides, agri-input dealers, farm equipment",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "field-sales",
        "label": "Field sales"
      },
      {
        "id": "fs-activities",
        "label": "Work schedule"
      },
      {
        "id": "fs-adherence",
        "label": "Route adherence"
      },
      {
        "id": "fs-approvals",
        "label": "Approvals"
      },
      {
        "id": "fs-budget",
        "label": "Fs budget"
      },
      {
        "id": "fs-calendar",
        "label": "Visit calendar"
      },
      {
        "id": "fs-campaigns",
        "label": "Field campaigns"
      },
      {
        "id": "fs-clients",
        "label": "Field customers"
      },
      {
        "id": "fs-coverage-geo",
        "label": "Fs coverage geo"
      },
      {
        "id": "fs-dashboard",
        "label": "Field sales reports"
      },
      {
        "id": "fs-deals",
        "label": "Fs deals"
      },
      {
        "id": "fs-deviation",
        "label": "Plan vs actual working"
      },
      {
        "id": "fs-divisions",
        "label": "Field sales setup"
      },
      {
        "id": "fs-drill",
        "label": "Fs drill"
      },
      {
        "id": "fs-invoices",
        "label": "SAP primary sales"
      },
      {
        "id": "fs-map",
        "label": "Route map"
      },
      {
        "id": "fs-offline",
        "label": "Fs offline"
      },
      {
        "id": "fs-orders",
        "label": "Orders"
      },
      {
        "id": "fs-pba",
        "label": "Fs pba"
      },
      {
        "id": "fs-plan",
        "label": "Sales planning"
      },
      {
        "id": "fs-planupload",
        "label": "Fs planupload"
      },
      {
        "id": "fs-pricing",
        "label": "Fs pricing"
      },
      {
        "id": "fs-products",
        "label": "Fs products"
      },
      {
        "id": "fs-prospects",
        "label": "Field prospects"
      },
      {
        "id": "fs-rollup",
        "label": "Fs rollup"
      },
      {
        "id": "fs-routes",
        "label": "Routes"
      },
      {
        "id": "fs-sap",
        "label": "Fs sap"
      },
      {
        "id": "fs-stock",
        "label": "Dealer stock"
      },
      {
        "id": "fs-today",
        "label": "My day"
      },
      {
        "id": "fs-tracking",
        "label": "Fs tracking"
      },
      {
        "id": "fs-visits",
        "label": "Field visits & evidence"
      },
      {
        "id": "workspace",
        "label": "My Workspace"
      }
    ],
    "highlights": [
      "Sales planning with budget, roll-up, plan vs actual, approvals; routes with manager approval; visit evidence; dealer stock; order desk; dealer portal; offline queue",
      "SAP S/4HANA connector (modes off, sandbox, live)"
    ],
    "not_built": [
      "Two-way SAP and general offline are not complete; connector defaults to off",
      "Plan entitlement not confirmed"
    ]
  },
  {
    "key": "automotive_service",
    "name": "Auto Service",
    "description": "Car service centres, workshops, tyre shops, detailing studios",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "beauty_wellness",
    "name": "Beauty & Wellness",
    "description": "Salons, spas, clinics, beauty services, grooming",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "bw-appointments",
        "label": "Appointments"
      },
      {
        "id": "bw-clients",
        "label": "Clients"
      },
      {
        "id": "bw-documents",
        "label": "Consent & Documents"
      },
      {
        "id": "bw-memberships",
        "label": "Memberships & Packages"
      },
      {
        "id": "bw-reports",
        "label": "Reports"
      },
      {
        "id": "bw-services",
        "label": "Services"
      },
      {
        "id": "bw-staff",
        "label": "Stylists & Staff"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "ca_accounting",
    "name": "CA / Accounting",
    "description": "Chartered accountants, tax consultants, bookkeeping firms",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "ca-billing",
        "label": "Ca billing"
      },
      {
        "id": "ca-calendar",
        "label": "Compliance Calendar"
      },
      {
        "id": "ca-clients",
        "label": "Ca clients"
      },
      {
        "id": "ca-dashboard",
        "label": "Ca dashboard"
      },
      {
        "id": "ca-documents",
        "label": "Documents"
      },
      {
        "id": "ca-engagements",
        "label": "Engagements & Jobs"
      },
      {
        "id": "ca-filings",
        "label": "Filings & Returns"
      },
      {
        "id": "ca-notices",
        "label": "Notices"
      },
      {
        "id": "ca-queries",
        "label": "Queries"
      },
      {
        "id": "ca-reports",
        "label": "Reports"
      },
      {
        "id": "ca-tasks",
        "label": "Timesheets"
      }
    ],
    "highlights": [
      "Compliance calendar, filings with approval, notices, queries, documents, engagements, tasks, reports, UDIN and DSC registers, time with write-off and WIP dashboard, engagement letters"
    ],
    "not_built": [
      "US tax-software connectors (Lacerte, Drake, UltraTax) and Bill.com are planned, not built"
    ]
  },
  {
    "key": "cloud_kitchen",
    "name": "Cloud Kitchen",
    "description": "Delivery-only kitchens and food brands — menus, orders, aggregator channels, outlets",
    "kind": "alias",
    "alias_of": "restaurant_fnb",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "construction",
    "name": "Construction",
    "description": "Builders, contractors, civil works, project management",
    "kind": "alias",
    "alias_of": "interior_design",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "dental_clinic",
    "name": "Dental Clinic",
    "description": "Dental clinics, orthodontists, dental surgeons — patients, appointments, treatment plans",
    "kind": "alias",
    "alias_of": "doctors_clinic",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "doctors_clinic",
    "name": "Doctors / Clinic",
    "description": "Clinics, hospitals, multi-specialty centres, patient management",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "clinic-appointments",
        "label": "Clinic appointments"
      },
      {
        "id": "clinic-billing",
        "label": "Clinic billing"
      },
      {
        "id": "clinic-dashboard",
        "label": "Clinic dashboard"
      },
      {
        "id": "clinic-doctors",
        "label": "Doctors & Staff"
      },
      {
        "id": "clinic-followups",
        "label": "Clinic followups"
      },
      {
        "id": "clinic-patients",
        "label": "Patients"
      },
      {
        "id": "clinic-prescriptions",
        "label": "Prescriptions"
      },
      {
        "id": "clinic-reports",
        "label": "Clinic reports"
      },
      {
        "id": "clinic-services",
        "label": "Clinic services"
      },
      {
        "id": "clinic-visits",
        "label": "Consultations & Visits"
      }
    ],
    "highlights": [
      "Patients (patient id, assigned doctor, blood group), Doctors & Staff (working hours, leave, locums), Consultations & Visits (live queue, clinical notes), Prescriptions (new, print, void)",
      "Appointments board by doctor with token and room; Patient Follow-ups task board; Collect Visit Fee on invoices; clinic analytics (no-show rate, doctor utilisation, service performance)",
      "DPDP per-purpose consent (care, WhatsApp reminders, record sharing, teleconsult); clinical free text is withheld from the AI tools",
      "ABHA identity card (ABDM milestone 1, identity only)",
      "Default pipeline: New Patient, Appointment Booked, Consultation Done, Treatment Ongoing, Follow-Up Due, Discharged / Closed"
    ],
    "not_built": [
      "No treatment-plan module or session packages (descriptions of the dental and physio aliases mention them, the code does not implement them)",
      "Appointment-reminder sending not confirmed",
      "Not offered to US and Canada tenants"
    ]
  },
  {
    "key": "driving_school",
    "name": "Driving School",
    "description": "Driving schools — learners, batches, licence milestones, instructor and vehicle scheduling",
    "kind": "alias",
    "alias_of": "education",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "ecommerce",
    "name": "eCommerce",
    "description": "Online retail, Shopify, Stripe, payments",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "ecom-abandoned-carts",
        "label": "Abandoned Carts"
      },
      {
        "id": "ecom-customers",
        "label": "Customers"
      },
      {
        "id": "ecom-dashboard",
        "label": "Store Dashboard"
      },
      {
        "id": "ecom-integrations",
        "label": "Integrations"
      },
      {
        "id": "ecom-orders",
        "label": "Orders"
      },
      {
        "id": "ecom-returns",
        "label": "Returns & Refunds"
      },
      {
        "id": "ecom-shipments",
        "label": "Shipments"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "education",
    "name": "Education",
    "description": "Schools, colleges, coaching, edtech, institutes — students, staff, partner vendors",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "edu-admissions",
        "label": "Admissions"
      },
      {
        "id": "edu-attendance",
        "label": "Attendance"
      },
      {
        "id": "edu-batches",
        "label": "Batches & Courses"
      },
      {
        "id": "edu-certificates",
        "label": "Certificates"
      },
      {
        "id": "edu-dashboard",
        "label": "Edu dashboard"
      },
      {
        "id": "edu-enrollments",
        "label": "Enrollment"
      },
      {
        "id": "edu-exams",
        "label": "Exams & Results"
      },
      {
        "id": "edu-fees",
        "label": "Fee Management"
      },
      {
        "id": "edu-renewals",
        "label": "Renewals"
      },
      {
        "id": "edu-students",
        "label": "Students"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "event_management",
    "name": "Event Management",
    "description": "Wedding planners, corporate events, exhibition organisers",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "event-bookings",
        "label": "Events & Bookings"
      },
      {
        "id": "event-checkin",
        "label": "Check-in & Attendance"
      },
      {
        "id": "event-dashboard",
        "label": "Event dashboard"
      },
      {
        "id": "event-guests",
        "label": "Guests & Attendees"
      },
      {
        "id": "event-operations",
        "label": "Event Operations"
      },
      {
        "id": "event-vendors",
        "label": "Vendors & Services"
      },
      {
        "id": "event-venues",
        "label": "Venues & Seating"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "export_trade",
    "name": "Export & Trade",
    "description": "Exporters, merchant traders, buying houses — buyer enquiries, export orders, shipments, trade documents, IEC/compliance",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "exp-buyers",
        "label": "Buyers"
      },
      {
        "id": "exp-compliance",
        "label": "IEC & Compliance"
      },
      {
        "id": "exp-dashboard",
        "label": "Export Dashboard"
      },
      {
        "id": "exp-documents",
        "label": "Trade Documents"
      },
      {
        "id": "exp-orders",
        "label": "Export Orders"
      },
      {
        "id": "exp-shipments",
        "label": "Shipments"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "field_service_amc",
    "name": "Field Service / AMC",
    "description": "Equipment maintenance, service calls, AMC contracts, technician dispatch",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "fsvc-contracts",
        "label": "AMC Contracts"
      },
      {
        "id": "fsvc-dispatch",
        "label": "Dispatch"
      }
    ],
    "highlights": [
      "AMC contracts, dispatch, preventive-visit schedule, ticket-to-visit job card, renewal reminders at 60, 30, 7 and 0 days"
    ],
    "not_built": [
      "There is no separate solar-installer industry; a solar plan exists but is not built"
    ]
  },
  {
    "key": "financial_services",
    "name": "Financial Services",
    "description": "Loans, lending, NBFCs, wealth management",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "dsa-analytics",
        "label": "DSA Analytics"
      },
      {
        "id": "dsa-balance-transfer",
        "label": "Balance Transfer"
      },
      {
        "id": "dsa-connectors",
        "label": "Connectors"
      },
      {
        "id": "dsa-cross-sell",
        "label": "Insurance Cross-Sell"
      },
      {
        "id": "dsa-margin",
        "label": "Margin P&L"
      },
      {
        "id": "dsa-speed-to-lead",
        "label": "Speed-to-Lead"
      },
      {
        "id": "finserv-loan-desk",
        "label": "Loan Desk"
      },
      {
        "id": "inv-dashboard",
        "label": "Inv dashboard"
      },
      {
        "id": "inv-funds",
        "label": "Mutual Funds"
      },
      {
        "id": "inv-sips",
        "label": "SIPs"
      },
      {
        "id": "loan-payout-reconciliation",
        "label": "Payout Reconciliation"
      },
      {
        "id": "loan-payouts",
        "label": "Payout Receivables"
      },
      {
        "id": "loan-sub-dsa-network",
        "label": "Sub-DSA Network"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "fmcg_distributor",
    "name": "FMCG Distributor",
    "description": "FMCG and general-goods distributors — retailers, beat routes, orders, stock, schemes",
    "kind": "alias",
    "alias_of": "pharma_distribution",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "freight_forwarding",
    "name": "Freight Forwarding",
    "description": "Freight forwarders, NVOCCs, customs brokers — ocean/air jobs, consolidations, customs, job costing",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "ff-billing",
        "label": "Billing & Job Costing"
      },
      {
        "id": "ff-bookings",
        "label": "Bookings & Schedules"
      },
      {
        "id": "ff-claims",
        "label": "Claims"
      },
      {
        "id": "ff-consolidations",
        "label": "Consolidations"
      },
      {
        "id": "ff-containers",
        "label": "Containers"
      },
      {
        "id": "ff-documents",
        "label": "Documents & Customs"
      },
      {
        "id": "ff-jobs",
        "label": "Forwarding Jobs"
      },
      {
        "id": "ff-partners",
        "label": "Partners & Vendors"
      },
      {
        "id": "ff-portal",
        "label": "Customer Portal"
      },
      {
        "id": "ff-quotations",
        "label": "Quotations"
      },
      {
        "id": "ff-rates",
        "label": "Rates & Tariffs"
      },
      {
        "id": "ff-reports",
        "label": "Reports"
      },
      {
        "id": "ff-road",
        "label": "Road Transport"
      },
      {
        "id": "ff-today",
        "label": "Today"
      },
      {
        "id": "ff-tracking",
        "label": "Tracking"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "general",
    "name": "General",
    "description": "Standard CRM without industry modules",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "gym_fitness",
    "name": "Gym & Fitness",
    "description": "Gyms, yoga studios, CrossFit, personal trainers, sports academies",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "gym-attendance",
        "label": "Attendance"
      },
      {
        "id": "gym-classes",
        "label": "Classes"
      },
      {
        "id": "gym-dashboard",
        "label": "Gym dashboard"
      },
      {
        "id": "gym-documents",
        "label": "Documents & Files"
      },
      {
        "id": "gym-members",
        "label": "Members"
      },
      {
        "id": "gym-nutrition",
        "label": "Nutrition & Diet"
      },
      {
        "id": "gym-plans",
        "label": "Memberships & Plans"
      },
      {
        "id": "gym-programs",
        "label": "Workouts & Programs"
      },
      {
        "id": "gym-reports",
        "label": "Reports"
      },
      {
        "id": "gym-trainers",
        "label": "Trainers & Staff"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "homestay",
    "name": "Homestay",
    "description": "Homestays, villas and B&Bs — rooms, reservations, guests, rates, housekeeping",
    "kind": "alias",
    "alias_of": "hospitality",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "hospitality",
    "name": "Hospitality",
    "description": "Hotels and resorts: rooms, reservations, front desk, housekeeping, rates, guests",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "accounts",
        "label": "Corporate & Agents"
      },
      {
        "id": "deals",
        "label": "Events & Banquets"
      },
      {
        "id": "hotel-calendar",
        "label": "Booking Calendar"
      },
      {
        "id": "hotel-channels",
        "label": "Channels & OTAs"
      },
      {
        "id": "hotel-enquiries",
        "label": "Booking Enquiries"
      },
      {
        "id": "hotel-frontdesk",
        "label": "Front Desk"
      },
      {
        "id": "hotel-housekeeping",
        "label": "Housekeeping"
      },
      {
        "id": "hotel-loyalty",
        "label": "Loyalty & Offers"
      },
      {
        "id": "hotel-rates",
        "label": "Rates & Availability"
      },
      {
        "id": "hotel-reports",
        "label": "Hotel Reports"
      },
      {
        "id": "hotel-reservations",
        "label": "Reservations"
      },
      {
        "id": "hotel-reviews",
        "label": "Reviews & Feedback"
      },
      {
        "id": "hotel-rooms",
        "label": "Rooms & Room Types"
      },
      {
        "id": "invoices",
        "label": "Billing & Folios"
      },
      {
        "id": "table",
        "label": "Guests"
      }
    ],
    "highlights": [
      "Front desk, reservations and booking calendar, rooms, rates, housekeeping, channels, guest loyalty, folios"
    ],
    "not_built": []
  },
  {
    "key": "immigration",
    "name": "Immigration & Visa Consultancy",
    "description": "Visa and immigration consultants — applicants, cases, document checklists, deadlines, sub-agents",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "imm-dashboard",
        "label": "Imm dashboard"
      },
      {
        "id": "imm-deadlines",
        "label": "Deadlines & Reminders"
      },
      {
        "id": "imm-documents",
        "label": "Documents & Checklists"
      },
      {
        "id": "imm-expiry",
        "label": "Expiry & Renewals"
      },
      {
        "id": "imm-fees",
        "label": "Fees & Payment Milestones"
      },
      {
        "id": "imm-partners",
        "label": "Partners / Sub-agents"
      },
      {
        "id": "imm-reports",
        "label": "Reports"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "insurance",
    "name": "Insurance",
    "description": "Insurance agents, brokers, POSPs, renewals, policy management",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "ins-agents",
        "label": "Agents / POSPs"
      },
      {
        "id": "ins-catalog",
        "label": "Carriers & Products"
      },
      {
        "id": "ins-claims",
        "label": "Claims"
      },
      {
        "id": "ins-commissions",
        "label": "Commissions"
      },
      {
        "id": "ins-dashboard",
        "label": "Ins dashboard"
      },
      {
        "id": "ins-documents",
        "label": "Documents"
      },
      {
        "id": "ins-policies",
        "label": "Policies"
      },
      {
        "id": "ins-premiums",
        "label": "Premium & Payment"
      },
      {
        "id": "ins-renewals",
        "label": "Renewals"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "interior_design",
    "name": "Architecture & Interior Design",
    "description": "Architecture practices, interior designers, modular kitchen, office fit-out",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "interior-design-approvals",
        "label": "Client Approvals"
      },
      {
        "id": "interior-design-billing",
        "label": "Billing & Payments"
      },
      {
        "id": "interior-design-boq",
        "label": "BOQ"
      },
      {
        "id": "interior-design-clients",
        "label": "Requirements"
      },
      {
        "id": "interior-design-dashboard",
        "label": "Interior design dashboard"
      },
      {
        "id": "interior-design-documents",
        "label": "Documents & Contracts"
      },
      {
        "id": "interior-design-drawings",
        "label": "Drawings"
      },
      {
        "id": "interior-design-procurement",
        "label": "Procurement"
      },
      {
        "id": "interior-design-projects",
        "label": "Projects"
      },
      {
        "id": "interior-design-reports",
        "label": "Reports & Analytics"
      },
      {
        "id": "interior-design-site-execution",
        "label": "Site Execution"
      },
      {
        "id": "interior-design-team",
        "label": "Team / Designers / Contractors"
      }
    ],
    "highlights": [
      "Projects, BOQ, drawings, procurement, site execution, client approvals, milestone billing"
    ],
    "not_built": []
  },
  {
    "key": "it_services",
    "name": "IT Services / MSP",
    "description": "Software projects, IT support, MSP contracts, SLAs, helpdesk",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "legal_services",
    "name": "Legal Services",
    "description": "Law firms, advocates, CA/CS firms",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "legal-advocates",
        "label": "Advocates & Team"
      },
      {
        "id": "legal-clients",
        "label": "Legal clients"
      },
      {
        "id": "legal-compliance",
        "label": "Compliance & Risk"
      },
      {
        "id": "legal-dashboard",
        "label": "Legal dashboard"
      },
      {
        "id": "legal-deadlines",
        "label": "Legal deadlines"
      },
      {
        "id": "legal-documents",
        "label": "Documents & Drafting"
      },
      {
        "id": "legal-hearings",
        "label": "Court Diary & Hearings"
      },
      {
        "id": "legal-invoices",
        "label": "Legal invoices"
      },
      {
        "id": "legal-matters",
        "label": "Matters & Cases"
      },
      {
        "id": "legal-reports",
        "label": "Reports & Analytics"
      },
      {
        "id": "legal-time",
        "label": "Time & Billing"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "logistics_freight",
    "name": "Logistics & Freight",
    "description": "Freight forwarders, transport companies, courier aggregators, 3PL",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "logistics-billing",
        "label": "Freight Billing"
      },
      {
        "id": "logistics-claims",
        "label": "Claims"
      },
      {
        "id": "logistics-consignments",
        "label": "Consignments"
      },
      {
        "id": "logistics-drivers",
        "label": "Drivers"
      },
      {
        "id": "logistics-fleet",
        "label": "Fleet"
      },
      {
        "id": "logistics-pod",
        "label": "POD & Exceptions"
      },
      {
        "id": "logistics-rate-contracts",
        "label": "Customers & Rate Contracts"
      },
      {
        "id": "logistics-reports",
        "label": "Reports & Analytics"
      },
      {
        "id": "logistics-tracking",
        "label": "Tracking"
      },
      {
        "id": "logistics-trips",
        "label": "Trips & Dispatch"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "manufacturing",
    "name": "Manufacturing & Distribution",
    "description": "ERP, inventory, logistics",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "mfg-customers",
        "label": "Customer Profiles"
      },
      {
        "id": "mfg-dashboard",
        "label": "Dashboard"
      },
      {
        "id": "mfg-inventory",
        "label": "Inventory & Traceability"
      },
      {
        "id": "mfg-orders",
        "label": "Sales Orders"
      },
      {
        "id": "mfg-parts",
        "label": "Mfg parts"
      },
      {
        "id": "mfg-production",
        "label": "Production"
      },
      {
        "id": "mfg-products-engineering",
        "label": "Products & Engineering"
      },
      {
        "id": "mfg-purchase-orders",
        "label": "Procurement"
      },
      {
        "id": "mfg-quality",
        "label": "Quality Management"
      },
      {
        "id": "mfg-reports",
        "label": "Reports & Analytics"
      },
      {
        "id": "mfg-rfqs",
        "label": "RFQ & Quotations"
      },
      {
        "id": "mfg-shipments",
        "label": "Shipments & Delivery"
      }
    ],
    "highlights": [
      "RFQ, sales orders, production, quality (NCR), procurement, inventory with lots and serials, shipments"
    ],
    "not_built": [
      "e-Invoice (IRN) and e-Way Bill are planned, not built",
      "Hidden from the public industry picker (it backs the KanchanFlow product)"
    ]
  },
  {
    "key": "marketing_agency",
    "name": "Marketing / Digital Agency",
    "description": "SEO, performance-ads, social and creative agencies — retainer clients, deliverables, per-client campaign reporting, client portal",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "agency-content",
        "label": "Content Calendar"
      },
      {
        "id": "agency-deliverables",
        "label": "Projects & Deliverables"
      },
      {
        "id": "agency-portal",
        "label": "Client Portal"
      },
      {
        "id": "agency-reporting",
        "label": "Campaign Reporting"
      },
      {
        "id": "agency-reports",
        "label": "Reports"
      },
      {
        "id": "agency-retainers",
        "label": "Retainers & Contracts"
      },
      {
        "id": "agency-time",
        "label": "Time & Utilisation"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "matrimonial",
    "name": "Matrimonial",
    "description": "Matrimony bureaus, profile matching, wedding consultants",
    "kind": "alias",
    "alias_of": "matrimony",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "matrimony",
    "name": "Matrimony",
    "description": "Matchmaking agencies, marriage bureaus, profile management",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "mat-dashboard",
        "label": "Mat dashboard"
      },
      {
        "id": "mat-interests",
        "label": "Interests"
      },
      {
        "id": "mat-matchmaking",
        "label": "Matchmaking"
      },
      {
        "id": "mat-meetings",
        "label": "Mat meetings"
      },
      {
        "id": "mat-memberships",
        "label": "Mat memberships"
      },
      {
        "id": "mat-profiles",
        "label": "Profiles"
      },
      {
        "id": "mat-settings",
        "label": "Mat settings"
      },
      {
        "id": "mat-shortlist",
        "label": "Shortlist"
      },
      {
        "id": "mat-success-stories",
        "label": "Success Stories"
      },
      {
        "id": "mat-verification",
        "label": "Verification"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "mortgage_broker",
    "name": "Mortgage Broker",
    "description": "Mortgage and home-loan brokers — applicants, lender files, sanction pipeline, payouts",
    "kind": "alias",
    "alias_of": "financial_services",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "music_dance_academy",
    "name": "Music & Dance Academy",
    "description": "Music, dance and performing-arts academies — students, batches, fee renewals, recitals",
    "kind": "alias",
    "alias_of": "education",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "ngo_fundraising",
    "name": "NGO / Fundraising",
    "description": "NGOs, trusts, charities, donation management, CSR",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "other",
    "name": "Other",
    "description": "Tell us the industry you operate in",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "pharma_distribution",
    "name": "Pharma & Medical",
    "description": "Pharma distributors, medical reps, stockists, healthcare supply",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "pharma-compliance",
        "label": "Compliance & Licences"
      },
      {
        "id": "pharma-customers",
        "label": "Pharma customers"
      },
      {
        "id": "pharma-dashboard",
        "label": "Pharma dashboard"
      },
      {
        "id": "pharma-dcr",
        "label": "Daily Call Reporting"
      },
      {
        "id": "pharma-field-force",
        "label": "Field Force & Tour Plan"
      },
      {
        "id": "pharma-inventory",
        "label": "Inventory & Expiry"
      },
      {
        "id": "pharma-orders",
        "label": "Orders & Secondary Sales"
      },
      {
        "id": "pharma-products",
        "label": "Products, Batches & Pricing"
      },
      {
        "id": "pharma-purchases",
        "label": "Purchases & Returns"
      },
      {
        "id": "pharma-reports",
        "label": "Reports & Analytics"
      },
      {
        "id": "pharma-samples",
        "label": "Samples & Inputs"
      }
    ],
    "highlights": [
      "Field force and tour plan, Daily Call Reporting (DCR), samples, secondary-sales orders, inventory and expiry, purchases and returns, compliance and licences"
    ],
    "not_built": []
  },
  {
    "key": "physiotherapy_clinic",
    "name": "Physiotherapy Clinic",
    "description": "Physiotherapy and rehab clinics — patients, appointments, treatment plans, session packages",
    "kind": "alias",
    "alias_of": "doctors_clinic",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "pilgrimage_tour_operator",
    "name": "Pilgrimage Tour Operator",
    "description": "Pilgrimage and religious-tour operators — itineraries, group departures, pax, instalments",
    "kind": "alias",
    "alias_of": "travel_agency",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "plotted_land_developer",
    "name": "Plotted Land Developer",
    "description": "Plotted-land and layout developers — plots, bookings, site visits, instalment collections",
    "kind": "alias",
    "alias_of": "real_estate",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "preschool",
    "name": "Preschool / Daycare",
    "description": "Preschools, playschools and daycare — admissions, parents, fee cycles, attendance",
    "kind": "alias",
    "alias_of": "education",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "printing_packaging",
    "name": "Printing & Packaging",
    "description": "Print shops, packaging manufacturers, flexo, offset",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "real_estate",
    "name": "Real Estate",
    "description": "Brokers, builders, property management",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "re-bookings",
        "label": "Bookings"
      },
      {
        "id": "re-channel-partners",
        "label": "Channel Partners"
      },
      {
        "id": "re-dashboard",
        "label": "Re dashboard"
      },
      {
        "id": "re-documents",
        "label": "Documents"
      },
      {
        "id": "re-leads",
        "label": "Re leads"
      },
      {
        "id": "re-loans",
        "label": "Loans & Bank Panel"
      },
      {
        "id": "re-payments",
        "label": "Payment Collections"
      },
      {
        "id": "re-projects",
        "label": "Projects"
      },
      {
        "id": "re-reports",
        "label": "RE Reports"
      },
      {
        "id": "re-site-visits",
        "label": "Site Visits"
      },
      {
        "id": "re-tools",
        "label": "RE Tools"
      },
      {
        "id": "re-units",
        "label": "Unit Inventory"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "recruitment",
    "name": "HR / Recruitment",
    "description": "Recruiting agencies, in-house TA teams, candidate pipelines",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "appraisal-cycles",
        "label": "Appraisal cycles"
      },
      {
        "id": "appraisal-reviews",
        "label": "Appraisal reviews"
      },
      {
        "id": "appraisal-templates",
        "label": "Appraisal templates"
      },
      {
        "id": "assessments-hub",
        "label": "Assessments"
      },
      {
        "id": "attendance-grid",
        "label": "Attendance grid"
      },
      {
        "id": "attendance-hub",
        "label": "Attendance"
      },
      {
        "id": "attendance-regularizations",
        "label": "Attendance regularizations"
      },
      {
        "id": "career-assistant",
        "label": "AI Career Assistant"
      },
      {
        "id": "career-lifecycle",
        "label": "Career Lifecycle"
      },
      {
        "id": "hr-dashboard",
        "label": "Hr dashboard"
      },
      {
        "id": "hr-employees",
        "label": "Employees"
      },
      {
        "id": "leave-balances",
        "label": "Leave balances"
      },
      {
        "id": "leave-hub",
        "label": "Leave Management"
      },
      {
        "id": "leave-requests",
        "label": "Leave requests"
      },
      {
        "id": "leave-types",
        "label": "Leave types"
      },
      {
        "id": "lms-courses",
        "label": "Courses"
      },
      {
        "id": "lms-dashboard",
        "label": "LMS Dashboard"
      },
      {
        "id": "lms-enrollments",
        "label": "Enrollments"
      },
      {
        "id": "payroll-compensation",
        "label": "Payroll compensation"
      },
      {
        "id": "payroll-dashboard",
        "label": "Payroll dashboard"
      },
      {
        "id": "payroll-entities",
        "label": "Payroll entities"
      },
      {
        "id": "payroll-hub",
        "label": "Payroll"
      },
      {
        "id": "payroll-runs",
        "label": "Payroll runs"
      },
      {
        "id": "payroll-statutory",
        "label": "Payroll statutory"
      },
      {
        "id": "payroll-timecards",
        "label": "Payroll timecards"
      },
      {
        "id": "performance-hub",
        "label": "Performance"
      },
      {
        "id": "rec-approvals",
        "label": "Letter Approvals"
      },
      {
        "id": "rec-assessment-attempts",
        "label": "Rec assessment attempts"
      },
      {
        "id": "rec-assessments",
        "label": "Rec assessments"
      },
      {
        "id": "rec-candidates",
        "label": "Candidates"
      },
      {
        "id": "rec-dashboard",
        "label": "Rec dashboard"
      },
      {
        "id": "rec-interviews",
        "label": "Interviews"
      },
      {
        "id": "rec-jobs",
        "label": "Jobs"
      },
      {
        "id": "rec-pipeline",
        "label": "Pipeline"
      }
    ],
    "highlights": [
      "Jobs, candidates, pipeline, interviews, approvals, employees; CV parsing and matching; public careers site; payroll (PF, ESI, professional tax, flat TDS estimate), leave, attendance, appraisals, LMS"
    ],
    "not_built": [
      "General HR for non-recruitment businesses is not built",
      "TDS is an estimate; no ECR, challan, Form 16, loans or bank file"
    ]
  },
  {
    "key": "restaurant_fnb",
    "name": "Restaurant / F&B",
    "description": "Restaurants, cafes, cloud kitchens, catering, food delivery",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "restaurant-analytics",
        "label": "Restaurant Analytics"
      },
      {
        "id": "restaurant-dashboard",
        "label": "Restaurant dashboard"
      },
      {
        "id": "restaurant-events",
        "label": "Events & Catering"
      },
      {
        "id": "restaurant-feedback",
        "label": "Feedback & Complaints"
      },
      {
        "id": "restaurant-guests",
        "label": "Guest Profiles"
      },
      {
        "id": "restaurant-loyalty",
        "label": "Loyalty & Offers"
      },
      {
        "id": "restaurant-menu",
        "label": "Menu Management"
      },
      {
        "id": "restaurant-orders",
        "label": "Orders & Kitchen"
      },
      {
        "id": "restaurant-reservations",
        "label": "Reservations"
      },
      {
        "id": "restaurant-tables",
        "label": "Tables & Waitlist"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "retail",
    "name": "Retail",
    "description": "POS, inventory, suppliers, loyalty programs",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "rtl-dashboard",
        "label": "Rtl dashboard"
      },
      {
        "id": "rtl-inventory",
        "label": "Inventory"
      },
      {
        "id": "rtl-loyalty",
        "label": "Loyalty Program"
      },
      {
        "id": "rtl-pos",
        "label": "POS Transactions"
      },
      {
        "id": "rtl-products",
        "label": "Products"
      },
      {
        "id": "rtl-promotions",
        "label": "Promotions & Coupons"
      },
      {
        "id": "rtl-purchase-orders",
        "label": "Purchase Orders & Receiving"
      },
      {
        "id": "rtl-returns",
        "label": "Returns & Refunds"
      },
      {
        "id": "rtl-stock-operations",
        "label": "Stock Operations"
      },
      {
        "id": "rtl-suppliers",
        "label": "Suppliers"
      }
    ],
    "highlights": [
      "POS with itemised checkout and atomic stock, loyalty ledger, product variants, register and day-close, returns, suppliers, purchase orders, promotions"
    ],
    "not_built": []
  },
  {
    "key": "security_facility",
    "name": "Security & Facility",
    "description": "Security agencies, facility management, housekeeping, AMC",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "sports_academy",
    "name": "Sports Academy",
    "description": "Sports academies and coaching centres — trainees, batches, fee renewals, coach assignment",
    "kind": "alias",
    "alias_of": "gym_fitness",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "student_hostel_pg",
    "name": "Student Hostel / PG",
    "description": "Hostels and paying-guest accommodation — beds, occupants, monthly rent cycles, facilities",
    "kind": "alias",
    "alias_of": "hospitality",
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "study_abroad",
    "name": "Study Abroad / Overseas Education",
    "description": "Overseas education consultants, university admission agents, test-prep & visa counsellors",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "sab-applications",
        "label": "Applications & Shortlists"
      },
      {
        "id": "sab-communication",
        "label": "Sab communication"
      },
      {
        "id": "sab-dashboard",
        "label": "Sab dashboard"
      },
      {
        "id": "sab-deadlines",
        "label": "Offers, Deposits & Visa"
      },
      {
        "id": "sab-documents",
        "label": "Documents & SOP"
      },
      {
        "id": "sab-fees",
        "label": "Fees & Commissions"
      },
      {
        "id": "sab-partners",
        "label": "Partners & Sub-Agents"
      },
      {
        "id": "sab-reports",
        "label": "Reports"
      },
      {
        "id": "sab-students",
        "label": "Sab students"
      },
      {
        "id": "sab-universities",
        "label": "Universities & Courses"
      }
    ],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "textile_apparel",
    "name": "Textile & Apparel",
    "description": "Garment manufacturers, fabric traders, fashion brands, exporters",
    "kind": "configuration_only",
    "alias_of": null,
    "modules": [],
    "highlights": [],
    "not_built": []
  },
  {
    "key": "travel_agency",
    "name": "Travel Agency",
    "description": "Tour operators, travel agents, visa consultants, corporate travel",
    "kind": "dedicated",
    "alias_of": null,
    "modules": [
      {
        "id": "travel-bookings",
        "label": "Bookings"
      },
      {
        "id": "travel-dashboard",
        "label": "Travel dashboard"
      },
      {
        "id": "travel-itinerary-builder",
        "label": "Itinerary Builder"
      },
      {
        "id": "travel-packages",
        "label": "Travel Packages"
      },
      {
        "id": "travel-suppliers-payments",
        "label": "Suppliers & Payments"
      },
      {
        "id": "travel-travelers-documents",
        "label": "Travelers & Documents"
      },
      {
        "id": "travel-vouchers",
        "label": "Vouchers & Credits"
      }
    ],
    "highlights": [
      "Itinerary builder with public share link, packages, bookings, vouchers, suppliers and payments, traveller documents"
    ],
    "not_built": []
  },
  {
    "key": "yoga_studio",
    "name": "Yoga Studio",
    "description": "Yoga and pilates studios — members, class batches, renewals, instructor assignment",
    "kind": "alias",
    "alias_of": "gym_fitness",
    "modules": [],
    "highlights": [],
    "not_built": []
  }
];

/** Screens shared by several verticals (not tied to one industry). */
export const CROSS_CUTTING_MODULES: IndustryModule[] = [
  {
    "id": "material-tracking-balances",
    "label": "Stock Balances"
  },
  {
    "id": "material-tracking-dashboard",
    "label": "Overview"
  },
  {
    "id": "material-tracking-locations",
    "label": "Locations"
  },
  {
    "id": "material-tracking-movements",
    "label": "Movements"
  },
  {
    "id": "material-tracking-reports",
    "label": "Reports"
  }
];
