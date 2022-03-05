import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {DataStore} from '@aws-amplify/datastore';

import {View} from '../components/Themed';
import ContactListItem from '../components/ContactListItem';
// import users from '../data/Users';
import {User} from '../src/models';

export default function ContactsScreen() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // query users
    DataStore.query(User).then(setUsers);
  }, []);

  // useEffect(() => {
  //   // query users
  //   const fetchUsers = async () => {
  //     const fetchedUsers = await DataStore.query(User);
  //     setUsers(fetchedUsers);
  //   };

  //   fetchUsers();
  // }, []);

  return (
    <View style={styles.container}>
      <FlatList
        style={{width: '100%'}}
        data={users}
        renderItem={({item}) => <ContactListItem user={item} />}
        keyExtractor={item => item.id}
      />
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
