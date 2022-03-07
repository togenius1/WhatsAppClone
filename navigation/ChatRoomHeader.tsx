import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Auth} from '@aws-amplify/auth';
import {DataStore} from '@aws-amplify/datastore';
import moment from 'moment';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {ChatRoomUser, ChatRoom, User} from '../src/models';

type Props = {
  id: any;
};

const ChatRoomHeader = (props: Props) => {
  const {width} = useWindowDimensions();
  const [user, setUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const {id} = props;

  useEffect(() => {
    if (!id) {
      return;
    }
    fetchUsers();
    fetchChatRoom();
  }, [id]);

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatRoom.id === id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);

    const authUser = await Auth.currentAuthenticatedUser();
    setUser(
      fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null,
    );
  };

  const fetchChatRoom = async () => {
    DataStore.query(ChatRoom, id).then(setChatRoom);
  };

  const getLastOnlineText = () => {
    if (!user?.lastOnlineAt) {
      return null;
    }
    // if lastOnlineAt is less than 5 minutes ago, show him as ONLINE
    const lastOnlineDiffMS = moment().diff(moment(user.lastOnlineAt));
    if (lastOnlineDiffMS < 5 * 60 * 1000) {
      // less than 5 minutes
      return 'Online';
    } else {
      return `Last seen online ${moment(user.lastOnlineAt).fromNow()}`;
    }
  };

  // console.log(allUsers);
  const getUsernames = () => {
    return allUsers.map(user => user.name).join(', ');
  };

  const isGroup = allUsers.length > 2;

  return (
    <View style={[styles.container, {width: width - 25}]}>
      <Image
        source={{
          uri: user?.imageUri,
        }}
        style={{width: 30, height: 30, borderRadius: 30}}
      />

      <View style={styles.headerStatusContainer}>
        <Text style={{fontWeight: 'bold', fontSize: 16, color: 'lightgray'}}>
          {chatRoom?.name || user?.name}
        </Text>
        <Text numberOfLines={1} style={{fontSize: 12, color: 'lightgrey'}}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </View>

      <FontAwesome5
        name="video"
        size={22}
        color={'white'}
        style={{marginHorizontal: 5}}
      />

      <MaterialIcons
        name="call"
        size={22}
        color={'white'}
        style={{marginHorizontal: 10}}
      />

      <MaterialCommunityIcons
        name="dots-vertical"
        size={22}
        color={'white'}
        style={{marginHorizontal: -5}}
      />
    </View>
  );
};

export default ChatRoomHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // width: width - 25,
    marginLeft: Platform.OS === 'ios' ? -30 : -50,
    padding: 10,
    alignItems: 'center',
  },
  headerStatusContainer: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    // fontWeight: 'bold',
    fontSize: 16,
    color: 'lightgrey',
    fontWeight: 'bold',
  },
  lastOnlineAtStyle: {
    color: 'lightgrey',
  },
});
