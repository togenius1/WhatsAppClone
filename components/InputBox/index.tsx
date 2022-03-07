import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useState, useCallback} from 'react';
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
import AudioPlayer from '../AudioPlayer';

type Props = {
  chatRoom: ChatRoom;
};

const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5

export default function InputBox(props: Props) {
  const {chatRoom} = props;

  const [message, setMessage] = useState<string>('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<any>(0);
  const [image, setImage] = useState<any>(null);
  const [startRecord, setStartRecord] = useState<boolean>(false);
  const [soundURI, setSoundURI] = useState<any>();
  const [recording, setRecording] = useState<any>({
    isLoggingIn: false,
    recordSecs: 0,
    recordTime: '00:00:00',
    currentPositionSec: 0,
    currentDurationSec: 0,
    playTime: '00:00:00',
    duration: '00:00:00',
  });

  const dirs = RNFetchBlob.fs.dirs;
  const path = Platform.select({
    ios: 'hello.m4a',
    android: `${dirs.CacheDir}/hello.mp3`,
  });

  const onStartRecord = async () => {
    // Check permissions
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external stroage', grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
    };

    // console.log('audioSet', audioSet);
    //? Custom path
    const uri = await audioRecorderPlayer.startRecorder(path, audioSet);

    //? Default path
    // const uri = await audioRecorderPlayer.startRecorder(undefined, audioSet);

    audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
      console.log('record-back', e);
      setRecording({
        recordSecs: e.currentPosition,
        recordTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
      });
    });
    console.log(`uri: ${uri}`);
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setRecording({
      recordSecs: 0,
    });
    // console.log(result);

    setSoundURI(result);
  };

  // Capture Image or pick image from library
  const onButtonPress = useCallback((type, options) => {
    if (type === 'capture') {
      ImagePicker.launchCamera(options, setImage);
      resetFields();
    } else {
      ImagePicker.launchImageLibrary(options, setImage);
      resetFields();
    }
  }, []);

  // Get Blob
  const getBlob = async (uri: string) => {
    const respone = await fetch(uri);
    const blob = await respone.blob();
    return blob;
  };

  const sendMessage = async () => {
    // console.warn('send message');
    const authUser = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        userID: authUser.attributes.sub,
        chatroomID: chatRoom.id,
        status: 'SENT',
      }),
    );
    updateLastMessage(newMessage);

    resetFields();
  };

  // Send Image
  const sendImage = async () => {
    // console.warn('send image');
    if (!image) {
      return;
    }
    const blob = await getBlob(image.assets[0].uri);
    const {key} = await Storage.put(`${uuidv4()}.png`, blob, {
      progressCallback,
    });

    // Send Image with Message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage: Message = await DataStore.save(
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

  const progressCallback = () => {
    // console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
    setProgress(progress.loaded / progress.total);
  };

  // Send audio
  const sendAudio = async () => {
    // console.warn('send audio');
    if (!soundURI) {
      return;
    }
    const uriParts = soundURI.split('.');
    const extension = uriParts[uriParts.length - 1];
    const blob = await getBlob(soundURI);
    const {key} = await Storage.put(`${uuidv4()}.${extension}`, blob, {
      progressCallback,
    });

    // Send Audio with Message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        audio: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const updateLastMessage = async (newMessage: Message) => {
    DataStore.save(
      ChatRoom.copyOf(chatRoom, updatedChatRoom => {
        updatedChatRoom.LastMessage = newMessage;
      }),
    );
  };

  const onMicrophonePress = () => {
    // console.warn('Microphone');
    setStartRecord(!startRecord);
    onStartRecord();
  };

  const StopRecordPress = () => {
    // console.warn('Stop Record');
    onStopRecord();
  };

  const onPlusClicked = () => {
    console.warn('No messages');
  };

  const onPress = () => {
    if (image) {
      sendImage();
    } else if (message) {
      sendMessage();
    } else if (!startRecord) {
      onMicrophonePress();
    } else if (!soundURI) {
      StopRecordPress();
    } else if (soundURI) {
      sendAudio();
    } else {
      onPlusClicked();
    }
  };

  const resetFields = () => {
    setMessage('');
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
    setSoundURI(null);
    setRecording(null);
    setStartRecord(false);
  };

  const resetSendAudio = () => {
    setSoundURI(null);
    resetFields();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {height: isEmojiPickerOpen ? '50%' : 'auto'}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}>
      {image?.assets &&
        image?.assets.map(({uri}: any) => (
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
                style={{margin: 5, marginTop: -50}}
              />
            </Pressable>
          </View>
        ))}

      {soundURI && <AudioPlayer soundURI={soundURI} />}
      {soundURI && (
        <Pressable onPress={resetSendAudio}>
          <Ionicons
            name="close-outline"
            size={24}
            color="black"
            // style={{marginTop: -40}}
          />
        </Pressable>
      )}

      {startRecord && (
        <Text style={{color: 'black'}}>{recording?.recordTime}</Text>
      )}

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
        <View>
          <Pressable onPress={onPress} style={styles.buttonContainer}>
            {!startRecord ? (
              <View>
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
            ) : (
              <View>
                {soundURI ? (
                  <MaterialIcons name="send" size={24} color="white" />
                ) : (
                  <MaterialCommunityIcons name="stop" size={24} color="white" />
                )}
              </View>
            )}
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
  },
});
