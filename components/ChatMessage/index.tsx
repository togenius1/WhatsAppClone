import {View, Text, ActivityIndicator} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';
import moment from 'moment';

import {User, Message} from '../../src/models';
// import {Message} from '../../types';
import styles from './styles';

const ChatMessage = ({message}) => {
  const [user, setUser] = useState<User | undefined>();
  const [isMe, setIsMe] = useState<boolean>(false);

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
        <Text style={styles.message}>{message.content}</Text>
        <Text style={styles.time}>{moment(message.createdAt).fromNow()}</Text>
      </View>
    </View>
  );
};

export default ChatMessage;
