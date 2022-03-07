import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {withAuthenticator} from 'aws-amplify-react-native';
import {Auth, DataStore, Hub} from 'aws-amplify';

import {Message} from './src/models';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

function App() {
  const colorScheme = useColorScheme();

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

  return (
    <SafeAreaProvider>
      <Navigation colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}

export default withAuthenticator(App);
