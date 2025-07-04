import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { verifyOtp } from '../services/authService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { setSignIn } from '../state/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOtp'>;

const VerifyOtpScreen = ({ route }: Props) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();

  const handleVerifyOtp = async () => {
    try {
      const { data } = await verifyOtp(phone, otp);
      if (data.session) {
        dispatch(setSignIn(data.session.access_token));
        // On successful login, the AppNavigator will handle showing the Home screen
      } else {
        Alert.alert('Error', 'Could not verify OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />
      <Button title="Verify OTP" onPress={handleVerifyOtp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default VerifyOtpScreen; 