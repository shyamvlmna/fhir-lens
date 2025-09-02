# FHIR Render

A comprehensive React-based FHIR (Fast Healthcare Interoperability Resources) viewer that provides an intuitive interface for browsing and analyzing healthcare data.

## 🚀 Features

### 📊 Comprehensive Resource Support
- **Insurance Plans**: Detailed benefit display with pricing, limits, and service coverage
- **Coverage Eligibility**: Request and response analysis with financial details
- **Patient Information**: Complete demographic and health record display
- **Claims**: Full claim and response processing visualization
- **Organizations & Practitioners**: Healthcare provider information

### 🎨 Enhanced User Experience
- **Dynamic File Discovery**: Automatically detects FHIR files without static configuration
- **Expandable Sections**: Click to view complete service lists and detailed information
- **Color-coded Badges**: Visual indicators for different data types and statuses
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Single-page Interface**: Streamlined navigation without unnecessary complexity

### 💡 Smart Data Visualization
- **Financial Information**: Clear display of allowed amounts, used amounts, and available balances
- **Authorization Status**: Visual indicators for pre-authorization requirements
- **Benefit Periods**: Easy-to-read date ranges and coverage timeframes
- **Service Categories**: Organized display of medical services and procedures
- **Error Handling**: Clear error messages with specific codes and descriptions

## 🛠️ Technology Stack

- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **CSS3** with modern styling and animations
- **FHIR R4** specification compliance

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fhir-render
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add FHIR data files**
   Place your FHIR JSON files in the `public/` directory. The application will automatically discover them.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001` (or the port shown in the terminal)

## 📁 Project Structure

```
fhir-render/
├── public/                 # FHIR data files
│   ├── eligibilityCheckReq.json
│   ├── eligibilityCheckResp.json
│   ├── insurancePlanResp.json
│   └── claimReq.json
├── src/
│   ├── components/         # React components
│   │   ├── FHIRBundleViewer.tsx
│   │   └── FHIRBundleViewer.css
│   ├── types/             # TypeScript type definitions
│   │   └── fhir.ts
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── package.json
└── README.md
```

## 🎯 Supported FHIR Resources

### Fully Supported
- **InsurancePlan** - Complete benefit analysis with expandable service lists
- **CoverageEligibilityRequest** - Service requests with provider information
- **CoverageEligibilityResponse** - Eligibility results with financial details
- **Patient** - Demographics and identification
- **Organization** - Healthcare facility information
- **Practitioner** - Healthcare provider details

### Basic Support
- **Coverage** - Insurance coverage information
- **Claim** - Healthcare claims
- **ClaimResponse** - Claim processing results
- **Bundle** - FHIR resource collections

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Data Format

The application expects FHIR R4 compliant JSON files. Place your FHIR Bundle or individual resource files in the `public/` directory with `.json` extensions.

Example supported file patterns:
- `*Req.json` - Request files
- `*Resp.json` - Response files
- `*.json` - Any FHIR resource files

## 🎨 Customization

### Adding New Resource Types
1. Update the `getResourceIcon()` function in `FHIRBundleViewer.tsx`
2. Add specific rendering logic in the `renderResourceDetails()` function
3. Add corresponding CSS styles in `FHIRBundleViewer.css`

### Styling
The application uses CSS custom properties for theming. Modify the CSS variables in `FHIRBundleViewer.css` to customize colors and spacing.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with compliance to HL7 FHIR R4 specification
- Designed for healthcare interoperability standards
- Optimized for Indian healthcare ecosystem (NDHM/ABDM compliance)

## 📞 Support

For questions, issues, or feature requests, please open an issue on the GitHub repository.
