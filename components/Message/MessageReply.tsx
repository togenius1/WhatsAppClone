import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Auth, DataStore, Storage} from 'aws-amplify';
import {S3Image} from 'aws-amplify-react-native';
import AudioPlayer from '../AudioPlayer';
import {Message as MessageModel, User} from '../../src/models';

const blue = '#3777f0';
const grey = 'lightgrey';

type Props = {
  message: MessageModel;
};

const MessageReply = (props: Props) => {
  const {message: propMessage} = props;
  const [message, setMessage] = useState(propMessage);
  const [user, setUser] = useState<User>();
  const [isMe, setIsMe] = useState<boolean | null>(null);
  const [soundURI, setSoundURI] = useState();

  const {width} = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, [message.userID]);

  useEffect(() => {
    setMessage(propMessage);
  }, [propMessage]);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, [message]);

  useEffect(() => {
    const checkIfMe = async () => {
      if (!user) {
        return;
      }
      const authUser = await Auth.currentAuthenticatedUser();
      setIsMe(user.id === authUser.attributes.sub);
    };
    checkIfMe();
  }, [user]);

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    <View
      style={[
        styles.container,
        // isMe ? styles.rightContainer : styles.leftContainer,
        // {width: soundURI ? '75%' : 'auto'},
      ]}>
      {/* <View style={styles.row}> */}
      {message.image && (
        <View
          style={{
            marginBottom: message.content ? 10 : 0,
          }}>
          <S3Image
            imgKey={message.image}
            style={{width: width * 0.55, aspectRatio: 4 / 3}}
            resizeMode="contain"
          />
        </View>
      )}
      {soundURI && <AudioPlayer soundURI={soundURI} />}
      {!!message.content && (
        <Text style={{color: isMe ? 'black' : 'white'}}>{message.content}</Text>
      )}
      {/* </View> */}

      {/* {isMe && !!message.status && message.status !== 'SENT' && (
        <Ionicons
          name={
            message.status === 'DELIVERED'
              ? 'checkmark-outline'
              : 'checkmark-done-outline'
          }
          size={16}
          color="green"
          style={{marginHorizontal: 5}}
        />
      )} */}
    </View>
  );
};

export default MessageReply;

const styles = StyleSheet.create({
  container: {
    // padding: 10,
    margin: 10,
    borderRadius: 10,
    maxWidth: '75%',
  },
  //   row: {
  //     flexDirection: 'row',
  //     alignItems: 'flex-end',
  //   },
  //   messageReply: {
  //     backgroundColor: 'grey',
  //     padding: 5,
  //     borderWidth: 3,
  //   },
  //   leftContainer: {
  // backgroundColor: 'white',
  // marginLeft: 10,
  // marginRight: 'auto',
  // alignItems: 'flex-end',
  //   },
  //   rightContainer: {
  // backgroundColor: grey,
  // marginLeft: 'auto',
  // marginRight: 'auto',
  // alignItems: 'flex-start',
  //   },
});
