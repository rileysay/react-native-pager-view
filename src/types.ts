import type { NativeProps } from './PagerViewNativeComponent';
import type React from 'react';

export type GestureTweak = (
  g: ReturnType<typeof import('react-native-gesture-handler').Gesture.Pan>
) => ReturnType<typeof import('react-native-gesture-handler').Gesture.Pan>;

export type PagerViewProps = NativeProps & {
  /** Ref to another gesture the pager should run with */
  simultaneousWith?: React.RefObject<any>;
  /** Optional fn to tweak our internal pan gesture (thresholds, etc.) */
  gestureConfig?: GestureTweak;
};
