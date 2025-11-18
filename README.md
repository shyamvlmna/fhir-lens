# FHIR Bundle Renderer

A React-based FHIR (Fast Healthcare Interoperability Resources) bundle viewer with support for NHCX (National Health Claims Exchange) workflows. Visualize and explore FHIR resources with an intuitive, user-friendly interface.

## Features

✅ **Configurable Data Sources** - Switch between local files and remote API  
✅ **NHCX Workflow Support** - Coverage Eligibility, Pre-Authorization, Claims, Insurance Plans  
✅ **Visual Workflow Timelines** - Track request/response progress  
✅ **Resource Explorer** - Browse all resources in a bundle with detailed views  
✅ **Special Renderers** - Custom displays for Insurance Plans, Eligibility, Claims  
✅ **Type-Safe** - Full TypeScript support  

## Quick Start

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## Data Source Configuration

### Option 1: Local Files (Default)

Place FHIR bundle JSON files in the `/resources` directory. The app will automatically discover and load them.

Supported file patterns:
- `claimReq.json`, `claimResp.json`
- `eligibilityCheckReq.json`, `eligibilityCheckResp.json`
- `preAuthReq.json`, `preAuthResp.json`
- `insurancePlanReq.json`, `insurancePlanResp.json`

### Option 2: API Source

Switch to loading bundles from a remote API:

1. Create a `.env` file:
```bash
cp .env.example .env
```

2. Configure your API:
```env
VITE_DATA_SOURCE_TYPE=api
VITE_DATA_SOURCE_API_URL=https://your-api.com/fhir/v1
```

3. Restart the dev server

Your API should implement:
- `GET /bundles` - List available bundles
- `GET /bundles/{id}` - Get a specific bundle

See **DATA_SOURCE_GUIDE.md** for detailed API requirements.

## Project Structure

```
src/
├── components/          # React components
│   ├── FHIRRenderer.tsx           # Main bundle viewer
│   ├── NHCXWorkflowComponents.tsx # Workflow UI components
│   ├── FHIRRenderer.css           # Styles for renderer
│   └── NHCXWorkflow.css           # Styles for workflows
├── config/             # Configuration
│   ├── dataSourceConfig.ts        # Data source settings
│   └── nhcxConfig.ts              # NHCX API settings
├── services/           # API and data services
│   ├── dataService.ts             # Unified data loader
│   └── nhcxApiService.ts          # NHCX API client
├── types/              # TypeScript types
│   └── fhir.ts                    # FHIR resource types
└── utils/              # Helper functions
    └── nhcxWorkflow.ts            # Workflow utilities
```

## FHIR Resources Supported

- **Bundle** - Collection of resources
- **Patient** - Patient demographics
- **Organization** - Healthcare providers, payers
- **Practitioner** - Healthcare professionals
- **InsurancePlan** - Insurance plan details with benefits
- **Coverage** - Insurance coverage
- **CoverageEligibilityRequest** - Eligibility check request
- **CoverageEligibilityResponse** - Eligibility check response
- **Claim** - Medical claim submission
- **ClaimResponse** - Claim processing response
- **Condition** - Medical conditions/diagnoses
- **Procedure** - Medical procedures

## NHCX Workflows

### 1. Coverage Eligibility Check
Verify patient eligibility and coverage benefits before treatment.

### 2. Pre-Authorization
Request approval for planned procedures or treatments.

### 3. Claim Submission
Submit claims for completed services and receive adjudication.

### 4. Insurance Plan Discovery
Browse available insurance plans and their benefits.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DATA_SOURCE_TYPE` | `local` | Data source: `local` or `api` |
| `VITE_DATA_SOURCE_API_URL` | - | API base URL |
| `VITE_DATA_SOURCE_API_TIMEOUT` | `30000` | API timeout (ms) |
| `VITE_LOCAL_RESOURCE_PATH` | `/resources` | Local files path |
| `VITE_NHCX_API_BASE_URL` | - | NHCX API endpoint |

## Development

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS3** - Styling

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep components focused and reusable

### Adding New Resource Renderers

1. Add resource type to `getResourceIcon()` in `FHIRRenderer.tsx`
2. Add special handling in `renderResourceDetails()` if needed
3. Update `detectBundleMetadata()` in `dataService.ts` for auto-detection

## Troubleshooting

### "Failed to load available bundles"

**Local source:**
- Verify files exist in `/resources` directory
- Check JSON files are valid FHIR bundles
- Ensure file names match expected patterns

**API source:**
- Verify `VITE_DATA_SOURCE_API_URL` is set correctly
- Check API is accessible
- Verify API returns proper JSON format
- Check browser console for CORS errors

### Build Errors

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Documentation

- **DATA_SOURCE_GUIDE.md** - Complete data source configuration guide
- **.env.example** - Environment variable templates

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
1. Code builds without errors (`npm run build`)
2. TypeScript types are properly defined
3. New features include documentation
4. Code follows existing style

## Support

For issues or questions, please create an issue in the repository.

