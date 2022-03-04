import {View, Text, Image, Pressable} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {DataStore, Auth} from 'aws-amplify';

// import {User} from '../../types';
import {User, ChatRoom, ChatRoomUser} from '../../src/models';
import styles from './style';

export default function ContactListItem(props: {user: User}) {
  const {user} = props;
  State = {
    dbUser,
  };

  const navigation = useNavigation();

  const onClick = async () => {
    // TODO if there is already a chat room between these 2 users
    // then redirect to the existing chat room
    // otherwise, create a new chat room with these users.
    

    // Create a chat room
    const newChatRoom = await DataStore.save(new ChatRoom({newMessages: 0}));

    const authUser = await Auth.currentAuthenticatedUser();
    const dbUser = await DataStore.query(User, authUser.attributes.sub);
    await DataStore.save(
      new ChatRoomUser({
        user: dbUser,
        chatRoom: newChatRoom,
      }),
    );

    // connect clicked user with the chat room
    await DataStore.save(
      new ChatRoomUser({
        user,
        chatRoom: newChatRoom,
      }),
    );

    // navigate to chat room with this user
    navigation.navigate('ChatRoom', {
      id: newChatRoom.id,
    });
  };

  return (
    <Pressable onPress={onClick}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <Image source={{uri: user.imageUri}} style={styles.avatar} />

          <View style={styles.midContainer}>
            <Text style={styles.username}>{user.name}</Text>
            <Text numberOfLines={2} style={styles.status}>
              {user.status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// export default ContactListItem;
