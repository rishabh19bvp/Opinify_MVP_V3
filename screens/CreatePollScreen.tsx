import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../services/authService';
import { createPoll, uploadPollImage, getWardFromCoords } from '../services/apiService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePoll'>;

const CreatePollScreen = ({ navigation }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [categoryId, setCategoryId] = useState(1);
  const [wardId, setWardId] = useState<number | null>(null);
  
  // Hardcoded for now, we'll fetch these later
  const ward_id = 1;

  // Hardcoded categories
  const categories = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Roads' },
    { id: 3, name: 'Water' },
    { id: 4, name: 'Electricity' },
  ];

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      const imagePickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && locationStatus.status === 'granted' && imagePickerStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      setImage(data.uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);

    try {
      const ward = await getWardFromCoords(location.coords.latitude, location.coords.longitude);
      if (ward) {
        setWardId(ward.id);
      }
    } catch (error) {
      Alert.alert('Could not determine ward', error.message);
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const handleSubmit = async () => {
    try {
      let imageUrl = null;
      if (image) {
        const uploadData = await uploadPollImage(image);
        const { data } = supabase.storage.from('poll_images').getPublicUrl(uploadData.path);
        imageUrl = data.publicUrl;
      }

      await createPoll({ title, description, options, category_id: categoryId, ward_id: wardId, image_url: imageUrl });
      Alert.alert('Success', 'Poll created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera or location</Text>;
  }

  return (
    <View style={styles.container}>
      {image ? (
        <View>
          <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
          <Button title="Retake Image" onPress={() => setImage(null)} />
        </View>
      ) : (
        <Camera 
          ref={ref => setCamera(ref)}
          style={styles.camera}
          type={Camera.Constants.Type.back}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}> Take Picture </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Text style={styles.text}> Select from Library </Text>
            </TouchableOpacity>
          </View>
        </Camera>
      )}

      <Button title="Get Location" onPress={getLocation} />
      {location && (
        <Text>
          Lat: {location.coords.latitude}, Lon: {location.coords.longitude}
        </Text>
      )}

      {wardId && <Text>Ward ID: {wardId}</Text>}

      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={categoryId}
        onValueChange={(itemValue) => setCategoryId(itemValue)}
      >
        {categories.map((category) => (
          <Picker.Item key={category.id} label={category.name} value={category.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Options</Text>
      {options.map((option, index) => (
        <TextInput
          key={index}
          style={styles.input}
          value={option.text}
          onChangeText={(text) => handleOptionChange(text, index)}
          placeholder={`Option ${index + 1}`}
        />
      ))}
      <Button title="Add Option" onPress={addOption} />

      <View style={styles.submitButton}>
        <Button title="Create Poll" onPress={handleSubmit} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    flex: 0.2,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default CreatePollScreen;
