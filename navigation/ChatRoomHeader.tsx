import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {ChatRoomUser, User} from '../src/models';

type Props = {
  id: any;
};

const ChatRoomHeader = (props: Props) => {
  const [user, setUser] = useState<User | null>(null);

  const {id} = props;

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
    <View style={styles.container}>
      <View style={styles.imgContainer}>
        <Image
          source={{
            uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg',
          }}
          style={{width: 30, height: 30, borderRadius: 30}}
        />

        <Text style={styles.text}>{user?.name}</Text>
      </View>

      <View style={styles.icon}>
        <Pressable>
          <FontAwesome5 name="video" size={22} color={'white'} />
        </Pressable>
        <Pressable>
          <MaterialIcons name="call" size={22} color={'white'} />
        </Pressable>
        <Pressable>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={22}
            color={'white'}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default ChatRoomHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width - 125,
    marginLeft: Platform.OS === 'ios' ? -70 : -30,
    padding: 10,
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    width: 100,
    justifyContent: 'space-between',
    marginRight: -100,
  },
  imgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
  },
});
