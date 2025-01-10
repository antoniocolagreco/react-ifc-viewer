# React IFC Viewer

A simple IFC viewer for React. This library is currently a work in progress (WIP)—I advise against using it for now! 😀

Its primary purpose is to locate IFC elements based on their properties, allowing users to select them, overlay custom markers, and attach events. The library is developed to meet the specific needs of an application requiring the highlighting and selection of small sensors on large structures, based on real-time data from WebSocket connections. There are several other functionalities I still need to port from a previous project, but I am not sure when I will be able to.

The library is built with React, Three.js, and Web-IFC.

---

## Installation

Before installing this library, make sure you have React, Three.js, and Web-IFC installed. Additionally, ensure you have the Web-IFC WASM files, which the library expects to find by default in the `public/wasm` directory.

Install the library using npm:

```bash
npm install react-ifc-viewer
```

---

## Features

- **Selectable Meshes:** You can hover or select meshes, and custom events can be attached to them.
- **Overlays:** You can overlay custom components on meshes, such as markers or labels, but any React component will work.
- **ViewModes:** You can switch between different view modes (using a function in the `useIfcViewer` hook):
    - Default: The default view mode.
    - Transparent: Only the selectable meshes and the ones marked as always visible are displayed; everything else becomes half-transparent.
    - OnlySelectable: Only the selectable meshes and the ones marked as always visible are displayed; everything else is hidden.
- **Property-Based Selection:** To locate elements, the library performs an initial full scan of the IFC model’s properties. While this can be slow for large models, optimizations are available:
    - A function is provided (through the `useIfcViewer` hook) to analyze the IFC model and generate a serializable object containing all properties.
    - Then, this JSON string can be saved and loaded later to skip the initial scan, enabling instant element detection.
    - You can drop all the properties while keeping just the specified ones to now waste space. JSON is very inefficient but simple.
- **Controls:** You can navigate the model using mouse, left click to rotate and right click to move. There is a hook that adds extra functionalities to the viewer, such as focusing the view on selection, fitting and centering the view on selection, and resetting the viewport.
- **Efficient Rendering:** The scene is rerendered only while interacting with the viewport.

---

## Limitations

- **Performance:** The library’s performance is sufficient for the typical IFC files used by my customer. However, instanced meshes could be implemented for further optimization if needed. When I first started working with this library, I encountered issues with the materials, which led me to avoid using instanced meshes. However, now I am sharing all materials between the meshes when possible to improve performance and I generate new materials when I have to highlight meshes so I can easily switch to instanced meshes in the future.
- **Maturity:** This library is still in its early stages, and I advise against using it at this time.
- **Testing:** I have implemented some basic tests for the IFC model and properties loader, as well as a Storybook showcase for the viewer and the hook.

---

## Usage

Below is an example demonstrating how to use the viewer:

```jsx
<IfcViewer url="/test/castle.ifc" enableMeshHover enableMeshSelection>
	<IfcOverlay
		requirements={{
			requiredType: 'IfcDistributionControlElement',
			requiredProperties: [{ name: 'Contrassegno', value: '1' }],
		}}
		onSelect={ifcElement => {
			console.log(ifcElement)
		}}
		onHover={ifcElement => {
			console.log(ifcElement)
		}}
	>
		<IfcGreenMarker hoverEffect />
	</IfcOverlay>
	<IfcControls />
</IfcViewer>
```

---
