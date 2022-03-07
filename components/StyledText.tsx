import * as React from 'react';

import {Text, TextProps} from './Themed';

export function MonoText(props: TextProps) {
  // return (
  //   <Text {...props} style={[props.style, {fontFamily: 'SpaceMono-Regular'}]} />
  // );
  return <Text {...props} style={[props.style]} />;
}
