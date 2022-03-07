import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';
import {Storage} from '@aws-amplify/storage';
import {S3Image} from 'aws-amplify-react-native';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {User, Message as MessageModel} from '../../src/models';
import Colors from '../../constants/Colors';
import AudioPlayer from '../AudioPlayer';

type Props = {
  message: MessageModel;
};

const ChatMessage = (props: Props) => {
  const {message: messageProp} = props;
  const [message, setMessage] = useState<MessageModel>(messageProp);
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean | null>(null);
  const [soundURI, setSoundURI] = useState<any>(null);

  const {width} = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, [message.userID]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModel, message.id).subscribe(
      msg => {
        // console.log(msg.model, msg.opType, msg.element);
        if (msg.model === MessageModel && msg.opType === 'UPDATE') {
          setMessage(message => ({...message, ...msg.element}));
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [message.id]);

  useEffect(() => {
    if (message.audio) {
      Storage.get(message.audio).then(setSoundURI);
    }
  }, []);

  useEffect(() => {
    const setAsRead = () => {
      if (isMe === false && message.status !== 'READ') {
        DataStore.save(
          MessageModel.copyOf(message, updated => {
            updated.status = 'READ';
          }),
        );
      }
    };

    setAsRead();
  }, [isMe, message]);

  useEffect(() => {
    const isMyMessage = async () => {
      if (!user) {
        return;
      }
      const authUser = await Auth.currentAuthenticatedUser();
      setIsMe(user.id === authUser.attributes.sub);
    };
    isMyMessage();
  }, [user]);

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    // <View style={styles.container}>
    <View
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
        {width: message.image ? '65%' : 'auto'},
      ]}>
      {/* {!isMe && <Text style={styles.msgContainer}>{message.name}</Text>} */}
      <View style={styles.row}>
        {message.image && (
          <View style={{marginBottom: message.content ? 10 : 0}}>
            <S3Image
              imgKey={message.image}
              style={{width: width * 0.55, aspectRatio: 4 / 3}}
              resizeMode="contain"
            />
          </View>
        )}
        {soundURI && <AudioPlayer soundURI={soundURI} />}
        {!!message.content && (
          <Text
            style={{
              color: isMe ? 'black' : 'black',
            }}>
            {message.content}
          </Text>
        )}
      </View>

      {/* <Text style={styles.time}>{moment(message.createdAt).fromNow()}</Text> */}

      {isMe && message.status !== null && message.status !== 'SENT' && (
        <Ionicons
          name={message.status === 'DELIVERED' ? 'checkmark' : 'checkmark-done'}
          size={15}
          color={message.status === 'DELIVERED' ? 'gray' : 'green'}
          style={{marginTop: 5}}
        />
      )}
    </View>
    // </View>
  );
};

export default ChatMessage;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
    maxWidth: '75%',
  },
  row: {
    // justifyContent: 'center',
    alignItems: 'center',
  },
  leftContainer: {
    backgroundColor: '#DCF8C5',
    marginRight: 'auto',
    justifyContent: 'flex-start',
    // marginLeft: 20,
    // alignItems: 'flex-end',
  },
  rightContainer: {
    backgroundColor: 'white',
    marginLeft: 'auto',
    justifyContent: 'flex-start',
    // marginRight: 20,
    // alignItems: 'flex-end',
  },
  msgContainer: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  time: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    color: 'grey',
    fontSize: 11,
  },
});
