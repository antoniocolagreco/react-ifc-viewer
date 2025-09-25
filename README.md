# React IFC Viewer

A React library for interactive visualization of Industry Foundation Classes (IFC) models with real-time data integration support.

## Overview

React IFC Viewer enables property-based element selection, custom overlays, and interactive events on building models. Built specifically for applications requiring sensor monitoring, equipment tracking, and real-time data visualization through MQTT integration.

**Built with:** React, Three.js, and Web-IFC.

## Installation

```bash
npm install react-ifc-viewer
```

**Prerequisites:**

- React 19.0.0+
- Three.js 0.175.0+  
- Web-IFC 0.0.66+
- Web-IFC WASM files in `public/wasm` directory

## Quick Start

```jsx
import { IfcViewer, IfcOverlay, IfcGreenMarker, IfcControls } from 'react-ifc-viewer'
import 'react-ifc-viewer/css'

function App() {
  return (
    <IfcViewer url="/model.ifc" enableMeshHover enableMeshSelection>
      <IfcOverlay
        requirements={{
          type: 'IfcSensor',
          properties: [{ name: 'SensorType', value: 'Temperature' }]
        }}
        onSelect={(data) => console.log('Sensor selected:', data)}
      >
        <IfcGreenMarker hoverEffect />
      </IfcOverlay>
      <IfcControls />
    </IfcViewer>
  )
}
```

## Core Features

### Element Selection & Interaction

- Property-based element filtering and targeting
- Interactive hover and click events
- Programmatic selection via hooks

### Dynamic Overlays

- Overlay React components on 3D elements
- Support for markers, labels, and custom components
- Automatic positioning and event handling

### View Modes

- **All**: Show all elements (default)
- **Transparent**: Semi-transparent non-selectable elements  
- **Selectable Only**: Hide non-selectable elements

### Performance Optimization

- Property scanning with caching
- Shared materials for memory efficiency
- On-demand rendering during interactions

## API Reference

### Components

#### `<IfcViewer>`

Main viewer component for rendering IFC models.

```jsx
<IfcViewer
  url="/path/to/model.ifc"
  enableMeshHover={true}
  enableMeshSelection={true}
  hoverColor={0x00ff00}
  selectedColor={0xff0000}
  onModelLoaded={(model) => {}}
  onMeshSelect={(element) => {}}
  data={preProcessedData} // Optional: skip initial scan
>
  {/* Child components */}
</IfcViewer>
```

#### `<IfcOverlay>`

Creates positioned overlays on IFC elements matching specified criteria.

```jsx
<IfcOverlay
  requirements={{
    type: 'IfcWall',
    properties: [{ name: 'Material', value: 'Concrete' }],
    expressId: 12345 // Optional: target specific element
  }}
  onSelect={(data) => {}}
  onHover={(data) => {}}
>
  <IfcGreenMarker hoverEffect />
</IfcOverlay>
```

#### Pre-built Components

- `<IfcControls />` - View controls (fit, focus, reset, view modes)
- `<IfcGreenMarker />`, `<IfcRedMarker />`, `<IfcBlueMarker />`, `<IfcYellowMarker />`
- `<IfcButton />` - Styled button component

### Hooks

#### `useIfcViewer()`

Access viewer state and control functions.

```jsx
const {
  // Camera controls
  viewPort: { focusView, fitView, resetView, changeViewMode, viewMode },
  
  // Loading state
  loadingProgress: { status, loaded, total, percentage },
  
  // Model access
  model,
  selectableElements,
  
  // Selection methods
  selectByProperty,
  selectByExpressId,
  getElementByExpressId,
  
  // Utilities
  utilities: { propertiesReader }
} = useIfcViewer()
```

## Advanced Usage

### Property Pre-processing

Optimize performance by pre-processing IFC properties:

```jsx
const { utilities } = useIfcViewer()

// Process and cache properties
const data = await utilities.propertiesReader.read(ifcBuffer, {
  requirements: {
    selectableRequirements: [
      { type: 'IfcSensor', properties: [{ name: 'Type', value: 'Temperature' }] }
    ]
  },
  keepProperties: false // Reduce memory usage
})

// Save for future use
localStorage.setItem('processedData', JSON.stringify(data))

// Use pre-processed data
<IfcViewer data={data} url="/model.ifc" />
```

### Real-time Integration Pattern

Example MQTT integration for alarm monitoring:

```jsx
function AlarmSystem() {
  const { selectByProperty } = useIfcViewer()
  const [alarms, setAlarms] = useState(new Set())

  useEffect(() => {
    const client = mqtt.connect('mqtt://broker.com')
    
    client.on('message', (topic, message) => {
      const alarm = JSON.parse(message.toString())
      
      if (alarm.status === 'ACTIVE') {
        setAlarms(prev => new Set([...prev, alarm.elementId]))
        selectByProperty({ name: 'ElementID', value: alarm.elementId })
      } else {
        setAlarms(prev => { prev.delete(alarm.elementId); return new Set(prev) })
      }
    })
    
    return () => client.end()
  }, [])

  return (
    <IfcViewer url="/building.ifc">
      {/* Normal elements */}
      <IfcOverlay requirements={{ type: 'IfcSensor' }}>
        <IfcGreenMarker />
      </IfcOverlay>
      
      {/* Alarm elements */}
      {Array.from(alarms).map(id => (
        <IfcOverlay
          key={id}
          requirements={{ properties: [{ name: 'ElementID', value: id }] }}
        >
          <IfcRedMarker hoverEffect />
        </IfcOverlay>
      ))}
    </IfcViewer>
  )
}
```

## Requirements & Limitations

### Browser Support

- WebGL 2.0 support required
- Modern browsers with Web Workers
- ES2020+ JavaScript features

### Performance Notes

- Property scanning can be slow for large models - use pre-processing
- Materials are shared between meshes for efficiency
- Scene renders only during user interactions

### Current Status

⚠️ **This library is in active development and not recommended for production use.**

- Limited test coverage
- Instanced meshes not yet implemented
- API may change between versions

## Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Run tests
pnpm test

# Build library
pnpm build:lib

# Build Storybook
pnpm build:storybook
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions, issues, and feature requests are welcome. Please check the GitHub repository for the latest updates and contribution guidelines.
