import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {DataStore} from '@aws-amplify/datastore';
import {SortDirection} from 'aws-amplify';

import {ChatRoom, Message as MessageModel} from '../src/models';
import Message from '../components/Message/Message';
import InputBox from '../components/InputBox/InputBox';
import {RootStackParamList} from '../types';

type ChatRoomScreenRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen = () => {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [messageReplyTo, setMessageReplyTo] = useState<MessageModel | null>(
    null,
  );
  const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);

  const route = useRoute<ChatRoomScreenRouteProp>();
  // const navigation = useNavigation<RootStackParamList>();

  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!route.params?.id) {
        console.warn('No any chat room ids provided');
        return;
      }
      const chatRoom = await DataStore.query(ChatRoom, route.params.id);
      if (!chatRoom) {
        console.warn("Couldn't find a chat room with this id");
      } else {
        setChatRoom(chatRoom);
      }
    };
    fetchChatRoom();
  }, []);

  useEffect(() => {
    if (!chatRoom) {
      return;
    }
    const fetchMessages = async () => {
      const fetchedMessages = await DataStore.query(
        MessageModel,
        message => message.chatroomID('eq', chatRoom?.id),
        {
          sort: message => message.createdAt(SortDirection.DESCENDING),
        },
      );
      setMessages(fetchedMessages);
    };
    fetchMessages();
  }, [chatRoom]);

  useEffect(() => {
    const subscription = DataStore.observe(MessageModel).subscribe(msg => {
      // console.log(msg.model, msg.opType, msg.element);
      if (msg.model === MessageModel && msg.opType === 'INSERT') {
        setMessages(existingMessage => [msg.element, ...existingMessage]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!chatRoom) {
    return <ActivityIndicator />;
  }

  return (
    <SafeAreaView style={styles.page}>
      <FlatList
        data={messages}
        renderItem={({item}) => (
          <Message
            message={item}
            setAsMessageReply={() => setMessageReplyTo(item)}
          />
        )}
        inverted
      />

      <InputBox
        chatRoom={chatRoom}
        messageReplyTo={messageReplyTo}
        removeMessageReplyTo={() => setMessageReplyTo(null)}
      />
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
});
