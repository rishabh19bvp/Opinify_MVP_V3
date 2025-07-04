import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getPollById, castVote } from '../services/apiService';
import { supabase } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'PollDetails'>;

const PollDetailsScreen = ({ route }: Props) => {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  const fetchPoll = useCallback(async () => {
    try {
      const data = await getPollById(pollId);
      setPoll(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  useEffect(() => {
    const channel = supabase
      .channel('public:votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `poll_id=eq.${pollId}` }, (payload) => {
        console.log('Change received!', payload)
        // For simplicity, we'll just refetch the poll to get the latest vote counts
        fetchPoll();
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, fetchPoll]);

  const handleVote = async (optionId: number) => {
    try {
      setVoted(true); // Optimistically update UI
      await castVote({ poll_id: poll.id, option_id: optionId });
    } catch (error) {
      Alert.alert('Error', error.message);
      setVoted(false); // Revert on error
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (!poll) {
    return <Text>Poll not found</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.title}</Text>
      <Text>{poll.description}</Text>

      {poll.options.map((option) => (
        <View key={option.id} style={styles.optionContainer}>
          <Button
            title={`${option.text} (${option.votes[0].count})`}
            onPress={() => handleVote(option.id)}
            disabled={voted}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  optionContainer: {
    marginTop: 10,
  },
});

export default PollDetailsScreen; 