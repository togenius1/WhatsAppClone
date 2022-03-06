import {FlatList, StyleSheet, Text, Pressable} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth, DataStore} from 'aws-amplify';

// import chatRooms from '../data/ChatRooms';
import {ChatRoomUser, ChatRoom} from '../src/models';
import {View} from '../components/Themed';
import ChatListItem from '../components/ChatListItem';
import NewMessageButton from '../components/NewMessageButton';

export default function ChatsScreen() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const authUser = await Auth.currentAuthenticatedUser();

      const authChatRooms = (await DataStore.query(ChatRoomUser))
        .filter(
          chatRoomUser => chatRoomUser.user.id === authUser.attributes.sub,
        )
        .map(chatRoomUser => chatRoomUser.chatRoom);
      // console.log(chatRooms);
      setChatRooms(authChatRooms);
    };

    fetchChatRooms();
  }, []);

  const logOut = async () => {
    await DataStore.clear();
    Auth.signOut();
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={{width: '100%'}}
        data={chatRooms}
        renderItem={({item}) => <ChatListItem chatRoom={item} />}
        keyExtractor={item => item.id}
      />
      <NewMessageButton />

      <Pressable
        onPress={logOut}
        style={{
          backgroundColor: 'red',
          height: 50,
          width: '100%',
          margin: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
