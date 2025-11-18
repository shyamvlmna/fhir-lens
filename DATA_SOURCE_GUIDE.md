# Data Source Configuration Guide

## Overview

The FHIR Renderer now supports **configurable data sources**, allowing you to switch between loading FHIR bundles from local files or a remote API.

## Quick Start

### 1. Local Files (Default)

By default, the application loads FHIR bundles from the `/resources` directory:

```bash
# No configuration needed - works out of the box!
npm run dev
```

### 2. Switch to API Source

To use an API instead of local files:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure your API:
```env
VITE_DATA_SOURCE_TYPE=api
VITE_DATA_SOURCE_API_URL=https://your-api.com/fhir/v1
```

3. Restart the development server:
```bash
npm run dev
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DATA_SOURCE_TYPE` | `local` | Data source type: `local` or `api` |
| `VITE_DATA_SOURCE_API_URL` | - | API base URL (required if type=`api`) |
| `VITE_DATA_SOURCE_API_TIMEOUT` | `30000` | API request timeout (ms) |
| `VITE_LOCAL_RESOURCE_PATH` | `/resources` | Local resource directory path |

### Runtime Configuration

You can also switch data sources programmatically:

```typescript
import { dataSourceConfig } from './config/dataSourceConfig';

// Switch to local files
dataSourceConfig.useLocal('/resources');

// Switch to API
dataSourceConfig.useApi('https://api.example.com/fhir/v1');

// Check current source
const info = dataSourceConfig.getDataSourceInfo();
console.log(info.type); // 'local' or 'api'
```

## API Requirements

If using the API data source, your backend should implement these endpoints:

### 1. List Bundles
```
GET /bundles
```

**Response:**
```json
{
  "bundles": [
    {
      "id": "bundle-123",
      "name": "claimReq.json",
      "title": "Claim Request",
      "description": "Medical claim submission",
      "type": "request",
      "workflow": "Claim Processing",
      "resourceCount": 5
    }
  ]
}
```

### 2. Get Bundle
```
GET /bundles/{id}
```

**Response:** A valid FHIR Bundle JSON

```json
{
  "resourceType": "Bundle",
  "id": "bundle-123",
  "type": "collection",
  "entry": [...]
}
```

## Service Usage

The new unified data service automatically handles both local and API sources:

```typescript
import { loadBundle, listBundles } from './services/dataService';

// List available bundles (works with both local and API)
const bundles = await listBundles();

// Load a specific bundle (works with both local and API)
const bundle = await loadBundle('claimReq.json');
```

## UI Indicator

The application shows the current data source in the sidebar:

- **📁 LOCAL** - Loading from local files
- **🌐 API** - Loading from remote API

The full path/URL is displayed below the badge.

## Switching Between Sources

### Method 1: Environment Variables (Recommended)

Edit your `.env` file and restart the server:

```env
# For local development
VITE_DATA_SOURCE_TYPE=local

# For production with API
VITE_DATA_SOURCE_TYPE=api
VITE_DATA_SOURCE_API_URL=https://prod-api.example.com/fhir/v1
```

### Method 2: Programmatic Switching

Add a toggle in your UI (example):

```typescript
import { dataSourceConfig } from './config/dataSourceConfig';

// In your component
const switchToApi = () => {
  dataSourceConfig.useApi('https://api.example.com');
  window.location.reload(); // Reload to refresh bundles
};

const switchToLocal = () => {
  dataSourceConfig.useLocal();
  window.location.reload();
};
```

## Benefits

✅ **Flexibility**: Switch between local development and production API seamlessly  
✅ **Type Safety**: Full TypeScript support with proper interfaces  
✅ **Error Handling**: Comprehensive error messages for both sources  
✅ **Consistency**: Same interface for both local and API data  
✅ **Configuration**: Environment-based setup for different deployments  

## Troubleshooting

### "Failed to load available bundles"

**Local source:**
- Verify files exist in `/resources` or configured path
- Check file names match the expected patterns
- Ensure JSON files are valid FHIR bundles

**API source:**
- Verify `VITE_DATA_SOURCE_API_URL` is set correctly
- Check API is accessible and CORS is configured
- Ensure API returns proper JSON format

### "API base URL not configured"

Set the API URL in your `.env` file:
```env
VITE_DATA_SOURCE_API_URL=https://your-api.com
```

## Examples

See `.env.example` for a complete configuration template with all available options.

## Migration Guide

If you have existing code that loads bundles directly:

**Before:**
```typescript
const response = await fetch('/resources/claimReq.json');
const bundle = await response.json();
```

**After:**
```typescript
import { loadBundle } from './services/dataService';
const bundle = await loadBundle('claimReq.json');
```

The new service automatically handles the data source based on configuration!

