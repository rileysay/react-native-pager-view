// src/PagerView.tsx
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Keyboard, Platform, I18nManager } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import PagerViewNativeComponent, {
  Commands as NativeCommands,
  OnPageScrollEventData,
  OnPageScrollStateChangedEventData,
  OnPageSelectedEventData,
  NativeProps,
} from './PagerViewNativeComponent';

import { childrenWithOverriddenStyle } from './utils';

/* ────────────────────────────────────────────────────────── */
/*  Extra props the fork exposes                              */
/* ────────────────────────────────────────────────────────── */
export type PagerViewProps = NativeProps & {
  /** run our pan simultaneously with this handler (e.g. FlatList) */
  simultaneousWith?: React.RefObject<any>;
  /** let callers tweak the internal Gesture.Pan() */
  gestureConfig?: (
    g: ReturnType<typeof Gesture.Pan>,
  ) => ReturnType<typeof Gesture.Pan>;
};

/* ────────────────────────────────────────────────────────── */
/*  Functional component                                     */
/* ────────────────────────────────────────────────────────── */
const PagerViewFC = (
  {
    simultaneousWith,
    gestureConfig,
    keyboardDismissMode = 'none',
    layoutDirection = 'locale',
    scrollEnabled = true,
    ...rest
  }: PagerViewProps,
  ref: React.Ref<React.ElementRef<typeof PagerViewNativeComponent>>,
) => {
  /* native ref + imperative API -------------------------------- */
  const pagerRef = useRef<React.ElementRef<typeof PagerViewNativeComponent>>(
    null,
  );

  useImperativeHandle(ref, () => ({
    setPage: (page: number) =>
      pagerRef.current && NativeCommands.setPage(pagerRef.current, page),
    setPageWithoutAnimation: (page: number) =>
      pagerRef.current &&
      NativeCommands.setPageWithoutAnimation(pagerRef.current, page),
    setScrollEnabled: (enabled: boolean) =>
      pagerRef.current &&
      NativeCommands.setScrollEnabledImperatively(pagerRef.current, enabled),
  }));

  /* pan gesture ------------------------------------------------- */
  const panGesture = useMemo(() => {
    let g = Gesture.Pan()
      .enabled(scrollEnabled)
      .activeOffsetX([-10, 10])   // ≥10 px horizontal
      .failOffsetY([-4, 4])       // ≤4 px vertical
      .onStart(() => {
        if (Platform.OS === 'android' && keyboardDismissMode === 'on-drag') {
          Keyboard.dismiss();
        }
      });

    if (simultaneousWith?.current) {
      g = g.simultaneousWithExternalGesture(simultaneousWith);
    }
    if (gestureConfig) g = gestureConfig(g);
    return g;
  }, [scrollEnabled, simultaneousWith, gestureConfig, keyboardDismissMode]);

  /* native callbacks ------------------------------------------- */
  const onPageScroll = (
    e: React.NativeSyntheticEvent<OnPageScrollEventData>,
  ) => rest.onPageScroll?.(e);

  const onPageScrollStateChanged = (
    e: React.NativeSyntheticEvent<OnPageScrollStateChangedEventData>,
  ) => rest.onPageScrollStateChanged?.(e);

  const onPageSelected = (
    e: React.NativeSyntheticEvent<OnPageSelectedEventData>,
  ) => rest.onPageSelected?.(e);

  /* layout direction ------------------------------------------- */
  const deducedDir =
    layoutDirection === 'locale'
      ? I18nManager.isRTL
        ? 'rtl'
        : 'ltr'
      : layoutDirection;

  /* render ------------------------------------------------------ */
  return (
    <GestureDetector gesture={panGesture}>
      <PagerViewNativeComponent
        {...rest}
        ref={pagerRef}
        layoutDirection={deducedDir}
        onPageScroll={onPageScroll}
        onPageScrollStateChanged={onPageScrollStateChanged}
        onPageSelected={onPageSelected}
        children={childrenWithOverriddenStyle(rest.children)}
      />
    </GestureDetector>
  );
};

export const PagerView = forwardRef(PagerViewFC);
export default PagerView;
