import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import * as TaskManager from 'expo-task-manager';
import { RefreshCw, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OPENWEATHER_API_KEY } from '@env';
import { PreferencesModal } from '../components/PreferencesModal';
import { StockNewsWidget } from '../components/StockNewsWidget';
import { StockNewsWidgetSkeleton } from '../components/StockNewsWidgetSkeleton';
import { WeatherWidget } from '../components/WeatherWidget';
import { WeatherWidgetSkeleton } from '../components/WeatherWidgetSkeleton';
import { fetchDailyQuote, getAIResponse, getWeatherSummaryFromAI } from '../utils/ai';
import { scheduleDaily8amNotification } from '../utils/notification';

const ASYNCSTORAGE_CACHE_KEY = '@ohayoAppCache';
const ASYNCSTORAGE_USER_NAME_KEY = '@ohayoUserName';
const ASYNCSTORAGE_TRACKED_STOCKS_KEY = '@ohayoTrackedStocks';
const BACKGROUND_FETCH_TASK = 'background-fetch-daily-data';

const fetchWeatherData = async (coords: Location.LocationObjectCoords | null) => {
  if (!coords?.latitude || !coords?.longitude) return null;
  const NEXT_PUBLIC_OPENWEATHER_API_KEY = OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;  
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

const fetchAndCategorizeStockNews = async (country: string | null) => {
  let market;
  if (country) {
    switch (country) {
      case "India": market = "Indian stock market (NSE, BSE)"; break;
      case "United States": market = "US stock market (NYSE, NASDAQ)"; break;
      default: market = `stock market for ${country}`;
    }
  } else {
    market = "Indian stock market (default)";
  }
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are an expert financial news analyst AI. Your task is to act as if you have read the top articles from financial news websites like moneycontrol.com for the ${market} for today's date, ${formattedDate}. From your knowledge, generate a structured JSON output of the day's most important stock market news. 1. Identify 2-3 of the most impactful market categories from today's news (e.g., "Banking Sector", "IT Stocks", "Automotive"). 2. For each category, write a short, catchy, one-line summary in a friendly tone. 3. For each category, list 1-2 of the most important stock tickers mentioned in the news, along with the specific, brief headline related to that stock. The required JSON structure is: { "categorizedNews": [ { "category": "Example Category", "summary": "Catchy summary here...", "stocks": [ { "ticker": "TICKER", "headline": "Specific stock headline here..." } ] } ] }`;
  try {
    const responseText = await getAIResponse(prompt);
    const cleanedResponse = responseText.replace(/(\r\n|\n|\r)/gm, "").replace(/`{3}(json)?/g, '').trim();
    const parsedJson = JSON.parse(cleanedResponse);
    return parsedJson.categorizedNews || [];
  } catch (e) {
    return [];
  }
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const location = await Location.getCurrentPositionAsync({});
    const finalCoords = location.coords;
    const reverseGeocode = await Location.reverseGeocodeAsync(finalCoords);
    const finalCountry = reverseGeocode[0]?.country || null;
    const finalCityName = reverseGeocode[0]?.city || reverseGeocode[0]?.region || null;

    const [weatherResult, stockResult, quoteResult] = await Promise.allSettled([
      fetchWeatherData(finalCoords),
      fetchAndCategorizeStockNews(finalCountry),
      fetchDailyQuote()
    ]);

    const weatherData = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const stockData = stockResult.status === 'fulfilled' ? stockResult.value : [];
    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : "The secret of getting ahead is getting started. - Mark Twain";

    const weatherAiSummary = weatherData ? await getWeatherSummaryFromAI(weatherData) : null;

    const fullWeatherData = { data: weatherData, aiSummary: weatherAiSummary };

    await AsyncStorage.setItem(ASYNCSTORAGE_CACHE_KEY, JSON.stringify({
      date: today,
      weather: fullWeatherData,
      stocks: stockData,
      locationName: finalCityName,
      country: finalCountry,
    }));

    console.log("Background fetch: data updated");

    // 🛑 Don't send notification here
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // 👈 required now
    shouldShowList: true,   // 👈 required now
  }),
});

SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [appState, setAppState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [preferences, setPreferences] = useState<{ userName: string | null; locationName: string | null; country: string | null; trackedStocks: string; }>({ userName: null, locationName: null, country: null, trackedStocks: '' });
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  const [weatherData, setWeatherData] = useState<any>(null);
  const [categorizedNews, setCategorizedNews] = useState<any[]>([]);
  const [stockDetailCache, setStockDetailCache] = useState<{ [key: string]: string }>({});
  const [newsAnalysisCache, setNewsAnalysisCache] = useState<{ [key: string]: string | null }>({});

  const insets = useSafeAreaInsets();

  const loadAppData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) { setStockDetailCache({}); setNewsAnalysisCache({}); }
    setAppState('loading');
    const today = new Date().toISOString().split('T')[0];
    try {
      const cachedDataJSON = await AsyncStorage.getItem(ASYNCSTORAGE_CACHE_KEY);
      const cachedData = cachedDataJSON ? JSON.parse(cachedDataJSON) : null;
      if (!forceRefresh && cachedData && cachedData.date === today) {
        setWeatherData(cachedData.weather);
        setCategorizedNews(cachedData.stocks);
        setPreferences(prev => ({ ...prev, locationName: cachedData.locationName, country: cachedData.country }));
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error("Location permission denied.");

        const location = await Location.getCurrentPositionAsync({});
        const finalCoords = location.coords;
        let reverseGeocode = await Location.reverseGeocodeAsync(finalCoords);
        const finalCountry = reverseGeocode[0]?.country || null;
        const finalCityName = reverseGeocode[0]?.city || reverseGeocode[0]?.region || null;

        setPreferences(prev => ({ ...prev, locationName: finalCityName, country: finalCountry }));

        const [weatherResultRaw, stockResult, weatherAiSummaryResult] = await Promise.allSettled([
          fetchWeatherData(finalCoords),
          fetchAndCategorizeStockNews(finalCountry),
          getWeatherSummaryFromAI(await fetchWeatherData(finalCoords)) // A bit redundant, but ensures data is fresh
        ]);

        const newWeatherDataRaw = weatherResultRaw.status === 'fulfilled' ? weatherResultRaw.value : null;
        const newStockData = stockResult.status === 'fulfilled' ? stockResult.value : [];
        const weatherAiSummary = weatherAiSummaryResult.status === 'fulfilled' ? weatherAiSummaryResult.value : null;

        const fullWeatherData = { data: newWeatherDataRaw, aiSummary: weatherAiSummary };
        setWeatherData(fullWeatherData);
        setCategorizedNews(newStockData);
        setAppState('loaded'); // ✅ Important


        const newDataToCache = { date: today, weather: fullWeatherData, stocks: newStockData, locationName: finalCityName, country: finalCountry };
        await AsyncStorage.setItem(ASYNCSTORAGE_CACHE_KEY, JSON.stringify(newDataToCache));
      }
    } catch (e: any) {
      setAppState('error');
    } finally {
      setAppState('loaded');
    }
  }, []);



  const registerBackgroundFetchAsync = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      if (isRegistered) {
        console.log("Background fetch task is already registered.");
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 60 * 12, // approx 12 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background fetch task registered successfully!");
    } catch (error) {
      console.error("Failed to register background fetch task:", error);
    }
  };

  const loadAppDataWithReturn = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error("Location permission denied.");

      const location = await Location.getCurrentPositionAsync({});
      const finalCoords = location.coords;
      const reverseGeocode = await Location.reverseGeocodeAsync(finalCoords);
      const finalCountry = reverseGeocode[0]?.country || null;
      const finalCityName = reverseGeocode[0]?.city || reverseGeocode[0]?.region || null;

      setPreferences(prev => ({
        ...prev,
        locationName: finalCityName,
        country: finalCountry,
      }));

      const [weatherResultRaw, stockResult, quoteResult, weatherAiSummaryResult] = await Promise.allSettled([
        fetchWeatherData(finalCoords),
        fetchAndCategorizeStockNews(finalCountry),
        fetchDailyQuote(),
        getWeatherSummaryFromAI(await fetchWeatherData(finalCoords)),
      ]);

      const weatherData = weatherResultRaw.status === 'fulfilled' ? weatherResultRaw.value : null;
      const stockData = stockResult.status === 'fulfilled' ? stockResult.value : [];
      const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : "The secret of getting ahead is getting started. - Mark Twain";
      const weatherAiSummary = weatherAiSummaryResult.status === 'fulfilled' ? weatherAiSummaryResult.value : null;

      const fullWeatherData = { data: weatherData, aiSummary: weatherAiSummary };
      setWeatherData(fullWeatherData);
      setCategorizedNews(stockData);
      setAppState('loaded')


      const newDataToCache = {
        date: today,
        weather: fullWeatherData,
        stocks: stockData,
        locationName: finalCityName,
        country: finalCountry,
      };
      await AsyncStorage.setItem(ASYNCSTORAGE_CACHE_KEY, JSON.stringify(newDataToCache));

      return { weather: fullWeatherData, quote }; // ✅ return fresh data
    } catch (e) {
      console.warn("Error loading app data:", e);
      return { weather: null, quote: "The secret of getting ahead is getting started. - Mark Twain" };
    }
  };


  const requestPermissions = async () => {
    const { status: existingNotifStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingNotifStatus;

    if (existingNotifStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'You might miss out on daily brief notifications!');
    }

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed for the weather widget to work correctly.');
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        await requestPermissions();
        await registerBackgroundFetchAsync();

        const storedUserName = await AsyncStorage.getItem(ASYNCSTORAGE_USER_NAME_KEY);
        const storedTrackedStocks = await AsyncStorage.getItem(ASYNCSTORAGE_TRACKED_STOCKS_KEY);
        const userName = storedUserName || 'buddy';

        setPreferences(prev => ({
          ...prev,
          userName,
          trackedStocks: storedTrackedStocks || '',
        }));

        if (!storedUserName) {
          setIsPreferencesModalOpen(true);
        }

        // ✅ Load fresh data
        const today = new Date().toISOString().split('T')[0];
        const { weather, quote } = await loadAppDataWithReturn(); // this is new

        // ✅ Schedule 8 AM notification with fresh quote and weather
        const temp = weather?.data?.main?.temp?.toString();
        await scheduleDaily8amNotification(userName, quote, temp);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);


  const onLayoutRootView = useCallback(async () => { if (appIsReady) { await SplashScreen.hideAsync(); } }, [appIsReady]);
  const handleSavePreferences = async (name: string, stocks: string) => { await AsyncStorage.setItem(ASYNCSTORAGE_USER_NAME_KEY, name); await AsyncStorage.setItem(ASYNCSTORAGE_TRACKED_STOCKS_KEY, stocks); setPreferences(prev => ({ ...prev, userName: name, trackedStocks: stocks })); setIsPreferencesModalOpen(false); };
  const getGreeting = () => { const hour = new Date().getHours(); const name = preferences.userName || 'Friend'; const nameToGreet = name.charAt(0).toUpperCase() + name.slice(1); if (hour < 12) return `Ohayo, ${nameToGreet}!`; if (hour < 18) return `Good afternoon, ${nameToGreet}!`; return `Good evening, ${nameToGreet}!`; };

  if (!appIsReady) { return null; }

  const primaryColor = '#0B132B';
  const secondaryColor = '#F58A07';
  const backgroundColor = '#F3F4F6';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} onLayout={onLayoutRootView}>
      <View style={styles.header}>
        <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
        <View style={styles.headerIcons}>
          <Pressable onPress={() => loadAppData(true)} disabled={appState === 'loading'}><RefreshCw size={22} color={appState === 'loading' ? '#A0AEC0' : primaryColor} /></Pressable>
          <Pressable onPress={() => setIsPreferencesModalOpen(true)}><Settings size={24} color={primaryColor} /></Pressable>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.mainContent}>
          <View style={styles.greetingContainer}><Text style={[styles.greetingTitle, { color: primaryColor }]}>{getGreeting()}</Text><Text style={styles.greetingSubtitle}>Here's your personalized daily brief.</Text></View>
          <View style={{ gap: 24 }}>
            {appState === 'loading' ? (<> <WeatherWidgetSkeleton /> <StockNewsWidgetSkeleton /> </>
            ) : (
              <>
                <WeatherWidget locationName={preferences.locationName} weatherData={weatherData} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                <StockNewsWidget categorizedNews={categorizedNews} country={preferences.country} trackedStocks={preferences.trackedStocks} primaryColor={primaryColor} secondaryColor={secondaryColor} stockDetailCache={stockDetailCache} setStockDetailCache={setStockDetailCache} newsAnalysisCache={newsAnalysisCache} setNewsAnalysisCache={setNewsAnalysisCache} />
                {/* <FeatureShowcase primaryColor={primaryColor} /> */}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <Pressable
        onPress={() => Linking.openURL('https://bolt.new')}
        style={styles.floatingBoltBadge}
      >
               <Image source={require('../assets/images/bolt.png')} style={{height: 60, width: 60, resizeMode: 'contain' }} />

      </Pressable>

      <PreferencesModal isOpen={isPreferencesModalOpen} onClose={() => setIsPreferencesModalOpen(false)} onSave={handleSavePreferences} currentName={preferences.userName} currentStocks={preferences.trackedStocks} primaryColor={primaryColor} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerLogo: { height: 35, width: 80, resizeMode: 'contain' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  mainContent: { padding: 20 },
  greetingContainer: { marginBottom: 24 },
  greetingTitle: { fontSize: 28, fontWeight: 'bold' },
  greetingSubtitle: { fontSize: 16, color: '#6b7285' },
  floatingBoltBadge: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    // backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: '50%',
    elevation: 3, // for Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
 
  boltHighlight: {
    color: '#0B132B',
    fontWeight: '600',
  },
});