import { Text, View,} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';

import {ChatRoomUser, User} from '../src/models';

const ChatRoomHeader = ({id}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const fetchUsers = async () => {
      const fetchedUsers = (await DataStore.query(ChatRoomUser))
        .filter(chatRoomUser => chatRoomUser.chatRoom.id === id)
        .map(chatRoomUser => chatRoomUser.user);

      const authUser = await Auth.currentAuthenticatedUser();
      setUser(
        fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null,
      );
    };

    fetchUsers();
  }, [id]);

  return (
    <View style={{flex: 1, marginLeft: -20}}>
      <Text style={{fontWeight: 'bold', fontSize: 16, color: 'white'}}>
        {user?.name}
      </Text>
    </View>
  );
};

export default ChatRoomHeader;
