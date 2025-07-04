import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getPollsByWard, getWardFromCoords, getUserProfile } from '../services/apiService';
import * as Location from 'expo-location';
import { RootState } from '../state/rootReducer';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWardAndPolls = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to get user profile and their ward
        try {
          const userProfile = await getUserProfile();
          if (userProfile && userProfile.ward_id) {
            console.log("Fetching polls for stored ward:", userProfile.ward_id);
            const data = await getPollsByWard(userProfile.ward_id);
            setPolls(data);
            setLoading(false);
            return;
          }
        } catch (profileError) {
          console.log("Could not fetch user profile, falling back to location.", profileError);
        }
        
        // If no profile or no ward_id, use location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied. Cannot fetch polls for your area.');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        const wardData = await getWardFromCoords(latitude, longitude);
        
        if (wardData && wardData.id) {
          const pollsData = await getPollsByWard(wardData.id);
          setPolls(pollsData);
        } else {
          setError("Could not determine your ward. Showing all polls for now.");
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchWardAndPolls();
  }, []);

  const renderItem = ({ item }: { item: { id: number; title: string } }) => (
    <TouchableOpacity
      style={styles.pollItem}
      onPress={() => navigation.navigate('PollDetails', { pollId: item.id.toString() })}
    >
      <Text style={styles.pollTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.center}><Text>{error}</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      {polls.length > 0 ? (
        <FlatList
          data={polls}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={() => {}} // TODO: Implement refresh
          refreshing={loading}
        />
      ) : (
        <View style={styles.center}>
            <Text>No polls found for your ward yet.</Text>
        </View>
      )}
      <Button
        title="Create Poll"
        onPress={() => navigation.navigate('CreatePoll')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pollItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  pollTitle: {
    fontSize: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default HomeScreen; 