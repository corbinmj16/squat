import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import './style.css'

let poseLandmarker = undefined;
let lastVideoTime = -1;
let repCount = 0;
let isSquatting = false;
let maxDepthThisRep = 0;

// Configuration
const TARGET_KNEE_ANGLE = 90; // degrees
const TARGET_DEPTH_THRESHOLD = 85; // Allow 85-95 degrees
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/pose_landmarker_lite.task'
    },
    runningMode: 'LIVE_STREAM'
  });
};

// Calculate angle between three points
const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

// Calculate squat depth as a percentage (0-100)
// 0% = standing tall, 100% = full squat
const calculateSquatDepth = (landmarks) => {
  if (!landmarks || landmarks.length < 26) return 0;

  // Landmark indices: 11=left shoulder, 23=left hip, 25=left knee, 27=left ankle
  const leftShoulder = landmarks[11];
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];

  // Calculate knee angle (between hip, knee, ankle)
  const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

  // Calculate hip angle (between shoulder, hip, knee)
  const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);

  // Depth is inversely related to knee angle
  // At 180° (standing) = 0% depth
  // At 90° (full squat) = 100% depth
  const depth = Math.max(0, Math.min(100, ((180 - kneeAngle) / 90) * 100));

  return {
    depth: Math.round(depth),
    kneeAngle: Math.round(kneeAngle),
    hipAngle: Math.round(hipAngle)
  };
};

// Update UI status
const updateStatus = (depth, kneeAngle) => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const depthValue = document.getElementById('depth-value');
  const repCounter = document.getElementById('rep-count');

  depthValue.textContent = `${depth}%`;
  repCounter.textContent = repCount;

  if (depth < 30) {
    // Standing
    statusIndicator.className = 'status-ready';
    statusIndicator.innerHTML = '<p>Standing</p>';
    statusText.textContent = 'Ready';
  } else if (depth < 50) {
    // Shallow squat
    statusIndicator.className = 'status-squatting';
    statusIndicator.innerHTML = '<p>Going Down...</p>';
    statusText.textContent = 'Squatting';
  } else if (depth < 80) {
    // Mid squat
    statusIndicator.className = 'status-squatting';
    statusIndicator.innerHTML = '<p>Keep Going...</p>';
    statusText.textContent = 'Squatting';
  } else {
    // Deep squat (good depth)
    statusIndicator.className = 'status-success';
    statusIndicator.innerHTML = '<p>DEPTH REACHED! ✓</p>';
    statusText.textContent = 'Target Depth!';
  }
};

// Draw skeleton on canvas
const drawSkeleton = (landmarks, canvas, video) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Define connections (bones) between landmarks
  const connections = [
    // Head
    [0, 1], [1, 2], [2, 3], [3, 7],
    [0, 4], [4, 5], [5, 6], [6, 8],
    // Body
    [9, 10],
    // Left arm
    [11, 13], [13, 15],
    // Right arm
    [12, 14], [14, 16],
    // Left leg
    [23, 25], [25, 27], [27, 29], [29, 31],
    // Right leg
    [24, 26], [26, 28], [28, 30], [30, 32],
    // Torso
    [11, 12], [11, 23], [12, 24], [23, 24]
  ];

  // Calculate scale factors to match displayed video size
  const scaleX = canvas.width / video.videoWidth;
  const scaleY = canvas.height / video.videoHeight;

  // Draw connections (lines)
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
  ctx.lineWidth = 2;

  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];

    if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    }
  }

  // Draw landmarks (circles)
  ctx.fillStyle = 'rgba(50, 205, 50, 0.8)';
  for (const landmark of landmarks) {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
};

// Process video frames
const detectPose = async () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  if (video.currentTime === lastVideoTime) {
    window.requestAnimationFrame(detectPose);
    return;
  }

  lastVideoTime = video.currentTime;

  const results = await poseLandmarker.detectForVideo(video, performance.now());

  if (results.landmarks && results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];
    
    // Draw skeleton on canvas
    drawSkeleton(landmarks, canvas, video);
    
    const depthInfo = calculateSquatDepth(landmarks);
    const depth = depthInfo.depth;

    // Track the deepest point in current rep
    maxDepthThisRep = Math.max(maxDepthThisRep, depth);

    // Rep counting logic
    if (depth > 60 && !isSquatting) {
      // Started squatting
      isSquatting = true;
      maxDepthThisRep = depth;
    } else if (depth < 20 && isSquatting) {
      // Returned to standing - rep completed
      if (maxDepthThisRep >= 60) {
        // Valid rep (reached at least 60% depth)
        repCount++;
      }
      isSquatting = false;
      maxDepthThisRep = 0;
    }

    updateStatus(depth, depthInfo.kneeAngle);
  }

  window.requestAnimationFrame(detectPose);
};

// Initialize
const init = async () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');

  try {
    // Get video stream from camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: VIDEO_WIDTH },
        height: { ideal: VIDEO_HEIGHT }
      }
    });

    video.srcObject = stream;

    // Wait for video to load
    video.onloadedmetadata = async () => {
      // Set canvas to match the displayed video size, not native resolution
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.display = 'block';

      // Initialize MediaPipe
      await createPoseLandmarker();
      document.getElementById('status-indicator').innerHTML = '<p>Ready to Squat!</p>';
      document.getElementById('status-indicator').className = 'status-ready';
      document.getElementById('status-text').textContent = 'Initialized';

      // Start detection loop
      detectPose();
    };
  } catch (error) {
    console.error('Camera access error:', error);
    document.getElementById('status-indicator').innerHTML = '<p>Camera access denied</p>';
    document.getElementById('status-text').textContent = 'Error: Please enable camera access';
  }
};

// Start on page load
init();