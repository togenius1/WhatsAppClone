import {FlatList, StyleSheet, Text, Pressable} from 'react-native';
import React, {useState} from 'react';
import {Auth, DataStore} from 'aws-amplify';

import {View} from '../components/Themed';
import ChatListItem from '../components/ChatListItem';
import chatRooms from '../data/ChatRooms';
import NewMessageButton from '../components/NewMessageButton';

export default function ChatsScreen() {
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

      {/* <Pressable
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
      </Pressable> */}
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
