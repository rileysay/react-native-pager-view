import React from 'react';
import { Platform, Keyboard } from 'react-native';
import { I18nManager } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type * as ReactNative from 'react-native';

import {
  childrenWithOverriddenStyle,
} from './utils';

import PagerViewNativeComponent, {
  Commands as PagerViewNativeCommands,
  OnPageScrollEventData,
  OnPageScrollStateChangedEventData,
  OnPageSelectedEventData,
  NativeProps,
} from './PagerViewNativeComponent';

// Extended props to include new gesture configuration
interface ModernPagerViewProps extends NativeProps {
  simultaneousWith?: React.RefObject<any> | React.RefObject<any>[];
  gestureConfig?: (gesture: ReturnType<typeof Gesture.Pan>) => ReturnType<typeof Gesture.Pan>;
}

/**
 * Container that allows to flip left and right between child views. Each
 * child view of the `PagerView` will be treated as a separate page
 * and will be stretched to fill the `PagerView`.
 *
 * Now includes modern gesture handling with GestureDetector + Gesture.Pan()
 * while maintaining backward compatibility with imperative API.
 *
 * New props:
 * - simultaneousWith: Pass a ref to allow simultaneous gestures with other components
 * - gestureConfig: Optional function to customize the pan gesture behavior
 *
 * Example:
 *
 * ```
 * const listRef = useRef<FlatList>(null);
 * 
 * render: function() {
 *   return (
 *     <PagerView
 *       style={styles.PagerView}
 *       initialPage={0}
 *       simultaneousWith={listRef}
 *       gestureConfig={g => g.activeOffsetX([-8, 8])}>
 *       <View style={styles.pageStyle} key="1">
 *         <Text>First page</Text>
 *       </View>
 *       <View style={styles.pageStyle} key="2">
 *         <Text>Second page</Text>
 *       </View>
 *     </PagerView>
 *   );
 * }
 * ```
 */

export class PagerView extends React.Component<ModernPagerViewProps> {
  private isScrolling = false;
  pagerView: React.ElementRef<typeof PagerViewNativeComponent> | null = null;

  private get deducedLayoutDirection() {
    if (
      !this.props.layoutDirection ||
      //@ts-ignore fix it
      this.props.layoutDirection === 'locale'
    ) {
      return I18nManager.isRTL ? 'rtl' : 'ltr';
    } else {
      return this.props.layoutDirection;
    }
  }

  // Create the modern pan gesture
  private createPanGesture = () => {
    let baseGesture = Gesture.Pan()
      .onStart(() => {
        this.isScrolling = true;
      })
      .onUpdate((event) => {
        // Handle pan updates - this integrates with native pager scrolling
        // The native component will handle the actual scrolling
      })
      .onEnd(() => {
        this.isScrolling = false;
      })
      .onFinalize(() => {
        this.isScrolling = false;
      });

    // Apply custom gesture configuration if provided
    if (this.props.gestureConfig) {
      baseGesture = this.props.gestureConfig(baseGesture);
    }

    // Set up simultaneous gestures if specified
    if (this.props.simultaneousWith) {
      const refs = Array.isArray(this.props.simultaneousWith)
        ? this.props.simultaneousWith
        : [this.props.simultaneousWith];

      refs.forEach(ref => {
        if (ref?.current) {
          baseGesture = baseGesture.simultaneousWithExternalGesture(ref.current);
        }
      });
    }

    return baseGesture;
  };

  private _onPageScroll = (
    e: ReactNative.NativeSyntheticEvent<OnPageScrollEventData>
  ) => {
    if (this.props.onPageScroll) {
      this.props.onPageScroll(e);
    }

    // Not implemented on iOS yet
    if (Platform.OS === 'android') {
      if (this.props.keyboardDismissMode === 'on-drag') {
        Keyboard.dismiss();
      }
    }
  };

  private _onPageScrollStateChanged = (
    e: ReactNative.NativeSyntheticEvent<OnPageScrollStateChangedEventData>
  ) => {
    if (this.props.onPageScrollStateChanged) {
      this.props.onPageScrollStateChanged(e);
    }
    this.isScrolling = e.nativeEvent.pageScrollState === 'dragging';
  };

  private _onPageSelected = (
    e: ReactNative.NativeSyntheticEvent<OnPageSelectedEventData>
  ) => {
    if (this.props.onPageSelected) {
      this.props.onPageSelected(e);
    }
  };

  private _onMoveShouldSetResponderCapture = () => {
    return this.isScrolling;
  };

  /**
   * A helper function to scroll to a specific page in the PagerView.
   * The transition between pages will be animated.
   */
  public setPage = (selectedPage: number) => {
    if (this.pagerView) {
      PagerViewNativeCommands.setPage(this.pagerView, selectedPage);
    }
  };

  /**
   * A helper function to scroll to a specific page in the PagerView.
   * The transition between pages will *not* be animated.
   */
  public setPageWithoutAnimation = (selectedPage: number) => {
    if (this.pagerView) {
      PagerViewNativeCommands.setPageWithoutAnimation(
        this.pagerView,
        selectedPage
      );
    }
  };

  /**
   * A helper function to enable/disable scroll imperatively
   * The recommended way is using the scrollEnabled prop, however, there might be a case where a
   * imperative solution is more useful (e.g. for not blocking an animation)
   */
  public setScrollEnabled = (scrollEnabled: boolean) => {
    if (this.pagerView) {
      PagerViewNativeCommands.setScrollEnabledImperatively(
        this.pagerView,
        scrollEnabled
      );
    }
  };

  render() {
    const panGesture = this.createPanGesture();

    return (
      <GestureDetector gesture={panGesture}>
        <PagerViewNativeComponent
          {...this.props}
          ref={(ref) => {
            this.pagerView = ref;
          }}
          style={this.props.style}
          layoutDirection={this.deducedLayoutDirection}
          onPageScroll={this._onPageScroll}
          onPageScrollStateChanged={this._onPageScrollStateChanged}
          onPageSelected={this._onPageSelected}
          onMoveShouldSetResponderCapture={
            this._onMoveShouldSetResponderCapture
          }
          children={childrenWithOverriddenStyle(this.props.children)}
        />
      </GestureDetector>
    );
  }
}
