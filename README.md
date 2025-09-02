# FHIR Lens

A simple web app to view and understand healthcare data files. Upload your FHIR files and see the information in an easy-to-read format.

## What it does

- Shows healthcare data in a clear, organized way
- Displays insurance plans with benefits and pricing
- Shows eligibility checks and responses
- Works with patient records, claims, and provider information
- Click buttons to see more details when needed

## How to use it

1. **Get the code**
   ```bash
   git clone https://github.com/shyamvlmna/fhir-lens.git
   cd fhir-lens
   ```

2. **Install**
   ```bash
   npm install
   ```

3. **Add your files**
   Put your healthcare data files (*.json) in the `public/` folder

4. **Start the app**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Go to `http://localhost:3001`

## What files it works with

- Insurance plans
- Eligibility requests and responses  
- Patient information
- Claims and claim responses
- Healthcare provider details
- Any standard FHIR healthcare files

## Key features

- **Easy viewing**: No technical knowledge needed
- **Click to expand**: See more details when you want them
- **Color coded**: Different colors for different types of information
- **Works on phones**: Responsive design for any device
- **No setup**: Just add files and start viewing

## File structure

```
fhir-lens/
├── public/           # Put your healthcare files here
├── src/             # App code
└── README.md        # This file
```

## Available commands

- `npm run dev` - Start the app
- `npm run build` - Build for sharing
- `npm run preview` - Test the built version

## Adding new file types

The app automatically detects and displays most healthcare data files. Just put them in the `public/` folder with a `.json` extension.
