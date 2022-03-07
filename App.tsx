import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {withAuthenticator} from 'aws-amplify-react-native';
import {Auth, DataStore, Hub} from 'aws-amplify';
import moment from 'moment';

import {Message, User} from './src/models';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

function App() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);

  // Listening that message sent and delivered
  useEffect(() => {
    const listener = Hub.listen('datastore', async hubData => {
      const {event, data} = hubData.payload;
      if (
        event === 'outboxMutationProcessed' &&
        data.model === Message &&
        !['DELIVERED', 'READ'].includes(data.element.status)
      ) {
        // set the message status to delivered
        DataStore.save(
          Message.copyOf(data.element, updated => {
            updated.status = 'DELIVERED';
          }),
        );
      }
    });
    // Remove listener
    return () => listener();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateLastOnline();
    }, 1 * 60 * 1000); // update every Minute * sec * 1000 milliseconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      const authUser = await Auth.currentAuthenticatedUser();
      const user = await DataStore.query(User, authUser.attributes.sub);
      if (user) {
        setUser(user);
      }
    };
    fetchUser();
  }, []);

  // update last online to database
  const updateLastOnline = async () => {
    if (!user) {
      return;
    }
    const response = await DataStore.save(
      User.copyOf(user, updated => {
        updated.lastOnlineAt = +new Date(); // seconds
      }),
    );
    setUser(response);
  };

  return (
    <SafeAreaProvider>
      <Navigation colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}

export default withAuthenticator(App);
