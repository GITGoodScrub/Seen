import { ReactNode, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet } from "react-native";

type SwipeBackGestureViewProps = {
    children: ReactNode;
    onBack: () => void;
    enabled?: boolean;
    edgeWidth?: number;
    threshold?: number;
};

export const SwipeBackGestureView = (
    {
        children,
        onBack,
        enabled = true,
        edgeWidth = 28,
        threshold = 88,
    }: SwipeBackGestureViewProps,
) =>
{
    const screenWidth = Dimensions.get("window").width;
    const translateX = useRef(new Animated.Value(0)).current;
    const isTrackingRef = useRef(false);
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;

    const isValidSwipeStart = (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
    ): boolean =>
    {
        if (!enabled)
        {
            return false;
        }

        const startedFromEdge = gestureState.x0 <= edgeWidth;
        const movingRight = gestureState.dx > 8;
        const mostlyHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25;

        if (startedFromEdge && movingRight && mostlyHorizontal)
        {
            isTrackingRef.current = true;
            return true;
        }

        return false;
    };

    const resetPosition = (): void =>
    {
        Animated.spring(
            translateX,
            {
                toValue: 0,
                useNativeDriver: true,
                tension: 180,
                friction: 22,
            },
        ).start();
    };

    const completeBackGesture = (): void =>
    {
        Animated.timing(
            translateX,
            {
                toValue: screenWidth,
                duration: 170,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            },
        ).start(
            () =>
            {
                translateX.setValue(0);
                onBackRef.current();
            },
        );
    };

    const panResponder = useMemo(
        () => PanResponder.create(
            {
                onMoveShouldSetPanResponder: isValidSwipeStart,
                onMoveShouldSetPanResponderCapture: isValidSwipeStart,
                onPanResponderMove: (_, gestureState) =>
                {
                    if (!isTrackingRef.current)
                    {
                        return;
                    }

                    translateX.setValue(Math.max(0, gestureState.dx));
                },
                onPanResponderRelease: (_, gestureState) =>
                {
                    if (!isTrackingRef.current)
                    {
                        return;
                    }

                    isTrackingRef.current = false;

                    const shouldGoBack = gestureState.dx >= threshold || gestureState.vx > 0.8;
                    if (shouldGoBack)
                    {
                        completeBackGesture();
                        return;
                    }

                    resetPosition();
                },
                onPanResponderTerminate: () =>
                {
                    isTrackingRef.current = false;
                    resetPosition();
                },
            },
        ),
        [enabled, edgeWidth, threshold, screenWidth],
    );

    const edgeShadowOpacity = translateX.interpolate(
        {
            inputRange: [0, 24, 120],
            outputRange: [0, 0.18, 0],
            extrapolate: "clamp",
        },
    );

    return (
        <Animated.View
            style={[styles.container, { transform: [{ translateX }] }]}
            {...panResponder.panHandlers}
        >
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.edgeShadow,
                    {
                        opacity: edgeShadowOpacity,
                    },
                ]}
            />
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        edgeShadow: {
            position: "absolute",
            left: -14,
            top: 0,
            bottom: 0,
            width: 14,
            backgroundColor: "#000000",
        },
    },
);
