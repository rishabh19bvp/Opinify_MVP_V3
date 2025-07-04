import React, { useEffect } from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../services/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
      throw new Error("Missing Google Client ID. Make sure .env file is set up correctly.");
    }
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    });
  }, []);


  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.idToken,
        });

        if (error) {
          throw new Error(error.message);
        }
        
        // The user is signed in. The AppNavigator will automatically navigate to the 'Home' screen
        // because the userToken will be set in the Redux store by a listener.

      } else {
        throw new Error('No ID token present!');
      }
    } catch (error) {
      if (error.code) {
        // Handle specific Google Sign-In errors
        Alert.alert('Google Sign-In Error', error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default LoginScreen; 