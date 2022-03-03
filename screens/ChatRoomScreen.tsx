import {Text, View} from 'react-native';
import React from 'react';

import {useRoute} from '@react-navigation/native';

const ChatRoomScreen = () => {
  const route = useRoute();

  return (
    <View>
      <Text>Chat Room</Text>
    </View>
  );
};

export default ChatRoomScreen;
