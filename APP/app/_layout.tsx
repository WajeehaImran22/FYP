//layout
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as Linking from 'expo-linking';

// Importing the capture logic from your services folder
import { captureTokenFromDeepLink } from '../services/api';
import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Point this to 'index' since that is your main file
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const url = Linking.useURL();

  // Handle incoming deep links (e.g. from Google Auth)
  useEffect(() => {
    if (url) {
      const handleDeepLink = async (incomingUrl: string) => {
        const token = await captureTokenFromDeepLink(incomingUrl);
        if (token) {
          console.log("Token captured! Routing to home...");
          // We route to '/' because your index.tsx is the home page
          router.replace('/'); 
        }
      };
      handleDeepLink(url);
    }
  }, [url]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main Landing/Home Page */}
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        
        {/* Modal Screen */}
        <Stack.Screen 
          name="modal" 
          options={{ presentation: 'modal', title: 'System Info' }} 
        />

        {/* NOTE: If you create an auth.tsx file later, 
           add a Stack.Screen for it here.
        */}
      </Stack>
    </ThemeProvider>
  );
}
