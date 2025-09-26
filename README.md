# React IFC Viewer

A React library for interactive visualization of Industry Foundation Classes (IFC) models with real-time data integration support.

## Overview

React IFC Viewer enables property-based element selection, custom overlays, and interactive events on building models. Built specifically for applications requiring sensor monitoring, equipment tracking, and real-time data visualization through MQTT integration. Under the hood it now relies on instanced meshes to render repeated geometry efficiently, keeping draw calls low even on large models.

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
- Instanced meshes for repeat geometry to minimize draw calls and GPU overhead
- Shared materials for memory efficiency
- On-demand rendering during interactions

## API Reference

### Components

#### `<IfcViewer>`

Main viewer component for rendering IFC models.

```jsx
<IfcViewer
  url="/path/to/model.ifc"
  enableMeshHover
  enableMeshSelection
  hoverColor={0x00ff00}
  selectedColor={0xff0000}
  links={linksBetweenElements}
  selectable={[{ type: 'IfcSensor' }]}
  alwaysVisible={[{ type: 'IfcWall' }]}
  highlightedSelectables={[{ type: 'IfcSensor', properties: [{ name: 'Status', value: 'Alarm' }] }]}
  showBoundingSphere={false}
  onModelLoaded={(model) => {}}
  onMeshSelect={(element) => {}}
  data={preProcessedData} // Optional: skip initial scan
>
  {/* Child components */}
</IfcViewer>
```

Where `linksBetweenElements` is an array of [`IfcElementLink`](./src/core/types/types.ts) objects produced during preprocessing.

Additional notable props:

- `links`: Couples related elements (e.g., sensors to devices) so they can be resolved quickly at runtime.
- `selectable`: Declares which elements can be interacted with via hover/click and programmatic selection.
- `alwaysVisible`: Keeps specific element classes visible in every view mode.
- `highlightedSelectables`: Visually emphasises selectables that match a given requirement.
- `showBoundingSphere`: Renders a helper sphere when focusing the camera on a selected element.

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
  loadingProgress,
  
  // Model access
  model,
  selectableElements,
  
  // Selection methods
  selectByProperty,
  selectByExpressId,
  getElementByExpressId,
  getElementsWithData,
  renderScene,
  updateAnchors,
  
  // Utilities
  utilities: { propertiesReader }
} = useIfcViewer()

const loadingPercentage =
  loadingProgress.loaded && loadingProgress.total
    ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
    : 0
```

## Advanced Usage

### Property Pre-processing

Optimize performance by pre-processing IFC properties:

```jsx
import { useEffect, useState } from 'react'
import type { IfcElementData } from 'react-ifc-viewer'
import { IfcViewer, useIfcViewer } from 'react-ifc-viewer'

function PreprocessedViewer({ src }: { src: string }) {
  const {
    utilities: {
      propertiesReader: { read }
    }
  } = useIfcViewer()

  const [data, setData] = useState<IfcElementData[]>()

  useEffect(() => {
    const preprocess = async () => {
      const response = await fetch(src)
      const buffer = new Uint8Array(await response.arrayBuffer())

      const processed = await read(buffer, {
        requirements: {
          selectableRequirements: [
            { type: 'IfcSensor', properties: [{ name: 'Type', value: 'Temperature' }] }
          ],
          alwaysVisibleRequirements: [{ type: 'IfcWall' }]
        },
        keepProperties: false,
        wasmPath: { path: '/wasm/', absolute: false }
      })

      localStorage.setItem('processedData', JSON.stringify(processed))
      setData(processed)
    }

    void preprocess()
  }, [read, src])

  if (!data) {
    return null
  }

  return <IfcViewer url={src} data={data} />
}
```

### Real-time Integration Pattern

Example MQTT integration for alarm monitoring:

```jsx
import { useEffect, useMemo, useState } from 'react'
import mqtt from 'mqtt'
import { IfcGreenMarker, IfcOverlay, IfcRedMarker, IfcViewer, useIfcViewer } from 'react-ifc-viewer'

function AlarmSystemViewer() {
  const { selectByProperty } = useIfcViewer()
  const [alarms, setAlarms] = useState<Set<string>>(new Set())

  const decoder = useMemo(() => new TextDecoder(), [])

  useEffect(() => {
    const client = mqtt.connect('wss://broker.example.com')

    const handleMessage = (_topic: string, payload: Uint8Array) => {
      const alarm = JSON.parse(decoder.decode(payload))

      if (alarm.status === 'ACTIVE') {
        setAlarms(prev => new Set([...prev, alarm.elementId]))
        selectByProperty({ name: 'ElementID', value: alarm.elementId })
        return
      }

      setAlarms(prev => {
        const next = new Set(prev)
        next.delete(alarm.elementId)
        return next
      })
    }

    client.subscribe('alarms')
    client.on('message', handleMessage)

    return () => {
      client.off('message', handleMessage)
      client.end(true)
    }
  }, [decoder, selectByProperty])

  return (
    <IfcViewer url="/building.ifc">
      <IfcOverlay requirements={{ type: 'IfcSensor' }}>
        <IfcGreenMarker />
      </IfcOverlay>

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

### Performance Notes

- Property scanning can be slow for large models - use pre-processing
- Materials are shared between meshes for efficiency
- Scene renders only during user interactions (overlays always rerender as they are React components)

### Performance TODOs

- [x] Move canvas sizing out of the main render loop: rely on the resize observer to call `renderer.setSize` and update the camera aspect only when dimensions actually change.
- [x] Precompute the array of instanced meshes so raycasting no longer scans every child of the scene graph on each hover/select event.
- [x] Memoize overlay anchor projections and refresh them through a single animation frame scheduler, so repeated calls to `transformViewportPositionToScreenPosition` are limited to nodes that actually moved.
- [x] Run IFC property processing inside a Web Worker to keep the main thread responsive while heavy parsing or `processIfcData` loops are underway.
- [x] Skip hover raycasts when the pointer displacement is below a small threshold and shorten the `renderingEnabledRef` timeout to avoid keeping the render loop hot unnecessarily.
- [x] Batch progress updates in the IFC reader (e.g., update React state every N elements or with `requestIdleCallback`) to lower reconciliation overhead during long scans.
- [x] Reuse shared Three.js math objects instead of allocating new `Vector3`/`Matrix4` instances inside tight loops to reduce garbage collection spikes.

### Current Status

⚠️ **This library is in active development and not recommended for production use.**

- Limited test coverage
- Instanced mesh performance tuning is ongoing
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
