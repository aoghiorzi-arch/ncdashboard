# Newbold Connect Dashboard — SharePoint Integration Guide

**For: IT Team / Azure AD Administrators**
**Date: March 2026**
**Version: 1.0**

---

## Overview

The Newbold Connect Dashboard is a single-page web application (React/TypeScript) that currently stores all data in the browser's `localStorage`. This guide explains how to connect it to **SharePoint Online Lists** via **Microsoft Graph API**, enabling multi-user shared data access.

### Architecture Diagram

```
┌─────────────────┐     HTTPS      ┌──────────────────────┐     Graph API     ┌─────────────────┐
│  NC Dashboard   │ ──────────────▶│  Azure Function      │ ────────────────▶ │  SharePoint     │
│  (Browser SPA)  │                │  (Token Proxy)       │                   │  Online Lists   │
│                 │◀──────────────│                      │◀────────────────│                 │
└─────────────────┘    JSON        └──────────────────────┘    JSON           └─────────────────┘
                                          │
                                          │ Uses
                                          ▼
                                   ┌──────────────────┐
                                   │  Azure AD App    │
                                   │  Registration    │
                                   └──────────────────┘
```

---

## Step 1: Register an Azure AD Application

1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations** → **New registration**
2. Configure:
   - **Name**: `Newbold Connect Dashboard`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Leave blank (not needed for client credentials flow)
3. After creation, note down:
   - **Application (client) ID** → This goes into the dashboard's "Azure Client ID" field
   - **Directory (tenant) ID** → This goes into the dashboard's "Azure Tenant ID" field

### API Permissions

Add the following **Application permissions** (not Delegated):

| API | Permission | Type | Purpose |
|-----|-----------|------|---------|
| Microsoft Graph | `Sites.ReadWrite.All` | Application | Read/write SharePoint list items |
| Microsoft Graph | `Sites.Manage.All` | Application | Create lists if needed |

> ⚠️ **Grant admin consent** after adding permissions.

### Client Secret

1. Go to **Certificates & secrets** → **New client secret**
2. Description: `NC Dashboard Proxy`
3. Expiry: Choose your policy (recommend 12-24 months)
4. **Copy the secret value immediately** — store it securely (Azure Key Vault recommended)

---

## Step 2: Create SharePoint Lists

Create the following lists on your SharePoint site. The **list names** must match what users enter in the dashboard's Settings → SharePoint Integration → List Mappings.

### Recommended List Names & Columns

#### NC_Tasks
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Task title |
| Description | Multiple lines (plain) | |
| ModuleTag | Choice | Calendar, Class, Instructor, Legal, Event, Budget, Marketing, General |
| Priority | Choice | Low, Medium, High, Critical |
| Status | Choice | Not Started, In Progress, Blocked, In Review, Complete |
| Owner | Single line of text | |
| DueDate | Date | |
| Subtasks | Multiple lines (plain) | JSON string |
| Notes | Multiple lines (plain) | JSON string |
| Pinned | Yes/No | |
| CreatedBy | Single line of text | |
| Recurrence | Choice | none, daily, weekly, biweekly, monthly |
| RecurrenceEndDate | Date | |
| ParentTaskId | Single line of text | |
| ExternalId | Single line of text | Maps to app's `id` field |
| DataJSON | Multiple lines (plain) | Full JSON fallback |

#### NC_Calendar
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Event title |
| EventType | Choice | Milestone, Filming Day, Meeting, Deadline, Event, Reminder |
| EventDate | Date and Time | |
| StartTime | Single line of text | HH:MM format |
| EndTime | Single line of text | HH:MM format |
| Location | Single line of text | |
| Attendees | Multiple lines (plain) | |
| Notes | Multiple lines (plain) | |
| Recurrence | Choice | none, weekly, monthly |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | |

#### NC_Classes
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Class title |
| InstructorName | Single line of text | |
| Status | Choice | Idea, In Development, Review, Approved, Filming, Editing, Published, Archived |
| Category | Single line of text | |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | Full JSON record |

#### NC_Instructors
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Instructor name |
| Email | Single line of text | |
| Phone | Single line of text | |
| Specialty | Single line of text | |
| Status | Choice | Prospect, Contacted, Confirmed, Active, On Hold, Inactive |
| ReferralCode | Single line of text | Unique referral code for revenue tracking |
| RevenueShareRate | Number | Commission rate percentage (default 15) |
| IRPEligibleUntil | Date | IRP eligibility end date (12 months post-launch) |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | |

#### NC_Expenses
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Description |
| Amount | Number | Currency |
| Category | Single line of text | |
| Status | Choice | Draft, Approved, Paid, Disputed, Cancelled |
| BudgetLine | Single line of text | |
| Phase | Choice | Phase 1, Phase 2, General Overhead |
| PaymentDate | Date | |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | |

#### NC_Income
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Description |
| Source | Choice | Membership, Single Class, Founders, Grant, Sponsorship, Other |
| Amount | Number | |
| DateReceived | Date | |
| Status | Choice | Expected, Received, Refunded |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | |

#### NC_Team
| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Name |
| RoleTitle | Single line of text | |
| EmploymentType | Choice | Staff, Contractor, Volunteer, Instructor |
| Email | Single line of text | |
| ExternalId | Single line of text | |
| DataJSON | Multiple lines (plain) | |

#### NC_Compliance, NC_Ideas, NC_Events, NC_Partnerships, NC_Checklists, NC_Metrics, NC_Workflows

For these, use the **simplified pattern**:

| Column | Type | Notes |
|--------|------|-------|
| Title | Single line of text | Record title |
| ExternalId | Single line of text | Maps to app's `id` |
| DataJSON | Multiple lines (plain) | Full JSON record |
| ModifiedDate | Date and Time | |

> 💡 **Tip**: The `DataJSON` column is a fallback that stores the complete record as JSON. This means you can start with minimal columns and add structured columns later for reporting/filtering.

---

## Step 3: Deploy the Azure Function Proxy

The browser app cannot call Microsoft Graph directly (it would expose the client secret). Deploy an **Azure Function** as a secure proxy.

### 3a. Create Azure Function App

1. **Azure Portal** → **Create a resource** → **Function App**
2. Configure:
   - **Runtime**: Node.js 20
   - **Plan**: Consumption (Serverless)
   - **Region**: Same as your SharePoint tenant

### 3b. Application Settings (Environment Variables)

Add these in **Configuration → Application settings**:

| Setting | Value |
|---------|-------|
| `AZURE_TENANT_ID` | Your Azure AD tenant ID |
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_CLIENT_SECRET` | App registration client secret |
| `SHAREPOINT_SITE_URL` | e.g. `https://yourorg.sharepoint.com/sites/NewboldConnect` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins (e.g. `https://yourorg.sharepoint.com,file://`) |

### 3c. Function Code

Create an HTTP-triggered function. Here is a reference implementation:

```javascript
// graph-proxy/index.js
const { ConfidentialClientApplication } = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function getToken() {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return result.accessToken;
}

module.exports = async function (context, req) {
  // CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  try {
    const token = await getToken();
    const { action, listName, itemId, data } = req.body;

    // Get site ID
    const siteUrl = new URL(process.env.SHAREPOINT_SITE_URL);
    const sitePath = siteUrl.pathname;
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteUrl.hostname}:${sitePath}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const site = await siteRes.json();
    const siteId = site.id;

    // Get list ID
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const list = await listRes.json();
    const listId = list.id;

    const baseUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;
    let result;

    switch (action) {
      case 'getAll':
        const getRes = await fetch(`${baseUrl}?expand=fields&$top=5000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await getRes.json();
        break;

      case 'create':
        const createRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields: data }),
        });
        result = await createRes.json();
        break;

      case 'update':
        const updateRes = await fetch(`${baseUrl}/${itemId}/fields`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        result = await updateRes.json();
        break;

      case 'delete':
        await fetch(`${baseUrl}/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: result,
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: error.message },
    };
  }
};
```

### 3d. Install Dependencies

```bash
cd graph-proxy
npm init -y
npm install @azure/msal-node
```

### 3e. Deploy

```bash
func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
```

Note the function URL (e.g. `https://nc-proxy.azurewebsites.net/api/graph-proxy`).

---

## Step 4: Configure the Dashboard

In the NC Dashboard app:

1. Go to **Settings** → **SharePoint Integration**
2. Enable **SharePoint sync**
3. Enter:
   - **SharePoint Site URL**: `https://yourorg.sharepoint.com/sites/NewboldConnect`
   - **Azure Tenant ID**: From Step 1
   - **Azure Client ID**: From Step 1
4. Map each module to its SharePoint list name (e.g. Tasks → `NC_Tasks`)

### Additional Configuration Needed in App Code

The dashboard will also need the **Azure Function proxy URL**. This should be added to the Settings page or configured as a constant. The development team will need to:

1. Add a "Proxy URL" field to the SharePoint config
2. Replace `localStorage` calls with Graph API calls via the proxy when SharePoint is enabled
3. Implement offline fallback (use localStorage when proxy is unreachable)

---

## Step 5: Security Considerations

### Authentication
- The Azure Function uses **client credentials flow** (app-only, no user login required)
- For user-level access control, consider switching to **delegated permissions** with MSAL.js in the browser

### Network Security
- Restrict the Azure Function to your organization's IP range if possible
- Use Azure API Management for rate limiting if needed
- Enable HTTPS only

### Data Residency
- SharePoint data stays within your Microsoft 365 tenant
- The Azure Function should be in the same region as your tenant

### Secret Rotation
- Set a calendar reminder to rotate the client secret before expiry
- Use Azure Key Vault references in Function App settings

---

## Step 6: Testing

### Verify Azure AD App
```bash
# Get an access token (PowerShell)
$body = @{
    grant_type    = "client_credentials"
    client_id     = "<CLIENT_ID>"
    client_secret = "<CLIENT_SECRET>"
    scope         = "https://graph.microsoft.com/.default"
}
$token = (Invoke-RestMethod -Uri "https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token" -Method POST -Body $body).access_token

# Test reading a list
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/sites/<SITE_ID>/lists" -Headers @{ Authorization = "Bearer $token" }
```

### Verify Azure Function
```bash
curl -X POST https://nc-proxy.azurewebsites.net/api/graph-proxy \
  -H "Content-Type: application/json" \
  -d '{"action":"getAll","listName":"NC_Tasks"}'
```

---

## Summary of Values to Share with Dashboard Users

| Setting | Value | Where to Enter |
|---------|-------|----------------|
| Azure Tenant ID | `xxxxxxxx-xxxx-...` | Settings → SharePoint → Tenant ID |
| Azure Client ID | `xxxxxxxx-xxxx-...` | Settings → SharePoint → Client ID |
| SharePoint Site URL | `https://yourorg.sharepoint.com/sites/...` | Settings → SharePoint → Site URL |
| Proxy Function URL | `https://nc-proxy.azurewebsites.net/api/graph-proxy` | *(To be added to settings)* |

---

## Support

For questions about this integration, contact the NC Dashboard development team.

**Required Azure subscriptions**: Azure AD (included with M365), Azure Functions (Consumption plan, minimal cost).
