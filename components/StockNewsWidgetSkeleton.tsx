// components/StockNewsWidgetSkeleton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const WidgetCard: React.FC<{children: React.ReactNode}> = ({ children }) => <View style={styles.widgetCard}>{children}</View>;

const NewsItemSkeleton = () => (
    <View style={{ borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <ShimmerPlaceholder style={{ height: 35, width: 80, borderRadius: 8 }} />
            <ShimmerPlaceholder style={{ height: 35, width: 80, borderRadius: 8 }} />
        </View>
        <ShimmerPlaceholder style={{ height: 16, width: '90%', borderRadius: 8 }} />
        <ShimmerPlaceholder style={{ height: 20, width: '70%', borderRadius: 8, marginTop: 8 }} />
    </View>
);

export const StockNewsWidgetSkeleton = () => {
    return (
        <WidgetCard>
            <ShimmerPlaceholder style={{ height: 22, width: '70%', borderRadius: 8, marginBottom: 16 }} />
            <View style={{ gap: 16 }}>
                <NewsItemSkeleton />
                <NewsItemSkeleton />
            </View>
        </WidgetCard>
    );
};

const styles = StyleSheet.create({
    widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E0E0E0' },
});