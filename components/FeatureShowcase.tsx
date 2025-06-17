// components/FeatureShowcase.tsx
import { BrainCircuit, CheckCircle, LucideProps, Sparkles, Sunrise, Wind } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const WidgetCard: React.FC<{children: React.ReactNode}> = ({ children }) => <View style={styles.widgetCard}>{children}</View>;

const featuresData: {icon: React.ElementType<LucideProps>, title: string, tagline: string, features: string[]}[] = [
    { icon: Sunrise, title: "AI Morning Companion", tagline: "Start your day right. Every day.", features: ["Personalized greetings", "AI-generated motivation", "Voice interaction"] },
    { icon: CheckCircle, title: "Habit Tracker + Wins", tagline: "Your buddy for good habits.", features: ["Log daily wins", "Evolving buddy", "Daily mood check-ins"] },
    { icon: Wind, title: "Mindful Microtasks", tagline: "Tiny tasks. Big changes.", features: ["5-min mindful activities", "Mood tracking over time", "Journaling integration"] },
    { icon: BrainCircuit, title: "Daily Wisdom Drops", tagline: "One idea to grow your mind.", features: ["AI-curated daily ideas", "30-sec summary + deep dive", "Fun 'Buddy Quiz'"] },
    { icon: Sparkles, title: "Creative Spark App", tagline: "Fuel your creativity.", features: ["Daily creative challenges", "AI idea starters", "Save creative streaks"] },
];

type FeatureShowcaseProps = {
    primaryColor: string;
};

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ primaryColor }) => {
  return (
    <WidgetCard>
      <Text style={[styles.title, { color: primaryColor }]}>Ohayo Buddy: Feature Concepts</Text>
      <View style={styles.container}>
        {featuresData.map((item, index) => (
          <View key={index} style={[styles.featureItem, index === 0 && styles.firstFeatureItem]}>
            <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
              <item.icon size={24} color={primaryColor} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureTagline}>"{item.tagline}"</Text>
              {item.features.map((f, i) => <Text key={i} style={styles.featurePoint}>• {f}</Text>)}
            </View>
          </View>
        ))}
      </View>
    </WidgetCard>
  );
};

const styles = StyleSheet.create({
    widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E0E0E0' },
    title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    container: { gap: 16 },
    featureItem: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 16 },
    firstFeatureItem: { borderTopWidth: 0, paddingTop: 0, },
    iconContainer: { padding: 10, borderRadius: 10 },
    textContainer: { flex: 1 },
    featureTitle: { fontWeight: 'bold', color: '#111827' },
    featureTagline: { fontSize: 12, fontStyle: 'italic', color: '#6b7285', marginBottom: 6 },
    featurePoint: { fontSize: 13, color: '#374151' },
});