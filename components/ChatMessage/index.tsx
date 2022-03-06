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
import {S3Image} from 'aws-amplify-react-native';
import moment from 'moment';

import {User, Message} from '../../src/models';
// import {Message} from '../../types';
// import styles from './styles';
import Colors from '../../constants/Colors';

const ChatMessage = ({message}) => {
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean>(false);

  const {width} = useWindowDimensions();

  useEffect(() => {
    DataStore.query(User, message.userID).then(setUser);
  }, [message.userID]);

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
    <View style={styles.container}>
      <View
        style={[
          styles.messageBox,
          {
            backgroundColor: isMe ? '#DCF8C5' : 'white',
            marginLeft: isMe ? 50 : 0,
            marginRight: isMe ? 0 : 50,
          },
        ]}>
        {!isMe && <Text style={styles.name}>{message.name}</Text>}

        {message.image && (
          <View style={{marginBottom: message.content ? 10 : 0}}>
            <S3Image
              imgKey={message.image}
              style={{width: width * 0.65, aspectRatio: 4 / 3}}
              resizeMode="contain"
            />
          </View>
        )}
        {!!message.content && (
          <Text style={{color: isMe ? 'black' : 'gray'}}>
            {message.content}
          </Text>
        )}

        <Text style={styles.time}>{moment(message.createdAt).fromNow()}</Text>
      </View>
    </View>
  );
};

export default ChatMessage;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  messageBox: {
    borderRadius: 5,
    padding: 10,
  },
  name: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {},
  time: {
    alignSelf: 'flex-end',
    color: 'grey',
  },
});
