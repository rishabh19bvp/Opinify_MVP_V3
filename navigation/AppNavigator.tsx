import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { RootState } from '../state/store';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import CreatePollScreen from '../screens/CreatePollScreen';
import PollDetailsScreen from '../screens/PollDetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Login: undefined;
  VerifyOtp: { phone: string };
  CreatePoll: undefined;
  PollDetails: { pollId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { userToken } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator>
      {userToken == null ? (
        // No token found, user isn't signed in
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: 'Sign In',
              // When logging out, a pop animation feels intuitive
              animationTypeForReplace: 'pop',
            }}
          />
          <Stack.Screen
            name="VerifyOtp"
            component={VerifyOtpScreen}
            options={{ title: 'Verify OTP' }}
          />
        </>
      ) : (
        // User is signed in
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="CreatePoll" component={CreatePollScreen} options={{ title: 'Create a new Poll' }} />
          <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 