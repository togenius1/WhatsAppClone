import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useState, useEffect, useCallback} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';
import {Storage} from '@aws-amplify/storage';
import EmojiSelector from 'react-native-emoji-selector';
import * as ImagePicker from 'react-native-image-picker';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import RNFetchBlob from 'rn-fetch-blob';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';

import Colors from '../../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Entypo from 'react-native-vector-icons/Entypo';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Message, ChatRoom} from '../../src/models';

interface State {
  isLoggingIn: boolean;
  recordSecs: number;
  recordTime: string;
  currentPositionSec: number;
  currentDurationSec: number;
  playTime: string;
  duration: string;
}

const state = {
  isLoggingIn: false,
  recordSecs: 0,
  recordTime: '00:00:00',
  currentPositionSec: 0,
  currentDurationSec: 0,
  playTime: '00:00:00',
  duration: '00:00:00',
};

const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5

export default function InputBox({chatRoom, state}) {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [image, setImage] = useState<any>(null);

  const dirs = RNFetchBlob.fs.dirs;
  const path = Platform.select({
    ios: 'hello.m4a',
    android: `${dirs.CacheDir}/hello.mp3`,
  });

  const onButtonPress = React.useCallback((type, options) => {
    if (type === 'capture') {
      ImagePicker.launchCamera(options, setImage);
      // console.log('camera');
    } else {
      ImagePicker.launchImageLibrary(options, setImage);
    }
  }, []);

  // console.log(response);

  const onMicrophonePress = () => {
    console.log('Microphone');
  };

  // Get Blob
  const getBlob = async (uri: string) => {
    const respone = await fetch(uri);
    const blob = await respone.blob();
    return blob;
  };

  // Send Image
  const sendImage = async () => {
    if (!image) {
      return;
    }
    const blob = await getBlob(image.assets[0].uri);
    const {key} = await Storage.put(`${uuidv4()}.png`, blob, {
      progressCallback,
    });
    // console.log(blob);

    // Send Image with Message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        image: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const sendMessage = async () => {
    const authUser = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        userID: authUser.attributes.sub,
        chatroomID: chatRoom.id,
      }),
    );
    updateLastMessage(newMessage);

    resetFields();
  };

  const updateLastMessage = async newMessage => {
    DataStore.save(
      ChatRoom.copyOf(chatRoom, updatedChatRoom => {
        updatedChatRoom.LastMessage = newMessage;
      }),
    );
  };

  const progressCallback = progress => {
    // console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
    setProgress(progress.loaded / progress.total);
  };

  const resetFields = () => {
    setMessage('');
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
  };

  const onPlusClicked = () => {
    console.warn('No messages');
  };

  const onPress = () => {
    if (image) {
      sendImage();
    } else if (message) {
      sendMessage();
      console.log('send message');
    } else {
      onPlusClicked();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {height: isEmojiPickerOpen ? '50%' : 'auto'}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}>
      {image?.assets &&
        image?.assets.map(({uri}) => (
          <View key={uri} style={styles.sendImageContainer}>
            <Image
              resizeMode="cover"
              resizeMethod="scale"
              style={{width: 100, height: 100}}
              source={{uri: uri}}
            />
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-start',
                alignSelf: 'flex-end',
              }}>
              <View
                style={{
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: '#3777f0',
                  width: `${progress * 100}%`,
                }}
              />
            </View>

            <Pressable onPress={() => setImage(null)}>
              <Ionicons
                name="close-outline"
                size={24}
                color="black"
                style={{margin: 5}}
              />
            </Pressable>
          </View>
        ))}

      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Pressable
            onPress={() => setIsEmojiPickerOpen(currentValue => !currentValue)}>
            <FontAwesome5 name="laugh-beam" size={24} color="grey" />
          </Pressable>

          <TextInput
            style={styles.input}
            multiline={true}
            placeholder="type a message"
            value={message}
            onChangeText={setMessage}
          />

          <Pressable onPress={() => onButtonPress('library', 'mixed')}>
            <Entypo
              name="attachment"
              size={24}
              color="grey"
              style={styles.icon}
            />
          </Pressable>

          {!message && (
            <Pressable onPress={() => onButtonPress('capture', 'mixed')}>
              <Fontisto
                name="camera"
                size={24}
                color="grey"
                style={styles.icon}
              />
            </Pressable>
          )}
        </View>
        <Pressable onPress={onPress}>
          <View style={styles.buttonContainer}>
            {message || image ? (
              <MaterialIcons name="send" size={24} color="white" />
            ) : (
              <MaterialCommunityIcons
                name="microphone"
                size={24}
                color="white"
              />
            )}
          </View>
        </Pressable>
      </View>

      {isEmojiPickerOpen && (
        <EmojiSelector
          onEmojiSelected={emoji =>
            setMessage(currentMessage => currentMessage + emoji)
          }
          columns={8}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainer: {
    backgroundColor: 'white',
    flex: 1,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'lightgrey',
    alignItems: 'center',
    flexDirection: 'row',
    padding: Platform.OS === 'ios' ? 8 : 0,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
  },
  icon: {
    marginHorizontal: 5,
  },
  buttonContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 35,
  },
  sendImageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
  },
});
