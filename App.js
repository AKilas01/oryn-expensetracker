import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { SafeAreaProvider }         from 'react-native-safe-area-context';
import * as SplashScreen           from 'expo-splash-screen';
import * as LocalAuthentication    from 'expo-local-authentication';
import * as Notifications           from 'expo-notifications';
import * as Haptics                 from 'expo-haptics';

import { AppProvider, useApp }      from './src/context/AppContext';
import { useTheme }                 from './src/hooks/useTheme';

import SetupScreen             from './src/screens/SetupScreen';
import HomeScreen              from './src/screens/HomeScreen';
import TransactionsScreen      from './src/screens/TransactionsScreen';
import InsightsScreen          from './src/screens/InsightsScreen';
import BudgetsScreen           from './src/screens/BudgetsScreen';
import SettingsScreen          from './src/screens/SettingsScreen';
import AddTransactionScreen    from './src/screens/AddTransactionScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';

SplashScreen.preventAutoHideAsync();

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const linking = {
  prefixes: ['oryn://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home:         'home',
          Transactions: 'transactions',
          Insights:     'insights',
          Budgets:      'budgets',
        },
      },
      AddTransaction: 'add',
    },
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

// ── Animated loading/splash screen ──────────────────────────────────────────
function LoadingScreen() {
  const { C } = useTheme();

  const logoAnim    = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const dotAnim     = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: logo fades+slides in → tagline fades in → dot pulses
    Animated.sequence([
      // Logo slides up and fades in
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 1, duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1, duration: 900,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades in after logo
      Animated.timing(taglineAnim, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots pulse independently
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const logoTranslate = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <View style={{
      flex: 1,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Ambient glow behind logo */}
      <Animated.View style={{
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: C.accent,
        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
      }} />

      {/* Logo */}
      <Animated.View style={{
        opacity: logoAnim,
        transform: [{ translateY: logoTranslate }],
        alignItems: 'center',
      }}>
        {/* The O ring */}
        <View style={{
          width: 80, height: 80,
          borderRadius: 40,
          borderWidth: 8,
          borderColor: C.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <View style={{
            width: 14, height: 14,
            borderRadius: 7,
            backgroundColor: C.accent,
          }} />
        </View>

        {/* Wordmark */}
        <Text style={{
          fontSize: 52,
          fontWeight: '800',
          color: C.accent,
          letterSpacing: -3,
          lineHeight: 56,
        }}>
          Oryn
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={{
        opacity: taglineAnim,
        fontSize: 13,
        color: C.textSub,
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginTop: 12,
      }}>
        Know where it goes.
      </Animated.Text>

      {/* Loading indicator */}
      <Animated.View style={{
        position: 'absolute',
        bottom: 80,
        opacity: taglineAnim,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <Animated.View key={i} style={{
            width: 6, height: 6,
            borderRadius: 3,
            backgroundColor: C.accent,
            opacity: dotAnim.interpolate({
              inputRange: [0, 1],
              outputRange: i === 1 ? [0.3, 1] : i === 0 ? [1, 0.3] : [0.6, 0.6],
            }),
          }} />
        ))}
      </Animated.View>
    </View>
  );
}

function TabNavigator() {
  const { C } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          84,
          paddingBottom:   24,
          paddingTop:      10,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"         component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⊙</Text>, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>≡</Text>, tabBarLabel: 'History' }} />
      <Tab.Screen name="Insights"     component={InsightsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>◎</Text>, tabBarLabel: 'Insights' }} />
      <Tab.Screen name="Budgets"      component={BudgetsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎯</Text>, tabBarLabel: 'Budgets' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { settings, isLoading, processRecurring } = useApp();
  const { C, isDark } = useTheme();
  const [authed,      setAuthed]      = useState(false);
  const [appReady,    setAppReady]    = useState(false);
  const [authFailed,  setAuthFailed]  = useState(false);
  const [showSplash,  setShowSplash]  = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
      await processRecurring();
      setAppReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!isLoading && appReady) {
      SplashScreen.hideAsync();
      if (!settings.biometric || !settings.setupDone) setAuthed(true);
      else authenticate();

      // Show splash for at least 2 seconds, then fade out
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setShowSplash(false));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, appReady, settings]);

  async function authenticate() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Oryn',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        setAuthed(true);
        setAuthFailed(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setAuthFailed(true);
      }
    } catch {
      setAuthed(true);
    }
  }

  if (!appReady || isLoading) return <LoadingScreen />;

  // Show animated splash on top while fading out
  if (showSplash) {
    return (
      <View style={{ flex: 1 }}>
        {/* App underneath */}
        <View style={{ flex: 1, backgroundColor: C.bg }} />
        {/* Splash fading out on top */}
        <Animated.View style={{ position: 'absolute', inset: 0, opacity: fadeAnim }}>
          <LoadingScreen />
        </Animated.View>
      </View>
    );
  }

  // Biometric lock screen
  if (settings.setupDone && settings.biometric && !authed) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Text style={{ fontSize: 44, fontWeight: '800', color: C.accent, letterSpacing: -1.5 }}>Oryn</Text>
        <Text style={{ fontSize: 48 }}>🔐</Text>
        <Text style={{ color: C.textSub, fontSize: 15 }}>Locked for your security</Text>
        <TouchableOpacity onPress={authenticate}
          style={{ backgroundColor: C.accent, borderRadius: 28, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>🔓 Unlock Oryn</Text>
        </TouchableOpacity>
        {authFailed && <Text style={{ color: C.danger, fontSize: 14 }}>Authentication failed. Try again.</Text>}
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: C.bg } }}>
        {!settings.setupDone ? (
          <Stack.Screen name="Setup" component={SetupScreen} />
        ) : (
          <>
            <Stack.Screen name="Main"              component={TabNavigator} />
            <Stack.Screen name="AddTransaction"    component={AddTransactionScreen}    options={{ presentation: 'modal' }} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Settings"          component={SettingsScreen}          options={{ presentation: 'modal' }} />
            <Stack.Screen name="Budgets"           component={BudgetsScreen}           options={{ presentation: 'modal' }} />
            <Stack.Screen name="Setup"             component={SetupScreen}             options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
