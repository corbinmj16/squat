# Squat Tracker

A real-time squat form analyzer that uses your device's camera and AI-powered pose detection to track your squat depth and count your repetitions.

## Features

- **Real-Time Pose Detection**: Uses MediaPipe's PoseLandmarker to detect body landmarks in real-time
- **Squat Depth Tracking**: Calculates squat depth based on knee and hip angles
- **Rep Counting**: Automatically counts completed squats with proper form
- **Camera Selection**: Choose between front-facing or rear-facing cameras (if available)
- **Live Skeleton Visualization**: View detected body landmarks and joints on your video feed
- **Form Feedback**: Real-time status indicators showing standing, squatting, and target depth achievement

## How It Works

The application uses Google's MediaPipe pose estimation library to detect body landmarks from your camera feed. Here's the process:

1. **Pose Detection**: Detects 33 key body landmarks (joints) in each video frame
2. **Angle Calculation**: Computes knee and hip angles from the detected landmarks
3. **Depth Estimation**: Calculates squat depth as a percentage (0-100%)
   - 0% = Standing fully upright
   - 100% = Knee angle of 80° (full squat depth)
4. **Rep Counting**: Tracks when you complete a full squat (≥60% depth) and return to standing position
5. **Visual Feedback**: Displays your current depth percentage, status, and rep count

### Angle Calculation

The app calculates angles between three points using the arctangent formula:

- **Knee Angle**: Formed by hip → knee → ankle
- **Hip Angle**: Formed by shoulder → hip → knee

The squat depth is derived from the knee angle:

- At 180° (fully extended) = 0% depth
- At 80° (full squat) = 100% depth

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn
- A modern web browser with camera access
- Camera permission enabled

### Installation

2. Install dependencies:

```bash
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

Build the optimized production bundle:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Allow Camera Access**: When prompted, grant camera permissions
2. **Position Yourself**: Stand in front of the camera, fully visible
3. **Perform Squats**: The app will automatically track your depth and count reps
4. **Monitor Feedback**: Watch the status indicator to know when you've reached target depth

### Status Indicators

- **Standing**: You're upright and ready (0-30% depth)
- **Going Down...**: You're beginning to squat (30-50% depth)
- **Keep Going...**: You're squatting but not deep enough (50-80% depth)
- **DEPTH REACHED!**: You've achieved target depth (80%+)

## Libraries & Dependencies

### Runtime Dependencies

- **@mediapipe/tasks-vision** (v0.10.22): Google's MediaPipe library for pose estimation
  - Provides pre-trained TensorFlow models for pose detection
  - Optimized for real-time performance in browsers

### Dev Dependencies

- **vite** (v7.2.4): Lightning-fast build tool and dev server
  - Used for development and production builds

## Project Structure

```
squat/
├── index.html              # Main HTML file
├── package.json           # Project dependencies and scripts
├── vite.config.js         # Vite configuration
├── src/
│   ├── main.js           # Application logic
│   └── style.css         # Styling
├── app/
│   └── shared/
│       └── models/
│           └── pose_landmarker_lite.task  # MediaPipe model file
├── public/
│   └── pose_landmarker_lite.task  # Model copy for deployment
└── dist/                 # Production build output
```

## Technical Details

### Key Calculations

**Squat Depth Formula:**

```
depth = ((180 - kneeAngle) / 100) × 100
```

**Rep Validation:**

- Rep counts only when depth exceeds 60% AND returns to standing (<20% depth)
- Tracks the maximum depth achieved during each rep

### Browser Requirements

- Modern ES6+ JavaScript support
- WebRTC/MediaDevices API for camera access
- Canvas API for skeleton visualization
- requestAnimationFrame for smooth animation

## Performance Considerations

- Video resolution set to 640×480 for optimal performance
- Canvas size matches displayed video dimensions (not native resolution)
- MediaPipe runs in `LIVE_STREAM` mode for continuous real-time processing
- Uses visibility thresholds (>0.5) to filter out unreliable pose detections

## Camera Support

The app checks available cameras and:

- Shows camera selection UI if multiple cameras are available
- Automatically uses front-facing camera if only one is available
- Falls back to front-facing if enumeration fails

## Troubleshooting

| Issue                      | Solution                                              |
| -------------------------- | ----------------------------------------------------- |
| Camera not working         | Check browser permissions and try a different browser |
| Pose detection not visible | Ensure full body is in frame, with good lighting      |
| Inaccurate depth readings  | Try adjusting your distance from camera or lighting   |
| App won't start            | Clear browser cache and reload the page               |

## Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support (iOS requires camera app permission)
- Edge: Full support

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]
