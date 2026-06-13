/**
 * OpenAPI 3.1 description of the 10 HelloGrowthCRM CRM MCP tools, served at
 * GET /openapi.json so the spec can be imported as ChatGPT GPT Actions.
 *
 * SINGLE SOURCE OF TRUTH: kept byte-identical to the repo-root `openapi.json`.
 * If you edit one, regenerate the other.
 */

export const openApiSpecJson: string = JSON.stringify(
{
  "openapi": "3.1.0",
  "info": {
    "title": "HelloGrowthCRM MCP",
    "version": "1.0.0",
    "description": "OpenAPI description of the 10 HelloGrowthCRM MCP tools, exposed as POST /tools/{tool_name} operations so they can be imported as ChatGPT GPT Actions or called by any OpenAPI-compatible client. Every tool maps to a CRM operation over the public CRM data model (leads/contacts, deals, tasks, activities/notes). All write operations are recorded in the CRM audit trail with the calling AI client identity and a timestamp. Authenticate with a Bearer API key generated at https://app.hellogrowthcrm.com -> Settings -> API Keys.",
    "contact": {
      "name": "HelloGrowthCRM Support",
      "email": "support@hellogrowthcrm.com",
      "url": "https://hellogrowthcrm.com/docs#mcp"
    },
    "license": {
      "name": "Proprietary",
      "url": "https://hellogrowthcrm.com/legal/terms-of-service"
    }
  },
  "servers": [
    {
      "url": "https://mcp.hellogrowthcrm.com",
      "description": "HelloGrowthCRM MCP server (production)"
    }
  ],
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "tags": [
    { "name": "pipeline", "description": "Deal pipeline read operations" },
    { "name": "deals", "description": "Deal write operations" },
    { "name": "contacts", "description": "Contact / lead operations" },
    { "name": "intelligence", "description": "AI lead scoring and meeting summaries" },
    { "name": "automation", "description": "Outreach sequences and tasks" },
    { "name": "activity", "description": "Activity logging" },
    { "name": "analytics", "description": "Revenue and pipeline analytics" }
  ],
  "paths": {
    "/tools/get_pipeline": {
      "post": {
        "operationId": "get_pipeline",
        "summary": "Fetch deal pipeline",
        "description": "Fetch the deal pipeline with optional stage, minimum-value, and stale-days filters. Returns matching deals newest-first plus a pipeline summary (total value and deal count).",
        "tags": ["pipeline"],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/GetPipelineInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Pipeline deals and summary",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/PipelineResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/search_contacts": {
      "post": {
        "operationId": "search_contacts",
        "summary": "Natural-language contact search",
        "description": "Search CRM contacts (leads) using a natural-language query, e.g. 'fintech founders in Bangalore added this month'. Returns the best-matching contacts.",
        "tags": ["contacts"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/SearchContactsInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Matching contacts",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ContactListResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/update_deal": {
      "post": {
        "operationId": "update_deal",
        "summary": "Update a deal",
        "description": "Update a deal's stage, value, probability, expected close date, or custom fields. The deal is identified by deal_id. Recorded in the audit trail.",
        "tags": ["deals"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/UpdateDealInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Updated deal",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/DealResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/create_contact": {
      "post": {
        "operationId": "create_contact",
        "summary": "Create a CRM contact",
        "description": "Add a new CRM contact (lead). company_name is required. When enrich is true, the CRM attempts to enrich the record from public sources. Recorded in the audit trail.",
        "tags": ["contacts"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/CreateContactInput" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Created contact",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ContactResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/get_lead_score": {
      "post": {
        "operationId": "get_lead_score",
        "summary": "Get AI lead score",
        "description": "Retrieve the AI lead score, grade, and the contributing reasons for a contact identified by contact_id.",
        "tags": ["intelligence"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/GetLeadScoreInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Lead score",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/LeadScoreResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/trigger_sequence": {
      "post": {
        "operationId": "trigger_sequence",
        "summary": "Enrol a contact in a sequence",
        "description": "Enrol a contact in an outreach sequence. Identified by contact_id and sequence_id. Optionally schedule the start time. Recorded in the audit trail.",
        "tags": ["automation"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/TriggerSequenceInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Sequence enrollment",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/SequenceEnrollmentResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/log_activity": {
      "post": {
        "operationId": "log_activity",
        "summary": "Log an activity",
        "description": "Log a call, meeting, email, or note against a CRM record (lead). Stored as lead activity history. Recorded in the audit trail.",
        "tags": ["activity"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/LogActivityInput" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Logged activity",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ActivityResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/get_analytics": {
      "post": {
        "operationId": "get_analytics",
        "summary": "Fetch analytics",
        "description": "Fetch pipeline value, win rate, and revenue analytics over a period, optionally grouped by stage, owner, or month.",
        "tags": ["analytics"],
        "requestBody": {
          "required": false,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/GetAnalyticsInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Analytics metrics",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AnalyticsResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/create_task": {
      "post": {
        "operationId": "create_task",
        "summary": "Create a follow-up task",
        "description": "Create a follow-up task for a rep or team. title is required. Optionally link the task to a lead or deal and set priority, due date, and assignee. Recorded in the audit trail.",
        "tags": ["automation"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/CreateTaskInput" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Created task",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TaskResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    },
    "/tools/get_meeting_notes": {
      "post": {
        "operationId": "get_meeting_notes",
        "summary": "Get meeting / call summary",
        "description": "Retrieve the AI-generated summary, action items, and (when available) transcript for a meeting or call. Identified by meeting_id, or by lead_id to fetch the most recent meeting for that contact.",
        "tags": ["intelligence"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/GetMeetingNotesInput" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meeting notes",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/MeetingNotesResponse" }
              }
            }
          },
          "400": { "$ref": "#/components/responses/BadRequest" },
          "401": { "$ref": "#/components/responses/Unauthorized" },
          "404": { "$ref": "#/components/responses/NotFound" },
          "429": { "$ref": "#/components/responses/RateLimited" },
          "500": { "$ref": "#/components/responses/ServerError" }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "HelloGrowthCRM API key. Generate at https://app.hellogrowthcrm.com -> Settings -> API Keys and send as 'Authorization: Bearer <token>'."
      }
    },
    "responses": {
      "BadRequest": {
        "description": "Validation failed",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
        }
      },
      "Unauthorized": {
        "description": "Missing, invalid, or expired API key",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
        }
      },
      "NotFound": {
        "description": "Record or resource not found",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
        }
      },
      "RateLimited": {
        "description": "Rate limit exceeded",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
        }
      },
      "ServerError": {
        "description": "Server error",
        "content": {
          "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
        }
      }
    },
    "schemas": {
      "DealStage": {
        "type": "string",
        "description": "Pipeline stage of a deal (lowercase enum).",
        "enum": ["qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
      },
      "TaskPriority": {
        "type": "string",
        "description": "Task priority.",
        "enum": ["low", "medium", "high", "urgent"]
      },
      "ActivityType": {
        "type": "string",
        "description": "Type of logged activity.",
        "enum": ["call", "meeting", "email", "note"]
      },
      "Error": {
        "type": "object",
        "description": "Standard error envelope.",
        "properties": {
          "error": { "type": "string", "description": "Human-readable error message." },
          "details": {
            "type": "object",
            "additionalProperties": true,
            "description": "Optional field-level validation details."
          }
        },
        "required": ["error"]
      },
      "Deal": {
        "type": "object",
        "description": "A sales opportunity.",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "name": { "type": "string", "description": "Deal name." },
          "lead_id": { "type": "string", "format": "uuid", "description": "Linked contact/lead id." },
          "stage": { "$ref": "#/components/schemas/DealStage" },
          "value": { "type": "number", "description": "Monetary value of the deal." },
          "currency": { "type": "string", "description": "ISO 4217 currency code, e.g. USD, INR." },
          "probability": { "type": "integer", "minimum": 0, "maximum": 100, "description": "Win probability percentage." },
          "expected_close_date": { "type": "string", "format": "date" },
          "actual_close_date": { "type": "string", "format": "date" },
          "notes": { "type": "string" },
          "owner_id": { "type": "string", "format": "uuid" },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "Contact": {
        "type": "object",
        "description": "A CRM contact (lead).",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "lead_name": { "type": "string" },
          "company_name": { "type": "string" },
          "email_address": { "type": "string", "format": "email" },
          "phone_number": { "type": "string" },
          "designation": { "type": "string" },
          "lead_source": { "type": "string" },
          "stage_id": { "type": "string" },
          "deal_value": { "type": "number" },
          "deal_currency": { "type": "string" },
          "notes": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "website": { "type": "string", "format": "uri" },
          "linkedin_url": { "type": "string", "format": "uri" },
          "created_at": { "type": "string", "format": "date-time" },
          "updated_at": { "type": "string", "format": "date-time" }
        }
      },
      "Task": {
        "type": "object",
        "description": "A to-do item / follow-up.",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "status": { "type": "string" },
          "priority": { "$ref": "#/components/schemas/TaskPriority" },
          "due_date": { "type": "string", "format": "date" },
          "assignee_id": { "type": "string", "format": "uuid" },
          "lead_id": { "type": "string", "format": "uuid" },
          "deal_id": { "type": "string", "format": "uuid" },
          "board_id": { "type": "string", "format": "uuid" },
          "completed_at": { "type": "string", "format": "date-time" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "Activity": {
        "type": "object",
        "description": "A logged activity / note against a lead.",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "lead_id": { "type": "string", "format": "uuid" },
          "activity_type": { "$ref": "#/components/schemas/ActivityType" },
          "content": { "type": "string" },
          "occurred_at": { "type": "string", "format": "date-time" },
          "duration_minutes": { "type": "integer" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "GetPipelineInput": {
        "type": "object",
        "description": "Filters for the pipeline query. All fields optional.",
        "properties": {
          "stage": { "$ref": "#/components/schemas/DealStage" },
          "min_value": { "type": "number", "description": "Only return deals with value >= this amount." },
          "days_since_update": { "type": "integer", "minimum": 0, "description": "Only return deals not updated in at least this many days (stale deals)." },
          "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 50 },
          "offset": { "type": "integer", "minimum": 0, "default": 0 }
        }
      },
      "PipelineResponse": {
        "type": "object",
        "properties": {
          "deals": { "type": "array", "items": { "$ref": "#/components/schemas/Deal" } },
          "summary": {
            "type": "object",
            "properties": {
              "total_value": { "type": "number" },
              "deal_count": { "type": "integer" },
              "currency": { "type": "string" }
            }
          },
          "total": { "type": "integer" },
          "limit": { "type": "integer" },
          "offset": { "type": "integer" }
        }
      },
      "SearchContactsInput": {
        "type": "object",
        "required": ["query"],
        "properties": {
          "query": { "type": "string", "description": "Natural-language search query." },
          "limit": { "type": "integer", "minimum": 1, "maximum": 100, "default": 25 }
        }
      },
      "ContactListResponse": {
        "type": "object",
        "properties": {
          "data": { "type": "array", "items": { "$ref": "#/components/schemas/Contact" } },
          "total": { "type": "integer" }
        }
      },
      "ContactResponse": {
        "type": "object",
        "properties": {
          "data": { "$ref": "#/components/schemas/Contact" }
        }
      },
      "UpdateDealInput": {
        "type": "object",
        "required": ["deal_id"],
        "properties": {
          "deal_id": { "type": "string", "format": "uuid", "description": "Id of the deal to update." },
          "stage": { "$ref": "#/components/schemas/DealStage" },
          "value": { "type": "number" },
          "currency": { "type": "string" },
          "probability": { "type": "integer", "minimum": 0, "maximum": 100 },
          "expected_close_date": { "type": "string", "format": "date" },
          "notes": { "type": "string" },
          "custom_fields": {
            "type": "object",
            "additionalProperties": true,
            "description": "Custom field key/value pairs to set on the deal."
          }
        }
      },
      "DealResponse": {
        "type": "object",
        "properties": {
          "data": { "$ref": "#/components/schemas/Deal" }
        }
      },
      "CreateContactInput": {
        "type": "object",
        "required": ["company_name"],
        "properties": {
          "company_name": { "type": "string", "description": "Required. Company the contact belongs to." },
          "lead_name": { "type": "string" },
          "email_address": { "type": "string", "format": "email" },
          "phone_number": { "type": "string" },
          "designation": { "type": "string" },
          "lead_source": { "type": "string" },
          "website": { "type": "string", "format": "uri" },
          "linkedin_url": { "type": "string", "format": "uri" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "enrich": { "type": "boolean", "default": false, "description": "Attempt to enrich the contact from public sources on create." }
        }
      },
      "GetLeadScoreInput": {
        "type": "object",
        "required": ["contact_id"],
        "properties": {
          "contact_id": { "type": "string", "format": "uuid", "description": "Id of the contact/lead to score." }
        }
      },
      "LeadScoreResponse": {
        "type": "object",
        "properties": {
          "contact_id": { "type": "string", "format": "uuid" },
          "score": { "type": "integer", "minimum": 0, "maximum": 100, "description": "AI lead score, 0-100." },
          "grade": { "type": "string", "description": "Letter grade, e.g. A, B, C, D." },
          "reason": { "type": "string", "description": "Explanation of the contributing factors." }
        }
      },
      "TriggerSequenceInput": {
        "type": "object",
        "required": ["contact_id", "sequence_id"],
        "properties": {
          "contact_id": { "type": "string", "format": "uuid" },
          "sequence_id": { "type": "string", "description": "Id of the outreach sequence to enrol the contact in." },
          "start_at": { "type": "string", "format": "date-time", "description": "Optional scheduled start time; defaults to immediately." }
        }
      },
      "SequenceEnrollmentResponse": {
        "type": "object",
        "properties": {
          "enrollment_id": { "type": "string", "format": "uuid" },
          "contact_id": { "type": "string", "format": "uuid" },
          "sequence_id": { "type": "string" },
          "status": { "type": "string", "description": "e.g. active, scheduled." }
        }
      },
      "LogActivityInput": {
        "type": "object",
        "required": ["lead_id", "activity_type", "content"],
        "properties": {
          "lead_id": { "type": "string", "format": "uuid", "description": "Id of the lead/contact the activity is logged against." },
          "activity_type": { "$ref": "#/components/schemas/ActivityType" },
          "content": { "type": "string", "description": "The note, call summary, or meeting description." },
          "occurred_at": { "type": "string", "format": "date-time", "description": "When the activity happened; defaults to now." },
          "duration_minutes": { "type": "integer", "minimum": 0, "description": "Duration for calls and meetings." }
        }
      },
      "ActivityResponse": {
        "type": "object",
        "properties": {
          "data": { "$ref": "#/components/schemas/Activity" }
        }
      },
      "GetAnalyticsInput": {
        "type": "object",
        "properties": {
          "period": {
            "type": "string",
            "description": "Preset period.",
            "enum": ["last_7_days", "last_30_days", "last_90_days", "quarter_to_date", "year_to_date", "custom"],
            "default": "last_30_days"
          },
          "start_date": { "type": "string", "format": "date", "description": "Required when period is 'custom'." },
          "end_date": { "type": "string", "format": "date", "description": "Required when period is 'custom'." },
          "group_by": {
            "type": "string",
            "enum": ["stage", "owner", "month"],
            "description": "Optional grouping dimension for the metrics."
          }
        }
      },
      "AnalyticsResponse": {
        "type": "object",
        "properties": {
          "pipeline_value": { "type": "number" },
          "won_value": { "type": "number" },
          "win_rate": { "type": "number", "description": "Win rate as a fraction between 0 and 1." },
          "deals_won": { "type": "integer" },
          "deals_lost": { "type": "integer" },
          "open_deals": { "type": "integer" },
          "currency": { "type": "string" },
          "period": { "type": "string" },
          "breakdown": {
            "type": "array",
            "description": "Per-group metrics when group_by is supplied.",
            "items": {
              "type": "object",
              "properties": {
                "group": { "type": "string" },
                "value": { "type": "number" },
                "count": { "type": "integer" }
              }
            }
          }
        }
      },
      "CreateTaskInput": {
        "type": "object",
        "required": ["title"],
        "properties": {
          "title": { "type": "string", "description": "Required. Task title." },
          "description": { "type": "string" },
          "priority": { "$ref": "#/components/schemas/TaskPriority" },
          "due_date": { "type": "string", "format": "date" },
          "assignee_id": { "type": "string", "format": "uuid", "description": "Rep the task is assigned to." },
          "lead_id": { "type": "string", "format": "uuid", "description": "Optional linked contact/lead." },
          "deal_id": { "type": "string", "format": "uuid", "description": "Optional linked deal." }
        }
      },
      "TaskResponse": {
        "type": "object",
        "properties": {
          "data": { "$ref": "#/components/schemas/Task" }
        }
      },
      "GetMeetingNotesInput": {
        "type": "object",
        "description": "Provide either meeting_id or lead_id.",
        "properties": {
          "meeting_id": { "type": "string", "format": "uuid", "description": "Id of the meeting/call to summarise." },
          "lead_id": { "type": "string", "format": "uuid", "description": "Fetch the most recent meeting summary for this contact." }
        },
        "anyOf": [
          { "required": ["meeting_id"] },
          { "required": ["lead_id"] }
        ]
      },
      "MeetingNotesResponse": {
        "type": "object",
        "properties": {
          "meeting_id": { "type": "string", "format": "uuid" },
          "lead_id": { "type": "string", "format": "uuid" },
          "summary": { "type": "string", "description": "AI-generated summary of the meeting or call." },
          "action_items": { "type": "array", "items": { "type": "string" } },
          "transcript": { "type": "string", "description": "Full transcript when available." },
          "occurred_at": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
,
  null,
  2,
);

export const openApiSpec: Record<string, unknown> = JSON.parse(openApiSpecJson);
