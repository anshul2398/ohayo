import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import RModal from 'react-native-modal';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { getAIResponse } from '../utils/ai';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const StockDetailModalSkeleton = () => (
    <View style={{ padding: 4 }}>
        <ShimmerPlaceholder style={{ height: 20, width: '70%', borderRadius: 8, marginBottom: 16 }} />
        <ShimmerPlaceholder style={{ height: 14, width: '100%', borderRadius: 8 }} />
        <ShimmerPlaceholder style={{ height: 14, width: '80%', borderRadius: 8, marginTop: 8 }} />

        <ShimmerPlaceholder style={{ height: 20, width: '50%', borderRadius: 8, marginVertical: 16, marginTop: 60 }} />
        <View style={{ gap: 12 }}>
            <ShimmerPlaceholder style={{ height: 16, width: '100%', borderRadius: 8 }} />
            <ShimmerPlaceholder style={{ height: 16, width: '100%', borderRadius: 8 }} />
            <ShimmerPlaceholder style={{ height: 16, width: '100%', borderRadius: 8 }} />
        </View>

        <ShimmerPlaceholder style={{ height: 20, width: '50%', borderRadius: 8, marginVertical: 16, marginTop: 60 }} />
        <View style={{ gap: 12 }}>
            <ShimmerPlaceholder style={{ height: 16, width: '100%', borderRadius: 8 }} />
            <ShimmerPlaceholder style={{ height: 16, width: '100%', borderRadius: 8 }} />
            <ShimmerPlaceholder style={{ height: 16, width: '80%', borderRadius: 8 }} />
        </View>
    </View>
);

const RenderAnalysis: React.FC<{ text: string | undefined }> = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n').filter(line => line.trim() !== '');

    return (
        <View style={{ gap: 12 }}>
            {lines.map((line, index) => {
                if (line.startsWith('### ')) {
                    return <Text key={index} style={styles.modalSubheading}>{line.replace('### ', '').trim()}</Text>;
                }
                if (line.startsWith('* **')) {
                    const parts = line.replace('* **', '').split(':**');
                    if (parts.length > 1) {
                        return (
                            <View key={index} style={styles.metricRow}>
                                <Text style={styles.metricKey}>{parts[0]}:</Text>
                                <Text style={styles.metricValue}>{parts[1].trim()}</Text>
                            </View>
                        );
                    }
                }
                if (line.startsWith('*')) {
                    return <Text key={index} style={styles.modalParagraph}>{line.replace('*', '•').trim()}</Text>;
                }
                return <Text key={index} style={styles.modalParagraph}>{line}</Text>;
            })}
        </View>
    );
};

const StockDetailModal: React.FC<{ isOpen: boolean; onClose: () => void; ticker: string | null; analysis: string | undefined; loading: boolean; }> = ({ isOpen, onClose, ticker, analysis, loading }) => (
    <RModal
        isVisible={isOpen}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        onSwipeComplete={onClose}
        // swipeDirection="down"
        style={styles.modalContainer}
        useNativeDriverForBackdrop={true}
    >
        <View style={styles.modalOuterContent}>
            {/* <View style={styles.modalHandleBar} /> */}
            <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1, marginRight: 30 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>Analysis for: </Text>
                    <Text style={styles.modalTicker}>{ticker}</Text>
                </View>
                <Pressable style={styles.modalCloseButton} onPress={onClose}><X size={26} color="#6b7285" /></Pressable>
            </View>

            <ScrollView>
                <View style={styles.modalBodyContent}>
                    {loading ? <StockDetailModalSkeleton /> : <RenderAnalysis text={analysis} />}
                </View>
            </ScrollView>

            <View style={styles.modalFooter}><Text style={styles.modalDisclaimer}>Disclaimer: Stock markets are subject to market risk. This is a summary based on news and technical points present on the internet.</Text></View>
        </View>
    </RModal>
);

const WidgetCard: React.FC<{ children: React.ReactNode }> = ({ children }) => <View style={styles.widgetCard}>{children}</View>;

type StockNewsWidgetProps = {
    categorizedNews: any[];
    country: string | null;
    trackedStocks: string;
    primaryColor: string;
    secondaryColor: string;
    stockDetailCache: { [key: string]: string };
    setStockDetailCache: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    newsAnalysisCache: { [key: string]: string | null };
    setNewsAnalysisCache: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
};

export const StockNewsWidget: React.FC<StockNewsWidgetProps> = ({
    categorizedNews,
    country,
    trackedStocks,
    primaryColor,
    secondaryColor,
    stockDetailCache,
    setStockDetailCache,
    newsAnalysisCache,
    setNewsAnalysisCache
}) => {
    const [isStockDetailLoading, setIsStockDetailLoading] = useState(false);
    const [isNewsAnalyzing, setIsNewsAnalyzing] = useState<{ [key: string]: boolean }>({});
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [activeStockTicker, setActiveStockTicker] = useState<string | null>(null);

    const userWatchlist = trackedStocks.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

    const handleTickerClick = async (ticker: string, headline: string) => {
        setActiveStockTicker(ticker);
        setIsStockModalOpen(true);
        if (stockDetailCache[ticker]) return;
        setIsStockDetailLoading(true);

        const prompt = `You are Ohayo, a friendly and savvy financial buddy AI. Your friend wants to know about the stock with ticker: ${ticker}.
        
        IMPORTANT: Your response MUST have two parts. Do not use any other greeting or introduction.
        
        Part 1: Start with a heading "🗞️ In The News Today". Based on news from the last 24 hours, in a friendly tone, briefly summarize the key takeaway from this specific news headline: "${headline}"
        
        Part 2: Then, create a new section with the heading "📊 The Deeper Dive". In this section, provide a structured analysis covering these points (your response striclty MUST be structured with the exact headings and key-value pairs below):
        * **Market Cap:** [Provide value]
        * **P/E Ratio (TTM):** [Provide value]
        * **Book Value (per share):** [Provide value]
        * **Face Value:** [Provide value]
        * **Industry P/E:** [Provide value]
        * **Volume (3-month avg):** [Provide value]
        * **Return on Equity (RoE):** [Provide value] - After the number, add a fun, positive comment like "That's fantastic! ✨"
        
        Part 3: Finally, create a section with the heading "🤔 The Buddy Verdict"
        * Give your final take, starting with "So, what's the bottom line? My take is...".
        * State if it seems like a good investment right now.
        * You MUST suggest an investment horizon: specify if it looks better for **long-term** or **short-term** investment.`;

        try {
            const analysisText = await getAIResponse(prompt);
            setStockDetailCache(prev => ({ ...prev, [ticker]: analysisText }));
        } catch (e) {
            setStockDetailCache(prev => ({ ...prev, [ticker]: "Sorry, could not fetch detailed analysis." }));
        } finally {
            setIsStockDetailLoading(false);
        }
    };

    const handleToggleNewsAnalysis = async (newsItem: any) => {
        const { id } = newsItem;
        if (newsAnalysisCache[id]) { setNewsAnalysisCache(prev => ({ ...prev, [id]: null })); return; }
        setIsNewsAnalyzing(prev => ({ ...prev, [id]: true }));
        const prompt = `The news is: "${newsItem.headline}", impacting ${newsItem.affected_stocks.join(', ')}. The takeaway is: "${newsItem.impact_line}". Expand on this with a 'Key Points Analysis' for an investor in 2-3 simple bullet points.`;
        try {
            const analysisText = await getAIResponse(prompt);
            setNewsAnalysisCache(prev => ({ ...prev, [id]: analysisText }));
        } finally { setIsNewsAnalyzing(prev => ({ ...prev, [id]: false })); }
    };

    const renderNewsItem = (item: any) => {
        if (!item || !item.category) return null;
        const isTracked = Array.isArray(item.affected_stocks) && item.affected_stocks.some((newsTicker: string) =>
            userWatchlist.some(trackedTicker =>
                newsTicker && newsTicker.toUpperCase().startsWith(trackedTicker)
            )
        );

        return (
            <View key={item.category} style={[styles.newsItem, isTracked && { borderColor: secondaryColor, backgroundColor: '#FFFBEB' }]}>
                {isTracked && (<View style={styles.trackedBadge}><Star size={12} color="#fff" fill="#fff" /><Text style={styles.trackedBadgeText}>ON YOUR WATCHLIST</Text></View>)}
                <View style={styles.categoryHeader}><Text style={styles.categoryTitle}>{item.category}</Text><View style={styles.dividerLine} /></View>
                <Text style={styles.categorySummary}>"{item.summary}"</Text>
                <Text style={styles.relevantStocksTitle}>Relevant Stocks:</Text>
                <View style={styles.tickerContainer}>
                    {item.stocks && Array.isArray(item.stocks) && item.stocks.map((stock: any) => {
                        const isStockTracked = userWatchlist.some(trackedTicker => stock.ticker.toUpperCase().startsWith(trackedTicker));
                        return (
                            <Pressable key={stock.ticker} onPress={() => handleTickerClick(stock.ticker, stock.headline)} style={[styles.tickerButton, { backgroundColor: isStockTracked ? secondaryColor : primaryColor }]}>
                                <Text style={styles.tickerText}>{stock.ticker}</Text>
                            </Pressable>
                        );
                    })}
                </View>
              
            </View>
        );
    };

    const renderFallbackWatchlist = () => (
        <View>
            <Text style={styles.fallbackTitle}>No Market News Found. Here's Your Watchlist:</Text>
            <View style={styles.tickerContainer}>
                {userWatchlist.length > 0 ? (
                    userWatchlist.map((ticker: string) => (
                        <Pressable key={ticker} onPress={() => handleTickerClick(ticker, "General Analysis Request")} style={[styles.tickerButton, { backgroundColor: secondaryColor }]}>
                            <Text style={styles.tickerText}>{ticker}</Text>
                        </Pressable>
                    ))
                ) : (
                    <Text style={styles.errorText}>Your watchlist is empty. Add stocks in Settings.</Text>
                )}
            </View>
        </View>
    );

    return (
        <>
            <WidgetCard>
                <Text style={[styles.title, { color: primaryColor }]}>Today's Market Movers</Text>
                {!country && <View style={styles.warningContainer}><AlertTriangle size={14} color="#D97706" /><Text style={styles.warningText}>Country not detected. Showing default results.</Text></View>}
                {Array.isArray(categorizedNews) && categorizedNews.length > 0 ? <View style={{ gap: 20 }}>{categorizedNews.map(renderNewsItem)}</View> : renderFallbackWatchlist()}
            </WidgetCard>
            <StockDetailModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} ticker={activeStockTicker} analysis={stockDetailCache[activeStockTicker || '']} loading={isStockDetailLoading} />
        </>
    );
};

const styles = StyleSheet.create({
    widgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E0E0E0' },
    title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    errorText: { color: '#6b7285', textAlign: 'center', fontStyle: 'italic' },
    warningContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', padding: 8, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#FEEBC8' },
    warningText: { color: '#B45309', fontSize: 12 },
    newsItem: { borderWidth: 2, borderColor: 'transparent', borderRadius: 12, padding: 16, backgroundColor: '#F3F4F6' },
    trackedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#9333ea', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99, alignSelf: 'flex-start', marginBottom: 12 },
    trackedBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    dividerLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb' },
    categorySummary: { fontSize: 14, fontStyle: 'italic', color: '#6b7285', marginBottom: 16 },
    relevantStocksTitle: { fontSize: 12, fontWeight: '600', color: '#6b7285', textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
    tickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tickerButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
    tickerText: { color: '#fff', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    fallbackTitle: { fontWeight: '600', color: '#374151', marginBottom: 12 },
    analysisButtonContainer: { marginTop: 12, alignItems: 'flex-start' },
    analysisButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99 },
    analysisButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    analysisContainer: { marginTop: 12, backgroundColor: '#eef2ff', padding: 12, borderRadius: 8 },
    analysisText: { color: '#374151', fontSize: 14, lineHeight: 20 },
    modalContainer: { justifyContent: 'flex-end', margin: 0, },
    modalOuterContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', height: '85%', flexDirection: 'column', },
    modalHandleBar: { width: 40, height: 5, backgroundColor: '#d1d5db', borderRadius: 2.5, alignSelf: 'center', marginTop: 10, marginBottom: 5, },
    modalHeader: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', flexShrink: 1 },
    modalTicker: { fontSize: 20, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    modalCloseButton: { padding: 5, zIndex: 10 },
    modalBody: { flex: 1, },
    modalBodyContent: { padding: 20, paddingBottom: 40 },
    modalLoaderContainer: { paddingTop: 20 },
    loadingText: { fontSize: 16, color: '#6b7285', marginTop: 10 },
    modalAnalysis: {},
    modalSubheading: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, marginTop: 12 },
    modalListItem: { fontSize: 15, color: '#374151', lineHeight: 22, marginLeft: 5 },
    modalParagraph: { fontSize: 15, color: '#374151', lineHeight: 24 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    metricKey: { fontSize: 15, color: '#4A5568', fontWeight: '500' },
    metricValue: { fontSize: 15, color: '#1A202C', fontWeight: '600' },
    modalFooter: { padding: 20, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: '#f3f4f6' },
    modalDisclaimer: { fontSize: 10, color: 'gray', fontStyle: 'italic', textAlign: 'center' },
});