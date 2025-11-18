# ERP Frontend Application

Multi-company RBAC frontend application integrated with workflow builder API.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure backend URL** (create `.env.local`):
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Login with default credentials**:
   - Username: `admin`
   - Password: `admin`

## Documentation

Complete documentation is available in the `docs/` folder:

- **[API Endpoints Reference](./docs/API_ENDPOINTS_REFERENCE.md)** - Complete API documentation with all endpoints
- **[Configuration Guide](./docs/CONFIGURATION_GUIDE.md)** - How to configure the application, change backend URL
- **[Backend Frontend Integration](./docs/BACKEND_FRONTEND_INTEGRATION.md)** - Complete integration guide
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions
- **[Changes and Fixes](./docs/CHANGES_AND_FIXES.md)** - All changes made to the codebase
- **[Workflow Builder Integration](./docs/WORKFLOW_BUILDER_INTEGRATION.md)** - Workflow API integration details

## Key Features

- ✅ Authentication with JWT tokens
- ✅ Company management via workflow builder API
- ✅ Dynamic workflow management
- ✅ User management
- ✅ Dashboard with statistics
- ✅ Real-time data from backend

## API Integration

The frontend uses the following main APIs:

- **Authentication**: `/auth/token`, `/auth/logout`
- **Workflow Builder**: `/workflows/builder/*`
- **Master Data**: `/workflows/builder/table-data/all` - Get all companies from all workflows
- **User Management**: `/api/users`

See [API Endpoints Reference](./docs/API_ENDPOINTS_REFERENCE.md) for complete documentation.

## Changing Backend URL

### Option 1: Environment Variable (Recommended)

Create `.env.local` in the frontend root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://your-backend-url:8000
```

Restart the development server.

### Option 2: Direct Configuration

Edit `lib/api/config.ts`:

```typescript
export const API_CONFIG = {
  baseURL: "http://your-backend-url:8000", // Change this
  // ...
}
```

See [Configuration Guide](./docs/CONFIGURATION_GUIDE.md) for details.

## Setup Instructions

### Prerequisites

1. Backend server running on `http://localhost:8000`
2. Node.js 18+ installed
3. npm or yarn package manager

### Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create workflow and sample data** (in backend):
   ```bash
   cd ../erp_r-main
   python3 scripts/create_workflow_and_insert_data.py
   ```

3. **Start frontend**:
   ```bash
   npm run dev
   ```

4. **Access application**:
   - Open `http://localhost:3000`
   - Login with `admin`/`admin`

## Troubleshooting

### Common Issues

1. **"Not authenticated" error**:
   - Clear localStorage and login again
   - See [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

2. **Companies not showing**:
   - Run the workflow creation script
   - Check Network tab for API calls
   - See [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

3. **CORS errors**:
   - Verify backend CORS configuration
   - See [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

For more help, see the [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md).

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/multi-company-rbac/
├── components/          # React components
│   ├── erp-company-list.tsx      # Company management
│   ├── erp-dashboard.tsx         # Dashboard
│   ├── workflow-management.tsx   # Workflow management
│   └── ...
├── lib/
│   ├── api/
│   │   ├── config.ts             # API configuration
│   │   ├── http-client.ts        # HTTP client with interceptors
│   │   └── services/             # API service methods
│   ├── api-services.ts           # Main API services
│   └── erp-auth-context.tsx      # Authentication context
├── docs/                # Documentation
│   ├── API_ENDPOINTS_REFERENCE.md
│   ├── CONFIGURATION_GUIDE.md
│   ├── BACKEND_FRONTEND_INTEGRATION.md
│   ├── TROUBLESHOOTING_GUIDE.md
│   └── ...
└── .env.local          # Environment variables (not in git)
```

## API Endpoints Summary

| Endpoint | Method | Purpose | Used In |
|----------|--------|---------|---------|
| `/auth/token` | POST | Login | Login form |
| `/auth/logout` | POST | Logout | Auth context |
| `/workflows/builder/` | GET | List workflows | Workflow management |
| `/workflows/builder/table-data/all` | GET | Get all companies | Company list, Dashboard |
| `/workflows/builder/{id}/table-data` | GET | Get workflow records | Workflow data view |
| `/api/users` | GET | Get all users | Dashboard, User management |

See [API Endpoints Reference](./docs/API_ENDPOINTS_REFERENCE.md) for complete details.

## Support

For issues or questions:
1. Check the [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)
2. Review [Configuration Guide](./docs/CONFIGURATION_GUIDE.md)
3. See [Backend Frontend Integration](./docs/BACKEND_FRONTEND_INTEGRATION.md)

## License

See project license file.
