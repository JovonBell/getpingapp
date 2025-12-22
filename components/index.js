// Home Components
export { default as HomeHeader } from './home/HomeHeader';
export { default as HealthSummaryCard } from './home/HealthSummaryCard';
export { default as SearchBar } from './home/SearchBar';
export { DeleteCircleSelectModal, DeleteCircleConfirmModal } from './home/DeleteCircleModals';

// Contact Components
export { default as CircleZoom3D } from './contacts/CircleZoom3D';
export { default as PlanetZoom3D } from './contacts/PlanetZoom3D';
export { default as HealthIndicator } from './contacts/HealthIndicator';
export { default as CircleHealthBreakdown } from './contacts/CircleHealthBreakdown';

// 3D Components
export { default as SolarSystemView } from './3d/SolarSystemView';
export { TouchController, GESTURE_STATE } from './3d/TouchController';
export { CameraController, animateCameraTo, TRANSITIONS } from './3d/CameraController';
export { createBackgroundLayers, createSimpleStarField } from './3d/StarField';

// Communication Components
export { default as AISuggestionCard } from './communication/AISuggestionCard';

// Modal Components
export { default as AddContactModal } from './modals/AddContactModal';
export { default as EditContactModal } from './modals/EditContactModal';
export { default as AddReminderModal } from './modals/AddReminderModal';
export { default as CelebrationModal } from './modals/CelebrationModal';

// Common Components
export { default as Skeleton } from './common/Skeleton';
export { default as Confetti } from './common/Confetti';
export { default as GestureHint } from './common/GestureHint';

// Analytics Components (still in root)
export { default as AchievementCard } from './AchievementCard';
export { default as StreakCard } from './StreakCard';
export { default as WeeklyActivityCard } from './WeeklyActivityCard';
export { default as ReminderCard } from './ReminderCard';
export { default as NetworkHealthScore } from './NetworkHealthScore';
export { default as HealthDistributionChart } from './HealthDistributionChart';
export { default as PriorityContactsList } from './PriorityContactsList';
export { default as QuickActionMenu } from './QuickActionMenu';
