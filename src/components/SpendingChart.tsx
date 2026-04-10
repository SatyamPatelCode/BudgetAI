import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { LineChart as KitLineChart } from 'react-native-chart-kit'; 

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60; // card width minus padding

interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  created_at: string;
}

interface SpendingChartProps {
  transactions: Transaction[];
  theme: any;
}

export default function SpendingChart({ transactions, theme }: SpendingChartProps) {
  const [activeIndex, setActiveIndex] = useState(0); 
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Helper to generate chart config for a specific range
  const getChartConfig = (range: 'Week' | 'Month') => {
    const labels = [];
    const values = [];
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (range === 'Week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            // Changed: "Mon 10/24" format or just "10/24" if space is tight.
            // Let's try "Mon 24" or "10/24". User asked for Month and Day.
            // "MM/DD" format fits best on mobile x-axis.
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
            
            const total = transactions
                .filter(t => t.created_at.startsWith(dayStr))
                .reduce((sum, t) => sum + Number(t.amount), 0);
            values.push(total);
        }
    } else {
        // Month: Last 6 chunks of 5 days
        for (let i = 29; i >= 0; i-=5) {
            const endDate = new Date(now);
            endDate.setDate(now.getDate() - (29 - i));
            // Changed: "10/24" format instead of just "24"
            labels.push(`${endDate.getMonth() + 1}/${endDate.getDate()}`); 
            
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - (29 - i) - 4);
            
            let total = 0;
             for(let j=0; j<5; j++) {
               const checkDate = new Date(startDate);
               checkDate.setDate(startDate.getDate() + j);
               const str = checkDate.toISOString().split('T')[0];
               total += transactions
                  .filter(t => t.created_at?.startsWith(str))
                  .reduce((sum, t) => sum + Number(t.amount), 0);
             }
            values.push(total);
        }
    }
    
    return {
        labels,
        datasets: [{ data: values, color: (opacity = 1) => theme.primary }],
    };
  };

  const weekConfig = useMemo(() => getChartConfig('Week'), [transactions, theme]);
  const monthConfig = useMemo(() => getChartConfig('Month'), [transactions, theme]);

  const pieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (amt > 0) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
        totalSpent += amt;
      }
    });

    const colors = [theme.primary, theme.secondary, theme.warning, theme.error, '#40E0D0', '#FF69B4', '#FFA07A', '#20B2AA'];
    
    return Object.keys(categoryTotals).map((cat, index) => ({
      value: categoryTotals[cat],
      color: colors[index % colors.length],
      text: `${Math.round((categoryTotals[cat] / totalSpent) * 100)}%`, 
      category: cat,
      amount: categoryTotals[cat],
    }));
  }, [transactions, theme]);

  const renderLineChart = (config: any, title: string) => (
    <View style={{ width: CHART_WIDTH, marginRight: 0, paddingRight: 20 }}>
       <Text style={[styles.chartTitleOverlay, { color: theme.textSecondary, marginBottom: 5 }]}>{title}</Text>
       {config.datasets[0].data.length > 0 && !config.datasets[0].data.every((d: number) => d === 0) ? (
         <KitLineChart
            data={config}
            width={CHART_WIDTH - 20} // Adjust width slightly
            height={200}
            yAxisLabel="$"
            yAxisInterval={1} 
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card, 
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.primary, 
              labelColor: (opacity = 1) => theme.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary }
            }}
            bezier 
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
       ) : (
         <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
             <Text style={{ color: theme.textSecondary }}>No data available for {title}</Text>
         </View>
       )}
    </View>
  );

  return (
    <View>
      {/* 1. Spending Trend Section (Swipeable) */}
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Spending Trend</Text>
            {/* Pagination Dots */}
            <View style={styles.pagination}>
                <View style={[styles.dot, { backgroundColor: activeIndex === 0 ? theme.primary : '#E0E0E0' }]} />
                <View style={[styles.dot, { backgroundColor: activeIndex === 1 ? theme.primary : '#E0E0E0' }]} />
            </View>
        </View>

        <View style={styles.chartArea}>
             <ScrollView 
                ref={scrollViewRef}
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                    // Update active index based on scroll position
                    const slide = Math.round(e.nativeEvent.contentOffset.x / CHART_WIDTH);
                    if (slide !== activeIndex) setActiveIndex(slide);
                }}
                scrollEventThrottle={16}
                style={{ width: CHART_WIDTH }}
             >
                 {renderLineChart(weekConfig, "Last 7 Days")}
                 {renderLineChart(monthConfig, "Last 30 Days")}
             </ScrollView>
        </View>
      </View>

      {/* 2. Category Breakdown Section (Pie with External Lines) */}
      <View style={[styles.container, { backgroundColor: theme.card, marginTop: 20 }]}>
         <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Category Breakdown</Text>
         </View>

         <View style={[styles.chartArea, { minHeight: 300, paddingVertical: 20 }]}> 
            <View style={styles.pieContainer}>
                {pieData.length > 0 ? (
                    <PieChart
                        data={pieData}
                        donut
                        showText={true}
                        showExternalLabels={false}
                        radius={100} 
                        innerRadius={60}
                        textSize={12}
                        focusOnPress
                        textColor="white"
                    />
                ) : (
                    <Text style={{ color: theme.textSecondary }}>No data</Text>
                )}
            </View>
            
            {/* Legend Below */}
            {pieData.length > 0 && (
                <View style={styles.legendGrid}>
                    {pieData.map((item, idx) => (
                        <View key={idx} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={{ color: theme.text, fontSize: 12 }}>
                                {item.category} ({item.text})
                            </Text>
                        </View>
                    ))}
                </View>
            )}
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden' // Important for scrollview
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitleOverlay: {
      position: 'absolute',
      top: -20,
      right: 10,
      fontSize: 10,
      fontWeight: '600'
  },
  pagination: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 3
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20 // Ensure lines aren't cut off
  },
  legendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 10,
      width: '100%'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
