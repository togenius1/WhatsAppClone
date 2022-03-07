import {StyleSheet, Text, View, Pressable} from 'react-native';
import React, {useState, useEffect} from 'react';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {
  soundURI: string;
};

// Record Audio
const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.1

const AudioPlayer = (props: Props) => {
  const {soundURI} = props;
  const [paused, setPaused] = useState<boolean>(true);
  const [recording, setRecording] = useState<any>({
    isLoggingIn: false,
    recordSecs: 0,
    recordTime: '00:00:00',
    currentPositionSec: 0,
    currentDurationSec: 0,
    playTime: '00:00:00',
    duration: '00:00:00',
  });

  useEffect(() => {
    // Load sound
    const loadSound = async () => {
      if (!soundURI) {
        return;
      }
      const uri = await soundURI;
      setRecording(uri);
    };
    loadSound();

    //unload sound
    () => {
      audioRecorderPlayer.removeRecordBackListener();
      setRecording({
        recordSecs: 0,
      });
    };
  }, [soundURI]);

  const onStartPlay = async () => {
    // console.log('onStartPlay');
    //? Custom path
    // const msg = await this.audioRecorderPlayer.startPlayer(this.path);

    //? Default path
    const msg = await audioRecorderPlayer.startPlayer();
    const volume = await audioRecorderPlayer.setVolume(1.0);
    // console.log(`file: ${msg}`, `volume: ${volume}`);

    audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {
      setRecording({
        currentPositionSec: e.currentPosition,
        currentDurationSec: e.duration,
        playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      });
    });
    setPaused(false);
  };

  const onPausePlay = async () => {
    await audioRecorderPlayer.pausePlayer();
    setPaused(true);
  };

  const onResumePlay = async () => {
    await audioRecorderPlayer.resumePlayer();
  };

  const onStopPlay = async () => {
    // console.log('onStopPlay');
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
    setPaused(false);
  };

  return (
    <View style={styles.sendSoundContainer}>
      <View
        style={{
          padding: 10,
          justifyContent: 'flex-start',
        }}>
        <Pressable onPress={paused ? onStartPlay : onPausePlay}>
          <FontAwesome5
            name={paused ? 'play' : 'pause'}
            size={18}
            color="grey"
          />
        </Pressable>
      </View>
      <Text style={{marginRight: '50%', color: 'black'}}>
        {recording?.playTime}
      </Text>
    </View>
  );
};

export default AudioPlayer;

const styles = StyleSheet.create({
  sendSoundContainer: {
    flexDirection: 'row',
    // marginVertical: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
    backgroundColor: 'lightgrey',
  },
});
