// components/WeatherWidgetSkeleton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const WidgetCard: React.FC<{children: React.ReactNode}> = ({ children }) => <View style={styles.widgetCard}>{children}</View>;

export const WeatherWidgetSkeleton = () => {
    return (
        <WidgetCard>
            <View style={{ gap: 12 }}>
                <ShimmerPlaceholder style={{ height: 20, width: '60%', borderRadius: 8 }} />
                <ShimmerPlaceholder style={{ height: 48, width: '40%', borderRadius: 8 }} />
                <ShimmerPlaceholder style={{ height: 60, width: '100%', borderRadius: 8 }} />
            </View>
        </WidgetCard>
    );
};

const styles = StyleSheet.create({
    widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E0E0E0' },
});