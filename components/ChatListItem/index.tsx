import React, {useState, useEffect} from 'react';
import {View, Text, Image, Pressable, ActivityIndicator} from 'react-native';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';

import {ChatRoomUser, User, ChatRoom} from '../../src/models';
// import {ChatRoom} from '../../types';
import styles from './style';
import moment from 'moment';
import {useNavigation} from '@react-navigation/native';

const ChatListItem = (props: {chatRoom: ChatRoom}) => {
  const {chatRoom} = props;
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.chatRoom.id === chatRoom.id)
        .map(chatRoomUser => chatRoomUser.user);

      // setUsers(fetchedUsers);

      const authUser = await Auth.currentAuthenticatedUser();
      setUser(
        fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null,
      );
    };

    fetchUsers();
  }, []);

  const onClick = () => {
    navigation.navigate('ChatRoom', {
      id: chatRoom.id,
    });
  };

  if (!user) {
    return <ActivityIndicator />;
  }

  return (
    <Pressable onPress={onClick}>
      <View style={styles.container}>
        <View style={styles.lefContainer}>
          <Image source={{uri: user.imageUri}} style={styles.avatar} />

          {!!chatRoom.newMessages && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
            </View>
          )}

          <View style={styles.midContainer}>
            <Text style={styles.username}>{user.name}</Text>
            <Text numberOfLines={2} style={styles.lastMessage}>
              {chatRoom.lastMessage?.content}
            </Text>
          </View>
        </View>

        <Text style={styles.time}>
          {moment(chatRoom.lastMessage?.createdAt).format('DD/MM/YY')}
        </Text>
      </View>
    </Pressable>
  );
};

export default ChatListItem;
