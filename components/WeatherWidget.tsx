import { Lightbulb, MapPin, Sun } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

const WidgetCard: React.FC<{children: React.ReactNode}> = ({ children }) => <View style={styles.widgetCard}>{children}</View>;

type WeatherWidgetProps = {
  locationName: string | null;
  weatherData: any; // Now expects an object like { data: ..., aiSummary: ... }
  primaryColor: string;
  secondaryColor: string;
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ locationName, weatherData, primaryColor, secondaryColor }) => {
  const [iconFailed, setIconFailed] = React.useState(false);

  React.useEffect(() => {
    setIconFailed(false); 
  }, [weatherData]);
  
  const rawData = weatherData?.data;
  const aiContent = weatherData?.aiSummary;

  const renderWeatherIcon = () => {
      if (iconFailed || !rawData?.weather?.[0]?.icon) {
          return <Sun size={40} color={secondaryColor} />;
      }
      return (
          <Image 
            source={{ uri: `https://openweathermap.org/img/wn/${rawData.weather[0].icon}@2x.png` }} 
            style={styles.icon}
            onError={() => setIconFailed(true)}
          />
      );
  };

  const content = () => {
    if (!rawData || !locationName) {
        return (
            <View style={styles.loaderView}>
                <MapPin size={28} color="#A0AEC0" />
                <Text style={styles.noLocationText}>Weather not available</Text>
            </View>
        );
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>Weather in {locationName}</Text>
          {renderWeatherIcon()}
        </View>
        <Text style={[styles.temp, { color: primaryColor }]}>{`${Math.round(rawData.main.temp)}°C`}</Text>
        
        {aiContent ? (
            <View style={styles.aiContentContainer}>
                <Text style={styles.summaryText}>{aiContent.summary}</Text>
                <View style={styles.jokeContainer}>
                    <Lightbulb size={14} color={secondaryColor} />
                    <Text style={styles.jokeText}>{aiContent.joke}</Text>
                </View>
            </View>
        ) : (
          <View style={styles.loaderView}>
            <ActivityIndicator color={primaryColor} />
          </View>
        )}
      </>
    );
  };
  return <WidgetCard>{content()}</WidgetCard>;
};

const styles = StyleSheet.create({
    widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    loaderView: { minHeight: 160, justifyContent: 'center', alignItems: 'center' },
    noLocationText: { color: '#6b7285', marginTop: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    icon: { width: 45, height: 45 },
    temp: { fontSize: 40, fontWeight: 'bold', marginTop: 4 },
    aiContentContainer: { marginTop: 12, gap: 12 },
    summaryText: { fontSize: 14, color: '#374151', backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8, textAlign: 'center', overflow: 'hidden' },
    jokeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderColor: '#e5e7eb' },
    jokeText: { fontSize: 12, color: '#6b7285', fontStyle: 'italic' },
});